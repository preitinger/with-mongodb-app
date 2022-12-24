// BaseGame.ts

import { combinationsOf } from "../Combinations";
import * as br from "./BetRound"
import {Card, cardValue, cardColor, compareCards} from "./Card"

type Seat = number;

export type State = (
    "betRound"
    | "flop"
    | "turn"
    | "river"
    | "remainingCards" // wenn alle all-in oder gefoldet: evtl. verbleibende board und hole cards werden dann auf einmal nachgereicht
    | "showdown"
)

export type BaseGame<Seat> = {
    state: State
    smallBlind: number
    players: br.Player<Seat>[]
    betRound: br.BetRound<Seat>|null // aktuelle Setzrunde; null wenn bei side-pots nur noch auf remainingBoardCards fuer show-down gewartet wird.
    board: Card[]
    pots: br.Pot[]
}

export function create<Seat>(smallBlind: number, players: br.Player<Seat>[]): BaseGame<Seat> {
    // TODO hier fehlt noch fallunterscheidung
    // ob von anfang an alle schon wegen der blinds all-in sind, 
    // ist theoretisch moeglich wenn der Gewinner der letzten Runde aufgestanden ist
    // und z.B. noch 2 uebrig bleiben, die nur noch gerade oder weniger als einen Big Blind haben.

    const betRound = br.create(smallBlind, players);

    // Ausnahmefall pruefen, wenn alle durch die blinds gleich zu beginn in den all-in
    // zustand geraten
    const res = br.finishMove(betRound, false);

    const g: BaseGame<Seat> = {
        state: "betRound",
        smallBlind: smallBlind,
        players: players,
        betRound: betRound,
        board: [],
        pots: []
    }

    if (res) {
        g.state = "remainingCards";
        g.players = res[0];
        g.betRound = null;
        g.pots = res[1]
    }

    return g;
}

type PotWinners = {
    players: number[] // Indizes zu BaseGame.players
    chipsPerWinner: number
}

export type GameResult<Seat> = {
    players: br.Player<Seat>[]
    potWinners: PotWinners[]
}

function afterBetRound<Seat>(g: BaseGame<Seat>, roundRes: br.BetRoundResult<Seat>): GameResult<Seat>|null {

    const pots = roundRes[1];
    const lastPot = pots[pots.length - 1];
    console.assert(lastPot.players.length >= 1);
    
    if (lastPot.players.length > 1) {
        // neue setzrunde notwendig,
        // also auf flop warten
        switch(g.board.length) {
            case 0:
                g.state = "flop";
                break;
            case 3:
                g.state = "turn";
                break;
            case 4:
                g.state = "river";
                break;
            case 5:
                g.state = "showdown";
                break;
                
        }
        g.betRound = null;
        g.players = roundRes[0];
        g.pots = roundRes[1];
        return null;
    } else {
        // im main pot nur noch einer uebrig, keine weitere setzrunden notwendig
        // aber evtl. gibt es einen oder mehrere side-pots, fuer die ein show-down
        // notwendig ist

        if (pots.length > 1) {
            // es gibt mind. einen side-pot, so dass show-down notwendig
            g.pots = pots;
            g.betRound = null;
            g.state = "remainingCards";
            return null;
        } else {
            // kein show-down notwendig, da keine side-pots existieren und im main pot
            // nur einer nicht gefoldet hat.
            // also hier main pot an gewinner uebertragen:
            const winner = g.players[lastPot.players[0]];
            winner.chips += lastPot.chips;
            const result: GameResult<Seat> = {
                players: g.players,
                potWinners: [{
                    players: [lastPot.players[0]],
                    chipsPerWinner: lastPot.chips
                }]
            };
            return result;
        }
    }
}

export function fold<Seat>(g: BaseGame<Seat>): GameResult<Seat>|null {
    console.assert(g.state === "betRound");
    console.assert(g.betRound);
    if (!g.betRound) throw Error("illegal state g.betRound not set");
    const roundRes = br.fold(g.betRound);
    if (!roundRes) return null;
    return afterBetRound(g, roundRes);
}

export function check<Seat>(g: BaseGame<Seat>): GameResult<Seat>|null {
    console.assert(g.state === "betRound");
    console.assert(g.betRound);
    if (!g.betRound) throw Error("illegal state g.betRound not set");
    const roundRes = br.check(g.betRound);
    if (!roundRes) return null;
    return afterBetRound(g, roundRes);
}

export function call<Seat>(g: BaseGame<Seat>): GameResult<Seat>|null {
    console.assert(g.state === "betRound");
    console.assert(g.betRound);
    if (!g.betRound) return null;
    const roundRes = br.call(g.betRound);
    if (!roundRes) return null;
    return afterBetRound(g, roundRes);
}

export function raise<Seat>(g: BaseGame<Seat>, newMaxBet: number): GameResult<Seat>|null {
    console.assert(g.state === "betRound");
    console.assert(g.betRound);
    if (!g.betRound) return null;
    const roundRes = br.raise(g.betRound, newMaxBet);
    if (!roundRes) return null;
    // darf dies eigentlich nie erreichen
    console.assert(false);
    return afterBetRound(g, roundRes);
}

