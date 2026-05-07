// src/components/GameCard.tsx
import { doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

interface GameCardProps {
  title: string;
  date: string; // ISO string or formatted
}

export default function GameCard({ title, date }: GameCardProps) {
  const { user } = useAuth();
  const refereeRef = user ? doc(db, "referees", user.uid) : null;

  const toggleAvailability = async () => {
    if (!refereeRef) return;
    // placeholder for future implementation
  };

  return (
    <div className="card mb-2 p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-75">{date}</p>
      </div>
      <button className="btn" onClick={toggleAvailability}>Toggle</button>
    </div>
  );
}
