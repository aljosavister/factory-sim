import App from "./app.js";
import terminate from "./terminate.js";
const context = {};
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
//# sourceMappingURL=express.js.map