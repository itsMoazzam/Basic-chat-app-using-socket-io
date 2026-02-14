import mongoose from "mongoose";

const options = {
  serverSelectionTimeoutMS: 45000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: "majority" as const,
  maxPoolSize: 10,
  family: 4,
};

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chat-app";
  const localUri = process.env.MONGODB_URI_LOCAL;

  const tryConnect = async (attemptUri: string): Promise<boolean> => {
    try {
      await mongoose.connect(attemptUri, options);
      console.log("✅ MongoDB connected");
      return true;
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      return false;
    }
  };

  // Retry main URI up to 3 times (helps with DNS timeout / flaky network)
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      console.log(`🔄 Retry ${attempt}/3 in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
    if (await tryConnect(uri)) return;
  }

  // Optional: fallback to local MongoDB for development when Atlas is unreachable
  if (localUri) {
    console.log("⚠️ Trying fallback MongoDB (MONGODB_URI_LOCAL)...");
    if (await tryConnect(localUri)) return;
  }

  console.error("Could not connect to MongoDB. Check DNS/network, VPN, or use MONGODB_URI_LOCAL for local DB.");
  process.exit(1);
};
