const { createClient } = require("redis");
const { redisHost, redisPassword, redisUsername, redisPort } = require("./env");

function buildRedisUrl() {
  if (!redisHost) {
    return null;
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(redisHost)) {
    const normalizedHost = redisHost.replace(/^https:\/\//i, "rediss://").replace(/^http:\/\//i, "redis://");
    const parsedUrl = new URL(normalizedHost);

    if (redisUsername) {
      parsedUrl.username = redisUsername;
    }

    if (redisPassword) {
      parsedUrl.password = redisPassword;
    }

    if (!parsedUrl.port && redisPort) {
      parsedUrl.port = String(redisPort);
    }

    return parsedUrl.toString();
  }

  const host = redisHost.trim();
  const port = redisPort ? `:${redisPort}` : "";
  const hasCredentials = Boolean(redisUsername || redisPassword);

  if (hasCredentials) {
    const username = encodeURIComponent(redisUsername || "");
    const password = encodeURIComponent(redisPassword || "");
    return `rediss://${username}:${password}@${host}${port}`;
  }

  return `redis://${host}${port}`;
}

const redisUrl = buildRedisUrl();

const redisClient = redisUrl
  ? createClient({ url: redisUrl })
  : createClient({
      username: redisUsername,
      password: redisPassword,
      socket: {
        host: redisHost,
        port: Number(redisPort),
        tls: {},
      },
    });

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

async function connectRedis() {
  if (!redisUrl && !redisHost) {
    console.log("Redis not configured; skipping Redis connection");
    return;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
}

module.exports = { redisClient, connectRedis };
