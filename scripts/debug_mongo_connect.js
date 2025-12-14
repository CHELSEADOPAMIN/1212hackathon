import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Try to read .env.local manually since we can't rely on dotenv in this environment
let uri = process.env.MONGODB_URI;

if (!uri) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      const match = envConfig.match(/MONGODB_URI=(.+)/);
      if (match) {
        uri = match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (e) {
    console.error("Failed to read .env.local", e);
  }
}

if (!uri) {
  console.error("❌ MONGODB_URI not found in environment or .env.local");
  process.exit(1);
}

console.log("Attempting to connect to MongoDB...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");

    // Check Candidates collection count
    return mongoose.connection.db.collection('candidates').countDocuments();
  })
  .then((count) => {
    console.log(`📊 Current Candidate Count: ${count}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
    process.exit(1);
  });
