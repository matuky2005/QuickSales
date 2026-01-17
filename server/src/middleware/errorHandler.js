export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: error.message || "Server error" });
};
