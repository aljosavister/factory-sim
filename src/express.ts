// Add the following code to the startup process
/**
 * Module dependencies.
 */
import App from "./app.js";
import { AppContext } from "./app-context.js";
import terminate from "./terminate.js";
import { Factory } from "./factory.js";

/**
 * Create factory object
 */
const factory = new Factory();

/**
 * Express http server
 */
const context: AppContext = {
  factory
};
const app = new App(context, 3200);
app.start();


/**
 * Error handler
 */
const exitHandler = terminate(app.server, {
  coredump: false,
  timeout: 500,
});

process.on("uncaughtException", exitHandler(1, "Unexpected Error"));
process.on("unhandledRejection", exitHandler(1, "Unhandled Promise"));
process.on("SIGTERM", exitHandler(0, "SIGTERM"));
process.on("SIGINT", exitHandler(0, "SIGINT"));
