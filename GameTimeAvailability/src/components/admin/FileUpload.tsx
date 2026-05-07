// src/components/admin/FileUpload.tsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import type { Game } from "../../types";
import { format } from "date-fns";

export default function FileUpload() {
    const [status, setStatus] = useState("");

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setStatus("Reading file…");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = rows[0] as string[];
        const games: Game[] = rows.slice(1).filter(r => r.length > 0).map((r) => {
            const obj: any = {};
            headers.forEach((h, i) => (obj[h] = r[i]));

            // Handle Date (Excel serial number -> Date object)
            let d = obj["Date"];
            if (!(d instanceof Date)) {
                d = new Date(d);
            }

            // Handle Time (Excel fraction -> String)
            let timeStr = obj["Time"];
            if (timeStr instanceof Date) {
                timeStr = format(timeStr, "h:mm a");
            } else if (typeof timeStr === "number") {
                const totalSeconds = Math.round(timeStr * 86400);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const ampm = hours >= 12 ? "PM" : "AM";
                const h12 = hours % 12 || 12;
                timeStr = `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            }

            return {
                gameId: String(obj["Game ID"]),
                date: format(d, "MM/dd/yyyy"),
                time: String(timeStr),
                venue: obj["Venue"],
                level: obj["Level"] ?? obj["Age Group"],
                gender: obj["Gender"],
                gameType: obj["Game Type"] ?? "",
                homeTeam: obj["Home Team"],
                awayTeam: obj["Away Team"],
                listed: true,
                createdAt: new Date().toISOString(),
            };
        });

        // Batch write to Firestore
        const batch = writeBatch(db);
        const col = collection(db, "games");
        games.forEach((g) => {
            const docRef = doc(col, g.gameId);
            batch.set(docRef, g);
        });
        setStatus("Uploading…");
        await batch.commit();
        setStatus(`✅ Uploaded ${games.length} games`);
    };

    return (
        <div className="card" style={{ maxWidth: "500px", margin: "auto" }}>
            <h3>Upload Games (CSV / XLSX)</h3>
            <input type="file" accept=".xlsx,.csv" onChange={handleFile} />
            {status && <p>{status}</p>}
        </div>
    );
}
