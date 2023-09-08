import { EventEmitter } from "events";
import mqtt from "mqtt";
import HubInput from "./hub-input.js";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class HubProxy {
    eventhub = new EventEmitter();
    mqttHost;
    mqttSubToTopics;
    mqttSSL;
    mqttClient;
    constructor(mqttHost, mqttSubToTopics, username, password, mqttSSL) {
        this.mqttSSL = mqttSSL;
        this.mqttSubToTopics = mqttSubToTopics;
        this.mqttHost = mqttHost;
        console.log("Connecting to Mosquitto");
        try {
            let options;
            if (this.mqttSSL) {
                options = {
                    username,
                    password,
                    rejectUnauthorized: false,
                };
            }
            else {
                options = {
                    username,
                    password,
                };
            }
            this.mqttClient = mqtt.connect(`mqtt://${this.mqttHost}`, options);
            this.mqttClient.on("connect", () => {
                console.log(`Connected to ${this.mqttHost}`);
                if (this.mqttSubToTopics && this.mqttSubToTopics.length > 1) {
                    console.log(`Subscribed to ${this.mqttSubToTopics}`);
                    this.mqttClient.subscribe(this.mqttSubToTopics);
                }
            });
            this.mqttClient.on("message", (topic, message) => {
                try {
                    const messageString = message.toString();
                    console.log(`Message received from Hub`);
                    const transformedMessage = HubInput.hubInputTransform(topic, messageString);
                    this.eventhub.emit("events", transformedMessage);
                }
                catch (error) {
                    console.error("Error in hub-proxy mqttClient.on:", error.message);
                }
            });
        }
        catch (error) {
            console.error("Error in hub-proxy constructor:", error.message);
        }
    }
}
//# sourceMappingURL=hub-proxy.js.map