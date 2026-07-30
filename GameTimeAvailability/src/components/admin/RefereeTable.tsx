// src/components/admin/RefereeTable.tsx
import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import type { RefereeDoc } from "../../types";
import RefGamesModal from "./RefGamesModal";

export default function RefereeTable() {
    const [refs, setRefs] = useState<RefereeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRef, setRef] = useState<RefereeDoc|null>();

    useEffect(() => {
        const q = query(collection(db, "referees"));
        const unsub = onSnapshot(q, (snap) => {
            const data: RefereeDoc[] = [];
            snap.forEach((doc) => data.push(doc.data() as RefereeDoc));
            setRefs(data.sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const viewGames = (ref: RefereeDoc) => {
        setRef(ref);
    };

    if (loading) return <div>Loading referees…</div>;

    return (
        <div className="card" style={{ overflowX: "auto" }}>
            <h3>All Referees</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>Name</th><th># of requests</th><th>View Requests</th>
                    </tr>
                </thead>
                <tbody>
                    {refs.map((r) => (
                        <tr key={r.email}>
                            <td>{r.name}</td>
                            <td>{r.availableFor.length}</td>
                            <td>
                                <button className="btn" onClick={() => viewGames(r)}>View Games</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedRef && (
                <RefGamesModal
                    referee={selectedRef}
                    onClose={() => setRef(null)}
                />
            )}
        </div>
    );
}
