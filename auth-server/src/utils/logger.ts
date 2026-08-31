import winston from "winston";
import { env } from "../config/env.ts";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom console format for local development
const devConsoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
  return `[${timestamp}] [${level}]: ${stack || message}${metaString}`;
});

const isDev = env.NODE_ENV === "development";

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: isDev
        ? combine(colorize(), devConsoleFormat)
        : combine(json())
    })
  ]
});