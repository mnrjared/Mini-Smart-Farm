# Crop Farm API Endpoints

This document outlines the API endpoints required by the dynamic CropFarm component. Implement these endpoints in your Express/Node.js backend to support the frontend.

## Base URL
```
http://localhost:5000/api
```

---

## Endpoints

### 1. **Get Crop Tile Farm Zones**
**Endpoint:** `GET /farmzones?tileId=crop`

**Description:** Fetch all farm zones assigned to the 'Crop Tile'

**Query Parameters:**
- `tileId` (string): Use value `"crop"` or filter by tileName = 'Crop Tile'

**Response:**
```json
[
  {
    "farmZoneId": 2,
    "farmId": 1,
    "zoneName": "Vegetable Garden Block",
    "tileId": 2,
    "description": "Crop tile zone for fields, crops, and planting activity.",
    "areaSqMeter": 1200.00,
    "createdAt": "2026-04-01T10:00:00Z"
  }
]
```

---

### 2. **Get Fields for a Zone**
**Endpoint:** `GET /fields?zoneId={zoneId}`

**Description:** Fetch all fields in a specific farm zone

**Query Parameters:**
- `zoneId` (integer): The farmZoneId

**Response:**
```json
[
  {
    "fieldId": 1,
    "zoneId": 2,
    "fieldName": "Vegetable Bed A",
    "areaM2": 500.00,
    "soilType": "Loamy",
    "notes": "Primary vegetable planting area",
    "createdAt": "2026-04-01T10:00:00Z"
  }
]
```

---

### 3. **Get Crop Plantings for a Zone**
**Endpoint:** `GET /crops/plantings?zoneId={zoneId}`

**Description:** Fetch all crop plantings in a specific farm zone with crop details

**Query Parameters:**
- `zoneId` (integer): The farmZoneId

**Response:**
```json
[
  {
    "cropPlantingId": 1,
    "fieldId": 1,
    "cropId": 5,
    "cropStatus": "growing",
    "plantedDate": "2026-03-15",
    "expectedHarvestDate": "2026-05-15",
    "actualHarvestDate": null,
    "notes": "First spring planting",
    "createdAt": "2026-03-15T08:00:00Z",
    "crop": {
      "cropId": 5,
      "commonName": "Tomato",
      "scientificName": "Solanum lycopersicum",
      "variety": "Cherry",
      "growthDurationDays": 60,
      "notes": "Early variety"
    },
    "field": {
      "fieldId": 1,
      "zoneId": 2,
      "fieldName": "Vegetable Bed A",
      "areaM2": 500.00,
      "soilType": "Loamy",
      "notes": "Primary vegetable planting area",
      "createdAt": "2026-04-01T10:00:00Z"
    }
  }
]
```

---

### 4. **Get Sensor Readings for a Zone**
**Endpoint:** `GET /crops/sensors?zoneId={zoneId}&hours={hours}`

**Description:** Fetch crop sensor readings from the last N hours for a zone

**Query Parameters:**
- `zoneId` (integer): The farmZoneId
- `hours` (integer, default: 24): Number of hours to retrieve data for

**Response:**
```json
[
  {
    "cropSensorReadingId": 101,
    "plantingId": 1,
    "deviceId": 3,
    "sensorType": "moisture",
    "value1": 65.5,
    "value2": null,
    "value3": null,
    "takenAt": "2026-04-25T07:45:00Z"
  },
  {
    "cropSensorReadingId": 102,
    "plantingId": 1,
    "deviceId": 3,
    "sensorType": "temperature",
    "value1": 22.3,
    "value2": null,
    "value3": null,
    "takenAt": "2026-04-25T07:45:00Z"
  },
  {
    "cropSensorReadingId": 103,
    "plantingId": 1,
    "deviceId": 4,
    "sensorType": "NPK",
    "value1": 125.4,
    "value2": 65.2,
    "value3": 80.1,
    "takenAt": "2026-04-25T07:45:00Z"
  },
  {
    "cropSensorReadingId": 104,
    "plantingId": 1,
    "deviceId": 4,
    "sensorType": "EC",
    "value1": 1.45,
    "value2": null,
    "value3": null,
    "takenAt": "2026-04-25T07:45:00Z"
  }
]
```

