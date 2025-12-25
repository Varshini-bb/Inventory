import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import app from "./app.js";

connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
