import type { Adapter, AdapterPayload } from 'oidc-provider';
import { getRedisClient } from '#config';

export const OIDC_REDIS_NAMESPACE = 'auth:oidc';

/**
 * Redis Storage Adapter for oidc-provider.
 * Namespaces all keys under 'auth:oidc:<model>:<id>' with automated TTL expiration.
 */
export class RedisAdapter implements Adapter {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  private key(id: string): string {
    return `${OIDC_REDIS_NAMESPACE}:${this.name}:${id}`;
  }

  /**
   * Upserts a session, grant, or token record with automatic TTL expiration
   */
  async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
    const redis = getRedisClient();
    const key = this.key(id);
    const serialized = JSON.stringify(payload);

    if (expiresIn) {
      await redis.set(key, serialized, { EX: expiresIn });
    } else {
      await redis.set(key, serialized);
    }
  }

  /**
   * Finds an existing record by ID
   */
  async find(id: string): Promise<AdapterPayload | undefined> {
    const redis = getRedisClient();
    const data = await redis.get(this.key(id));
    if (!data) return undefined;
    return JSON.parse(data) as AdapterPayload;
  }

  /**
   * Finds record by userCode (used in device authorization flows)
   */
  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const redis = getRedisClient();
    const id = await redis.get(`${OIDC_REDIS_NAMESPACE}:userCode:${userCode}`);
    if (!id) return undefined;
    return this.find(id);
  }

  /**
   * Finds record by internal session uid
   */
  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const redis = getRedisClient();
    const id = await redis.get(`${OIDC_REDIS_NAMESPACE}:uid:${uid}`);
    if (!id) return undefined;
    return this.find(id);
  }

  /**
   * Deletes a session or token record upon logout or revocation
   */
  async destroy(id: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(this.key(id));
  }

  /**
   * Revokes all tokens associated with a specific grant ID
   */
  async revokeByGrantId(grantId: string): Promise<void> {
    const redis = getRedisClient();
    const pattern = `${OIDC_REDIS_NAMESPACE}:*:${grantId}`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  /**
   * Consumes a one-time token/code (e.g. authorization code or refresh token rotation)
   */
  async consume(id: string): Promise<void> {
    const redis = getRedisClient();
    const key = this.key(id);
    const data = await redis.get(key);
    if (data) {
      const payload = JSON.parse(data) as AdapterPayload;
      payload.consumed = Math.floor(Date.now() / 1000);
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.set(key, JSON.stringify(payload), { EX: ttl });
      }
    }
  }
}
