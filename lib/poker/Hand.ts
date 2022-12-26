// Hand.ts

import {Card, cardValue, cardColor, compareCards, format} from "./Card"


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

export function compare(hand1: HandValue, hand2: HandValue|null) {
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

// sucht aus einer Liste von Haenden, die um einen Pot konkurrieren, die
// eine oder auch mehrere Haende aus, die zu den Pot-Gewinnern gehoeren.
export function winners(handValues: (HandValue|null)[]): number[] {
    let positions: number[] = [];
    let best: HandValue|null = null;

    handValues.forEach((handValue, i) => {
        if (handValue) {
            const tmp = compare(handValue, best);
            if (tmp > 0) {
                positions = [i];
                best = handValue;
            } else if (tmp === 0) {
                positions.push(i);
            }
            }
    })

    return positions;
}


export function isFlush(hand: Hand): boolean {
    const col = cardColor(hand[0]);

    for (let i = 1; i < hand.length; ++i) {
        if (cardColor(hand[i]) !== col) return false;
    }

    return true;
}

// Voraussetzung: bereits absteigend nach cardValue(card[i]) sortiert
export function isStraight(hand: Hand): [boolean, number] {
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

export function handValue(hand: Hand): HandValue {

    if (hand.length !== 5) throw Error("Unexpected hand length: " + hand.length);
    // zunaechst immer kopieren und absteigend sortieren
    hand = hand.slice();
    hand.sort((a, b) => compareCards(b, a));

    // console.log("sortierte hand: ", hand, " = ", hand.map(card => format(card)));
    

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
            vals: [vals[0], vals[2], vals[4]]
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
            vals: [vals[1], vals[3], vals[0]]
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

export function handValueOrNull(hand: Hand|null): HandValue|null {
    return hand == null ? null : handValue(hand);
}
