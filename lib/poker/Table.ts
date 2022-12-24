// Table.ts

import * as br from "./holdem/BetRound"


export type Card = number; // 0..51

export type HoleCards = [Card, Card];

type Seat = number;
type BetRound = br.BetRound<Seat>
type Player = br.Player<Seat>

export type BaseSeat = {
    name: string,
    stock: number,
    bet: number,
    folded: boolean,
    fresh: boolean // fresh impliziert dass beim naechsten Spiel unabhaengig von der Position ein blind faellig wird
    // und zus. dass Small und Big Blinds ggf. um freshe Spieler herum definiert werden (als ob diese noch nicht da waeren obwohl sie schon spielen duerfen aber nur mit zus. blind)
    // fresh wird dann nach dem ersten spiel false
}

export type ServerSeat = BaseSeat & {
    cards: HoleCards|null
}

export type BaseTable = {
    id: string,
    pot: number,
    dealer: number,
    board: Array<Card>,

}

export type ServerTable = BaseTable & {
    seats: Array<ServerSeat|null>,
}

export type ClientTable = BaseTable & {
    seats: Array<BaseSeat|null>,
    ownCards:HoleCards|null, 
    ownSeat:number,
}

function cycleNext(i:number, n: number) {
    return (i + 1) % n;
}

function filterNext(i:number, n:number, filter:(i:number) => boolean): (number|null)  {
    for (let j = 0; j < n; ++j) {
        i = cycleNext(i, n);
        if (filter(i)) return i;
    }

    return null;
}

export function updateActive(t:ClientTable):void {
    const nextActive = filterNext(t.active, t.seats.length, (i:number) => {
        return t.seats[i] != null;
    })

    if (nextActive) {
        t.active = nextActive;
    }
}

export function updateDealerServer(t:ServerTable):void {
    const nextDealer = filterNext(t.dealer, t.seats.length, (i) => t.seats[i] != null);
    if (nextDealer) {
        t.dealer = nextDealer;
    }
}

export function updateDealerClient(t:ClientTable):void {
    const nextDealer = filterNext(t.dealer, t.seats.length, (i) => t.seats[i] != null);
    if (nextDealer) {
        t.dealer = nextDealer;
    }
}

export type DealAction = {
    type: "deal",
    newDealer: number,
    ownCards: [Card, Card],
}

export type EnterAction = {
    type: "enter"
    seatIdx: number,
    name: string,
    stock:number
}

export type BetAction = {
    type: "bet",
    seatIdx: number,
    bet: number
}

export type CallAction = {
    type: "call",
    seatIdx: number,
}

export type RaiseAction = {
    type: "raise",
    seatIdx: number,
    bet: number // bet is the new bet, i.e. the value that the bet is raised to
}

export type FoldAction = {
    type: "fold",
    seatIdx: number
}

export type TableAction = (
    DealAction |
    EnterAction |
    BetAction |
    CallAction |
    RaiseAction |
    FoldAction
);

type BaseSeatOrNull = BaseSeat | null;

export function runTableAction(a: TableAction, t: ClientTable) {
    switch (a.type) {
        case "deal": {
            const da: DealAction = a;
            t.dealer = da.newDealer;
            t.ownCards = da.ownCards;
    
            t.seats.forEach(seat => {
    
                if (seat != null) {
                    seat.bet = 0;
                    seat.folded = false;
                }
            })
            break;
        }

        case "enter": {
            // TODO
            t.seats[a.seatIdx] = {
                name:a.name,
                stock:a.stock,
                bet:0,
                folded:false
            }
            break;
        }
    }
}
