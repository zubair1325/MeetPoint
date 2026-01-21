import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";

// import { Meeting } from "../models/meeting.model.js";
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

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

export { register, login, getUserHistory, addToHistory };
