import ExpressError from "../utils/ExpressError.js";
import httpStatus from "http-status";

const LoginFormValidation = (req, res, next) => {
  let { username, password } = req.body;
  if (!username || !password || username.length == 0 || password.length == 0) {
    const state = new ExpressError(
      "provide user name and password",
      httpStatus.FOUND
    );
    return res.status(state.statusCode).send(state.message);
  }
  next();
};

const singUpFormValidation = (req, res, next) => {
  let { name, username, password } = req.body;
  if (
    !name ||
    !username ||
    !password ||
    name.length == 0 ||
    username.length == 0 ||
    password.length == 0
  ) {
    const state = new ExpressError(
      "provide name,username and password",
      httpStatus.FOUND
    );
    return res.status(state.statusCode).send(state.message);
  }
  next();
};

export { LoginFormValidation, singUpFormValidation };
