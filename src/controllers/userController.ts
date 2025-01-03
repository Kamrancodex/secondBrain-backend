import { NextFunction, Request, Response } from "express";
import { User } from "../models/user";
import zod from "zod";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Content } from "../models/content";
import { link } from "fs";
import mongoose from "mongoose";

export const signup: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userSchema = zod.object({
    username: zod.string().nonempty("Username cannot be empty"),
    email: zod.string().email("Invalid email format"),
    password: zod.string().min(6, "Password must be at least 6 characters"),
  });

  try {
    const { username, email, password } = userSchema.parse(req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // Create and save the new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
    return;
  } catch (error) {
    if (error instanceof zod.ZodError) {
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ message: "Validation failed", errors });
    } else {
      res.status(500).json({ message: "Server error", error });
    }
    return;
  }
};

export const signin: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userSchema = zod.object({
    username: zod.string().nonempty("Username cannot be empty"),
    password: zod.string().min(6, "Password must be at least 6 characters"),
  });

  try {
    const { username, password } = userSchema.parse(req.body);

    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid password" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "User logged in successfully",
      token,
    });
  } catch (error) {
    if (error instanceof zod.ZodError) {
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ message: "Validation failed", errors });
    } else {
      console.error("Error during signin:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
};

export const content = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contentSchema = zod.object({
    type: zod.string().nonempty("Type cannot be empty"),
    title: zod.string().nonempty("Title cannot be empty"),
    link: zod.string().nonempty("Link cannot be empty"),
    tags: zod.array(zod.string()).nonempty("Tags cannot be empty"),
  });

  try {
    // Validate the request body using Zod
    const { type, title, link, tags } = contentSchema.parse(req.body);

    // Access the authenticated user from the middleware
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Example: Save content (you can replace this with actual logic)
    const newContent = {
      type,
      title,
      link,
      tags,
      user: userId,
    };

    await Content.create(newContent);

    res.status(200).json({ message: "Content created" });
  } catch (error) {
    if (error instanceof zod.ZodError) {
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ message: "Validation failed", errors });
    } else {
      res.status(500).json({ message: "Server error", error });
    }
    next(error);
  }
};

export const getContent: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const content = await Content.find({ user: userId });
    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteContent: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contentId = req.params.id;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const content = await Content.findOne({ _id: contentId, user: userId });
    if (!content) {
      res.status(404).json({ message: "Content not found" });
      return;
    }
    await Content.deleteOne({ _id: contentId, user: userId });
    res.status(200).json({ message: "Content deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getProfile: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = await User.findOne({ _id: userId });
    const profile = {
      username: user?.username,
      email: user?.email,
    };
    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateContent: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contentSchema = zod.object({
    type: zod.string().nonempty("Type cannot be empty"),
    title: zod.string().nonempty("Title cannot be empty"),
    link: zod.string().nonempty("Link cannot be empty"),
    tags: zod.array(zod.string()).nonempty("Tags cannot be empty"),
  });

  try {
    const { type, title, link, tags } = contentSchema.parse(req.body);
    const _id = req.params.id;

    // Validate content ID
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      res.status(400).json({ message: "Invalid content ID" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const content = await Content.findOne({ _id, user: userId });
    if (!content) {
      res
        .status(404)
        .json({ message: "Content not found or not authorized to update" });
      return;
    }

    // Update content
    const updatedContent = {
      type,
      title,
      link,
      tags,
      user: userId,
    };

    await Content.updateOne({ _id, user: userId }, updatedContent);

    res
      .status(200)
      .json({
        message: "Content updated successfully",
        content: updatedContent,
      });
  } catch (error) {
    if (error instanceof zod.ZodError) {
      const errors = error.errors.map((err) => err.message);
      res.status(400).json({ message: "Validation failed", errors });
    } else {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
};
