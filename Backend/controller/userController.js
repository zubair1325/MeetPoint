import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";

import ExpressError from "../utils/ExpressError.js";
import { User } from "../model/userModel.js";

const register = async (req, res) => {
  const { name, username, password, token } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    const x = new ExpressError("User already exists", httpStatus.FOUND);
    return res.status(x.statusCode).send(x.message);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    username,
    password: hashedPassword,
  });
  await newUser.save();
  res.status(httpStatus.CREATED).json({ message: "user registered" });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    const state = new ExpressError("User not Found!", httpStatus.FOUND);
    return res.status(state.statusCode).send(state.message);
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const state = new ExpressError("Wrong Password", httpStatus.BAD_REQUEST);
    return res.status(state.statusCode).send(state.message);
  }
  let token = crypto.randomBytes(20).toString("hex");
  user.token = token;
  await user.save();
  res.status(httpStatus.OK).send(token);
};

export { register, login };