---

### 5. **Get Devices for a Zone**
**Endpoint:** `GET /devices?zoneId={zoneId}`

**Description:** Fetch all IoT devices assigned to a farm zone

**Query Parameters:**
- `zoneId` (integer): The farmZoneId

**Response:**
```json
[
  {
    "deviceId": 3,
    "zoneId": 2,
    "deviceName": "Crop Climate Node",
    "deviceType": "temp_humidity",
    "location": "Vegetable block weather pole",
    "protocol": "LoRa",
    "status": "online",
    "macAddress": "AA:BB:CC:20:00:01",
    "firmwareVersion": "v2.0.1",
    "lastSeen": "2026-04-25T07:40:00Z",
    "notes": "Crop tile device assigned only to the vegetable garden block."
  },
  {
    "deviceId": 4,
    "zoneId": 2,
    "deviceName": "Soil Moisture Station",
    "deviceType": "moisture",
    "location": "Vegetable block bed A",
    "protocol": "LoRa",
    "status": "online",
    "macAddress": "AA:BB:CC:20:00:02",
    "firmwareVersion": "v2.0.1",
    "lastSeen": "2026-04-25T07:41:00Z",
    "notes": "Crop tile device assigned only to crop-zone field activity."
  }
]
```

---

## Database Queries for Backend Implementation

### Query 1: Get Crop Tile Zones
```sql
SELECT fz.* FROM farmZones fz
JOIN tiles t ON t.tileId = fz.tileId
WHERE t.tileName = 'Crop Tile'
ORDER BY fz.zoneName;
```

### Query 2: Get Fields for Zone
```sql
SELECT * FROM fields
WHERE zoneId = ?
ORDER BY fieldName;
```

### Query 3: Get Plantings with Crop Details
```sql
SELECT 
  cp.*,
  c.commonName, c.scientificName, c.variety, c.growthDurationDays,
  f.fieldName, f.areaM2, f.soilType
FROM cropPlantings cp
JOIN crops c ON c.cropId = cp.cropId
JOIN fields f ON f.fieldId = cp.fieldId
WHERE f.zoneId = ?
  AND cp.cropStatus != 'harvested' OR cp.cropStatus != 'failed'
ORDER BY cp.plantedDate DESC;
```

### Query 4: Get Sensor Readings (Last 24 Hours)
```sql
SELECT csr.* FROM cropSensorReadings csr
JOIN cropPlantings cp ON cp.cropPlantingId = csr.plantingId
JOIN fields f ON f.fieldId = cp.fieldId
WHERE f.zoneId = ?
  AND csr.takenAt >= DATE_SUB(NOW(), INTERVAL ? HOUR)
ORDER BY csr.takenAt DESC;
```

### Query 5: Get Zone Devices
```sql
SELECT * FROM devices
WHERE zoneId = ?
ORDER BY deviceName;
```

---

## Sensor Types Supported

The component expects the following sensor types in the database:
- **`moisture`** - Soil moisture percentage (0-100)
- **`temperature`** - Soil or air temperature in °C
- **`EC`** - Electrical conductivity in S/m
- **`NPK`** - Nitrogen, Phosphorus, Potassium values (uses value1, value2, value3)
- **`humidity`** - Relative humidity percentage

---

## Error Handling

All endpoints should return appropriate HTTP status codes:
- `200 OK` - Successful request
- `400 Bad Request` - Invalid query parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Database or server error

---

## Notes

1. **Zone Filtering**: The frontend filters for 'Crop Tile' zones. Ensure your database has the tile relationship set up correctly.
2. **Timestamp Format**: All timestamps should be in ISO 8601 format (e.g., `2026-04-25T07:40:00Z`).
3. **Real-time Updates**: The component auto-refreshes sensor data every 30 seconds; ensure your API can handle this frequency.
4. **Pagination**: For large datasets, consider adding pagination to the endpoints.

---

## Integration Checklist

- [ ] Implement all 5 endpoints
- [ ] Add Crop Tile constraint to farmZones queries
- [ ] Test sensor data aggregation
- [ ] Verify device status tracking
- [ ] Test auto-refresh (30-second interval)
- [ ] Implement error responses
- [ ] Add request validation
- [ ] Set up CORS if needed
