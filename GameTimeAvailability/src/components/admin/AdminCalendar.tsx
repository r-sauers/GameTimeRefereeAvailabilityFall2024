// src/components/admin/AdminCalendar.tsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import type { Game } from "../../types";
import { startOfMonth, getDay, eachDayOfInterval, endOfMonth, parse, isSameDay, getYear } from "date-fns";
import DayModal from "./DayModal";

export default function AdminCalendar() {
    const [games, setGames] = useState<Game[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "games"), (snap) => {
            const data: Game[] = [];
            snap.forEach((doc) => data.push(doc.data() as Game));
            setGames(data);
        });
        return () => unsub();
    }, []);

    const openDay = (date: Date) => {
        setSelectedDay(date);
        setShowModal(true);
    };

    const months = ["August", "September", "October"];
    const year = getYear(new Date());

    const calendarData = months.map(monthName => {
        const firstDay = startOfMonth(new Date(`${monthName} 1, ${year}`));
        const lastDay = endOfMonth(firstDay);
        const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
        const padding = Array.from({ length: getDay(firstDay) });

        return {
            name: monthName,
            padding,
            days: daysInMonth.map(date => {
                const dayGames = games.filter(g => {
                    try {
                        const gDate = parse(g.date, "MM/dd/yyyy", new Date());
                        return isSameDay(gDate, date);
                    } catch {
                        return false;
                    }
                });
                return {
                    date,
                    dayNumber: date.getDate(),
                    games: dayGames
                };
            })
        };
    });

    return (
        <div className="referee-calendar-wrapper">
            <h3 style={{ padding: "0 2rem", marginBottom: "2rem" }}>Admin Calendar Overview</h3>
            
            {calendarData.map(month => (
                <section key={month.name} className="month-section">
                    <h2 className="month-title">{month.name}</h2>
                    <div className="calendar-headers">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                            <div key={d} className="calendar-header">{d}</div>
                        ))}
                    </div>
                    <div className="calendar-cards">
                        {month.padding.map((_, i) => (
                            <div key={`pad-${i}`} className="calendar-card empty"></div>
                        ))}
                        {month.days.map(day => (
                            <div 
                                key={day.date.toISOString()} 
                                className="calendar-card" 
                                onClick={() => openDay(day.date)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="calendar-date">{day.dayNumber}</div>
                                {day.games.length > 0 && (
                                    <div className="day-count" style={{ 
                                        position: "absolute", 
                                        top: "10px", 
                                        right: "10px",
                                        background: "var(--color-accent)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.8rem",
                                        fontWeight: "bold"
                                    }}>
                                        {day.games.length}
                                    </div>
                                )}
                                <div style={{ marginTop: "2rem", fontSize: "0.7rem", opacity: 0.8 }}>
                                    {day.games.slice(0, 2).map(g => (
                                        <div key={g.gameId} style={{ 
                                            whiteSpace: "nowrap", 
                                            overflow: "hidden", 
                                            textOverflow: "ellipsis",
                                            color: g.listed === false ? "#ff4444" : "inherit"
                                        }}>
                                            • {g.time} {g.venue} {g.listed === false && "(Unlisted)"}
                                        </div>
                                    ))}
                                    {day.games.length > 2 && <div>+ {day.games.length - 2} more</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {showModal && selectedDay && (
                <DayModal
                    date={selectedDay}
                    games={games.filter(g => isSameDay(parse(g.date, "MM/dd/yyyy", new Date()), selectedDay))}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
