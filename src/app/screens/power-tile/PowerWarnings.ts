export type WarningSeverity = "low" | "medium" | "high";

export interface WarningItem {
  id: string;
  source: string;
  message: string;
  severity: WarningSeverity;
}

export interface ZonePowerItem {
  zoneName: string;
  totalPower: number;
  percentage: number;
}

export interface PowerWarningInputs {
  batteryLevel: number;
  latestSolarPower: number;
  latestPowerOut: number;
  zonePowerData?: ZonePowerItem[];
  crossTileAlerts?: CrossTilePowerAlerts;
}

export interface CrossTilePowerAlerts {
    chickenCoop?: {
      temperatureSystemOffline?: boolean;
      ventilationFailure?: boolean;
      lightingSystemInactive?: boolean;
      highPowerDemand?: boolean;
    };
    cropFarm?: {
      irrigationInactive?: boolean;
      highPowerDemand?: boolean;
      lowPowerAffectingOperations?: boolean;
    };
    waterDistribution?: {
      pumpNotOperating?: boolean;
      lowWaterFlowDueToPower?: boolean;
      highPowerDemand?: boolean;
    };
  }

  export function generatePowerWarnings({
    batteryLevel,
    latestSolarPower,
    latestPowerOut,
    zonePowerData = [],
    crossTileAlerts,
  }: PowerWarningInputs): WarningItem[] {
    const warnings: WarningItem[] = [];

    if (batteryLevel <= 20) {
        warnings.push({
          id: "power-battery-low",
          source: "Power Tile",
          message: "Battery level is critically low.",
          severity: "high",
        });
      }
    
      if (latestSolarPower <= 0) {
        warnings.push({
          id: "power-no-solar",
          source: "Power Tile",
          message: "No solar power is currently being generated.",
          severity: "high",
        });
      }
  
    if (crossTileAlerts?.chickenCoop?.temperatureSystemOffline) {
      warnings.push({
        id: "chicken-temp-offline",
        source: "Chicken Coop",
        message: "Temperature control system is offline due to a power issue.",
        severity: "high",
      });
    }
      
      if (crossTileAlerts?.chickenCoop?.ventilationFailure) {
        warnings.push({
          id: "chicken-ventilation-failure",
          source: "Chicken Coop",
          message: "Ventilation system failure detected due to power loss.",
          severity: "high",
        });
      }
      
      if (crossTileAlerts?.chickenCoop?.lightingSystemInactive) {
        warnings.push({
          id: "chicken-lighting-inactive",
          source: "Chicken Coop",
          message: "Lighting system is inactive due to insufficient power.",
          severity: "medium",
        });
      }
      
      if (crossTileAlerts?.chickenCoop?.highPowerDemand) {
        warnings.push({
          id: "chicken-high-demand",
          source: "Chicken Coop",
          message: "Chicken coop is placing high demand on the power system.",
          severity: "medium",
        });
      }
      
      if (crossTileAlerts?.cropFarm?.irrigationInactive) {
        warnings.push({
          id: "crop-irrigation-inactive",
          source: "Crop Farm",
          message: "Irrigation system is inactive due to a power shortage.",
          severity: "high",
        });
      }
      
      if (crossTileAlerts?.cropFarm?.highPowerDemand) {
        warnings.push({
          id: "crop-high-demand",
          source: "Crop Farm",
          message: "Crop farm irrigation system is drawing high power.",
          severity: "medium",
        });
      }
      
      if (crossTileAlerts?.cropFarm?.lowPowerAffectingOperations) {
        warnings.push({
          id: "crop-low-power-operations",
          source: "Crop Farm",
          message: "Low power availability is affecting crop farm operations.",
          severity: "medium",
        });
      }
      
      if (crossTileAlerts?.waterDistribution?.pumpNotOperating) {
        warnings.push({
          id: "water-pump-not-operating",
          source: "Water Distribution",
          message: "Water pump is not operating due to a power issue.",
          severity: "high",
        });
      }
      
      if (crossTileAlerts?.waterDistribution?.lowWaterFlowDueToPower) {
        warnings.push({
          id: "water-low-flow-power",
          source: "Water Distribution",
          message: "Low water flow detected due to insufficient power.",
          severity: "medium",
        });
      }
      
      if (crossTileAlerts?.waterDistribution?.highPowerDemand) {
        warnings.push({
          id: "water-high-demand",
          source: "Water Distribution",
          message: "Water distribution system is drawing high power.",
          severity: "medium",
        });
      }

  return warnings;
}