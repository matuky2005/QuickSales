export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

import User from "../models/User.js";

export const requireUser = async (req, res, next) => {
  try {
    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ message: "auth required" });
    }
    const user = await User.findById(userId);
    if (!user || !user.active) {
      return res.status(401).json({ message: "invalid user" });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: error.message || "Server error" });
};
