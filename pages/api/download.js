import JSZip from "jszip";
import { getDb } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const db = await getDb();
  const students = await db
    .collection("students")
    .find({ hasPhoto: true })
    .toArray();

  if (students.length === 0) {
    return res.status(404).json({ error: "No photos have been added yet" });
  }

  const grade = students[0].grade || "10th";
  const zip = new JSZip();
  const root = zip.folder(grade);

  for (const s of students) {
    const shortSection = s.section.startsWith(grade)
      ? s.section.slice(grade.length).trim()
      : s.section;
    const folder = root.folder(shortSection || s.section);
    const safeName = s.name.replace(/[\/\\:*?"<>|]/g, "_");
    const base64Data = s.photo.split(",").pop(); // strip data:image/jpeg;base64, prefix if present
    folder.file(`${safeName}.jpg`, Buffer.from(base64Data, "base64"));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${grade}-student-photos.zip"`
  );
  return res.status(200).send(zipBuffer);
}
