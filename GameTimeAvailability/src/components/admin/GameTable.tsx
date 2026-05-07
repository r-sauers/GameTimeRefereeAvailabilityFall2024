// src/components/admin/GameTable.tsx
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { Game } from "../../types";

export default function GameTable() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "games"));
        const unsub = onSnapshot(q, (snap) => {
            const data: Game[] = [];
            snap.forEach((doc) => data.push(doc.data() as Game));
            setGames(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const toggleListed = async (gameId: string, current: boolean) => {
        await updateDoc(doc(db, "games", gameId), { listed: !current });
    };

    if (loading) return <div>Loading games…</div>;

    return (
        <div className="card" style={{ overflowX: "auto" }}>
            <h3>All Games</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>ID</th><th>Date</th><th>Time</th><th>Venue</th><th>Level</th><th>Gender</th><th>Listed</th>
                    </tr>
                </thead>
                <tbody>
                    {games.map((g) => (
                        <tr key={g.gameId}>
                            <td>{g.gameId}</td>
                            <td>{g.date}</td>
                            <td>{g.time}</td>
                            <td>{g.venue}</td>
                            <td>{g.level}</td>
                            <td>{g.gender}</td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={g.listed}
                                    onChange={() => toggleListed(g.gameId, g.listed)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
