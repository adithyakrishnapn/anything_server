const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}
const redisUsername = process.env.REDIS_USERNAME;
const redisPassword = process.env.REDIS_PASSWORD;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const port = Number(process.env.PORT || 4000);
const dbUrl = required("DB_URL");
const jwtSecret = required("JWT_SECRET");
const jwtRefreshSecret = required("JWT_REFRESH_SECRET");
const corsOrigin = required("CORS_ORIGIN");
const accessTokenTtl = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTokenTtl = process.env.REFRESH_TOKEN_TTL || "7d";
const nodeEnv = process.env.NODE_ENV || "development";
const defaultAdminEmails = (process.env.DEFAULT_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

module.exports = {
  port,
  dbUrl,
  jwtSecret,
  jwtRefreshSecret,
  corsOrigin,
  accessTokenTtl,
  refreshTokenTtl,
  nodeEnv,
  defaultAdminEmails,
  redisUsername,
  redisPassword,
  redisHost,
  redisPort
};
