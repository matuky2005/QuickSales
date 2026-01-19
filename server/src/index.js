import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quicksales";
const RETRY_DELAY_MS = 5000;

let isConnecting = false;

const connectWithRetry = async () => {
  if (isConnecting) {
    return;
  }
  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    isConnecting = false;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
    isConnecting = false;
    setTimeout(connectWithRetry, RETRY_DELAY_MS);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

connectWithRetry();
