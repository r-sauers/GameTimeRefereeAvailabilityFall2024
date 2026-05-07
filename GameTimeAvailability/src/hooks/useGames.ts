// src/hooks/useGames.ts
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Game } from "../types";

export const useGames = (includeUnlisted = false) => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const col = collection(db, "games");
        const q = includeUnlisted ? query(col) : query(col, where("listed", "==", true));
        const unsub = onSnapshot(q, (snap) => {
            const data: Game[] = [];
            snap.forEach((doc) => data.push(doc.data() as Game));
            setGames(data);
            setLoading(false);
        });
        return () => unsub();
    }, [includeUnlisted]);
    return { games, loading };
};
