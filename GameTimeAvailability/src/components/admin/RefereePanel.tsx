// src/components/admin/RefereePanel.tsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { RefereeDoc, RefereeWithID } from "../../types";

interface Props {
    refereeNames: string[]; // names passed from DayModal
    gameId: string;
    onClose: () => void;
}

/**
 * Shows a side‑panel with the selected referee's full game list.
 * Since we only have names, we query all referee docs and match by name.
 */
export default function RefereePanel({ refereeNames, gameId, onClose }: Props) {
    const [referees, setReferees] = useState<
        RefereeWithID[]
    >([]);

    useEffect(() => {
        const load = async () => {
            const col = collection(db, "referees");
            const snap = await getDocs(col);
            const list: RefereeWithID[] = [];
            snap.forEach((doc) => {
                const data = doc.data() as RefereeDoc;
                if (refereeNames.includes(data.name)) {
                    list.push({
                        uid: doc.id,
                        ...data
                    });
                }
            });
            setReferees(list);
        };
        load();
    }, [refereeNames]);

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "80%",
                    maxWidth: "500px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h4 style={{ margin: 0 }}>Referees for game {gameId}</h4>
                    <button className="btn" onClick={onClose}>Back</button>
                </div>

                {referees.map((r) => (
                    <div key={r.uid} style={{ marginBottom: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.8rem" }}>
                        <strong>{r.name}</strong>
                        <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>Selected games: {r.availableFor.length}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
