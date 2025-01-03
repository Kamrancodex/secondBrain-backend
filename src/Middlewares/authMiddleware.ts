import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  iat?: number;
  exp?: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: DecodedToken;
  }
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    res.status(401).json({ message: "No token provided" });
    return; // Ensure no further execution
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token format is invalid" });
    return; // Ensure no further execution
  }

  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret) as DecodedToken;

    req.user = decoded; // Attach decoded token to `req.user`

    next(); // Pass control to the next middleware/route
  } catch (error) {
    res.status(401).json({ message: "Failed to authenticate token", error });
    return; // Ensure no further execution
  }
};

export default authMiddleware;
