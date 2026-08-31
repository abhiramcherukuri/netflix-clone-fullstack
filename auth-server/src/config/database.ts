import mongoose from "mongoose";
import { env } from "./env.ts";
import { logger } from "../utils/logger.ts";

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection established successfully (netflix_auth).");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", { error: err.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting automatic reconnection...");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected.");
  });

  await mongoose.connect(env.AUTH_MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB connection closed gracefully.");
  }
};

export const getDatabaseStatus = (): string => {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
};