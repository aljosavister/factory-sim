import App from "./app.js";
import terminate from "./terminate.js";
import { Furnace } from "./factory.js";
const furnace = new Furnace();
furnace.start(1000);
const context = {
    furnace
};
const app = new App(context, 3200);
app.start();
const exitHandler = terminate(app.server, {
    coredump: false,
    timeout: 500,
});
process.on("uncaughtException", exitHandler(1, "Unexpected Error"));
process.on("unhandledRejection", exitHandler(1, "Unhandled Promise"));
process.on("SIGTERM", exitHandler(0, "SIGTERM"));
process.on("SIGINT", exitHandler(0, "SIGINT"));
//# sourceMappingURL=index.js.map