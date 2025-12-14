const { MongoClient } = require('mongodb');

// 从 .env.local 读取或直接硬编码测试 (为了安全，我先读取环境变量，但这里我们直接用刚才看到的URI进行测试，确保无误)
const uri = "mongodb+srv://yangqiqi789_db_user:QixinYang1228@cluster0.rz4e1mv.mongodb.net/?appName=Cluster0";

async function run() {
  console.log("Attempting to connect to MongoDB...");
  const client = new MongoClient(uri, {
    // 尝试添加一些 SSL 相关选项来调试
    tls: true,
    tlsAllowInvalidCertificates: true, // 尝试忽略证书错误
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Connected successfully to server");
    const db = client.db("test_connection");
    const result = await db.command({ ping: 1 });
    console.log("✅ Ping result:", result);
  } catch (dir) {
    console.error("❌ Connection failed:", dir);
  } finally {
    await client.close();
  }
}

run();
