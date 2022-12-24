// Card.ts

export type Card = number; // 0..51; // Reihenfolge: Kreuz 2, Kreuz 3, ..., Kreuz As, Pik 2, ..., Pik As, ..., Karo 2, ..., Karo As

function cardValOfRawVal(rawVal: number): number {
    switch (rawVal) {
        case 0: return 14;
        default: return rawVal + 1;
    }
}

// Wert in 2..14, wobei 2 fuer 2, ..., 10 fuer 10 und 11 fuer Bube, ... 14 fuer As
export function cardValue(c: Card): number {
    const rawVal = c % 13;
    return cardValOfRawVal(rawVal);
}

export function cardColor(c: Card): number {
    return Math.floor(c / 4);
}

export function compareCards(a: Card, b: Card): number {
    return cardValue(a) - cardValue(b);
}

