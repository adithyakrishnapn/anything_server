const { redisClient } = require("../config/redis");

function cache(keyBuilder, ttlSeconds) {
  return async function cacheMiddleware(req, res, next) {
    if (!redisClient.isOpen) {
      return next();
    }

    const key = keyBuilder(req);
    const cached = await redisClient.get(key);

    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };

    return next();
  };
}

async function invalidatePrefix(prefix) {
  if (!redisClient.isOpen) {
    return;
  }

  let cursor = 0;
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `${prefix}*`,
      COUNT: 100,
    });
    cursor = Number(result.cursor);
    const keys = result.keys || [];
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } while (cursor !== 0);
}

module.exports = { cache, invalidatePrefix };
