// Card.ts

export type Card = number; // 0..51; // Reihenfolge: Kreuz 2, Kreuz 3, ..., Kreuz As, Pik 2, ..., Pik As, ..., Karo 2, ..., Karo As

function cardValOfRawVal(rawVal: number): number {
    // switch (rawVal) {
    //     case 0: return 14;
    //     default: return rawVal + 1;
    // }

    return rawVal + 2;
}

// Wert in 2..14, wobei 2 fuer 2, ..., 10 fuer 10 und 11 fuer Bube, ... 14 fuer As
export function cardValue(c: Card): number {
    const rawVal = c % 13;
    return cardValOfRawVal(rawVal);
}

export function cardColor(c: Card): number {
    return Math.floor(c / 13);
}

export function compareCards(a: Card, b: Card): number {
    return cardValue(a) - cardValue(b);
}

const ALL_WHITESPACE = " \t\r\n";

// testet ob c bzw. dessen erstes zeichen whitespace ist.
export function isWhitespace(c: string) {
    return ALL_WHITESPACE.indexOf(c) !== -1;
}

// returns new pos after all whitespace starting at s[pos]
export function parseWhitespace(s: string, pos: number): number {
    while (pos < s.length && isWhitespace(s.charAt(pos))) {
        ++pos;
    }

    return pos;
}

// returns [color, pos]
export function parseColor(s: string, pos: number): [number, number] {
    if (s.substring(pos, pos + 2) === "kr") {
        return [0, pos + 2];
    }

    if (s.substring(pos, pos + 2) === "pi") {
        return [1, pos + 2];
    }

    if (s.substring(pos, pos + 2) === "he") {
        return [2, pos + 2];
    }

    if (s.substring(pos, pos + 2) === "ka") {
        return [3, pos + 2];
    }

    throw Error(`No valid color at start of ${s.substring(pos)}`);
}

const ALL_COLORS = ["Kr", "Pi", "He", "Ka"];
const ALL_VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "B", "D", "K", "A"];

export function formatColor(col: number): string {
    return ALL_COLORS[col];
}

export function formatValue(val: number): string {
    console.assert(val >= 2 && val <= 14);
    return ALL_VALUES[val - 2];
}

// return [value, pos]
export function parseValue(s: string, pos: number): [number, number] {
    const charCode2 = "2".charCodeAt(0);
    const charCode9 = "9".charCodeAt(0);
    const code = s.charCodeAt(pos);
    if (code >= charCode2 && code <= charCode9) {
        return [2 + code - charCode2, pos + 1];
    }
    if (s.substring(pos, pos + 2) === "10") {
        return [10, pos + 2];
    }
    switch(s.charAt(pos)) {
        case "b":
            // no break
        case "j":
            return [11, pos + 1];
        case "d":
            // no break
        case "q":
            return [12, pos + 1];
        case "k":
            return [13, pos + 1];
        case "a":
            return [14, pos + 1];
    }

    throw Error(`invalid card value at start of ${s.substring(pos)}`);
}

// returns [<card>, <new pos>]
// Voraussetzung: bereits in kleinbuchstaben konvertiert
export function parse(s: string, pos: number): [Card, number] {
    let col: number;
    let value: number;
    pos = parseWhitespace(s, pos);
    [col, pos] = parseColor(s, pos);
    pos = parseWhitespace(s, pos);
    [value, pos] = parseValue(s, pos);
    console.assert(value >= 2 && value <= 14);
    return [col * 13 + (value - 2), pos];
}

export function format(c: Card): string {
    const col = cardColor(c);
    const val = cardValue(c);
    return `${formatColor(col)} ${formatValue(val)}`;
}
