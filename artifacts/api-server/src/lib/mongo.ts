import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export class MongoNotConfiguredError extends Error {
  constructor() {
    super("MongoDB is not configured. Add MONGODB_URI in Replit Secrets.");
    this.name = "MongoNotConfiguredError";
  }
}

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new MongoNotConfiguredError();
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5_000,
        autoIndex: true,
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
