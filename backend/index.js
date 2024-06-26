import express, { response } from "express";
import mongoose from "mongoose";
import { Location } from "./models/locationModel.js";
import { Request } from "./models/requestModel.js";
// import locationRoute from "./routes/locationRoute.js";
import requestRoute from "./routes/requestRoute.js";
import userRoute from "./routes/userRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import statsRoutes from "./routes/statsRoute.js";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Middleware for parsing request body
app.use(express.json());
app.use(cookieParser());
config();

//Middleware for handling CORS Policy
//Option 1: Allow All origins with default of cors(*)
const corsOptions = {
  origin: "https://swift-pick-frontend.vercel.app",
  // origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

app.get("/", (requset, response) => {
  // console.log(requset);
  return response.status(234).send("Welcome");
});

app.use("/requests", requestRoute);
app.use("/auth", userRoute);
// app.use("/users", userRoute);
app.use("/admin", adminRoutes);
app.use("/stats", statsRoutes);

mongoose
  .connect(process.env.mongoDBURL)
  .then(() => {
    console.log("App connected to location database");
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
