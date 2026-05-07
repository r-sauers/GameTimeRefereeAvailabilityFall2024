// src/components/referee/GameCalendar.tsx
import { useState, memo, useMemo } from "react";
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
                                    <span className="game-ratio">({selectedInVenue}/{venueGames.length})</span>
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
    const months = useMemo(() => ["August", "September", "October"], []);
    const year = useMemo(() => getYear(new Date()), []);

    const calendarData = useMemo(() => {
        return months.map(monthName => {
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
                })
            };
        });
    }, [games, months, year]);

    return (
        <div className="referee-calendar-wrapper">
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
                </section>
            ))}
        </div>
    );
}