export function flop(g: BaseGame<Seat>, flop: Card[]): void {
    console.assert(g.state === "flop");
    if (!g.pots) throw Error("no pots saved before a following bet round");
    const lastPot = g.pots[g.pots.length - 1];
    g.betRound = br.createFollowing(g.smallBlind, g.players, 
        g.pots.splice(g.pots.length - 1, 1)[0]
    );
    g.board.push(...flop);
    g.state = "betRound";
}

export function turn(g: BaseGame<Seat>, turn: Card): void {
    console.assert(g.state === "turn");
    if (!g.pots) throw Error("no pots saved before a following bet round");
    const lastPot = g.pots[g.pots.length - 1];
    g.betRound = br.createFollowing(g.smallBlind, g.players, 
        g.pots.splice(g.pots.length - 1, 1)[0]
    );
    g.board.push(turn);
    g.state = "betRound";
}

export function river(g: BaseGame<Seat>, river: Card): void {
    console.assert(g.state === "river");
    if (!g.pots) throw Error("no pots saved before a following bet round");
    const lastPot = g.pots[g.pots.length - 1];
    g.betRound = br.createFollowing(g.smallBlind, g.players, 
        g.pots.splice(g.pots.length - 1, 1)[0]
    );
    g.board.push(river);
    g.state = "betRound";
}

export type HoleCards = [Card, Card];

export type Hand = Card[]; // genau 5 Karten ausgewaehlt aus den insgesamt 7 hole cards und board cards; so dass ein max. Handwert entsteht.

export type HandValue = {
    type: number // 8 downto 0 fuer die Klassen str fl, poker, full, flush, str, 3, 2p, 2, hi
    vals: number[] // jeweils unterschiedliche Zahlen von relevanten Kartenwerten:

    // {
    //     type: 8 // "str fl"
    //     vals: number[] // hoechste Karte in 5..14; 14 fuer As
    // } |
    // {
    //     type: 7 // "4"
    //     vals: number[] // Wert des Vierlings gefolgt von 1 Kicker; jede Zahl in 2..14
    // } |
    // {
    //     type: 6 // "full"
    //     vals: number[] // Wert des Drillings gefolgt von Wert des Zwillings; jeweils in 2..14
    // } |
    // {
    //     type: 5 // "flush"
    //     vals: number[] // Kartenwerte absteigend; jeweils in 2..14
    // } |
    // {
    //     type: 4 // "str"
    //     val: number[] // hoechste Karte in 2..14
    // } |
    // {
    //     type: 3 // "3"
    //     vals: number[] // Wert des Drillings gefolgt von 2 Kickern; jede Zahl in 2..14
    // } |
    // {
    //     type: 2 // "2p"
    //     vals: number[] // Wert des hoeheren Paares, Wert des niedrigeren Paares, gefolgt von einem Kicker; jede Zahl in 2..14
    // } |
    // {
    //     type: 1 // "2"
    //     vals: number[] // Wert des Paares, gefolgt von absteigend sortierten 3 Kickern
    // } |
    // {
    //     type: 0 // "hi"
    //     vals: number[] // alle Kartenwerte absteigend sortiert; jeweils in 2..14
    // }
}

