// src/lib/db/index.ts
import "./mongodb";
import "./register-models";

export { connectToDatabase } from "./mongodb";
export { default as connectDB } from "./connection";