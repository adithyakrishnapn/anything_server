const { createClient } = require("redis");
const { redisHost,redisPassword,redisUsername,redisPort } = require("./env");

const redisClient = createClient({
  username: redisUsername,
  password: redisPassword,
  socket: {
    host: redisHost,
    port: Number(redisPort)
  }
});

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
}

module.exports = { redisClient, connectRedis };
