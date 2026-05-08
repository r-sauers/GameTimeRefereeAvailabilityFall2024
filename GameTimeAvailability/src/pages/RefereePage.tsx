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
                <h1 className="text-xl font-bold">⚽ Game Time – Referee Availabiity
                    <span className="text-base font-normal opacity-70 ms-2">(2026 Suburban East &amp; Metro East Conferences)</span>
                </h1>
                <button className="btn" onClick={signOutUser}>Logout</button>
            </header>

            <section>
                <h2>Hello, {user?.displayName || referee?.name || "Referee"}!</h2>
                <p className="mb-4">Please select the games you’d like to officiate this highschool season. Your availability will only be visible to Todd and Carole.</p>
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
