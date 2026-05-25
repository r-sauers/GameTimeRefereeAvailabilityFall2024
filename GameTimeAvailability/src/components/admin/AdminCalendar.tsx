// src/components/admin/AdminCalendar.tsx
import { useEffect, useState, useMemo } from "react";
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

    const uniqueMonths = useMemo(() => {
        if (games.length === 0) {
            const currentYear = getYear(new Date());
            return ["August", "September", "October"].map(name => {
                return startOfMonth(new Date(`${name} 1, ${currentYear}`));
            });
        }

        const monthsMap: Record<string, Date> = {};
        games.forEach(g => {
            try {
                const date = parse(g.date, "MM/dd/yyyy", new Date());
                const start = startOfMonth(date);
                monthsMap[start.toISOString()] = start;
            } catch (e) {
                // ignore parsing errors
            }
        });

        const sorted = Object.values(monthsMap).sort((a, b) => a.getTime() - b.getTime());
        return sorted;
    }, [games]);

    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

    // Keep state within bounds if uniqueMonths changes
    useEffect(() => {
        if (currentMonthIndex >= uniqueMonths.length) {
            setCurrentMonthIndex(Math.max(0, uniqueMonths.length - 1));
        }
    }, [uniqueMonths, currentMonthIndex]);

    const activeMonthDate = uniqueMonths[currentMonthIndex] || new Date();

    const activeMonthData = useMemo(() => {
        const firstDay = startOfMonth(activeMonthDate);
        const lastDay = endOfMonth(firstDay);
        const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
        const padding = Array.from({ length: getDay(firstDay) });

        const days = daysInMonth.map(date => {
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
        });

        return {
            name: activeMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            padding,
            days
        };
    }, [games, activeMonthDate]);

    const handlePrevMonth = () => {
        setCurrentMonthIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthIndex(prev => Math.min(uniqueMonths.length - 1, prev + 1));
    };

    return (
        <div className="referee-calendar-wrapper">
            <h3 style={{ padding: "0 2rem", marginBottom: "1rem" }}>Admin Calendar Overview</h3>
            
            <div className="calendar-navigation-header">
                <button 
                    className="nav-btn prev-btn" 
                    onClick={handlePrevMonth}
                    disabled={currentMonthIndex <= 0}
                >
                    &larr; Prev
                </button>
                <h2 className="month-title">{activeMonthData.name}</h2>
                <button 
                    className="nav-btn next-btn" 
                    onClick={handleNextMonth}
                    disabled={currentMonthIndex >= uniqueMonths.length - 1}
                >
                    Next &rarr;
                </button>
            </div>

            <section className="month-section">
                <div className="calendar-scroll-container">
                    <div className="calendar-headers">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                            <div key={d} className="calendar-header">{d}</div>
                        ))}
                    </div>
                    <div className="calendar-cards">
                        {activeMonthData.padding.map((_, i) => (
                            <div key={`pad-${i}`} className="calendar-card empty"></div>
                        ))}
                        {activeMonthData.days.map(day => (
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
                </div>
            </section>

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
