import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().default(3000),
  API_MONGODB_URI: z.string().min(1, "API_MONGODB_URI is required"),
  API_REDIS_URL: z.string().min(1, "API_REDIS_URL is required"),
  AUTH_SERVER_JWKS_URL: z
    .string()
    .url()
    .default("http://localhost:3001/oauth/jwks"),
  CLOUDINARY_CLOUD_NAME: z.string().default("netflix_dev"),
  CLOUDINARY_API_KEY: z.string().default("dev_key"),
  CLOUDINARY_API_SECRET: z.string().default("dev_secret"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables in API Server:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;