import HubProxy from "./hub/hub-proxy.js";
import ShortUniqueId from "short-unique-id";

export interface FurnaceInterface {
  heaterPower: boolean,
  heaterTemperature: number,
  outsideTemperature: number,
  loadingFurnace: boolean,
  currentLoadingTime: number,
  unloadingFurnace: boolean,
  currentUnloadingTime: number,
  timestamp: Date,
  sensors: {
    furnaceTemperature: number,
    consumption: number,
    furnaceOpened: boolean,
    vibrations: number
  },
  charge: {
    id: string,
    optimalTemperatures: [number,number][],
    actualTemperatures?: [number,number][]
  },
  simulator: {
    simulatedIntervalDuration: number,
    intervalDuration: number
  }
}

export class Furnace {
  furnace: FurnaceInterface;
  mqttLocalhost: HubProxy;

  constructor() {
    this.mqttLocalhost = new HubProxy("localhost:1883");

    this.furnace = {
      timestamp: new Date(),
      heaterTemperature: 30,
      outsideTemperature: 30,
      loadingFurnace: false,
      currentLoadingTime: 0,
      unloadingFurnace: false,
      currentUnloadingTime: 0,
      heaterPower: false,
      sensors: {
        furnaceTemperature: 30,
        consumption: 0,
        furnaceOpened: false,
        vibrations: 0
      },
      charge: {
        id: "",
        optimalTemperatures: [
          [0, 200],
          [60000, 250]
        ]
      },
      simulator: {
        intervalDuration: 1000,
        simulatedIntervalDuration: 1000
      }
    }
  }

  /**
   * Start furnace simulator
   * @param ms delay between simulation
   */
  public start(ms: number) {
    setInterval(()=> {
      this.runSimulation();
      this.mqttReporting();
    }, ms)
  }


  /**
   * MQTT reporting - generate UNS
   */
  private mqttReporting() {
    const sensors = this.furnace.sensors;
    const furnace = this.furnace;
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/timestamp", furnace.timestamp.toUTCString());
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/furnaceTemperature", sensors.furnaceTemperature.toString());
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/consumption", sensors.consumption.toString());
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/heaterTemperature", furnace.heaterTemperature.toString());
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/furnaceOpened", sensors.furnaceOpened ? "true" : "false");
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/vibrations", sensors.vibrations.toString());
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/heaterPower", furnace.heaterPower ? "true" : "false");
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/loadingProcedure", furnace.loadingFurnace ? "true" : "false");
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/edge/unloadingProcedure", furnace.unloadingFurnace ? "true" : "false");
    this.mqttLocalhost.mqttClient.publish("sij/acroni/agregat-1/chargeid", furnace.charge.id.toString());


  }


  /**
   * Simulator functions
   * 
   * Calculate temperature based on the furnace power state and door state.
   * Calculate loading procedures and unloading procedures
   */
  private runSimulation() {
    const furnace = this.furnace;

    // Simulate sensors - temperature
    furnace.timestamp.setTime(furnace.timestamp.getTime() + furnace.simulator.intervalDuration);
    this.furnace.sensors.furnaceTemperature = this.simulateTemperatureSensor(furnace.heaterTemperature, furnace.sensors.furnaceTemperature, furnace.simulator.simulatedIntervalDuration);

    // Simulate loading and unloading procedure
    this.simulateLoadFurnace(10000, furnace.simulator.simulatedIntervalDuration);
    this.simulateUnloadFurnace(10000, furnace.simulator.simulatedIntervalDuration);

    // Simulate heater temperature based on chared id optimal temperatures
    this.simulateHeaterPowerAdjustment(furnace.simulator.simulatedIntervalDuration);
    
  }

  /**
   * Furnace functions
   */

  public setHeater(temperature: number) {
    if (temperature > 500)
      temperature = 500;
    if (temperature<1)
      temperature = 1;
    this.furnace.heaterTemperature = temperature;
    this.furnace.heaterPower = true;
    this.furnace.sensors.consumption = 135/500 * temperature;
  }

  public stopHeater() {
    this.furnace.heaterTemperature = this.furnace.outsideTemperature;
    this.furnace.heaterPower = false;
    this.furnace.sensors.consumption = 0;
  }

  public openFurnace() {
    this.furnace.sensors.furnaceOpened = true;
  }

  public closeFurnace() {
    this.furnace.sensors.furnaceOpened = false;
  }

  public startLoadingFurnaceProcedure() {
    const furnace = this.furnace;
    if (furnace.loadingFurnace == false && furnace.unloadingFurnace == false)
      furnace.loadingFurnace = true;
  }

  public startUnloadingFurnaceProcedure() {
    const furnace = this.furnace;
    if (furnace.loadingFurnace == false && furnace.unloadingFurnace == false)
      furnace.unloadingFurnace = true;
  }


  /**
   * Helper functions
   */

