import Express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { AppContext } from "../app-context.js";
import fs from "fs";

export default class Api {
  public router: Express.Router;
  private upload: multer.Multer;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tmp = path.join(__dirname, "/tmp");

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "tmp/");
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ".jpg");
      },
    });

    this.upload = multer({ storage: storage });

    this.router = Express.Router();
    this.router.use(
      (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction
      ) => {
        console.log("Time: ", Date.now());
        next();
      }
    );


    /**
     * Open for all
     * 
     */
    this.router.get("/heater/:action", async function (req: any, res) {
      try {
        const appContext: AppContext = req.appContext;
        if (req.params.action == "start") {
          appContext.furnace.setHeater(500);
        } else if (req.params.action == "stop") {
          appContext.furnace.stopHeater();
        }
        res.send("OK");
      } catch (error) {
        res.status(400).send("Error");
      }
    });

    this.router.get("/furnace/:action", async function (req: any, res) {
      try {
        const appContext: AppContext = req.appContext;
        if (req.params.action == "open") {
          appContext.furnace.openFurnace();
        } else if (req.params.action == "close") {
          appContext.furnace.closeFurnace();
        } else if (req.params.action == "load") {
          appContext.furnace.startLoadingFurnaceProcedure();
        } else if (req.params.action == "unload") {
          appContext.furnace.startUnloadingFurnaceProcedure();
        }
        res.send("OK");
      } catch (error) {
        res.status(400).send("Error");
      }
    });

    

    /**
     * Open for all
     * 
     * Upload files
     */
    this.router.post(
      "/controller/upload",
      this.upload.single("file"),
      function (req: any, res) {
        const appContext: AppContext = req.appContext;
        console.log(req.file);
        res.send("Successfully uploaded files");
      }
    );
  }
}
