function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.expose ? err.message : "Server error";

  if (err && err.name === "ZodError") {
    status = 400;
    message = "Invalid request";
  }

  if (status >= 500) {
    console.error("Request error", err);
  }

  res.status(status).json({ message });
}

module.exports = { errorHandler };
