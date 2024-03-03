import express from "express";
import { User } from "../models/userModel.js";
import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from 'crypto'
import {
  verifyToken,
  getUser,
  refreshToken,
  getAdmin,
  refreshAdminToken
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

/*
  Few Points to be noted:
    1) We have to change the jwt Key to a strong one
    2) The time the user would be allowed to be on the website
*/

// Route for SignUp
router.post("/signup", async (req, res) => {
  try {
    if (
      !req.body.username ||
      !req.body.email ||
      !req.body.password ||
      !req.body.roomNumber ||
      !req.body.hostelName ||
      !req.body.gender ||
      !req.body.phoneNumber
    ) {
      return res.status(400).send({
        message: "Required fields not found",
      });
    }
    const {
      username,
      email,
      password,
      roomNumber,
      hostelName,
      gender,
      phoneNumber,
    } = req.body;

    // Check if user is already existing
    const userEmailExists = await User.findOne({ email: email });
    const userNameExists = await User.findOne({ username: username });
    // console.log(userEmailExists)
    if (userEmailExists || userNameExists) {
      return res.json({ status: false, message: "User already exists" });
    }
    // Hash Password

    const hashPassword = await bcrypt.hash(password, 10);
    const verToken = crypto.randomBytes(32).toString('hex');
    // Validate Email
    const newUser = {
      username: username,
      email: email,
      password: hashPassword,
      verificationToken: verToken,
      roomNumber: roomNumber,
      hostelName: hostelName,
      gender: gender,
      phoneNumber: phoneNumber,
      requesterRating: 0.1,
      requesteeRating: 0.1,
      totalRequests: 0,
      totalDeliveries: 0,
    };

    const item = await User.create(newUser);
    //Send Gmail verification
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.adminEmail, // Send email from address and password
        pass: process.env.adminPass,
      },
    });
    const encodedToken = encodeURIComponent(verToken).replace(/\./g, "%2E");
    const verificationLink = `http://localhost:3000/auth/verifySignup/${encodedToken}`;
    var mailOptions = {
      from: process.env.adminEmail,
      to: email,
      subject: "Verify Signup",
      html: `<p>Click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.json({
          status: false,
          message: "Error sending email" + info,
        });
      } else {
        return res.json({ status: true, message: "Verification Email Sent" });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

// Route for SignUp Verification
router.post("/verifySignup/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = undefined;

    // Save the user after verifying
    await user.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route for login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    console.log("1");
    return res.status(401).json({ message: "User is not registered" });
  }

  const validPass = await bcrypt.compare(password, existingUser.password);
  if (!validPass) {
    console.log("2");
    return res.status(400).json({ message: "Wrong Password" });
  } else if(!existingUser.isVerified){
    console.log("3");
    return res.status(400).json({ message: "Verify Your email" });
  }
  else {
    const payLoad = {
      _id: existingUser._id,
      username: existingUser.username,
      email: existingUser.email,
      roomNumber: existingUser.roomNumber,
      hostelName: existingUser.hostelName,
      gender: existingUser.gender,
      phoneNumber: existingUser.phoneNumber,
      requesterRating: existingUser.requesterRating,
      requesteeRating: existingUser.requesteeRating,
      totalRequests: existingUser.totalRequests,
      totalDeliveries: existingUser.totalDeliveries,
    };
    const token = jwt.sign(payLoad, process.env.jwtTokenKey, {
      expiresIn: "11m",
    });

    if (req.cookies[`${existingUser._id}`]) {
      req.cookies[`${existingUser._id}`] = "";
    }

    const options = {
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 10),
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    };

    res.cookie(String(existingUser._id), token, options);
    console.log("Done");

    return res.json({
      status: true,
      message: "login successfully",
      user: payLoad,
    });
  }
});

//Route for forgot password
router.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ status: false, message: "User Not Registered" });
    }

    const token = jwt.sign({ id: user._id }, process.env.verificationTKey, {
      expiresIn: "5m",
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.adminEmail, // Send email from address and password
        pass: process.env.adminPass,
      },
    });
    const encodedToken = encodeURIComponent(token).replace(/\./g, "%2E");
    var mailOptions = {
      from: process.env.adminEmail,
      to: email,
      subject: "Reset Password",
      text: `http://localhost:3000/auth/resetPassword/${encodedToken}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.json({
          status: false,
          message: "Error sending email" + info,
        });
      } else {
        return res.json({ status: true, message: "Email Sent" });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// Route for Rest Password
router.post("/resetPassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = await jwt.verify(token, process.env.verificationTKey);
    const id = decoded.id;
    const hashPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate({ _id: id }, { password: hashPassword });
    return res.json({ status: true, message: "Updated Password" });
  } catch (error) {
    return res.json("Invalid token");
  }
});

// Route for Admin SignUp
router.post("/adminSignup", async (req, res) => {
  try {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).send({
        message: "Required fields not found",
      });
    }
    const { username, email, password } = req.body;

    // Check if user is already existing
    const userEmailExists = await Admin.findOne({ email: email });
    const userNameExists = await Admin.findOne({ username: username });
    // console.log(userEmailExists)
    if (userEmailExists || userNameExists) {
      return res.json({ status: false, message: "Admin already exists" });
    }
    // Hash Password

    const hashPassword = await bcrypt.hash(password, 10);
    // Validate Email
    const newUser = {
      username: username,
      email: email,
      password: hashPassword,
    };

    const item = await Admin.create(newUser);
    return res.json({ status: true, message: "Record Registered" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

// Route for Admin Login
router.post("/adminLogin", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ message: "Admin not found" });
  }

  const validPass = await bcrypt.compare(password, admin.password);
  if (!validPass) {
    return res.status(400).json({ message: "Wrong Password" });
  } else {
    const payLoad = {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
    };
    const token = jwt.sign(payLoad, process.env.jwtTokenKey, {
      expiresIn: "11m",
    });
    const options = {
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 10),
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    };
    res.cookie(String(admin._id), token, options);

    return res.json({
      status: true,
      message: "login successfully",
      user: admin,
      token,
    });
  }
});

//Route for Logout
router.post("/userLogout", verifyToken, async (req, res) => {
  try {
    const cookies = req.headers.cookie;
    const prevToken = cookies.split("=")[1];
    if (!prevToken) {
      return res.status(401).json({ message: "No token found" });
    }
    jwt.verify(String(prevToken), process.env.jwtTokenKey, (err, user) => {
      if (err) {
        console.log(err);
        return res.status(401).json({ message: "Invalid Token" });
      }

      res.clearCookie(`${user._id}`);
      req.cookies[`${user._id}`] = "";

      return res.status(200).json({ message: "Logout Success" });
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
});

// Route for login verification
router.get("/verifyLogin", verifyToken, getUser);

router.get("/verifyAdminLogin", verifyToken, getAdmin);

// Route for Token Refresh
router.get("/refresh", refreshToken, verifyToken, getUser);

router.get("/refreshAdmin", refreshAdminToken, verifyToken, getAdmin);

export default router;
