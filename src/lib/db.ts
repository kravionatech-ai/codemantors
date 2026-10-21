import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Ensure .env.local is loaded in script execution environments if not already loaded by Next.js
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      if (typeof (process as any).loadEnvFile === "function") {
        (process as any).loadEnvFile(envPath);
      } else {
        const envContent = fs.readFileSync(envPath, "utf-8");
        envContent.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim();
              if (!process.env[key]) process.env[key] = val;
            }
          }
        });
      }
    }
  } catch {
    // Ignore environment file read errors in production/containerized environments
  }
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codementors";
const DB_NAME = process.env.DB_NAME;

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      ...(DB_NAME ? { dbName: DB_NAME } : {}),
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
