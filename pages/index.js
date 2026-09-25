import { useEffect, useRef, useState } from "react";

const GRADE = "10th";
const SECTIONS = ["10th A", "10th B", "10th C"];

function compressImage(file, targetKB = 50) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      let maxDim = 640;
      let quality = 0.85;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let dataUrl;
      for (let attempt = 0; attempt < 8; attempt++) {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = (dataUrl.length * 0.75) / 1024; // base64 -> approx bytes
        if (sizeKB <= targetKB) break;
        if (quality > 0.4) quality -= 0.15;
        else maxDim = Math.round(maxDim * 0.8);
      }
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function Home() {
  const [students, setStudents] = useState([]);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [namesText, setNamesText] = useState("");
  const [addStatus, setAddStatus] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const activeStudentIdRef = useRef(null);
  const toastTimer = useRef(null);

  function toast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2200);
  }

  async function loadStudents() {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleAdd() {
    const names = namesText.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) {
      setAddStatus("Enter at least one student name.");
      return;
    }
    setAddStatus("Adding...");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names, section: activeSection, grade: GRADE }),
    });
    if (res.ok) {
      setNamesText("");
      setAddStatus(`Added ${names.length} student(s) to ${activeSection}.`);
      toast(`${names.length} added to ${activeSection}`);
      loadStudents();
    } else {
      setAddStatus("Something went wrong — try again.");
    }
  }

  function openCamera(studentId) {
    activeStudentIdRef.current = studentId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    const studentId = activeStudentIdRef.current;
    if (!file || !studentId) return;
    toast("Compressing photo...");
    try {
      const dataUrl = await compressImage(file, 50);
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64: dataUrl }),
      });
      if (!res.ok) throw new Error("save failed");
      toast("Photo saved");
      loadStudents();
    } catch (err) {
      console.error(err);
      toast("Could not save photo — try again");
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/download");
      if (!res.ok) {
        toast("No photos to download yet");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${GRADE}-student-photos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast("Could not build zip — try again");
    } finally {
      setDownloading(false);
    }
  }

  async function handleClear() {
    if (!confirm("Delete the entire list and all saved photos? This cannot be undone.")) return;
    await fetch("/api/clear", { method: "POST" });
    toast("Cleared");
    loadStudents();
  }

  const list = students.filter((s) => s.section === activeSection);
  const hasAnyPhoto = students.some((s) => s.hasPhoto);

  return (
    <>
      <header>
        <h1>Government Girls High School</h1>
        <p className="sub">{GRADE} &middot; synced across every device you open this on</p>
      </header>

      <main>
        <div className="tabs">
          {SECTIONS.map((sec) => {
            const count = students.filter((s) => s.section === sec).length;
            const withPhoto = students.filter((s) => s.section === sec && s.hasPhoto).length;
            return (
              <div
                key={sec}
                className={"tab" + (sec === activeSection ? " active" : "")}
                onClick={() => setActiveSection(sec)}
              >
                {sec}
                <span className="tcount">{withPhoto}/{count}</span>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <h2>Add students to {activeSection}</h2>
          <label htmlFor="namesArea">Student names, one per line</label>
          <textarea
            id="namesArea"
            placeholder={"Student Names"}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
          />
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={handleAdd}>Add to list</button>
            <span className="sub">{addStatus}</span>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="empty">No students in this section yet. Add names above.</div>
        ) : (
          <ul className="students">
            {list.map((s) => (
              <li key={s.id} className="student">
                {s.hasPhoto ? (
                  <img className="thumb" src={`/api/students/${s.id}`} alt="" style={{ display: "none" }} />
                ) : null}
                <div className={"thumb" + (s.hasPhoto ? "" : " placeholder")}>
                  {s.hasPhoto ? "✓" : "—"}
                </div>
                <span className="name">{s.name}</span>
                {s.hasPhoto ? (
                  <span className="status-ok">Added</span>
                ) : (
                  <button className="ghost" style={{ padding: "6px 12px", fontSize: ".82rem" }} onClick={() => openCamera(s.id)}>
                    Add photo
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="bar">
        <button className="ghost" disabled={!hasAnyPhoto || downloading} onClick={handleDownload}>
          {downloading ? "Building zip..." : "Download all photos (.zip)"}
        </button>
        <button className="danger" disabled={students.length === 0} onClick={handleClear}>
          Clear all
        </button>
      </div>

      <div className={"toast" + (toastMsg ? " show" : "")}>{toastMsg}</div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
