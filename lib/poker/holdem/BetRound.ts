// BetRound.ts

export type Blind = (
    "none"
    | "small" 
    | "big" 
    | "new"
)

export type Player<Seat> = {
    seat: Seat
    chips: number
    blind: Blind
}

export type Pot = {
    players: number[] // jeweils ein Index fuer BetRound.players
    chips: number
}

export type Better = {
    player: number // Array-Index fuer BetRound.players
    chips: number
    allIn: boolean
}

export type BetRound<Seat> = {
    smallBlind: number
    players: Player<Seat>[]
    // remaining enthaelt immer die Anzahl von Spielern, die noch eine Aktion machen muessen
    // Zu Beginn ist es betters.length
    // Nach jedem Call/Fold wird die Anzahl dekrementiert.
    // Nach jedem Raise wird remaining = betters.length - 1 gesetzt.
    remaining: number, // Anzahl Spieler, die noch mind. eine Aktion machen muessen; zu Beginn die Anzahl der Spieler.

    betters: Better[] // Wer folded fliegt hier raus, sein Einsatz wird zu BaseGame.pot addiert
    lastRaise: number // Zu Beginn 2 (Big Blind), spaeter letzte Netto-Erhoehung
    maxBet: number // hoechster Einsatz in der aktuellen Bet Round
    active: number,
    foldChips: number[],
    sidePots: Pot[],
    chipsFromLastRound: number,
    finished: boolean
}

// function initBettersOld<Seat>(players: Player<Seat>[]): Better[] {
//     const n = players.length;
//     console.assert(n >= 2, "not enough players");
//     if (n < 2) {
//         throw Error(`Too few players: ${n}`);
//     }

//     if (n === 2) {
//         // dealer in heads-up setzt small-blind
//         return [
//             {
//                 player: players[0].idx,
//                 chips: Math.min(2, players[0].chips),
//                 allIn: players[0].chips <= 2
//             },
//             {
//                 player: players[1].idx,
//                 chips: Math.min(1, players[1].chips),
//                 allIn: players[1].chips <= 1
//             }
//         ]
//     } else {
//         const betters: Better[] = [];

//         betters[0] = {
//             player: players[0].idx,
//             chips: Math.min(1, players[0].chips),
//             allIn: players[0].chips <= 1
//         };

//         betters[1] = {
//             player: players[1].idx,
//             chips: Math.min(2, players[1].chips),
//             allIn: players[1].chips <= 2
//         }

//         for (let i = 2; i < n; ++i) {
//             betters[i] = {
//                 player: players[i].idx,
//                 chips: 0,
//                 allIn: false
//             }
//         }

//         return betters;
//     }
// }

function playerOfBetter<Seat>(b: BetRound<Seat>, better: Better): Player<Seat> {
    return b.players[better.player];
}

function cycleActive<T>(b: BetRound<T>): void {
    // console.log("cycleActive: vorher", b.active);
    console.assert(b.remaining > 0);
    b.active = (b.active + 1) % b.betters.length;
    --b.remaining;
    // console.log("cycleActive: nachher", b.active);
}

function activeBetter(b:BetRound<any>): Better {
    return b.betters[b.active];
}

function cycleActiveUntilNotAllIn<T>(b: BetRound<T>, preCycle: boolean): void {
    const cond = () => (b.remaining > 0 && activeBetter(b).allIn);

    if (!preCycle && !(cond())) {
        return;
    }
    do {
        cycleActive(b);
    } while (cond());
}

// returns index of the better of the big blind
function setBlinds<Seat>(b: BetRound<Seat>):number {
    const n = b.betters.length;
    let bigBlindIdx = 0;

    for (let i = 0; i < n; ++i) {
        
        const better = b.betters[i];
        const player = playerOfBetter(b, better);
        // console.log("chips von ", i, " zu Beginn: ", player.chips);
        let chips = 0;
        switch(player.blind) {
            case "none":
                chips = 0;
                break;
            case "small":
                chips = Math.min(b.smallBlind, player.chips);
                break;
            case "big":
                bigBlindIdx = i;
                // no break
            case "new":
                chips = Math.min(b.smallBlind * 2, player.chips);
        }

        // console.log("chips bei i=", i, ": ", chips);
        
        better.chips = chips;
        player.chips -= chips;
        better.allIn = (player.chips === 0);
        console.log("chips von ", i, " nach setBlinds: ", player.chips);
        
    }

    b.lastRaise = b.maxBet = b.smallBlind * 2;
    return bigBlindIdx;
}

export function create<Seat>(smallBlind: number, players: Player<Seat>[]): BetRound<Seat> {
    const n = players.length;

    if (n < 2) {
        throw Error(`Too few players: ${n}`);
    }

    const b = {
        smallBlind: smallBlind,
        players: players,
        remaining: n,
        betters: players.map((p, i) => ({player: i, chips: 0, allIn: false})),
        lastRaise: 0,
        maxBet: 0,
        active: n > 2 ? 2 : 1, // bei heads-up hat dealer SB
        foldChips: [],
        sidePots: [],
        chipsFromLastRound: 0, // keine da erste setzrunde im spiel
        finished: false
    };

    const bigBlindIdx = setBlinds(b);
    b.active = bigBlindIdx;
    cycleActiveUntilNotAllIn(b, true);
    b.remaining = b.betters.length;
    return b;
}