  private simulateHeaterPowerAdjustment(simulatedIntervalDuration: number) {
    const furnace = this.furnace;
    if (furnace.charge.id && furnace.charge.id.length > 0 && furnace.heaterPower == true) {
      // Get and set current time and actual temperature
      let actualTime = simulatedIntervalDuration;
      const actualTemperature = furnace.sensors.furnaceTemperature;
      const actualTemperaturesArr = furnace.charge.actualTemperatures;
      if (actualTemperaturesArr) {
        const lastActualTemperatureArr = actualTemperaturesArr[actualTemperaturesArr.length-1];
        const lastActualTime = lastActualTemperatureArr[0];
        actualTime = lastActualTime + simulatedIntervalDuration;
      } else {
        furnace.charge.actualTemperatures = [];
      }
      furnace.charge.actualTemperatures.push([actualTime, actualTemperature]);

      // Calculate optimal temperature with linear function between to points
      const optimalTemperaturesArr = furnace.charge.optimalTemperatures;
      let optimalTimeArrA: [number,number];
      let optimalTimeArrB: [number,number];
      for (let index = 0; index < optimalTemperaturesArr.length; index++) {
        const optimalTimeArr = optimalTemperaturesArr[index];
        if (optimalTimeArr[0] >= actualTime) {
          optimalTimeArrA = optimalTemperaturesArr[index-1];
          optimalTimeArrB = optimalTemperaturesArr[index];
          break;
        }
      }

      if (optimalTimeArrA == undefined && optimalTimeArrB == undefined) {
        // This would mean that the temperature graf has no more timeframes
        this.startUnloadingFurnaceProcedure();
      } else {
        const factor = Math.abs(optimalTimeArrA[0] - actualTime) / Math.abs(optimalTimeArrA[0] - optimalTimeArrB[0]);
        const currentOptimalTemperature = Math.abs(optimalTimeArrA[1]-optimalTimeArrB[1]) * factor + optimalTimeArrA[1];
  
        if (currentOptimalTemperature < actualTemperature) {
          this.setHeater(50);
        } else {
          this.setHeater(500);
        }
      }
    }
  }

  private simulateTemperatureSensor(heaterTemperature: number, oldTemperature: number, simulatedIntervalDuration: number): number {
    let finalTemperature = heaterTemperature;
    let heatTransferRate = 0;
    if (this.furnace.heaterTemperature > this.furnace.sensors.furnaceTemperature) {
      heatTransferRate = 0.1;
    } else {
      heatTransferRate = 0.01;
    }

    if (this.furnace.sensors.furnaceOpened) {
      finalTemperature = (this.furnace.heaterTemperature - this.furnace.outsideTemperature) * 0.99 + this.furnace.outsideTemperature;
      if (this.furnace.heaterTemperature > this.furnace.sensors.furnaceTemperature) {
        heatTransferRate = 0.05;
      } else {
        heatTransferRate = 0.02;
      }  
    }

    const temperature = this.simulateFurnaceTemperature(finalTemperature, oldTemperature, heatTransferRate, simulatedIntervalDuration);
    return temperature;
  }


  simulateLoadFurnace(loadingInterval: number, simulatedIntervalDuration: number) {
    const furnace = this.furnace;
    if (furnace.loadingFurnace) {
      if (!furnace.heaterPower) {
        this.setHeater(500);
      }

      if (furnace.sensors.furnaceTemperature > furnace.charge.optimalTemperatures[0][1]) {
        if (!furnace.sensors.furnaceOpened) {
          this.openFurnace();
          furnace.sensors.consumption = furnace.sensors.consumption + 8;
        }
      }
      
      // Wait until load is complete
      if (furnace.sensors.furnaceOpened)
        furnace.currentLoadingTime = furnace.currentLoadingTime + simulatedIntervalDuration;

      if (furnace.currentLoadingTime > loadingInterval) {
        this.closeFurnace();
        furnace.sensors.consumption = furnace.sensors.consumption - 8;
        furnace.loadingFurnace = false;
        furnace.currentLoadingTime = 0;
        furnace.charge.id = `slab-${new ShortUniqueId().randomUUID(4)}`;
      }

    }
  }

  simulateUnloadFurnace(loadingInterval: number, simulatedIntervalDuration: number) {
    const furnace = this.furnace;
    if (furnace.unloadingFurnace) {
      if (!furnace.sensors.furnaceOpened) {
        this.stopHeater();        
        this.openFurnace();
        furnace.sensors.consumption = furnace.sensors.consumption + 8;
      }
      furnace.currentUnloadingTime = furnace.currentUnloadingTime + simulatedIntervalDuration;
      if (furnace.currentUnloadingTime > loadingInterval) {
        this.closeFurnace();
        furnace.sensors.consumption = furnace.sensors.consumption - 8;
        furnace.unloadingFurnace = false;
        furnace.currentUnloadingTime = 0;
        furnace.charge.id = "";
      }
    }
  }


  /**
   * Calculates furnace temperature over time
   * 
   * @param finalTemperature Degrees celsius
   * @param initialTemperature Degrees celsius
   * @param heatTransferRate How fast is heat transferred from heater to charge
   * @param simulatedIntervalDuration Simulation step in milliseconds
   * @returns 
   */
  simulateFurnaceTemperature(
    finalTemperature: number,
    initialTemperature: number,
    heatTransferRate: number,
    simulatedIntervalDuration: number
  ): number {
    // Initialize variables
    let currentTemperature = initialTemperature;
    const timeStepInSeconds = simulatedIntervalDuration / 1000;
    const temperatureChange = (finalTemperature - currentTemperature) * heatTransferRate * timeStepInSeconds;
    currentTemperature += temperatureChange;
  
    return currentTemperature;
  }
  

}