import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import bodyParser from "body-parser";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit the process if the connection fails
  }
};

connectDB();

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);

// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
