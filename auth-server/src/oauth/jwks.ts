import crypto from 'node:crypto';

export interface JWKKey extends crypto.JsonWebKey {
  use: string;
  alg: string;
  kid: string;
}

/**
 * In-memory RS256 JWKS Keystore.
 * Generates an RSA 2048-bit key pair on boot for JWT signing and verification.
 */
class Keystore {
  private keyPair!: crypto.KeyPairSyncResult<string, string>;
  private jwk!: JWKKey;

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    // Generate an RSA 2048-bit key pair
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Export private key as a JWK object for oidc-provider
    const privateKeyObject = crypto.createPrivateKey(this.keyPair.privateKey);
    const jwkObject = privateKeyObject.export({ format: 'jwk' });

    this.jwk = {
      ...jwkObject,
      use: 'sig',
      alg: 'RS256',
      kid: crypto.randomBytes(16).toString('hex'),
    };
  }

  /**
   * Returns the full JWK (including private parameters) for the Auth Server to sign tokens
   */
  public getSigningKeys(): JWKKey[] {
    return [this.jwk];
  }

  /**
   * Returns only public JWK parameters (kty, n, e, alg, kid, use) for public exposure
   */
  public getPublicJwks(): { keys: JWKKey[] } {
    const publicKey: JWKKey = {
      kty: this.jwk.kty,
      use: this.jwk.use,
      alg: this.jwk.alg,
      kid: this.jwk.kid,
      n: this.jwk.n,
      e: this.jwk.e,
    };
    return { keys: [publicKey] };
  }
}

export const keystore = new Keystore();
