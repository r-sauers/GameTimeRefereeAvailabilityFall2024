// src/hooks/useRefereeData.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { RefereeDoc } from "../types";
import { useAuth } from "../contexts/AuthContext";

export const useRefereeData = () => {
    const { user } = useAuth();
    const [referee, setReferee] = useState<RefereeDoc | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        const ref = doc(db, "referees", user.uid);
        const unsub = onSnapshot(ref, (snap) => {
            setReferee(snap.data() as RefereeDoc);
            setLoading(false);
        });
        return () => unsub();
    }, [user?.uid]);

    const saveSelection = async (selected: string[]) => {
        if (!user) return;
        await setDoc(
            doc(db, "referees", user.uid),
            {
                availableFor: selected,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
    };
    return { referee, loading, saveSelection };
};
