import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  const db = await getDb();
  const col = db.collection("students");

  if (req.method === "GET") {
    const students = await col
      .find({}, { projection: { photo: 0 } }) // never ship full base64 photo in list
      .sort({ section: 1, name: 1 })
      .toArray();
    return res.status(200).json(
      students.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        section: s.section,
        grade: s.grade,
        hasPhoto: !!s.hasPhoto,
      }))
    );
  }

  if (req.method === "POST") {
    const { names, section, grade } = req.body || {};
    if (!Array.isArray(names) || names.length === 0 || !section) {
      return res.status(400).json({ error: "names[] and section are required" });
    }
    const docs = names
      .map((n) => (n || "").trim())
      .filter(Boolean)
      .map((name) => ({ name, section, grade: grade || "10th", hasPhoto: false, photo: null }));
    if (docs.length === 0) {
      return res.status(400).json({ error: "No valid names provided" });
    }
    const result = await col.insertMany(docs);
    return res.status(201).json({ insertedCount: result.insertedCount });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