export function createFollowing<Seat>(smallBlind: number, players: Player<Seat>[], lastPot: Pot): BetRound<Seat> {
    const n = lastPot.players.length;
    return {
        smallBlind: smallBlind,
        players: players,
        remaining: n,
        betters: lastPot.players.map((idx, i) => (
            {
                player: idx,
                chips: 0,
                allIn: players[idx].chips === 0
            }
        )),
        lastRaise: smallBlind * 2,
        maxBet: 0,
        active: 0,
        foldChips: [],
        sidePots: [],
        chipsFromLastRound: lastPot.chips,
        finished: false
    }
}

function buildSidePot<Seat>(b: BetRound<Seat>):boolean {
    if (b.betters.length === 0) return false; // moeglich wenn mehrere mit exakt gleicher chip-zahl all-in
    const minBet = Math.min(...(b.betters.map(better => better.chips)));
    
    if (minBet === b.maxBet) return false;
    console.assert(minBet < b.maxBet, "minBet", minBet, "maxBet", b.maxBet);
    let newSidePot = b.chipsFromLastRound;
    b.chipsFromLastRound = 0;

    for (let i = 0; i < b.betters.length; ++i) {
        const better = b.betters[i];
        
        if (better.chips < minBet) {
            newSidePot += better.chips;
            better.chips = 0;
        } else {
            newSidePot += minBet;
            better.chips -= minBet;
        }
    }

    for (let i = 0; i < b.foldChips.length; ++i) {
        if (b.foldChips[i] < minBet) {
            newSidePot += b.foldChips[i];
            b.foldChips[i] = 0;
        } else {
            newSidePot += minBet;
            b.foldChips[i] -= minBet;
        }
    }

    b.sidePots.push({
        players: b.betters.map(better => better.player),
        chips: newSidePot
    })

    let shift = 0;

    for (let i = 0; i < b.betters.length - shift; ++i) {

        if (b.betters[i + shift].chips === 0) {
            ++shift;
            --i;
        } else if (shift > 0) {
            b.betters[i] = b.betters[i + shift];
        }


    }

    b.betters.splice(b.betters.length - shift, shift);
    b.maxBet -= minBet;
    return true;
}

export type BetRoundResult<Seat> = [Player<Seat>[], (Pot[]), ]

export function finishMove<Seat>(b: BetRound<Seat>, preCycle: boolean):BetRoundResult<Seat>|null {

    cycleActiveUntilNotAllIn(b, preCycle);
    
    if (b.remaining === 0) {
        b.finished = true;
        while (buildSidePot(b));

        if (b.betters.length === 0) {
            return [b.players, b.sidePots];
        }

        let prevChips = b.chipsFromLastRound;
        b.chipsFromLastRound = 0;
        b.foldChips.forEach(chips => {
            prevChips += chips;
        });
        return [
            b.players,
            [
                ...b.sidePots,
                {
                    players: b.betters.map(better => better.player),
                    chips: b.maxBet * b.betters.length + prevChips
                }
            ]
        ]
    }

    return null;
}

// returns the better who has fold.
// If only one has not folded or all have called, returns the final pot, otherwise null.
export function fold<Seat>(b: BetRound<Seat>):BetRoundResult<Seat>|null {
    console.assert(!b.finished);
    console.assert(b.remaining > 0);
    const playerIdx = b.active;
    const better = b.betters[playerIdx];
    b.foldChips.push(better.chips);
    b.betters.splice(playerIdx, 1);
    console.assert(b.active <= b.betters.length);
    if (b.active === b.betters.length) b.active = 0;
    --b.remaining;

    if (b.betters.length === 1) {
        b.remaining = 0;
        b.finished = true;
        while (buildSidePot(b));

        return [

            b.players,
            [
                ...b.sidePots, 
                {
                    players: [b.betters[0].player],
                    chips: (b.foldChips.reduce((prev, cur) => prev + cur, 0)) + b.betters[0].chips
                }
            ]
        ];

    }

    return finishMove(b, false);
}

export function check<Seat>(b: BetRound<Seat>): BetRoundResult<Seat>|null {
    const better = activeBetter(b);
    console.assert(better.chips === b.maxBet);
    console.assert(b.remaining > 0);
    
    return finishMove(b, true);
}

// stock notwendig, falls Fehlbetrag >, dann waere es naemlich all-in
// und es entsteht ein side-pot
export function call<Seat>(b: BetRound<Seat>):BetRoundResult<Seat>|null {
    const better = activeBetter(b);
    const player = playerOfBetter(b, better);
    console.assert(!better.allIn); // sonst haette vorher die BetRound beendet werden muessen
    console.assert(!b.finished);
    console.assert(b.remaining > 0);

    let missing = b.maxBet - better.chips;

    if (missing >= player.chips) {
        better.allIn = true;
        missing = player.chips;
    }

    better.chips += missing;
    player.chips -= missing;
    console.assert(player.chips >= 0);

    return finishMove(b, true);
}

export function raise<Seat>(b: BetRound<Seat>, newMaxBet: number): BetRoundResult<Seat>|null {
    const better = activeBetter(b);
    const player = playerOfBetter(b, better);
    console.assert(!better.allIn); // sonst haette vorher die BetRound beendet werden muessen
    console.assert(!b.finished);
    console.assert(b.remaining > 0);
    const newRaise = newMaxBet - b.maxBet;
    const missing = newMaxBet - better.chips;
    console.assert(missing <= player.chips);
    b.lastRaise = newRaise;
    b.maxBet = newMaxBet;
    better.chips += missing;
    player.chips -= missing;
    better.allIn = (player.chips === 0);
    console.assert(newRaise >= b.lastRaise || better.allIn);
    console.assert(better.chips === b.maxBet);
    b.remaining = b.betters.length;
    return finishMove(b, true);
}
