// ============================================================
// PowerWarnings.ts
// ------------------------------------------------------------
// This file is a pure utility module — it has NO React code
// and NO API calls. It defines the TypeScript types used for
// warnings across the dashboard, and exports a single function
// (generatePowerWarnings) that inspects live sensor values and
// returns a list of warning objects to be rendered in the UI.
// ============================================================

// --------------- TYPE DEFINITIONS ---------------

// The three possible urgency levels for any warning badge/card
export type WarningSeverity = "low" | "medium" | "high";

// A single warning item that will appear in the Warning Signs card
export interface WarningItem {
  id: string;       // Unique string ID (used as React key and for deduplication)
  source: string;   // Human-readable origin label, e.g. "Power Tile"
  message: string;  // The text shown to the user
  severity: WarningSeverity;
}

// Represents one farm zone's share of total power consumption.
// Populated by useZonePower() in SolarPower.tsx.
export interface ZonePowerItem {
  zoneName: string;    // e.g. "Chicken Coop", "Crop Farm"
  totalPower: number;  // Absolute power draw for this zone
  percentage: number;  // This zone's share of the grand total (0–100)
}


// The bag of inputs that generatePowerWarnings() expects.
// All values come from live data hooks in PowerGeneration.tsx.
export interface PowerWarningInputs {
  batteryLevel: number;          // Current battery % (0–100)
  latestSolarPower: number;      // Most recent solar reading in Wh
  latestPowerOut: number;        // Most recent consumption reading in Wh
  zonePowerData?: ZonePowerItem[]; // Per-zone breakdown (optional)
}

// --------------- MAIN WARNING GENERATOR ---------------

// generatePowerWarnings takes a snapshot of current sensor values
// and returns an array of WarningItem objects. This array is then
// merged with MQTT warnings in PowerGeneration.tsx and rendered
// in the Warning Signs card.
//
// ⚠️  POTENTIAL PROBLEM: zonePowerData and crossTileAlerts are
// accepted as parameters but never read inside the function body.
// If zone-level warnings were intended (e.g. "Chicken Coop using
// 80% of power"), that logic still needs to be written.
export function generatePowerWarnings({
  batteryLevel,
  latestSolarPower,
  latestPowerOut,
  zonePowerData = [],       // Default to empty array — prevents null errors
}: PowerWarningInputs): WarningItem[] {
  const warnings: WarningItem[] = [];

  // ---- BATTERY WARNINGS ----
  // Two thresholds: critically low (≤20%) and getting low (≤40%).
  // Only one fires at a time — the first match wins because of the else-if.
  if (batteryLevel <= 20) {
    warnings.push({
      id: "power-battery-low",
      source: "Power Tile",
      message: "Battery level is critically low.",
      severity: "high",
    });
  } else if (batteryLevel <= 40) {
    warnings.push({
      id: "power-battery-warning",
      source: "Power Tile",
      message: "Battery level is getting low.",
      severity: "medium",
    });
  }

  // ---- SOLAR GENERATION WARNINGS ----
  // Fires when solar output is zero (e.g. night-time or panel fault)
  // or very low (below 0.8 Wh — could indicate cloud cover or a fault).
  //
  // ⚠️  POTENTIAL PROBLEM: The 0.8 Wh threshold is hardcoded here.
  // If your panels' typical output range changes, this value needs
  // manual updating. Consider making it a named constant at the top
  // of the file so it's easy to find and adjust.
  if (latestSolarPower <= 0) {
    warnings.push({
      id: "power-no-solar",
      source: "Power Tile",
      message: "No solar power is currently being generated.",
      severity: "high",
    });
  } else if (latestSolarPower < 0.8) {
    warnings.push({
      id: "power-low-solar",
      source: "Power Tile",
      message: "Solar power generation is very low.",
      severity: "medium",
    });
  }

  // ---- SUPPLY vs DEMAND WARNING ----
  // If the farm is consuming more power than the panels are producing,
  // this fires. The difference drives severity: >20 Wh gap = high.
  //
  // ⚠️  POTENTIAL PROBLEM: At night latestSolarPower is 0 and
  // latestPowerOut will almost certainly be greater than 0, so this
  // warning will ALWAYS fire at night alongside the "no solar" warning.
  // The UI will show two simultaneous warnings every night, which may
  // be noisy/confusing. Consider suppressing this warning when solar is
  // already flagged as zero, or adding a time-of-day check.
  if (latestPowerOut > latestSolarPower) {
    const difference = latestPowerOut - latestSolarPower;

    warnings.push({
      id: "power-demand-high",
      source: "Power Tile",
      message: `Power demand is higher than solar supply by ${difference.toFixed(2)} Wh.`,
      severity: difference > 20 ? "high" : "medium",
    });
  }

  return warnings;
}
