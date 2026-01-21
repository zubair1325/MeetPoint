import { Router } from "express";

import wrapAsync from "../utils/wrapAsync.js";
import {
  LoginFormValidation,
  singUpFormValidation,
} from "../formValidation/userForm.js";
import {
  addToHistory,
  getUserHistory,
  register,
  login,
} from "../controller/userController.js";

const router = Router();

router.route("/login").post(LoginFormValidation, wrapAsync(login));
router.route("/register").post(singUpFormValidation, wrapAsync(register));
router.route("add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);

export default router;
