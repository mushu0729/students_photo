import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "student_photos";

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

let cachedClient = global._mongoClient;
let cachedPromise = global._mongoClientPromise;

if (!cachedPromise) {
  cachedClient = new MongoClient(uri);
  cachedPromise = cachedClient.connect();
  global._mongoClient = cachedClient;
  global._mongoClientPromise = cachedPromise;
}

export async function getDb() {
  const client = await cachedPromise;
  return client.db(dbName);
}
