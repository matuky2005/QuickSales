import User from "../models/User.js";
import { normalizeText } from "../utils/normalize.js";

export const createUser = async (req, res, next) => {
  try {
    const username = normalizeText(req.body.username);
    const password = req.body.password;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }
    const user = await User.create({ username, password, active: true });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (req.body.username !== undefined) {
      user.username = normalizeText(req.body.username);
    }
    if (req.body.password !== undefined) {
      user.password = req.body.password;
    }
    if (req.body.active !== undefined) {
      user.active = Boolean(req.body.active);
    }
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};
