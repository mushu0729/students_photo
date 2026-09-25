import { getDb } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  const db = await getDb();
  await db.collection("students").deleteMany({});
  return res.status(200).json({ ok: true });
}
