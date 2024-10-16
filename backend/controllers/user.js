import { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const userRegister = async (req, res) => {
  try {
    // get the data from body
    const { username, email, password } = req.body;

    // validate that all are present or not
    if (!username || !email || !password) {
      return res.status(401).json({ message: "All Fields are Compulsory" });
    }

    // check user exists or not
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    // if not than hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // create token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

    // send the token to the user
    return res
      .status(201)
      .cookie("token", token, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        secure: true,
      })
      .json({ success: true, httpOnly: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All Field are Compulsory" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    return res
      .status(201)
      .cookie("token", token, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        secure: true,
      })
      .json({ success: true, httpOnly: true, message: "Welcome back" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const search = async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" }, // Case-insensitive search
    }).select("username");

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("username"); // Fetch all users with their usernames
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};
