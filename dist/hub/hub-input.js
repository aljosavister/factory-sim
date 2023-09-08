export default class HubInput {
    static hubInputTransform(topic, input) {
        const jsonMessage = JSON.parse(input);
        return { message: jsonMessage, topic };
    }
}
//# sourceMappingURL=hub-input.js.map