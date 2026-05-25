// src/components/referee/GameCalendar.tsx
import { useState, memo, useMemo, useEffect } from "react";
import type { Game } from "../../types";
import { startOfMonth, getDay, eachDayOfInterval, endOfMonth, parse, isSameDay, getYear } from "date-fns";

interface CellProps {
    dayNumber: number;
    dayDate: Date;
    venues: [string, Game[]][];
    selectedIds: string[];
    onToggle: (gameId: string) => void;
    onBatchToggle: (gameIds: string[], select: boolean) => void;
}

/**
 * Individual Calendar Cell with optimized comparison.
 * Only re-renders if the selection status of any game IN THIS DAY changes.
 */
const CalendarCell = memo(({ dayNumber, venues, selectedIds, onToggle, onBatchToggle }: CellProps) => {
    const [openVenues, setOpenVenues] = useState<Set<string>>(new Set());

    const toggleVenue = (venueName: string) => {
        setOpenVenues(prev => {
            const next = new Set(prev);
            if (next.has(venueName)) next.delete(venueName);
            else next.add(venueName);
            return next;
        });
    };

    return (
        <div className="calendar-card">
            <div className="calendar-date">{dayNumber}</div>
            <div className="card-content">
                {venues.map(([venueName, venueGames]: [string, Game[]]) => {
                    const isOpen = openVenues.has(venueName);
                    const selectedInVenue = venueGames.filter(g => selectedIds.includes(g.gameId)).length;
                    const allSelected = selectedInVenue === venueGames.length;

                    return (
                        <div key={venueName} className={`venue-group ${!isOpen ? 'closed' : ''}`}>
                            <div className="venue-header-container">
                                <input
                                    type="checkbox"
                                    className="venue-checkbox"
                                    checked={allSelected}
                                    onChange={() => onBatchToggle(venueGames.map(g => g.gameId), !allSelected)}
                                />
                                <div
                                    className="venue-header"
                                    onClick={() => toggleVenue(venueName)}
                                >
                                    {venueName}
                                    {selectedInVenue > 0 ? (
                                        <span className="game-ratio">(<span className="game-ratio-highlight">{selectedInVenue}/{venueGames.length}</span>)</span>
                                    ) : (
                                        <span className="game-ratio">(<span>{selectedInVenue}/{venueGames.length}</span>)</span>
                                    )}
                                </div>
                            </div>
                            <ul className="venue-games">
                                {venueGames.map(game => (
                                    <li key={game.gameId} className="game-item">
                                        <input
                                            type="checkbox"
                                            className="game-checkbox"
                                            checked={selectedIds.includes(game.gameId)}
                                            onChange={() => onToggle(game.gameId)}
                                        />
                                        <span className="game-label">
                                            {game.gender} {game.level} {game.time}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: only re-render if the selection status of our specific games changed
    if (prevProps.venues !== nextProps.venues) return false;
    
    // Check if any of our game IDs have a different selection status
    const allGameIds = prevProps.venues.flatMap(([_, games]) => games.map(g => g.gameId));
    for (const id of allGameIds) {
        const wasSelected = prevProps.selectedIds.includes(id);
        const isSelected = nextProps.selectedIds.includes(id);
        if (wasSelected !== isSelected) return false;
    }
    
    // Otherwise, skip re-render
    return true;
});

interface Props {
    games: Game[];
    selectedIds: string[];
    onToggle: (gameId: string) => void;
    onBatchToggle: (gameIds: string[], select: boolean) => void;
}

export default function GameCalendar({ games, selectedIds, onToggle, onBatchToggle }: Props) {
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
            }).sort((a, b) => a.time.localeCompare(b.time));
            
            const venues: Record<string, Game[]> = {};
            dayGames.forEach(g => {
                if (!venues[g.venue]) venues[g.venue] = [];
                venues[g.venue].push(g);
            });

            return {
                date,
                dayNumber: date.getDate(),
                venues: Object.entries(venues).sort(([a], [b]) => a.localeCompare(b))
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
                            <CalendarCell
                                key={day.date.toISOString()}
                                dayNumber={day.dayNumber}
                                dayDate={day.date}
                                venues={day.venues}
                                selectedIds={selectedIds}
                                onToggle={onToggle}
                                onBatchToggle={onBatchToggle}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
