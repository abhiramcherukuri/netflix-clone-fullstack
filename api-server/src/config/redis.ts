import { createClient } from "redis";
import { env } from "./env.ts";
import { logger } from "../utils/logger.ts";

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export const connectRedis = async (): Promise<RedisClient> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: env.API_REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          logger.error("Redis maximum reconnection attempts exceeded.");
          return new Error("Redis connection failed");
        }
        const delay = Math.min(retries * 200, 3000);
        logger.warn(`Reconnecting to Redis in ${delay}ms (attempt ${retries})...`);
        return delay;
      },
    },
  });

  redisClient.on("connect", () => {
    logger.info("Redis client connected successfully.");
  });

  redisClient.on("ready", () => {
    logger.info("Redis client ready to accept commands.");
  });

  redisClient.on("error", (err) => {
    logger.error("Redis client error:", { error: err.message });
  });

  redisClient.on("end", () => {
    logger.warn("Redis client connection closed.");
  });

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = (): RedisClient => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error("Redis client is not connected. Call connectRedis() first.");
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis connection closed gracefully.");
  }
};

export const getRedisStatus = (): string => {
  if (!redisClient) return "disconnected";
  return redisClient.isOpen ? "connected" : "disconnected";
};