// src/components/admin/DayModal.tsx
import { useEffect, useState } from "react";
import type { Game } from "../../types";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";
import RefereePanel from "./RefereePanel";

interface Props {
    date: Date;
    games: Game[];
    onClose: () => void;
}

export default function DayModal({ date, games, onClose }: Props) {
    const [refMap, setRefMap] = useState<Record<string, string[]>>({}); // gameId → [referee names]
    const [viewingGameId, setViewingGameId] = useState<string | null>(null);

    const toggleListed = async (gameId: string, currentStatus: boolean) => {
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, { listed: !currentStatus });
    };

    useEffect(() => {
        const refsCol = collection(db, "referees");
        const unsub = onSnapshot(refsCol, (snap) => {
            const map: Record<string, string[]> = {};
            snap.forEach((doc) => {
                const data = doc.data() as any;
                const name = data.name || "Unnamed";
                const selections: string[] = data.availableFor || [];
                selections.forEach((gid: string) => {
                    if (!map[gid]) map[gid] = [];
                    map[gid].push(name);
                });
            });
            setRefMap(map);
        });
        return () => unsub();
    }, []);

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "90%",
                    maxWidth: "700px",
                }}
            >
                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "3rem", // Increased margin for the header
                    paddingBottom: "1rem",
                    borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{format(date, "EEEE, MMMM d, yyyy")}</h3>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
                
                <div className="day-games-list">
                    {games.map((g) => (
                        <div key={g.gameId} className="card" style={{ marginBottom: "1.5rem", position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h4 style={{ marginBottom: "0.5rem" }}>
                                        {g.time} - {g.venue}
                                        {g.listed === false && <span style={{ color: "#ff4444", fontSize: "0.7rem", marginLeft: "8px" }}>(Unlisted)</span>}
                                    </h4>
                                    <p style={{ marginBottom: "0.5rem", opacity: 0.9 }}>{g.gender} {g.level} | {g.homeTeam} vs {g.awayTeam}</p>
                                    <p style={{ fontSize: "0.85rem", color: "var(--color-accent)", fontWeight: 600 }}>
                                        {refMap[g.gameId]?.length || 0} Referees Available: {refMap[g.gameId]?.join(", ")}
                                    </p>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <button
                                        className="btn"
                                        onClick={() => setViewingGameId(g.gameId)}
                                    >
                                        View Refs
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: g.listed === false ? "#44ff44" : "#ff4444", fontSize: "0.7rem" }}
                                        onClick={() => toggleListed(g.gameId, g.listed !== false)}
                                    >
                                        {g.listed === false ? "Relist" : "Unlist"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {viewingGameId && (
                    <RefereePanel
                        refereeNames={refMap[viewingGameId] || []}
                        gameId={viewingGameId}
                        onClose={() => setViewingGameId(null)}
                    />
                )}
            </div>
        </div>
    );
}
