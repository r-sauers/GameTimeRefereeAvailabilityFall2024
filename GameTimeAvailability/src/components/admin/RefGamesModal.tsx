// src/components/admin/RefGamesModal.tsx
import { useEffect, useState } from "react";
import type { Game, RefereeDoc } from "../../types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";

interface Props {
    referee: RefereeDoc;
    onClose: () => void;
}

export default function RefGamesModal({ referee, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState<Game[]>([]);

    useEffect(() => {
        const gamesCol = collection(db, "games");
        let i = 0;
        const promises = [];
        while (i < referee.availableFor.length) {
            const q = query(gamesCol, where("gameId", "in", referee.availableFor.slice(i, i + 30)));
            promises.push(getDocs(q));
            i += 30;
        }
        Promise.all(promises).then((reqs) => {
            const games = [] as Game[];
            for (const r of reqs) {
                games.concat(r.docs as unknown as Game[]);
            }
            games.sort((a, b) =>
                       new Date(a.date + " " + a.time).valueOf()
                       - new Date(b.date + " " + b.time).valueOf())
            setGames(games);
            setLoading(false);
        });
    }, [referee.availableFor]);

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
                    <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Games for {referee.name}</h3>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>

                {loading ? (<p>Loading...</p>) : (
                    <div className="day-games-list">
                        {games.map((g) => (
                            <div key={g.gameId} className="card" style={{ marginBottom: "1.5rem", position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h4 style={{ marginBottom: "0.5rem" }}>
                                            {format(new Date(g.date), "EEEE, MMMM d, yyyy")} {g.time} - {g.venue}
                                            {g.listed === false && <span style={{ color: "#ff4444", fontSize: "0.7rem", marginLeft: "8px" }}>(Unlisted)</span>}
                                        </h4>
                                        <p style={{ marginBottom: "0.5rem", opacity: 0.9 }}>{g.gender} {g.level} | {g.homeTeam} vs {g.awayTeam}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                )}
                
            </div>
        </div>
    );
}
