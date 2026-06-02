import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
dotenv.config();

let UserID = 0; // Placeholder for user ID, can be set upon login and used in other routes as needed


const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/*
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME

});



  db.connect((err: Error | null) => {
  if (err) {
    console.error('Database connection failed:', err.message); // ← will show in terminal
  } else {
    console.log('Connected to MySQL database');
  }
});
*/

//pool is just better and more stable.
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
  }
});


//----- login route/API, checks if the username exists and if the password matches------//
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  db.query(
    'SELECT userId, password, username FROM users WHERE username = ?',
    [username],
    async (err: Error | null, results: any[]) => {  // ← add async here
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: "Username does not exist" });
      }

      // bcrypt compare replaces the plain === check
      const passwordMatch = await bcrypt.compare(password, results[0].password);

      if (passwordMatch) {
        res.json({ success: true, user: results[0].userId });
        UserID = results[0].userId;
      } else {
        res.status(401).json({ success: false, message: "Incorrect password" });
      }
    }
  );
});





app.get('/api/users', (req: Request, res: Response) => {
  db.query('SELECT * FROM users', (err: Error | null, results: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});



//--------API to register new users------------//
app.post('/api/register', async (req: Request, res: Response) => {
  const { firstName, lastName, username, email, password, role, institution } = req.body;

  const roleMap: Record<string, number> = {
    student: 1,
    faculty: 2,
    researcher: 3,
    administrator: 4,
    community: 5,
    observer: 6
  };
  const roleId = roleMap[role.toLowerCase()] || 0;

  console.log('Register payload:', { firstName, lastName, username, email, roleId, institution });

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 12);

  db.query(
        'INSERT INTO `users`(`firstName`, `lastName`, `username`, `email`, `password`, `roleId`, `institution`) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [firstName, lastName, username, email, hashedPassword, roleId, institution], // ← hashedPassword here
    (err: Error | null) => {
      if (err) {
        console.error('MySQL error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "User registered successfully" });
    }
  );
});


//===========================================================================================================//

//=====Dashboard stuff===================================================================================//

//===========================================================================================================//

//displays 3 of the 4 blocks at the bottom (soil temp is excluded)
app.get('/api/dashboard/summary', (req: Request, res: Response) => {
  const queries = {
    currentPower: `
      SELECT powerUsageKw
      FROM powerOutputLogs
      ORDER BY takenAt DESC
      LIMIT 1
    `,
    waterAvailable: `
      SELECT SUM(capacityLiters) AS totalLiters
      FROM waterSources
    `,
    deviceHealth: `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS online
      FROM devices
    `
  };
 
  Promise.all([
    new Promise<any>((resolve, reject) =>
      db.query(queries.currentPower, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(results[0]?.powerUsageKw ?? 0);
      })
    ),
    new Promise<any>((resolve, reject) =>
      db.query(queries.waterAvailable, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(Number(results[0]?.totalLiters) || 0);
      })
    ),
    new Promise<any>((resolve, reject) =>
      db.query(queries.deviceHealth, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(results[0]);
      })
    )
  ])
    .then(([currentPowerKw, waterAvailableL, deviceRow]) => {
      const total = Number(deviceRow?.total) || 0;
      const online = Number(deviceRow?.online) || 0;
      const systemHealthPct = total > 0 ? Math.round((online / total) * 100) : 0;
 
      res.json({
        currentPowerKw: Number(currentPowerKw),
        waterAvailableL: Number(waterAvailableL),
        systemHealthPct,
        onlineDevices: online,
        totalDevices: total
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});



//creates the chart for the power generation/usage
app.get('/api/dashboard/power-chart', (req: Request, res: Response) => {
  const solarQuery = `
    SELECT
      DATE_FORMAT(takenAt, '%H:00') AS time,
      AVG(powerGeneratedKw)         AS generation
    FROM solarReadings
    WHERE takenAt >= NOW() - INTERVAL 24 HOUR
    GROUP BY DATE_FORMAT(takenAt, '%H:00')
    ORDER BY DATE_FORMAT(takenAt, '%H:00') ASC
  `;
 
  const usageQuery = `
    SELECT
      DATE_FORMAT(takenAt, '%H:00') AS time,
            AVG(powerUsageKw)             AS usageKw
    FROM powerOutputLogs
    WHERE takenAt >= NOW() - INTERVAL 24 HOUR
    GROUP BY DATE_FORMAT(takenAt, '%H:00')
    ORDER BY DATE_FORMAT(takenAt, '%H:00') ASC
  `;
 
  Promise.all([
    new Promise<any[]>((resolve, reject) =>
      db.query(solarQuery, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(results);
      })
    ),
    new Promise<any[]>((resolve, reject) =>
      db.query(usageQuery, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(results);
      })
    )
  ])
    .then(([solarRows, usageRows]) => {
      // Merge the two result sets on the 'time' key
      const map: Record<string, { time: string; generation: number; usage: number }> = {};
 
      for (const row of solarRows) {
        map[row.time] = { time: row.time, generation: Number(row.generation) || 0, usage: 0 };
      }
      for (const row of usageRows) {
        if (map[row.time]) {
                    map[row.time].usage = Number(row.usageKw) || 0;
        } else {
                    map[row.time] = { time: row.time, generation: 0, usage: Number(row.usageKw) || 0 };
        }
      }
 
      // Sort chronologically and return
      const sorted = Object.values(map).sort((a, b) =>
        a.time.localeCompare(b.time)
      );
 
      res.json(sorted);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

//create the chart for water in the last 24 hours
app.get('/api/dashboard/water-chart', (req: Request, res: Response) => {
  const query = `
    SELECT
            DATE_FORMAT(takenAt, '%m-%d %H:00') AS time,
            DATE_FORMAT(takenAt, '%Y-%m-%d %H:00:00') AS sortKey,
            AVG(depthLevelCm)                   AS level
    FROM waterSensorReadings
        WHERE takenAt >= (
            SELECT DATE_SUB(MAX(takenAt), INTERVAL 24 HOUR)
            FROM waterSensorReadings
        )
        GROUP BY sortKey, time
        ORDER BY sortKey ASC
  `;
 
  db.query(query, (err: Error | null, results: any) => {
    if (err) return res.status(500).json({ error: err.message });
 
    const formatted = (results as any[]).map((row) => ({
      time: row.time,
      level: Number(row.level) || 0
    }));
 
    res.json(formatted);
  });
});

//displays the total water level, how many nodes are connected, and when the last update occured
app.get('/api/dashboard/water-status', (req: Request, res: Response) => {
    const query = `
        SELECT
            COUNT(*)                  AS deviceCount,
            SUM(latest.depthLevelCm)  AS totalDepthCm,
            AVG(latest.depthLevelCm)  AS averageDepthCm,
            MAX(latest.takenAt)       AS latestTakenAt
        FROM (
            SELECT
                readings.deviceId,
                readings.depthLevelCm,
                readings.takenAt
            FROM waterSensorReadings readings
            INNER JOIN (
                SELECT
                    deviceId,
                    MAX(takenAt) AS latestTakenAt
                FROM waterSensorReadings
                GROUP BY deviceId
            ) groupedLatest
                ON groupedLatest.deviceId = readings.deviceId
             AND groupedLatest.latestTakenAt = readings.takenAt
        ) latest
    `;

    db.query(query, (err: Error | null, results: any) => {
        if (err) return res.status(500).json({ error: err.message });

        const row = results[0] ?? {};

        res.json({
            deviceCount: Number(row.deviceCount) || 0,
            totalDepthCm: Number(row.totalDepthCm) || 0,
            averageDepthCm: Number(row.averageDepthCm) || 0,
            latestTakenAt: row.latestTakenAt ?? null
        });
    });
});

//checks the status of all devices connected to calculate health
app.get('/api/dashboard/devices', (req: Request, res: Response) => {
  const query = `
    SELECT
      deviceName,
      protocol,
      status,
      lastSeen
    FROM devices
    WHERE protocol IN ('LoRa', 'Meshtastic')
    ORDER BY deviceName ASC
  `;
 
  db.query(query, (err: Error | null, results: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});










/* Chicken stuff =================================================================================================== */

/* Chicken queries */

const PI_STREAM = process.env.Chicken_PI_STREAM_URL;

app.get('/api/chickenAiStream', async (req: Request, res: Response) => {
    if (!PI_STREAM) { res.status(500).json({ error: 'PI_STREAM_URL not configured' }); return; }
    const upstream = await fetch(PI_STREAM);
    
    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
    upstream.body!.pipe(res);
});

function detectMimeType(buffer: Buffer) {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
    if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
    return 'image/jpeg';
}

app.get('/api/chickenSelect', (req, res) => {
    // Old query with UserID filter (requires login):
    // const query = `SELECT chickens.* FROM users 
    //                 INNER JOIN farms
    //                 ON users.farmId = farms.farmId
    //                 INNER JOIN FarmZones
    //                 ON farms.farmId = farmZones.farmId
    //                 INNER JOIN coops
    //                 ON farmZones.farmZoneId = coops.zoneId
    //                 INNER JOIN chickens
    //                 ON coops.coopId = chickens.coopId
    //                 WHERE userId = ?`;
    // db.query(query, [UserID], ...);

    // New simplified query - returns all chickens
    const query = 'SELECT * FROM chickens';

    db.query(query, (err: Error | null, results: any) => {
        if(err) {
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        const formatted = results.map((chicken: any) =>({
            ...chicken,
            imageData: chicken.imageData
            ? `data:${detectMimeType(chicken.imageData)};base64,${chicken.imageData.toString('base64')}`
            : null
        }))
        res.json(formatted);
    });
});

app.put('/api/updateChicken', (req, res) => {
    const {rfid,chickenName,gender,dob,species,weightKg,imageData,notes} = req.body;

    let imageBuffer = null;
    if (imageData) {
        const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64String, 'base64');
    }

    const query = 'UPDATE chickens SET chickenName = ?, gender = ?, dateOfBirth = ?, species = ?, weightKg = ?, imageData = ?, notes = ? WHERE rfid = ?';
    db.query(query, [chickenName, gender, dob, species, weightKg, imageBuffer, notes, rfid], (err: Error | null, _results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Chicken updated successfully' });
    })
});

app.delete('/api/deleteChicken', (req, res) => {
    const { rfid } = req.body;
    const query = 'DELETE FROM chickens WHERE rfid = ?';
    db.query(query, [rfid], (err: Error | null, _results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Chicken deleted successfully' });
    });
});

app.get('/api/getChickenNames', (req, res) => {
    const query = 'SELECT rfid, chickenName FROM chickens';
    db.query(query, (err: Error | null, results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});
app.post('/api/addChickenEgg', (req, res) => {
    const {rfid, recordedAt, eggCount} = req.body;
    const formattedDate = recordedAt.replace("T", " ") + ":00";
    const query = 'INSERT INTO chickenEggs (rfid, recordedAt, eggCount) VALUES (?, ?, ?)';
    db.query(query, [rfid, formattedDate, eggCount], (err: Error | null, _results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Egg log added successfully' });
    })
});
app.post('/api/addHealthLog', (req, res) => {
    const {rfid, observation, action, date} = req.body;
    const query = 'INSERT INTO animalHealthLogs (rfid, observation, actionTaken, recordedAt) VALUES (?, ?, ?, ?)';
    db.query(query, [rfid, observation, action, date], (err: Error | null, _results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Health log added successfully' });
    })
});
app.post('/api/addChicken', (req, res) => {
    const {rfid,coopId,chickenName,gender,dob,species,weightKg,imageData,regDate,notes} = req.body;

    let imageBuffer = null;
    if (imageData) {
        const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64String, 'base64');
    }

    const query = 'INSERT INTO chickens (rfid, coopId, chickenName, gender, dateOfBirth, species, weightKg, imageData, registerDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [rfid, coopId, chickenName, gender, dob, species, weightKg, imageBuffer, regDate, notes], (err: Error | null, _results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Chicken added successfully' });
    })
}); 
app.get('/api/getCoopIDs', (req, res) => {
    const query = 'SELECT coopId FROM coops ORDER BY coopId ASC';
    db.query(query, (err: Error | null, results: any) => {
        if(err){
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});

/* Dashboard queries */

app.get("/api/dashboard", (req, res) => {

    const queries = {
        chickens: "SELECT COUNT(*) AS total FROM chickens",
        eggs: "SELECT SUM(eggCount) AS total FROM chickenEggs",
        predators: "SELECT COUNT(*) AS total FROM predatorLog",
        movement: "SELECT COUNT(*) AS total FROM coopActivityLogs WHERE eventType='movement'"
    };

    Promise.all([
        new Promise((resolve, reject) => {
            db.query(queries.chickens, (err: Error | null, result: any) => {
                if (err) reject(err);
                else resolve(result[0].total);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.eggs, (err: Error | null, result: any) => {
                if (err) reject(err);
                else resolve(Number(result[0].total) || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.predators, (err: Error | null, result: any) => {
                if (err) reject(err);
                else resolve(result[0].total);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queries.movement, (err: Error | null, result: any) => {
                if (err) reject(err);
                else resolve(result[0].total);
            });
        })
    ])
    .then(([chickens, eggs, predators, movement]) => {
        res.json({
            chickens,
            weeklyEggs: eggs,
            predatorIncidents: predators,
            movement
        });
    })
    .catch(err => res.status(500).json(err));
});



app.get("/api/eggs", (req, res) => {
    const query = `
        SELECT DATE(recordedAt) AS date, SUM(eggCount) AS eggs
        FROM chickenEggs
        GROUP BY DATE(recordedAt)
        ORDER BY date ASC
    `;

    db.query(query, (err: Error | null, results: any) => {
        if (err) return res.status(500).json(err);
        res.json(results);


        });
});

app.get("/api/predators", (req, res) => {
    const query = `
        SELECT DATE(timeOfDetection) as date, COUNT(*) as count
        FROM predatorLog
        GROUP BY DATE(timeOfDetection)
        ORDER BY date ASC
    `;

    db.query(query, (err: Error | null, result: any) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});


app.get("/api/movement", (req, res) => {
    const query = `
        SELECT DATE(takenAt) as date, COUNT(*) as count
        FROM coopActivityLogs
        WHERE eventType='movement'
        GROUP BY DATE(takenAt)
        ORDER BY date ASC
    `;

    db.query(query, (err: Error | null, result: any) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* Coop queries */

app.get('/api/coopSelect', (req, res) => {
    const query = 'SELECT * FROM coops';

    db.query(query, (err: Error | null, results: any) => {
        if(err) {
            console.log("Query error;", err);
            return res.status(500).json({ error: 'Database query error' });
        }

        res.json(results);
    });
});

app.put('/api/updateDoorTimes', (req, res) => {
    const { openTime, closeTime, coopId } = req.body;
    const query = 'UPDATE coops SET doorOpen = ?, doorClose = ? WHERE coopId = ?';

    db.query(query, [openTime, closeTime, coopId], (err: Error | null, _results: any) => {
        if (err) {
            console.error('Error updating door times:', err);
            return res.status(500).json({ error: 'Database update error' });
        }
        res.json({ message: 'Door times updated successfully' });
    });
});

app.delete("/api/clear", (req, res) => {
    const deleteQueries = [
        'DELETE FROM chickenEggs',
        'DELETE FROM predatorLog',
        'DELETE FROM coopActivityLogs'
    ];

    Promise.all(
        deleteQueries.map(
            (query) =>
                new Promise<void>((resolve, reject) => {
                    db.query(query, (err: Error | null) => {
                        if (err) reject(err);
                        else resolve();
                    });
                })
        )
    )
        .then(() => res.json({ message: "All data cleared" }))
        .catch((err: Error) => {
            console.error('Error clearing legacy data:', err);
            res.status(500).json({ error: 'Database clear error' });
        });
});

app.put('/api/updateCleaningTimes', (req, res) => {
    const { reminderDate, reminderPeriod, coopId } = req.body;
    const query = 'UPDATE coops SET reminderDate = ?, reminderPeriod = ? WHERE coopId = ?';

    db.query(query, [reminderDate, reminderPeriod, coopId], (err: Error | null, _results: any) => {
        if (err) {
            console.error('Error updating cleaning times:', err);
            return res.status(500).json({ error: 'Database update error' });
        }
        res.json({ message: 'Cleaning times updated successfully' });
    });
});


app.post('/api/addCleaningLog', (req, res) => {
    const { coopId, lastCleaned, nextCleanDue, NextCleanDue, weightKg, notes } = req.body;
    const cleanDue = nextCleanDue ?? NextCleanDue ?? null;
    const query = 'INSERT INTO coopCleaningLogs (coopId, lastCleaned, nextCleanDue, weightKg, notes) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [coopId, lastCleaned, cleanDue, weightKg, notes], (err: Error | null, _results: any) => {
        if (err) {
            console.error('Error adding cleaning log:', err);
            return res.status(500).json({ error: 'Database insert error' });
        }
        res.json({ message: 'Cleaning log added successfully' });
    });
});

app.post('/api/addCoop', (req, res) => {
    const { zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod } = req.body;
    const query = `INSERT INTO coops (zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod], (err: Error | null, results: any) => {
        if (err) {
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Coop added successfully', coopId: results.insertId });
    });
});

app.put('/api/updateCoop/:coopId', (req, res) => {
    const { coopId } = req.params;
    const { zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod } = req.body;
    const query = `UPDATE coops SET zoneId = ?, coopName = ?, capacity = ?, notes = ?, doorOpen = ?, doorClose = ?, 
                   reminderDate = ?, reminderPeriod = ? WHERE coopId = ?`;
    db.query(query, [zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod, coopId], (err: Error | null, results: any) => {
        if (err) {
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Coop not found' });
        }
        res.json({ message: 'Coop updated successfully' });
    });
});


app.put('/api/updateCoop', (req, res) => {
    const { coopId, zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod } = req.body;

    if (!coopId) {
        return res.status(400).json({ error: 'coopId is required' });
    }

    const query = `UPDATE coops SET zoneId = ?, coopName = ?, capacity = ?, notes = ?, doorOpen = ?, doorClose = ?, 
                   reminderDate = ?, reminderPeriod = ? WHERE coopId = ?`;
    db.query(query, [zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod, coopId], (err: Error | null, results: any) => {
        if (err) {
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Coop not found' });
        }
        res.json({ message: 'Coop updated successfully' });
    });
});

app.delete('/api/deleteCoop/:coopId', (req, res) => {
    const { coopId } = req.params;
    const query = 'DELETE FROM coops WHERE coopId = ?';
    db.query(query, [coopId], (err: Error | null, results: any) => {
        if (err) {
            console.log("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Coop not found' });
        }
        res.json({ message: 'Coop deleted successfully' });
    });
});

//--------------------------Power team----------------------------------

app.get('/api/batteryLevel', (req, res) => {
    const query = 'SELECT batteryLevelPercent FROM batteryLevels ORDER BY batteryLevelId DESC LIMIT 1';

    db.query(query, (err: Error | null, results: any) => {
        if(err) {
            console.log("Query error;", err);
            return res.status(500).json({ error: 'Database query error' });
        }

        res.json(results);
    });
});

app.get('/api/solar-hourly', (req: Request, res: Response) => {
    // 1. We ORDER BY DESC to get the newest data first
    // 2. We LIMIT 24 to get the last 24 hours recorded
    const query = `
        SELECT 
            DATE_FORMAT(takenAt, '%Y-%m-%d %H:00:00') AS hour_bucket, 
            AVG(powerGeneratedKw) AS avg_power
        FROM solarReadings 
        GROUP BY hour_bucket
        ORDER BY hour_bucket DESC 
        LIMIT 24;
    `;

    db.query(query, (err: Error | null, results: any) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        
        // Reverse the results so the chart reads Left -> Right (Oldest -> Newest)
        const chronologicalData = Array.isArray(results) ? [...results].reverse() : [];
        res.json(chronologicalData);
    });
});

app.get('/api/power-out', (req: Request, res: Response) => {

    const usageQuery = `
        SELECT 
            DATE_FORMAT(takenAt, '%Y-%m-%d %H:00:00') AS per_hour, 
            AVG(powerUsageKw) AS average_power
        FROM powerOutputLogs 
        GROUP BY per_hour
        ORDER BY per_hour DESC 
        LIMIT 24;
    `;

    const fallbackQuery = `
        SELECT
            DATE_FORMAT(sr.takenAt, '%Y-%m-%d %H:00:00') AS per_hour,
            AVG(sr.powerGeneratedKw) AS average_power
        FROM solarReadings sr
        GROUP BY per_hour
        ORDER BY per_hour DESC
        LIMIT 24;
    `;

    db.query(usageQuery, (err: Error | null, results: any) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (Array.isArray(results) && results.length > 0) {
            const chronologicalData = [...results].reverse();
            return res.json(chronologicalData);
        }

        db.query(fallbackQuery, (fallbackErr: Error | null, fallbackResults: any) => {
            if (fallbackErr) {
                console.error("Fallback database error:", fallbackErr);
                return res.status(500).json({ error: 'Database query error' });
            }

            const chronologicalData = Array.isArray(fallbackResults)
                ? [...fallbackResults].reverse()
                : [];

            res.json(chronologicalData);
        });
    });
});

app.get('/api/batteryLevel-everyTenMinutes', (req: Request, res: Response) => {
const batteryId = req.query.id; 

    const query = `
        SELECT 
            FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(takenAt) / 600) * 600) AS intervalTime,
            AVG(batteryLevelPercent) as avgLevel
        FROM batteryLevels
        WHERE batteryId = ? 
        GROUP BY intervalTime
        ORDER BY intervalTime ASC
    `;

    db.query(query, [batteryId], (err: Error | null, results: any) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});

app.get('/api/zone-power-usage', (req: Request, res: Response) => {
    // 1. We JOIN the zones with their logs using destinationZoneId
    // 2. We SUM the powerUsageKw to get the total per zone
    // 3. We GROUP BY the zone name for the Pie Chart labels
    const query = `
        SELECT 
            fz.zoneName, 
            SUM(pol.powerUsageKw) AS totalPower
        FROM farmZones fz
        INNER JOIN powerOutputLogs pol ON fz.farmZoneId = pol.destinationZoneId
        GROUP BY fz.zoneName
        ORDER BY totalPower DESC;
    `;

    const fallbackQuery = `
        SELECT
            fz.zoneName,
            ROUND(SUM(sr.powerGeneratedKw), 3) AS totalPower
        FROM solarReadings sr
        JOIN solarPanel sp ON sp.solarPanelId = sr.solarPanelId
        JOIN farmZones fz ON fz.farmZoneId = sp.zoneId
        GROUP BY fz.zoneName
        ORDER BY totalPower DESC;
    `;

    db.query(query, (err: Error | null, results: any) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (Array.isArray(results) && results.length > 0) {
            // Return the results directly for the Pie Chart
            // Expected format: [{ zoneName: 'Zone A', totalPower: 500 }, ...]
            return res.json(results);
        }

        db.query(fallbackQuery, (fallbackErr: Error | null, fallbackResults: any) => {
            if (fallbackErr) {
                console.error("Fallback database error:", fallbackErr);
                return res.status(500).json({ error: 'Database query error' });
            }

            res.json(fallbackResults);
        });
    });
});

// -------------------- WATER SENSOR --------------------

app.get('/api/water-sensor-readings', (req, res) => {
    const limit = req.query.limit || 10;
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const query = `
        SELECT *
        FROM waterSensorReadings
        ORDER BY takenAt ${order}
        LIMIT ?
    `;

    db.query(query, [Number(limit)], (err, results) => {
        if (err) {
            console.error("Query error:", err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});

app.get('/api/valves', (req: Request, res: Response) => {
    const query = `
        SELECT
            valve.id,
            COALESCE(
                JSON_UNQUOTE(JSON_EXTRACT(tm.payload, '$.state')),
                'closed'
            ) AS state,
            COALESCE(
                DATE_FORMAT(tm.sentAt, '%Y-%m-%d %H:%i:%s'),
                'Never'
            ) AS lastChanged
        FROM (
            SELECT 1 AS id
            UNION ALL
            SELECT 2 AS id
        ) AS valve
        LEFT JOIN tileMessages tm
            ON tm.messageId = (
                SELECT tm2.messageId
                FROM tileMessages tm2
                WHERE tm2.destTile = 'Water Distribution Tile'
                  AND tm2.msgType = 'command'
                  AND CAST(JSON_UNQUOTE(JSON_EXTRACT(tm2.payload, '$.valveId')) AS UNSIGNED) = valve.id
                ORDER BY tm2.sentAt DESC, tm2.messageId DESC
                LIMIT 1
            )
        ORDER BY valve.id ASC
    `;

    db.query(query, (err: Error | null, results: any) => {
        if (err) {
            console.error('Valve query error:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        const normalized = Array.isArray(results)
            ? results.map((row: any) => ({
                id: Number(row.id),
                state: row.state === 'open' ? 'open' : 'closed',
                lastChanged: row.lastChanged,
            }))
            : [];

        res.json(normalized);
    });
});

app.put('/api/valves/:id', (req: Request, res: Response) => {
    const valveId = Number(req.params.id);
    const { state } = req.body;

    if (![1, 2].includes(valveId)) {
        return res.status(400).json({ error: 'Valve id must be 1 or 2' });
    }

    if (state !== 'open' && state !== 'closed') {
        return res.status(400).json({ error: 'state must be "open" or "closed"' });
    }

    const valveNodeQuery = `
        SELECT nodeId, nodeName
        FROM waterDistributionNodes
        WHERE LOWER(nodeType) = 'valve'
        ORDER BY nodeId ASC
        LIMIT 1
    `;

    db.query(valveNodeQuery, (nodeErr: Error | null, nodeResults: any) => {
        if (nodeErr) {
            console.error('Valve node lookup error:', nodeErr);
            return res.status(500).json({ error: 'Database query error' });
        }

        const valveNode = Array.isArray(nodeResults) ? nodeResults[0] : null;

        if (!valveNode) {
            return res.status(404).json({ error: 'No valve node configured in waterDistributionNodes' });
        }

        const insertQuery = `
            INSERT INTO tileMessages (srcTile, destTile, msgType, payload)
            VALUES (?, ?, ?, JSON_OBJECT('nodeId', ?, 'nodeName', ?, 'valveId', ?, 'state', ?))
        `;

        db.query(
            insertQuery,
            ['Website Dashboard', 'Water Distribution Tile', 'command', valveNode.nodeId, valveNode.nodeName, valveId, state],
            (insertErr: Error | null) => {
                if (insertErr) {
                    console.error('Valve command insert error:', insertErr);
                    return res.status(500).json({ error: 'Database insert error' });
                }

                res.json({
                    id: valveId,
                    state,
                    lastChanged: new Date().toISOString(),
                });
            }
        );
    });
});

//ssh to pi
import { NodeSSH } from 'node-ssh';

app.post('/api/door', async (req: Request, res: Response) => {
    const { state } = req.body; 
    
    const ssh = new NodeSSH();
    
    try {
        await ssh.connect({
            host: process.env.PI_HOST,        
            username: process.env.PI_USER,    
            password: process.env.PI_PASS,
        });

        const command = state === 'open' 
            ? 'python3 ~/door_open.py' 
            : 'python3 ~/door_close.py';

        const result = await ssh.execCommand(command);
        ssh.dispose();

        res.json({ success: true, output: result.stdout });
    } catch (err) {
        console.error('SSH error:', err);
        res.status(500).json({ error: 'Failed to connect to Pi' });
    }
});


app.listen(5000, () => console.log('Server running on port 5000'));

// ===================== CROP API START =====================

// ===================== CROP API =====================
// All routes corrected to match the actual DB schema.
//
// Key schema facts:
//   crops             → cropId, commonName, scientificName, variety, growthDurationDays
//   cropPlantings     → cropPlantingId, fieldId, cropId, cropStatus, plantedDate, expectedHarvestDate
//   cropSensorReadings→ cropSensorReadingId, plantingId, deviceId, sensorType, value1, value2, value3, takenAt
//   harvestRecords    → harvestRecordId, plantingId, harvestedAt, yieldKg, qualityGrade
//   cropImages        → cropImageId, plantingId, deviceId, imageData, takenAt
//   cropAiPredictions → cropAiPredictionId, imageId, diseaseName, confidenceScore, status, createdAt
//   fields            → fieldId, zoneId, fieldName, areaM2, soilType
//   farmZones         → farmZoneId, zoneName


// ---------- GET: Crop Tile Farm Zones ----------
app.get('/api/farmzones', (req: Request, res: Response) => {
    const { tileId } = req.query;

    let query = `
        SELECT
            fz.farmZoneId,
            fz.farmId,
            fz.zoneName,
            fz.tileId,
            fz.description,
            fz.areaSqMeter,
            fz.createdAt
        FROM farmZones fz
        LEFT JOIN tiles t ON t.tileId = fz.tileId
    `;
    const params: Array<number | string> = [];

    if (tileId !== undefined) {
        const normalizedTileId = String(tileId).trim().toLowerCase();

        if (normalizedTileId === 'crop') {
            query += ` WHERE LOWER(t.tileName) = 'crop tile' `;
        } else {
            const numericTileId = Number(tileId);

            if (!Number.isInteger(numericTileId)) {
                return res.status(400).json({ error: 'tileId must be "crop" or a numeric tile id' });
            }

            query += ` WHERE fz.tileId = ? `;
            params.push(numericTileId);
        }
    }

    query += ` ORDER BY fz.zoneName ASC `;

    db.query(query, params, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: Fields for a Zone ----------
app.get('/api/fields', (req: Request, res: Response) => {
    const zoneId = Number(req.query.zoneId);

    if (!Number.isInteger(zoneId)) {
        return res.status(400).json({ error: 'zoneId is required and must be an integer' });
    }

    const query = `
        SELECT
            fieldId,
            zoneId,
            fieldName,
            areaM2,
            soilType,
            notes,
            createdAt
        FROM fields
        WHERE zoneId = ?
        ORDER BY fieldName ASC
    `;

    db.query(query, [zoneId], (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: All Crops ----------
app.get('/api/crops', (req: Request, res: Response) => {
    db.query('SELECT * FROM crops ORDER BY commonName ASC', (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: All Fields (with zone name) ----------
app.get('/api/crops/fields', (req: Request, res: Response) => {
    const query = `
        SELECT
            f.fieldId,
            f.fieldName,
            f.areaM2,
            f.soilType,
            f.notes,
            fz.zoneName
        FROM fields f
        LEFT JOIN farmZones fz ON fz.farmZoneId = f.zoneId
        ORDER BY f.fieldName ASC
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: Active Plantings ----------
// cropPlantings uses cropStatus (ENUM) and plantedDate — not 'status'/'plantingDate'
app.get('/api/crops/plantings', (req: Request, res: Response) => {
    const zoneIdParam = req.query.zoneId;

    if (zoneIdParam !== undefined) {
        const zoneId = Number(zoneIdParam);

        if (!Number.isInteger(zoneId)) {
            return res.status(400).json({ error: 'zoneId must be an integer' });
        }

        const zoneQuery = `
            SELECT
                cp.cropPlantingId,
                cp.fieldId,
                cp.cropId,
                cp.cropStatus,
                cp.plantedDate,
                cp.expectedHarvestDate,
                cp.actualHarvestDate,
                cp.notes,
                cp.createdAt,
                c.commonName,
                c.scientificName,
                c.variety,
                c.growthDurationDays,
                c.notes AS cropNotes,
                f.zoneId,
                f.fieldName,
                f.areaM2,
                f.soilType,
                f.notes AS fieldNotes,
                f.createdAt AS fieldCreatedAt
            FROM cropPlantings cp
            JOIN crops c ON c.cropId = cp.cropId
            JOIN fields f ON f.fieldId = cp.fieldId
            WHERE f.zoneId = ?
              AND cp.cropStatus NOT IN ('harvested', 'failed')
            ORDER BY cp.plantedDate DESC
        `;

        db.query(zoneQuery, [zoneId], (err: any, results: any) => {
            if (err) return res.status(500).json({ error: err.message });

            const formatted = results.map((row: any) => ({
                cropPlantingId: row.cropPlantingId,
                fieldId: row.fieldId,
                cropId: row.cropId,
                cropStatus: row.cropStatus,
                plantedDate: row.plantedDate,
                expectedHarvestDate: row.expectedHarvestDate,
                actualHarvestDate: row.actualHarvestDate,
                notes: row.notes,
                createdAt: row.createdAt,
                crop: {
                    cropId: row.cropId,
                    commonName: row.commonName,
                    scientificName: row.scientificName,
                    variety: row.variety,
                    growthDurationDays: row.growthDurationDays,
                    notes: row.cropNotes
                },
                field: {
                    fieldId: row.fieldId,
                    zoneId: row.zoneId,
                    fieldName: row.fieldName,
                    areaM2: row.areaM2,
                    soilType: row.soilType,
                    notes: row.fieldNotes,
                    createdAt: row.fieldCreatedAt
                }
            }));

            res.json(formatted);
        });

        return;
    }

    const query = `
        SELECT
            cp.cropPlantingId,
            cp.cropStatus,
            cp.plantedDate,
            cp.expectedHarvestDate,
            cp.actualHarvestDate,
            cp.notes,
            c.commonName        AS cropName,
            c.variety,
            c.growthDurationDays,
            f.fieldName,
            fz.zoneName,
            GREATEST(0, DATEDIFF(cp.expectedHarvestDate, CURDATE())) AS daysToHarvest
        FROM cropPlantings cp
        JOIN crops      c  ON c.cropId       = cp.cropId
        JOIN fields     f  ON f.fieldId      = cp.fieldId
        LEFT JOIN farmZones fz ON fz.farmZoneId = f.zoneId
        WHERE cp.cropStatus NOT IN ('harvested', 'failed')
        ORDER BY cp.plantedDate DESC
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: Sensor Readings for a Zone ----------
app.get('/api/crops/sensors', (req: Request, res: Response) => {
    const zoneId = Number(req.query.zoneId);
    const hoursParam = req.query.hours ?? 24;
    const hours = Number(hoursParam);

    if (!Number.isInteger(zoneId)) {
        return res.status(400).json({ error: 'zoneId is required and must be an integer' });
    }

    if (!Number.isInteger(hours) || hours <= 0) {
        return res.status(400).json({ error: 'hours must be a positive integer' });
    }

    const query = `
        SELECT
            csr.cropSensorReadingId,
            csr.plantingId,
            csr.deviceId,
            csr.sensorType,
            csr.value1,
            csr.value2,
            csr.value3,
            csr.takenAt
        FROM cropSensorReadings csr
        JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
        JOIN fields f ON f.fieldId = cp.fieldId
        WHERE f.zoneId = ?
          AND csr.takenAt >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY csr.takenAt DESC
    `;

    db.query(query, [zoneId, hours], (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: Devices for a Zone ----------
app.get('/api/devices', (req: Request, res: Response) => {
    const zoneId = Number(req.query.zoneId);

    if (!Number.isInteger(zoneId)) {
        return res.status(400).json({ error: 'zoneId is required and must be an integer' });
    }

    const query = `
        SELECT
            deviceId,
            zoneId,
            deviceName,
            deviceType,
            location,
            protocol,
            status,
            macAddress,
            firmwareVersion,
            lastSeen,
            notes
        FROM devices
        WHERE zoneId = ?
        ORDER BY deviceName ASC
    `;

    db.query(query, [zoneId], (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ---------- GET: Crop Growth / Yield Chart ----------
// There is no cropGrowth table or heightCm column in the schema.
// Weekly harvest yield from harvestRecords is the correct growth proxy.
app.get('/api/crops/growth', (req: Request, res: Response) => {
    const query = `
        SELECT
            YEARWEEK(hr.harvestedAt, 3)     AS sortKey,
            CONCAT('Week ',
                YEARWEEK(hr.harvestedAt, 3) - YEARWEEK(
                    (SELECT MIN(harvestedAt) FROM harvestRecords
                     WHERE harvestedAt >= NOW() - INTERVAL 10 WEEK), 3
                ) + 1
            )                               AS week,
            c.commonName                    AS crop,
            ROUND(SUM(hr.yieldKg), 2)       AS yieldKg
        FROM harvestRecords  hr
        JOIN cropPlantings   cp ON cp.cropPlantingId = hr.plantingId
        JOIN crops            c  ON c.cropId          = cp.cropId
        WHERE hr.harvestedAt >= NOW() - INTERVAL 10 WEEK
        GROUP BY YEARWEEK(hr.harvestedAt, 3), c.cropId, c.commonName
        ORDER BY sortKey ASC
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });

        // Pivot rows → { week: 'Week 1', Spinach: 12.5, Tomato: 8.0 }
        const pivoted: Record<string, any> = {};
        for (const row of results) {
            if (!pivoted[row.sortKey]) pivoted[row.sortKey] = { week: row.week };
            pivoted[row.sortKey][row.crop] = row.yieldKg;
        }
        res.json(Object.values(pivoted));
    });
});

// ---------- GET: AI Predictions (latest 20) ----------
// cropAiPredictions links to cropImages via imageId — no direct cropId
app.get('/api/crops/predictions', (req: Request, res: Response) => {
    const query = `
        SELECT
            ai.cropAiPredictionId,
            ai.diseaseName,
            ai.confidenceScore,
            ai.status,
            ai.createdAt,
            c.commonName    AS cropName,
            f.fieldName,
            fz.zoneName
        FROM cropAiPredictions ai
        JOIN cropImages      ci ON ci.cropImageId    = ai.imageId
        JOIN cropPlantings   cp ON cp.cropPlantingId = ci.plantingId
        JOIN crops            c  ON c.cropId          = cp.cropId
        JOIN fields           f  ON f.fieldId         = cp.fieldId
        LEFT JOIN farmZones   fz ON fz.farmZoneId     = f.zoneId
        ORDER BY ai.createdAt DESC
        LIMIT 20
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ---------- GET: Crop Images (latest 50, without binary data) ----------
// imageData (LONGBLOB) is excluded by default — fetch /api/crops/images/:id for the binary
app.get('/api/crops/images', (req: Request, res: Response) => {
    const query = `
        SELECT
            ci.cropImageId,
            ci.plantingId,
            ci.deviceId,
            ci.takenAt,
            c.commonName    AS cropName,
            f.fieldName,
            fz.zoneName,
            d.deviceName,
            -- include latest AI prediction for this image inline
            ai.status           AS aiStatus,
            ai.diseaseName      AS aiDiseaseName,
            ai.confidenceScore  AS aiConfidenceScore
        FROM cropImages ci
        JOIN cropPlantings   cp ON cp.cropPlantingId = ci.plantingId
        JOIN crops            c  ON c.cropId          = cp.cropId
        JOIN fields           f  ON f.fieldId         = cp.fieldId
        LEFT JOIN farmZones   fz ON fz.farmZoneId     = f.zoneId
        LEFT JOIN devices     d  ON d.deviceId        = ci.deviceId
        LEFT JOIN cropAiPredictions ai ON ai.imageId  = ci.cropImageId
        ORDER BY ci.takenAt DESC
        LIMIT 50
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ---------- GET: Single Crop Image (binary) ----------
app.get('/api/crops/images/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.query(
        'SELECT imageData, takenAt FROM cropImages WHERE cropImageId = ?',
        [id],
        (err: any, results: any) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!results.length) return res.status(404).json({ error: 'Image not found' });

            const buf: Buffer = results[0].imageData;
            const mime =
                buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' :
                buf[0] === 0x89 && buf[1] === 0x50 ? 'image/png'  : 'image/jpeg';

            res.setHeader('Content-Type', mime);
            res.send(buf);
        }
    );
});

// ---------- GET: Harvest Records ----------
// harvestRecords links to cropPlantings via plantingId — not directly to crops
app.get('/api/crops/harvests', (req: Request, res: Response) => {
    const query = `
        SELECT
            hr.harvestRecordId,
            hr.harvestedAt,
            hr.yieldKg,
            hr.qualityGrade,
            hr.notes,
            c.commonName    AS cropName,
            c.variety,
            f.fieldName,
            fz.zoneName
        FROM harvestRecords hr
        JOIN cropPlantings  cp ON cp.cropPlantingId = hr.plantingId
        JOIN crops           c  ON c.cropId          = cp.cropId
        JOIN fields          f  ON f.fieldId         = cp.fieldId
        LEFT JOIN farmZones  fz ON fz.farmZoneId     = f.zoneId
        ORDER BY hr.harvestedAt DESC
    `;
    db.query(query, (err: any, results: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ===================== CREATE / UPDATE ROUTES =====================

// ---------- POST: Add Crop ----------
// Schema uses commonName — not cropName
app.post('/api/crops', (req: Request, res: Response) => {
    const { commonName, scientificName, variety, growthDurationDays, notes } = req.body;

    if (!commonName) return res.status(400).json({ error: 'commonName is required' });

    db.query(
        'INSERT INTO crops (commonName, scientificName, variety, growthDurationDays, notes) VALUES (?, ?, ?, ?, ?)',
        [commonName, scientificName ?? null, variety ?? null, growthDurationDays ?? null, notes ?? null],
        (err: any, result: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Crop added', cropId: result.insertId });
        }
    );
});

// ---------- POST: Add Planting ----------
// Schema uses cropStatus (ENUM) and plantedDate — not 'status'/'plantingDate'
app.post('/api/crops/plantings', (req: Request, res: Response) => {
    const { cropId, fieldId, cropStatus, plantedDate, expectedHarvestDate, notes } = req.body;

    if (!cropId || !fieldId || !cropStatus || !plantedDate) {
        return res.status(400).json({ error: 'cropId, fieldId, cropStatus, and plantedDate are required' });
    }

    const validStatuses = ['planted', 'growing', 'ready_to_harvest', 'harvested', 'failed'];
    if (!validStatuses.includes(cropStatus)) {
        return res.status(400).json({ error: `cropStatus must be one of: ${validStatuses.join(', ')}` });
    }

    const query = `
        INSERT INTO cropPlantings (cropId, fieldId, cropStatus, plantedDate, expectedHarvestDate, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [cropId, fieldId, cropStatus, plantedDate, expectedHarvestDate ?? null, notes ?? null],
        (err: any, result: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Planting added', cropPlantingId: result.insertId });
        }
    );
});

// ---------- PATCH: Update Planting Status ----------
app.patch('/api/crops/plantings/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { cropStatus, actualHarvestDate } = req.body;

    const validStatuses = ['planted', 'growing', 'ready_to_harvest', 'harvested', 'failed'];
    if (!validStatuses.includes(cropStatus)) {
        return res.status(400).json({ error: `cropStatus must be one of: ${validStatuses.join(', ')}` });
    }

    db.query(
        'UPDATE cropPlantings SET cropStatus = ?, actualHarvestDate = ? WHERE cropPlantingId = ?',
        [cropStatus, actualHarvestDate ?? null, id],
        (err: any, result: any) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Planting not found' });
            res.json({ message: 'Status updated' });
        }
    );
});

/// ===================== FULL SENSOR API =====================

// ==========================================================
// GET ALL AVAILABLE SENSOR TYPES
// ==========================================================
app.get('/api/crops/sensors/types', (req: Request, res: Response) => {

    const query = `
        SELECT DISTINCT sensorType
        FROM cropSensorReadings
        ORDER BY sensorType ASC
    `;

    db.query(query, (err: any, results: any) => {

        if (err) {
            console.error('Sensor types error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const types = results.map((row: any) => row.sensorType);

        res.json(types);
    });
});

// ==========================================================
// GET LATEST SENSOR VALUES
// Used for dashboard cards/widgets
// ==========================================================
app.get('/api/crops/sensors/latest', (req: Request, res: Response) => {

    const fieldId = Number(req.query.fieldId);

    if (!Number.isInteger(fieldId)) {
        return res.status(400).json({ error: 'fieldId is required and must be an integer' });
    }

    const query = `
        SELECT
            csr.cropSensorReadingId,
            cp.fieldId,
            csr.plantingId,
            csr.deviceId,
            csr.sensorType,
            csr.value1,
            csr.value2,
            csr.value3,
            csr.takenAt
        FROM cropSensorReadings csr
        JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
        WHERE cp.fieldId = ?
          AND csr.cropSensorReadingId = (
              SELECT csr2.cropSensorReadingId
              FROM cropSensorReadings csr2
              JOIN cropPlantings cp2 ON cp2.cropPlantingId = csr2.plantingId
              WHERE cp2.fieldId = cp.fieldId
                AND csr2.sensorType = csr.sensorType
              ORDER BY csr2.takenAt DESC, csr2.cropSensorReadingId DESC
              LIMIT 1
          )
        ORDER BY csr.sensorType ASC
    `;

    db.query(query, [fieldId], (err: any, results: any) => {

        if (err) {
            console.error('Latest sensors error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const formatted = results.map((row: any) => ({
            cropSensorReadingId: row.cropSensorReadingId,
            readingId: row.cropSensorReadingId,
            fieldId: row.fieldId,
            plantingId: row.plantingId,
            deviceId: row.deviceId,
            sensorType: row.sensorType,
            value: row.value1,
            value1: row.value1,
            value2: row.value2,
            value3: row.value3,
            takenAt: row.takenAt,
            recordedAt: row.takenAt
        }));

        res.json(formatted);
    });
});

// ==========================================================
// LIVE SENSOR GRAPH DATA
// Used for real-time line charts
// ==========================================================
app.get('/api/crops/sensors/live', (req: Request, res: Response) => {

    const {
        fieldId,
        sensorType,
        range = '1h'
    } = req.query;

    const numericFieldId = Number(fieldId);

    if (!Number.isInteger(numericFieldId)) {
        return res.status(400).json({ error: 'fieldId is required and must be an integer' });
    }

    if (typeof sensorType !== 'string' || sensorType.trim() === '') {
        return res.status(400).json({ error: 'sensorType is required' });
    }

    let interval = '1 HOUR';

    if (range === '6h') interval = '6 HOUR';
    if (range === '24h') interval = '24 HOUR';
    if (range === '7d') interval = '7 DAY';

    const query = `
        SELECT
            csr.cropSensorReadingId,
            cp.fieldId,
            csr.plantingId,
            csr.deviceId,
            csr.takenAt,
            csr.value1,
            csr.value2,
            csr.value3
        FROM cropSensorReadings csr
        JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
        WHERE cp.fieldId = ?
          AND csr.sensorType = ?
          AND csr.takenAt >= NOW() - INTERVAL ${interval}
        ORDER BY csr.takenAt ASC
    `;

    db.query(query, [numericFieldId, sensorType], (err: any, results: any) => {

        if (err) {
            console.error('Live sensor error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const formatted = results.map((row: any) => ({
            cropSensorReadingId: row.cropSensorReadingId,
            readingId: row.cropSensorReadingId,
            fieldId: row.fieldId,
            plantingId: row.plantingId,
            deviceId: row.deviceId,
            time: new Date(row.takenAt).toLocaleTimeString(),
            value: Number(row.value1),
            value1: Number(row.value1),
            value2: row.value2 === null ? null : Number(row.value2),
            value3: row.value3 === null ? null : Number(row.value3),
            takenAt: row.takenAt,
            recordedAt: row.takenAt
        }));

        res.json(formatted);
    });
});

// ==========================================================
// SENSOR HISTORY
// Paginated historical data
// ==========================================================
app.get('/api/crops/sensors/history', (req: Request, res: Response) => {

    const {
        fieldId,
        sensorType,
        limit = 100,
        offset = 0
    } = req.query;

    const numericFieldId = Number(fieldId);

    if (!Number.isInteger(numericFieldId)) {
        return res.status(400).json({ error: 'fieldId is required and must be an integer' });
    }

    if (typeof sensorType !== 'string' || sensorType.trim() === '') {
        return res.status(400).json({ error: 'sensorType is required' });
    }

    const query = `
        SELECT
            csr.cropSensorReadingId,
            cp.fieldId,
            csr.plantingId,
            csr.deviceId,
            csr.sensorType,
            csr.value1,
            csr.value2,
            csr.value3,
            csr.takenAt
        FROM cropSensorReadings csr
        JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
        WHERE cp.fieldId = ?
          AND csr.sensorType = ?
        ORDER BY csr.takenAt DESC
        LIMIT ? OFFSET ?
    `;

    db.query(
        query,
        [
            numericFieldId,
            sensorType,
            Number(limit),
            Number(offset)
        ],
        (err: any, results: any) => {

            if (err) {
                console.error('Sensor history error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json(
                results.map((row: any) => ({
                    cropSensorReadingId: row.cropSensorReadingId,
                    readingId: row.cropSensorReadingId,
                    fieldId: row.fieldId,
                    plantingId: row.plantingId,
                    deviceId: row.deviceId,
                    sensorType: row.sensorType,
                    sensorValue: row.value1,
                    value1: row.value1,
                    value2: row.value2,
                    value3: row.value3,
                    takenAt: row.takenAt,
                    recordedAt: row.takenAt
                }))
            );
        }
    );
});

// ==========================================================
// SENSOR SUMMARY
// Average values over 24h
// ==========================================================
app.get('/api/crops/sensors/summary', (req: Request, res: Response) => {

    const fieldIdParam = req.query.fieldId;
    const fieldId = fieldIdParam === undefined ? null : Number(fieldIdParam);

    if (fieldIdParam !== undefined && !Number.isInteger(fieldId)) {
        return res.status(400).json({ error: 'fieldId must be an integer' });
    }

    const query = `
        SELECT
            fz.zoneName,
            csr.sensorType,
            ROUND(AVG(csr.value1), 4) AS avgValue1,
            ROUND(AVG(csr.value2), 4) AS avgValue2,
            ROUND(AVG(csr.value3), 4) AS avgValue3,
            ROUND(MIN(csr.value1), 4) AS minValue1,
            ROUND(MIN(csr.value2), 4) AS minValue2,
            ROUND(MIN(csr.value3), 4) AS minValue3,
            ROUND(MAX(csr.value1), 4) AS maxValue1,
            ROUND(MAX(csr.value2), 4) AS maxValue2,
            ROUND(MAX(csr.value3), 4) AS maxValue3,
            COUNT(*) AS readingCount
        FROM cropSensorReadings csr
        JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
        JOIN fields f ON f.fieldId = cp.fieldId
        LEFT JOIN farmZones fz ON fz.farmZoneId = f.zoneId
        WHERE csr.takenAt >= NOW() - INTERVAL 24 HOUR
        ${fieldId !== null ? 'AND f.fieldId = ?' : ''}
        GROUP BY fz.zoneName, csr.sensorType
        ORDER BY fz.zoneName ASC, csr.sensorType ASC
    `;

    db.query(query, fieldId !== null ? [fieldId] : [], (err: any, results: any) => {

        if (err) {
            console.error('Sensor summary error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const formatted = results.map((row: any) => ({
            zoneName: row.zoneName,
            sensorType: row.sensorType,
            avgValue1: row.avgValue1,
            avgValue2: row.avgValue2,
            avgValue3: row.avgValue3,
            minValue1: row.minValue1,
            minValue2: row.minValue2,
            minValue3: row.minValue3,
            maxValue1: row.maxValue1,
            maxValue2: row.maxValue2,
            maxValue3: row.maxValue3,
            readingCount: Number(row.readingCount),
            average: row.avgValue1,
            min: row.minValue1,
            max: row.maxValue1
        }));

        res.json(formatted);
    });
});

// ==========================================================
// INSERT SENSOR READING
// Used by IoT devices / simulators
// ==========================================================
app.post('/api/crops/sensors', (req: Request, res: Response) => {

    const {
        plantingId,
        deviceId,
        sensorType,
        sensorValue,
        value1,
        value2,
        value3,
        takenAt
    } = req.body;

    const primaryValue = value1 ?? sensorValue;

    if (
        !plantingId ||
        !deviceId ||
        !sensorType ||
        (primaryValue === undefined && value2 === undefined && value3 === undefined)
    ) {
        return res.status(400).json({
            error: 'plantingId, deviceId, sensorType, and at least one sensor value are required'
        });
    }

    const query = `
        INSERT INTO cropSensorReadings
        (
            plantingId,
            deviceId,
            sensorType,
            value1,
            value2,
            value3,
            takenAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            plantingId,
            deviceId,
            sensorType,
            primaryValue ?? null,
            value2 ?? null,
            value3 ?? null,
            takenAt ?? new Date()
        ],
        (err: any, result: any) => {

            if (err) {
                console.error('Insert sensor error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: 'Sensor reading recorded',
                cropSensorReadingId: result.insertId,
                id: result.insertId
            });
        }
    );
});

// ==========================================================
// DELETE SENSOR HISTORY
// Optional admin/dev route
// ==========================================================
app.delete('/api/crops/sensors', (req: Request, res: Response) => {

    db.query(
        'DELETE FROM cropSensorReadings',
        (err: any) => {

            if (err) {
                console.error('Delete sensor data error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: 'All sensor data deleted'
            });
        }
    );
});

// ---------- POST: Add Harvest Record ----------

app.post('/api/crops/harvests', (req: Request, res: Response) => {
    const { plantingId, yieldKg, qualityGrade, notes } = req.body;

    if (!plantingId) return res.status(400).json({ error: 'plantingId is required' });

    const query = `
        INSERT INTO harvestRecords (plantingId, yieldKg, qualityGrade, notes)
        VALUES (?, ?, ?, ?)
    `;
    db.query(
        query,
        [plantingId, yieldKg ?? null, qualityGrade ?? null, notes ?? null],
        (err: any, result: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Harvest record added', harvestRecordId: result.insertId });
        }
    );
});