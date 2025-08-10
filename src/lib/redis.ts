import { createClient, RedisClientType } from 'redis';

type Redis = RedisClientType<any, any, any>;

let client: Redis | null = null;
let connecting: Promise<Redis> | null = null;

function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL nicht gesetzt');
  return url;
}

export async function getRedis(): Promise<Redis> {
  if (client) return client;
  if (connecting) return connecting;
  connecting = (async () => {
    const c = createClient({ url: getRedisUrl() });
    c.on('error', () => {});
    await c.connect();
    client = c as Redis;
    return c;
  })();
  return connecting;
}

export async function quitRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    connecting = null;
  }
}
