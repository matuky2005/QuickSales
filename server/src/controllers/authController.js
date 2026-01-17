import User from "../models/User.js";
import { normalizeText } from "../utils/normalize.js";

export const login = async (req, res, next) => {
  try {
    const username = normalizeText(req.body.username);
    const password = req.body.password;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user || user.password !== password || !user.active) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    res.json({ _id: user._id, username: user.username });
  } catch (error) {
    next(error);
  }
};
