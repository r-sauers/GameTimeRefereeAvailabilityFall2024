type Game = {
    gameId: string, //         (e.g. "808-HS25")
    date: string, //          ("MM/DD/YYYY")
    time: string, //           ("5:15 PM")
    venue: string, //
    level: string, //          (Varsity / JV / B-Squad / C-Squad / Grade 9)
    gender: string, //         (Boys / Girls)
    gameType: string, //       (blank or "Scrimmage")
    homeTeam: string, //
    awayTeam: string, //
    listed: boolean, //        (admin can toggle off to hide from referees)
    createdAt: string // timestamp
}

type RefereeDoc = {
    name: string,
    email: string,
    availableFor: string[],
    updatedAt: string
}

type RefereeWithID = RefereeDoc & { uid: string };

export type { Game, RefereeDoc, RefereeWithID }