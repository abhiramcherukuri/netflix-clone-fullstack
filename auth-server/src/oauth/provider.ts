import Provider, { type Configuration } from 'oidc-provider';
import { env } from '#config';
import { keystore } from './jwks.ts';
import { RedisAdapter } from './redis-adapter.ts';
import { userRepository } from '#modules/users';

export const OIDC_TOKEN_TTL_SECONDS = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  AUTHORIZATION_CODE: 60, // 60 seconds
  ID_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  INTERACTION: 15 * 60, // 15 minutes
  SESSION: 7 * 24 * 60 * 60, // 7 days
} as const;

const configuration: Configuration = {
  // 1. Storage Adapter (Redis)
  adapter: RedisAdapter,

  // 2. RS256 Signing Keystore
  jwks: {
    keys: keystore.getSigningKeys(),
  },

  // 3. Registered OAuth Clients
  clients: [
    {
      client_id: env.AUTH_CLIENT_ID, // "netflix-web"
      redirect_uris: [env.AUTH_REDIRECT_URI], // "http://localhost:4200/callback"
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_method: 'none', // Public client (SPA)
      id_token_signed_response_alg: 'RS256',
    },
  ],

  // 4. PKCE Enforcement (Strictly required for all clients)
  pkce: {
    required: () => true,
  },

  // 5. Token Lifespans (Aligned with BLUEPRINT1.md)
  ttl: {
    AccessToken: OIDC_TOKEN_TTL_SECONDS.ACCESS_TOKEN,
    AuthorizationCode: OIDC_TOKEN_TTL_SECONDS.AUTHORIZATION_CODE,
    IdToken: OIDC_TOKEN_TTL_SECONDS.ID_TOKEN,
    RefreshToken: OIDC_TOKEN_TTL_SECONDS.REFRESH_TOKEN,
    Interaction: OIDC_TOKEN_TTL_SECONDS.INTERACTION,
    Session: OIDC_TOKEN_TTL_SECONDS.SESSION,
  },

  // 6. Custom Claims in Access Token & ID Token
  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['name', 'role', 'subscription'],
  },

  // 7. Find Account Method (Binds oidc-provider to our Mongoose UserRepository)
  findAccount: async (_ctx, id) => {
    const user = await userRepository.findById(id);
    if (!user) return undefined;

    return {
      accountId: user._id.toString(),
      claims: async () => ({
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        email_verified: user.isVerified,
        role: user.role,
        subscription: user.subscription,
      }),
    };
  },

  // 8. Security & Feature Flags
  features: {
    devInteractions: { enabled: false }, // Disable default dev UI in favor of custom EJS
    revocation: { enabled: true }, // Enable POST /oauth/revoke for logout
  },
};

// Instantiate the OpenID Connect Provider
export const oidcProvider = new Provider(env.AUTH_OIDC_ISSUER, configuration);

// Enable trust proxy (needed behind Express & reverse proxies)
oidcProvider.proxy = true;
