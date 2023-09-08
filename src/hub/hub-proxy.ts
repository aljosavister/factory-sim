import { EventEmitter } from "events";
import mqtt, { IClientOptions } from "mqtt";
import HubInput, { HubMessage } from "./hub-input.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class HubProxy {
  public eventhub: EventEmitter = new EventEmitter();
  private mqttHost: string;
  private mqttSubToTopics: string[] | string;
  private mqttSSL: boolean;
  public mqttClient;

  /**
   * Connect to MQTT hub
   * @param hubMode Use hub technology
   */
  constructor(
    mqttHost: string,
    mqttSubToTopics?: string | string[],
    username?: string,
    password?: string,
    mqttSSL?: boolean
  ) {
    this.mqttSSL = mqttSSL;
    this.mqttSubToTopics = mqttSubToTopics;
    this.mqttHost = mqttHost;

    console.log("Connecting to Mosquitto");

    // Subscribe to messages on selected topic
    // console.log(`Current dirname ${__dirname}`);
    // const key = fs.readFileSync(
    //   path.join(__dirname, "../mqtt-client-certs/client.key")
    // );
    // const cert = fs.readFileSync(
    //   path.join(__dirname, "../mqtt-client-certs/client.crt")
    // );
    // const ca = fs.readFileSync(
    //   path.join(__dirname, "../mqtt-client-certs/ca.crt")
    // );

    try {
      let options: IClientOptions;
      if (this.mqttSSL) {
        options = {
          // ca,
          // cert,
          // key,
          username,
          password,
          rejectUnauthorized: false,
        };
      } else {
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

      this.mqttClient.on("message", (topic: string, message: Buffer) => {
        try {
          // Handle all other messages with hubInputTransform
          const messageString = message.toString();
          console.log(`Message received from Hub`);
          const transformedMessage: HubMessage = HubInput.hubInputTransform(topic, messageString)
          this.eventhub.emit(
            "events",
            transformedMessage
          );
        } catch (error) {
          console.error("Error in hub-proxy mqttClient.on:", error.message);
        }
      });
    } catch (error) {
      console.error("Error in hub-proxy constructor:", error.message);
    }
  }
}
