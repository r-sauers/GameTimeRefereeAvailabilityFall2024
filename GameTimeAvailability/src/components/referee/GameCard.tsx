// src/components/referee/GameCard.tsx
import type { Game } from "../../types";

interface Props {
    game: Game;
    selected: boolean;
    onToggle: (gameId: string) => void;
}

export default function GameCard({ game, selected, onToggle }: Props) {
    return (
        <div
            className="card"
            style={{
                marginTop: "0.5rem",
                border: selected ? "2px solid var(--accent)" : "none",
                cursor: "pointer",
            }}
            onClick={() => onToggle(game.gameId)}
        >
            <p><strong>{game.time}</strong> – {game.venue}</p>
            <p>{game.homeTeam} vs {game.awayTeam}</p>
            <p>{game.level} • {game.gender}</p>
        </div>
    );
}
