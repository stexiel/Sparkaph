import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
};

export const getCache = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  expiryInSeconds: number = 3600,
) => {
  try {
    await redisClient.setEx(key, expiryInSeconds, JSON.stringify(value));
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

export const deleteCache = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
};

export default redisClient;
