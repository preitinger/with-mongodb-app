// Hand.test.ts

import {Card, parse} from "./Card"
import { Hand, HandValue, compare, winners} from "./Hand"

test("compare", () => {
    let a, b: HandValue;

    a = {
        type: 0,
        vals: [7, 5, 4, 3, 2]
    }

    b = {
        type: 1,
        vals: [2, 5, 4, 3]
    }

    expect(compare(a, b)).toBeLessThan(0);
    expect(compare(b, a)).toBeGreaterThan(0);

    a = {
        type: 0,
        vals: [14, 5, 4, 3, 2]
    }
    b = {
        type: 0,
        vals: [13, 12, 11, 10, 9]
    }
    expect(compare(a, b)).toBeGreaterThan(0);
    expect(compare(b, a)).toBeLessThan(0);
})

test("winners", () => {
    let a, b: HandValue;
    a = {
        type: 8,
        vals: [14]
    }
    b = {
        type: 8,
        vals: [13]
    }
    expect(winners([a, b])).toEqual([0]);
    expect(winners([b, a])).toEqual([1]);
    let c: HandValue = {
        type: 8,
        vals: [14]
    }
    expect(winners([a, b, c])).toEqual([0, 2]);

    a = {
        type: 7,
        vals: [10, 12]
    }

    expect(winners([a,b])).toEqual([1])

    a = {
        type: 7,
        vals: [10, 12]
    }

    b = {
        type: 6,
        vals: [9, 2]
    }

    c = {
        type: 7,
        vals: [10, 13]
    }

    expect(winners([a,b,c])).toEqual([2]);
})

function parseTestHand(s: string): Hand {
    s = s.toLowerCase();
    const hand: Card[] = [];
    let pos = 0;
    let card: Card;
    for (let i = 0; i < 5; ++i) {
        [card, pos] = parse(s, pos);
        hand.push(card);
    }
    return hand;
}

test("isFlush", () => {
    let a = parseTestHand("He 7   Ka 8   He 10   He B   He 3");
    console.log("hand a", a);
    
    
})