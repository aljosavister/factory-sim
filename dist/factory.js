import HubProxy from "./hub/hub-proxy.js";
import ShortUniqueId from "short-unique-id";
export class Furnace {
    furnace;
    mqttLocalhost;
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
        };
    }
    start(ms) {
        setInterval(() => {
            this.runSimulation();
            this.mqttReporting();
        }, ms);
    }
    mqttReporting() {
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
    runSimulation() {
        const furnace = this.furnace;
        furnace.timestamp.setTime(furnace.timestamp.getTime() + furnace.simulator.intervalDuration);
        this.furnace.sensors.furnaceTemperature = this.simulateTemperatureSensor(furnace.heaterTemperature, furnace.sensors.furnaceTemperature, furnace.simulator.simulatedIntervalDuration);
        this.simulateLoadFurnace(10000, furnace.simulator.simulatedIntervalDuration);
        this.simulateUnloadFurnace(10000, furnace.simulator.simulatedIntervalDuration);
        this.simulateHeaterPowerAdjustment(furnace.simulator.simulatedIntervalDuration);
    }
    setHeater(temperature) {
        if (temperature > 500)
            temperature = 500;
        if (temperature < 1)
            temperature = 1;
        this.furnace.heaterTemperature = temperature;
        this.furnace.heaterPower = true;
        this.furnace.sensors.consumption = 135 / 500 * temperature;
    }
    stopHeater() {
        this.furnace.heaterTemperature = this.furnace.outsideTemperature;
        this.furnace.heaterPower = false;
        this.furnace.sensors.consumption = 0;
    }
    openFurnace() {
        this.furnace.sensors.furnaceOpened = true;
    }
    closeFurnace() {
        this.furnace.sensors.furnaceOpened = false;
    }
    startLoadingFurnaceProcedure() {
        const furnace = this.furnace;
        if (furnace.loadingFurnace == false && furnace.unloadingFurnace == false)
            furnace.loadingFurnace = true;
    }
    startUnloadingFurnaceProcedure() {
        const furnace = this.furnace;
        if (furnace.loadingFurnace == false && furnace.unloadingFurnace == false)
            furnace.unloadingFurnace = true;
    }
    simulateHeaterPowerAdjustment(simulatedIntervalDuration) {
        const furnace = this.furnace;
        if (furnace.charge.id && furnace.charge.id.length > 0 && furnace.heaterPower == true) {
            let actualTime = simulatedIntervalDuration;
            const actualTemperature = furnace.sensors.furnaceTemperature;
            const actualTemperaturesArr = furnace.charge.actualTemperatures;
            if (actualTemperaturesArr) {
                const lastActualTemperatureArr = actualTemperaturesArr[actualTemperaturesArr.length - 1];
                const lastActualTime = lastActualTemperatureArr[0];
                actualTime = lastActualTime + simulatedIntervalDuration;
            }
            else {
                furnace.charge.actualTemperatures = [];
            }
            furnace.charge.actualTemperatures.push([actualTime, actualTemperature]);
            const optimalTemperaturesArr = furnace.charge.optimalTemperatures;
            let optimalTimeArrA;
            let optimalTimeArrB;
            for (let index = 0; index < optimalTemperaturesArr.length; index++) {
                const optimalTimeArr = optimalTemperaturesArr[index];
                if (optimalTimeArr[0] >= actualTime) {
                    optimalTimeArrA = optimalTemperaturesArr[index - 1];
                    optimalTimeArrB = optimalTemperaturesArr[index];
                    break;
                }
            }
            if (optimalTimeArrA == undefined && optimalTimeArrB == undefined) {
                this.startUnloadingFurnaceProcedure();
            }
            else {
                const factor = Math.abs(optimalTimeArrA[0] - actualTime) / Math.abs(optimalTimeArrA[0] - optimalTimeArrB[0]);
                const currentOptimalTemperature = Math.abs(optimalTimeArrA[1] - optimalTimeArrB[1]) * factor + optimalTimeArrA[1];
                if (currentOptimalTemperature < actualTemperature) {
                    this.setHeater(50);
                }
                else {
                    this.setHeater(500);
                }
            }
        }
    }
    simulateTemperatureSensor(heaterTemperature, oldTemperature, simulatedIntervalDuration) {
        let finalTemperature = heaterTemperature;
        let heatTransferRate = 0;
        if (this.furnace.heaterTemperature > this.furnace.sensors.furnaceTemperature) {
            heatTransferRate = 0.1;
        }
        else {
            heatTransferRate = 0.01;
        }
        if (this.furnace.sensors.furnaceOpened) {
            finalTemperature = (this.furnace.heaterTemperature - this.furnace.outsideTemperature) * 0.99 + this.furnace.outsideTemperature;
            if (this.furnace.heaterTemperature > this.furnace.sensors.furnaceTemperature) {
                heatTransferRate = 0.05;
            }
            else {
                heatTransferRate = 0.02;
            }
        }
        const temperature = this.simulateFurnaceTemperature(finalTemperature, oldTemperature, heatTransferRate, simulatedIntervalDuration);
        return temperature;
    }
    simulateLoadFurnace(loadingInterval, simulatedIntervalDuration) {
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
    simulateUnloadFurnace(loadingInterval, simulatedIntervalDuration) {
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
    simulateFurnaceTemperature(finalTemperature, initialTemperature, heatTransferRate, simulatedIntervalDuration) {
        let currentTemperature = initialTemperature;
        const timeStepInSeconds = simulatedIntervalDuration / 1000;
        const temperatureChange = (finalTemperature - currentTemperature) * heatTransferRate * timeStepInSeconds;
        currentTemperature += temperatureChange;
        return currentTemperature;
    }
}
//# sourceMappingURL=factory.js.map