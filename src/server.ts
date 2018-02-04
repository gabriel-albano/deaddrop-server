import * as express from "express";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import * as helmet from "helmet";
import { Request, Response } from "express";
import * as session from "express-session";

// read .env
dotenv.config();

// log4j
import { configure, getLogger } from "log4js";
configure({appenders: {
    deaddrop: {
      type: "console",
      layout: {
        type: "pattern",
        pattern: "%d [%[%-5p%]] [%-10c%]] %m"
      }
    }
  },
  categories: {
    default: {
      appenders: ["deaddrop"], level: "debug"
    }
  }
});
const logger = getLogger("deadrop");

const env = process.env.env || "local";
const port = process.env.port || 8080;

// Create Express server
const app = express();

// Express configuration
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const dir = path.resolve(__dirname);
const deaddrop_dir = dir + "/deaddrop/";

const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
app.use(session({
  name: "deaddrop",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: expiryDate
  }
}));

// ping/pong to initialize and set secret
app.use("/ping/:id", function (req, res) {
  req.session.user = req.params.id;
  res.status(200).send("pong");
});


// deaddrop API
// token=ThisIsTheSecurityToken&team_id=T11STRFEE&team_domain=cenersys&channel_id=D1KD9E5EX&channel_name=directmessage&user_id=U11SMQJV7&user_name=gabriel&command=%2Fdeaddrop&text=1234567890+1&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT11STRFEE%2F308973064513%2FP16P31nkjIuqRpEZ3VDNQnWh
// token=ThisIsTheSecurityToken&user_name=gabriel&text=1234567890+1
app.post("/slack", (req: Request, res: Response) => {
  logger.debug("POST to slack ");
  // check for token
  if (req.query["token"] === process.env.SECURITY_TOKEN) {
    logger.info("Authorized");

    const data: string[] = req.query["text"].split(" ");
    // The absolute path of the new file with its name
    const filepath = "deaddrop/" + data[0];

    logger.debug("Deaddrop for %s value %s from %s", data[0], data[1], req.query["user_name"]);

    fs.writeFile(filepath, data[1], (err) => {
      if (err) {
        logger.error("Error writing file %s", filepath);
        res.status(500).send("Error writing file");
      } else {
        res.sendStatus(200);
      }
    });

  } else {
    res.sendStatus(401);
  }
});


// deaddrop routes
/*
 /deaddrop/1234567890     : single id
 /deaddrop/all/version1   : all ids for a version
 /deaddrop/group/group1   : all ids from a group
*/

// log deadrop access
app.use((req, res, next) => {
  if (req.url.startsWith("/deaddrop")) {
    logger.info("request to %s from %s", req.url, req.connection.remoteAddress.split(":").pop());
  }
  if (req.session && req.session.user) {
    next();
  } else {
    if (req.path !== "ping") {
      logger.error("Authentication failure!");
      res.sendStatus(401);
    } else {
      next();
    }
  }
});

// serve allv1
app.use("/deaddrop/all/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  logger.info("Deadrop request for all/%s", id);

  fs.open(deaddrop_dir + "all/" + id, "r", (err, fd: any) => {
    if (err) {
      if (err.code === "ENOENT") {
        logger.error("File does not exist");
        res.sendStatus(404);
      }
    } else {
      fs.readFile(fd, {encoding: "utf-8"}, (err: any, data: string) => {
        if (err) {
          logger.error(err);
          res.sendStatus(404);
        } else {
          logger.info("File served");
          res.status(200).send(data);
        }
      });
    }
  });
});

// server group/:id
app.use("/deaddrop/group/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  logger.info("Deadrop request for group/%s", id);

  fs.open(deaddrop_dir + "group/" + id, "r", (err, fd: any) => {
    if (err) {
      if (err.code === "ENOENT") {
        logger.error("File does not exist");
        res.sendStatus(404);
      }
    } else {
      fs.readFile(fd, {encoding: "utf-8"}, (err: any, data: string) => {
        if (err) {
          logger.error(err);
          res.sendStatus(404);
        } else {
          logger.info("File served");
          res.status(200).send(data);
        }
      });
    }
  });
});

// Serve and then remove deaddrop file
app.use("/deaddrop/:id", (req: Request, res: Response) => {

  if (req.session && req.session.user) {

    const id = req.params.id;

    logger.info("Deadrop request for %s", id);
    logger.debug("... if it exist, delete file after serving it!");

    fs.open(deaddrop_dir + id, "r", (err, fd: any) => {
      if (err) {
        if (err.code === "ENOENT") {
          logger.error("File does not exist");
          res.sendStatus(404);
        }
      } else {
        fs.readFile(fd, {encoding: "utf-8"}, (err: any, data: string) => {
          if (err) {
            logger.error(err);
            res.sendStatus(404);
          } else {
            logger.info("file served");
            res.status(200).send(data);
            fs.unlink(deaddrop_dir + id, (err) => {
              if (err) {
                logger.error("Error deleting %s%s: %s", deaddrop_dir, id, err);
              } else {
                logger.info(deaddrop_dir + id + " deleted successfully!");
              }
            });
          }
        });
      }
    });

  } else {
    logger.error("Authentication failure!");
    res.sendStatus(401);
  }
});

// default page
app.use("/", (req, res) => {
  res.sendStatus(404);
});

// HTTP Server
const server = app.listen(port, () => {
  logger.info(("App is running at http://localhost:%d in %s mode"), port, env);
});

export = server;