import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

import { connectToSocket } from "./controller/socketManager.js";
import ExpressError from "./utils/ExpressError.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket;

app.set("port", process.env.PORT || 8080);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

main()
  .then(() => {
    console.log("database online");
  })
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
}
app.use("/api/v1/users", userRoutes);
app.all("/", (req, res, next) => {
  next(new ExpressErrorError("page not found", 400));
});
app.use((err, req, res, next) => {
  console.log("entered into middleware route");
  console.log(err);
  let { message = "Something went wrong", statusCode = 500 } = err;
  res.status(statusCode).send(message);
});

const start = async () => {
  server.listen(app.get("port"), () => {
    console.log("server listening port 8080");
  });
};
start();
