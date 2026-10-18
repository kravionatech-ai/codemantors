import { runDatabaseSeed } from "../lib/seed";
import mongoose from "mongoose";

async function main() {
  try {
    const result = await runDatabaseSeed();
    console.log("Seed finished successfully:", result);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed execution failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
