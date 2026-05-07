// src/pages/AdminPage.tsx
import { useState } from "react";
import FileUpload from "../components/admin/FileUpload";
import GameTable from "../components/admin/GameTable";
import AdminCalendar from "../components/admin/AdminCalendar";

export default function AdminPage() {
    const [tab, setTab] = useState<"upload" | "games" | "calendar">("upload");
    return (
        <div style={{ padding: "2rem" }}>
            <header style={{ display: "flex", justifyContent: "space-between" }}>
                <h1>⚽ Game Time – Admin Dashboard</h1>
            </header>

            <nav style={{ marginBottom: "1rem" }}>
                {["upload", "games", "calendar"].map((t) => (
                    <button
                        key={t}
                        className="btn"
                        style={{
                            marginRight: "0.5rem",
                            background: tab === t ? "var(--accent)" : undefined,
                        }}
                        onClick={() => setTab(t as any)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </nav>

            {tab === "upload" && <FileUpload />}
            {tab === "games" && <GameTable />}
            {tab === "calendar" && <AdminCalendar />}
        </div>
    );
}
