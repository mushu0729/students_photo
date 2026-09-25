import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req, res) {
  const { id } = req.query;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }

  const db = await getDb();
  const col = db.collection("students");

  if (req.method === "PATCH") {
    const { photoBase64 } = req.body || {};
    if (!photoBase64) return res.status(400).json({ error: "photoBase64 is required" });
    await col.updateOne(
      { _id: objectId },
      { $set: { photo: photoBase64, hasPhoto: true } }
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await col.deleteOne({ _id: objectId });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
