export interface HubMessage {
  topic: string;
  message: any;
}

export default class HubInput {
  public static hubInputTransform(topic: string, input: string): HubMessage {
    const jsonMessage = JSON.parse(input);
    return {message: jsonMessage, topic};
  }
}
