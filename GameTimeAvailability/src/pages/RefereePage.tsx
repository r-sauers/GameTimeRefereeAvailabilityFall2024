// src/pages/RefereePage.tsx
import { useEffect, useState, useCallback } from "react";
import { useGames } from "../hooks/useGames";
import { useRefereeData } from "../hooks/useRefereeData";
import GameCalendar from "../components/referee/GameCalendar";
import { useAuth } from "../contexts/AuthContext";

export default function RefereePage() {
    const { user, signOutUser } = useAuth();
    const { games, loading: gamesLoading } = useGames();
    const { referee, loading: refLoading, saveSelection } = useRefereeData();
    const [selected, setSelected] = useState<string[] | null>(null);
    const [hasInitialised, setHasInitialised] = useState(false);

    // initialise from Firestore only once
    useEffect(() => {
        if (referee && !hasInitialised) {
            setSelected(referee.availableFor ?? []);
            setHasInitialised(true);
        }
    }, [referee, hasInitialised]);

    // auto‑save debounced
    useEffect(() => {
        if (!hasInitialised || selected === null) return;
        const t = setTimeout(() => {
            saveSelection(selected);
        }, 2000);
        return () => clearTimeout(t);
    }, [selected, hasInitialised]);

    const handleToggle = useCallback((gameId: string) => {
        setSelected((prev) => {
            const current = prev ?? [];
            return current.includes(gameId)
                ? current.filter((id) => id !== gameId)
                : [...current, gameId];
        });
    }, []);

    const handleBatchToggle = useCallback((gameIds: string[], select: boolean) => {
        setSelected((prev) => {
            const current = prev ?? [];
            if (select) {
                const toAdd = gameIds.filter(id => !current.includes(id));
                return [...current, ...toAdd];
            } else {
                return current.filter(id => !gameIds.includes(id));
            }
        });
    }, []);

    if (gamesLoading || refLoading) return <div>Loading…</div>;

    return (
        <div className="referee-page">
            <header style={{ display: "flex", justifyContent: "space-between" }}>
                <h1>⚽ Game Time – Referee Dashboard</h1>
                <button className="btn" onClick={signOutUser}>Logout</button>
            </header>

            <section>
                <h2>Hello, {user?.displayName || referee?.name || "Referee"}!</h2>
                <p>Select the games you’re willing to officiate.</p>
                <GameCalendar
                    games={games}
                    selectedIds={selected ?? []}
                    onToggle={handleToggle}
                    onBatchToggle={handleBatchToggle}
                />
            </section>
        </div>
    );
}
