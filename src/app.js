const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { corsOrigin, nodeEnv } = require("./config/env");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/", routes);

app.use(errorHandler);

module.exports = app;
