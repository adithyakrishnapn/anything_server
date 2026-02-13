const app = require("./app");
const { port } = require("./config/env");
const { connectDb } = require("./config/db");
const { connectRedis } = require("./config/redis");

async function start() {
  await connectDb();
  await connectRedis();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