function compare(hand1: HandValue, hand2: HandValue|null) {
    if (!hand2) return 1;
    const typeDiff = hand1.type - hand2.type;
    if (typeDiff !== 0) return typeDiff;

    if (hand1.vals.length !== hand2.vals.length) {
        console.error("hand1", hand1, "hand2", hand2);
        
        throw Error(`Unexpected vals lengths for hand type ${hand1.type}`)
    }

    for (let i = 0; i < hand1.vals.length; ++i) {
        const diff = hand1.vals[i] - hand2.vals[i];
        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

function best(handValues: HandValue[]): number[] {
    let positions: number[] = [];
    let best: HandValue|null = null;

    handValues.forEach((hand, i) => {
        const tmp = compare(hand, best);
        if (tmp > 0) {
            positions = [i];
            best = hand;
        } else if (tmp === 0) {
            positions.push(i);
        }
    })

    return positions;
}

function isFlush(hand: Hand): boolean {
    const col = cardColor(hand[0]);

    for (let i = 1; i < hand.length; ++i) {
        if (cardColor(hand[i]) !== col) return false;
    }

    return true;
}

// Voraussetzung: bereits absteigend nach cardValue(card[i]) sortiert
function isStraight(hand: Hand): [boolean, number] {
    let i = 1;
    let highest = cardValue(hand[0]);
    
    // Ausnahmefall: A 2 3 4 5; liegt dann so im Array: [14, 5, 4, 3, 2]
    if (cardValue(hand[0]) === 14 &&  cardValue(hand[1]) === 5) {
        // Hoechste Karte ist As
        i = 2;
        highest = 5;
    }

    let last = hand[i];
    for (let j = i; j < hand.length; ++j) {
        if (cardValue(hand[j]) !== cardValue(hand[j - 1]) - 1) {
            return [false, highest];
        }
    }

    return [true, highest];
}

function handValue(hand: Hand): HandValue {
    if (hand.length !== 5) throw Error("Unexpected hand length: " + hand.length);
    // zunaechst immer absteigend sortieren
    hand.sort((a, b) => compareCards(b, a));

    const flush = isFlush(hand);
    const [straight, highest] = isStraight(hand);
    const vals = hand.map(card => cardValue(card));

    // straight flush?
    if (flush && straight) {
        return {
            type: 8,
            vals: [highest]
        };
    }
    
    // Vierling?
    if (vals[0] === vals[1] && vals[1] === vals[2] && vals[2] === vals[3]) {
        return {
            type: 7,
            vals: [vals[0], vals[4]]
        };
    }
    if (vals[1] === vals[2] && vals[2] === vals[3] && vals[3] === vals[4]) {
        return {
            type: 7,
            vals: [vals[1], vals[0]]
        };
    }

    // Full House?
    if (vals[0] === vals[1] && vals[1] === vals[2] && vals[3] === vals[4]) {
        return {
            type: 6,
            vals: [vals[0], vals[3]]
        };
    }
    if (vals[0] === vals[1] && vals[2] === vals[3] && vals[3] === vals[4]) {
        return {
            type: 6,
            vals: [vals[2], vals[0]]
        };
    }

    // Flush?
    if (flush) {
        return {
            type: 5,
            vals: vals
        }
    }

    // Straight?
    if (straight) {
        return {
            type: 4,
            vals: [highest]
        };
    }

    // Drilling?
    if (vals[0] === vals[1] && vals[1] === vals[2]) {
        return {
            type: 3,
            vals: [vals[0], vals[3], vals[4]]
        };
    }
    if (vals[1] === vals[2] && vals[2] === vals[3]) {
        return {
            type: 3,
            vals: [vals[1], vals[0], vals[4]]
        };
    }
    if (vals[2] === vals[3] && vals[3] === vals[4]) {
        return {
            type: 3,
            vals: [vals[2], vals[0], vals[1]]
        };
    }

    // 2 Paare?
    if (vals[0] === vals[1] && vals[2] === vals[3]) {
        return {
            type: 2,
            vals: [vals[0], vals[3], vals[4]]
        };
    }
    if (vals[0] === vals[1] && vals[3] === vals[4]) {
        return {
            type: 2,
            vals: [vals[0], vals[3], vals[2]]
        };
    }
    if (vals[1] === vals[2] && vals[3] === vals[4]) {
        return {
            type: 2,
            vals: [vals[1], vals[3], vals[2]]
        };
    }

    // 1 Paar?
    if (vals[0] === vals[1]) {
        return {
            type: 1,
            vals: [vals[0], vals[2], vals[3], vals[4]]
        };
    }
    if (vals[1] === vals[2]) {
        return {
            type: 1,
            vals: [vals[1], vals[0], vals[3], vals[4]]
        };
    }
    if (vals[2] === vals[3]) {
        return {
            type: 1,
            vals: [vals[2], vals[0], vals[1], vals[4]]
        };
    }
    if (vals[3] === vals[4]) {
        return {
            type: 1,
            vals: [vals[3], vals[0], vals[1], vals[2]]
        };
    }

    // High Card
    return {
        type: 0,
        vals: vals
    };
}

function findPlayerHand(holeCards: HoleCards, board: Card[]): Hand {
    // Staerke jeder Kombination aus 5 Karten von den insgesamt 7 Karten berechnen; gearbeitet wird mit den weggelassenen Karten
    // und das Maximum merken
    
    const allCards = [...holeCards, ...board];
    const allHands = combinationsOf(allCards, 5);
    let bestHand: Hand = allHands[0];
    let bestHandValue: HandValue = handValue(bestHand);

    for (let i = 1; i < allHands.length; ++i) {
        const tmpVal = handValue(allHands[i]);

        if (compare(tmpVal, bestHandValue) > 0) {
            bestHand = allHands[i];
            bestHandValue = tmpVal;
        }
    }

    return bestHand;
}

function findPotWinners(players: number[], holeCards: HoleCards[], board: Card[], potChips: number): PotWinners {
    console.assert(players.length === holeCards.length);
    const playerHands = holeCards.map(hc => findPlayerHand(hc, board));
    const winners = best(playerHands.map(hand => handValue(hand)));
    return {
        players: winners.map(winner => players[winner]),
        chipsPerWinner: potChips / winners.length
    };
}

export function showdown(g: BaseGame<Seat>, holeCards: (HoleCards|null)[]): GameResult<Seat> {
    console.assert(holeCards.length === g.players.length);

    const allPotWinners: PotWinners[] = [];

    g.pots.forEach(pot => {
        const potWinners: PotWinners = findPotWinners(pot.players, holeCards, g.board, pot.chips);
        potWinners.players.forEach(potWinner => {
            allPotWinners.push(potWinners);
        })
    })

    return {
        players: g.players,
        potWinners: allPotWinners
    };
}