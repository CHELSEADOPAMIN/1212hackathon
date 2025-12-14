import { MongoClient } from "mongodb";

// URI from your debug script
const uri = "mongodb+srv://yangqiqi789_db_user:QixinYang1228@cluster0.rz4e1mv.mongodb.net/?appName=Cluster0";
const dbName = "lyrathon"; // Assuming this is the DB name from lib/db.ts default

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to DB...");
    const db = client.db(dbName);
    const collection = db.collection("candidates");

    // Get the most recent 5 candidates
    const candidates = await collection.find({})
      .sort({ _id: -1 }) // Sort by newest (assuming _id timestamp works, or we can use another field if available)
      .limit(5)
      .toArray();

    console.log(`Found ${candidates.length} candidates:`);
    candidates.forEach((c, i) => {
      console.log(`\n[${i + 1}] Name: ${c.name}`);
      console.log(`    Role: ${c.role}`);
      console.log(`    GitHub: ${c.githubUrl}`);
      console.log(`    Skills: ${c.skills ? c.skills.length : 0} count`);
      console.log(`    ID: ${c._id}`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();
