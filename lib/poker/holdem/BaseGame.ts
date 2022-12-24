// BaseGame.ts

import { combinationsOf } from "../Combinations";
import * as br from "./BetRound"
import {Card, cardValue, cardColor, compareCards} from "../Card"
import {Hand, HandValue, handValue, handValueOrNull, compare, winners} from "../Hand"

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

function findPlayerHand(holeCards: HoleCards|null, board: Card[]): Hand|null {
    // Staerke jeder Kombination aus 5 Karten von den insgesamt 7 Karten berechnen; gearbeitet wird mit den weggelassenen Karten
    // und das Maximum merken
    
    if (holeCards == null) {
        return null;
    }

    const allCards = [...holeCards, ...board];
    const allHands = combinationsOf(allCards, 5);
    let bestHand: Hand = allHands[0];
    let bestHandValue: HandValue|null = handValue(bestHand);

    for (let i = 1; i < allHands.length; ++i) {
        const tmpVal = handValue(allHands[i]);

        if (compare(tmpVal, bestHandValue) > 0) {
            bestHand = allHands[i];
            bestHandValue = tmpVal;
        }
    }

    return bestHand;
}

// holeCards[i] sind die hole cards von players[i], falls players[i] noch nicht gefoldet hat,
// sonst null
function findPotWinners(players: number[], holeCards: (HoleCards|null)[], board: Card[], potChips: number): PotWinners {
    console.assert(players.length === holeCards.length);
    const playerHands = holeCards.map(hc => findPlayerHand(hc, board));
    const winners1 = winners(playerHands.map(hand => handValueOrNull(hand)));
    return {
        players: winners1.map(winner => players[winner]),
        chipsPerWinner: potChips / winners.length
    };
}

// holeCards: hole Cards aller Spieler in g.players, d.h.
// holeCards[i] enthaelt die hole cards von g.players[i]
// wenn ein Spieler gefoldet hat, ist holeCards[i] === null
export function showdown(g: BaseGame<Seat>, holeCards: (HoleCards|null)[]): GameResult<Seat> {
    console.assert(holeCards.length === g.players.length);

    const allPotWinners: PotWinners[] = [];

    g.pots.forEach(pot => {
        const potHoleCards = pot.players.map(player => (holeCards[player]));
        const potWinners: PotWinners = findPotWinners(pot.players, potHoleCards, g.board, pot.chips);
        potWinners.players.forEach(potWinner => {
            allPotWinners.push(potWinners);
        })
    })

    return {
        players: g.players,
        potWinners: allPotWinners
    };
}
