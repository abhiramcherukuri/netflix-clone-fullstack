import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AUTH_PORT: z.coerce.number().default(3001),
  AUTH_MONGODB_URI: z.string().min(1, "AUTH_MONGODB_URI is required"),
  AUTH_REDIS_URL: z.string().min(1, "AUTH_REDIS_URL is required"),
  AUTH_BCRYPT_ROUNDS: z.coerce.number().default(12),
  AUTH_OIDC_ISSUER: z.string().url().default("http://localhost:3001"),
  AUTH_CLIENT_ID: z.string().default("netflix-web"),
  AUTH_REDIRECT_URI: z.string().url().default("http://localhost:4200/callback"),
  RESEND_API_KEY: z.string().default("test_resend_api_key"),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables in Auth Server:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;