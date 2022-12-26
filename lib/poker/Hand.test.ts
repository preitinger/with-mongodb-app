// Hand.test.ts

import {Card, parse, compareCards, parseValue} from "./Card"
import * as uut from "./Hand"
import { check } from "./holdem/BetRound";

test("compare", () => {
    let a, b: uut.HandValue;

    a = {
        type: 0,
        vals: [7, 5, 4, 3, 2]
    }

    b = {
        type: 1,
        vals: [2, 5, 4, 3]
    }

    expect(uut.compare(a, b)).toBeLessThan(0);
    expect(uut.compare(b, a)).toBeGreaterThan(0);

    a = {
        type: 0,
        vals: [14, 5, 4, 3, 2]
    }
    b = {
        type: 0,
        vals: [13, 12, 11, 10, 9]
    }
    expect(uut.compare(a, b)).toBeGreaterThan(0);
    expect(uut.compare(b, a)).toBeLessThan(0);
})

test("winners", () => {
    let a, b: uut.HandValue;
    a = {
        type: 8,
        vals: [14]
    }
    b = {
        type: 8,
        vals: [13]
    }
    expect(uut.winners([a, b])).toEqual([0]);
    expect(uut.winners([b, a])).toEqual([1]);
    let c: uut.HandValue = {
        type: 8,
        vals: [14]
    }
    expect(uut.winners([a, b, c])).toEqual([0, 2]);

    a = {
        type: 7,
        vals: [10, 12]
    }

    expect(uut.winners([a,b])).toEqual([1])

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

    expect(uut.winners([a,b,c])).toEqual([2]);
})

function parseTestHand(s: string): uut.Hand {
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

function parseSortTestHand(s: string): uut.Hand {
    const hand = parseTestHand(s);
    hand.sort((a, b) => compareCards(b, a));
    return hand;
}

test("isFlush", () => {
    let a = parseSortTestHand("He 7   Ka 8   He 10   He B   He 3");
    expect(uut.isFlush(a)).toBeFalsy();
    a = parseSortTestHand("He 7   He 8   He 10   He B   He 3");
    expect(uut.isFlush(a)).toBeTruthy();
    a = parseSortTestHand("Kr 7   Kr 8   Kr 10   Kr B   Kr 3");
    expect(uut.isFlush(a)).toBeTruthy();
    a = parseSortTestHand("Ka 7   Kr 8   Kr 10   Kr B   Kr 3");
    expect(uut.isFlush(a)).toBeFalsy();
    a = parseSortTestHand("Pi 7   Pi 8   Pi 10   Pi B   Pi 3");
    expect(uut.isFlush(a)).toBeTruthy();
    a = parseSortTestHand("He 7   Ka 8   Ka 10   Ka B   Ka 3");
    expect(uut.isFlush(a)).toBeFalsy();
    a = parseSortTestHand("Kr 7   Ka 8   Ka 10   Ka B   Ka 3");
    expect(uut.isFlush(a)).toBeFalsy();
})

function checkStraight(handString: string, expectedStraight: boolean, expectedHighestCardValStr: string): void {
    console.log(handString);
    const hand = parseSortTestHand(handString);
    const [straight, highest] = uut.isStraight(hand);
    expect(straight).toBe(expectedStraight);

    if (expectedStraight) {
        let expectedHighest: number;
        let pos = 0;
        [expectedHighest, pos] = parseValue(expectedHighestCardValStr.toLowerCase(), pos);
        expect(highest).toBe(expectedHighest);
    }
}

test("isStraight", () => {
    checkStraight("he a  ka 2  pi 3  pi 4  pi 5", true, "5");
    checkStraight("ka 2  pi 3  pi 4  pi 5  he 6", true, "6");
    checkStraight("ka a  pi 3  pi 4  pi 5  he 6", false, "6");
    checkStraight("ka 2  pi 4  pi 4  pi 5  he 6", false, "6");
    checkStraight("ka 5  ka 6  ka 7  ka 8  ka 9", true, "9");
    checkStraight("pi a  he k  kr d  he 10  he b", true, "A");
})

function checkHandValue(handString: string, expectedType: number, expectedVals: number[]): void {
    console.log(handString);
    expect(uut.handValue(parseTestHand(handString))).toEqual(
        {
            type: expectedType,
            vals: expectedVals
        }
    )
}

test("handValue", () => {
    checkHandValue("he 10  he b  he d  he k  he a", 8, [14]);
    checkHandValue("ka a  ka 2  ka 3  ka 4  ka 5", 8, [5]);
    checkHandValue("pi 8  pi 9  pi 10  pi j  pi q", 8, [12]);
    checkHandValue("kr a  pi a  he a  ka a  ka 9", 7, [14, 9]);
    checkHandValue("ka 9  he 9  pi 9  kr 9  he a", 7, [9, 14]);
    checkHandValue("he a  pi a  kr a  he k  ka k", 6, [14, 13]);
    checkHandValue("kr 2  pi 2  he 2  ka 3 pi 3", 6, [2, 3]);
    checkHandValue("he a  he 3  he d  he 7  he 8", 5, [14, 12, 8, 7, 3]);
    checkHandValue("he 4  he 3  he d  he 7  he 8", 5, [12, 8, 7, 4, 3]);
    checkHandValue("he a  ka 2  pi 3  pi 4  pi 5", 4, [5]);
    checkHandValue("ka 2  pi 3  pi 4  pi 5  he 6", 4, [6]);
    checkHandValue("ka 5  ka 6  ka 7  ka 8  he 9", 4, [9]);
    checkHandValue("pi a  he k  kr d  he 10  he b", 4, [14]);
    checkHandValue("pi 5  he 5  ka 5  ka a  ka k", 3, [5, 14, 13]);
    checkHandValue("kr a  pi a  ka a  he 2  pi 3", 3, [14, 3, 2]);
    checkHandValue("kr b  pi 4  he 4  ka 4  kr 2", 3, [4, 11, 2]);
    checkHandValue("ka 4  pi 4  pi 5  he 5  kr 9", 2, [5, 4, 9]);
    checkHandValue("ka 4  pi 4  pi 3  he 3  kr 9", 2, [4, 3, 9]);
    checkHandValue("ka 4  pi 4  pi 3  he 3  kr 2", 2, [4, 3, 2]);
    checkHandValue("ka a  pi a  pi 3  he 3  kr 9", 2, [14, 3, 9]);
    checkHandValue("ka a  he a  pi 4  pi 3  pi 2", 1, [14, 4, 3, 2]);
    checkHandValue("ka a  pi K  he k  he d  he b", 1, [13, 14, 12, 11]);
    checkHandValue("ka a  pi k  he q  ka d  he 2", 1, [12, 14, 13, 2]);
    checkHandValue("ka a  pi k  pi d  kr 10  pi 10", 1, [10, 14, 13, 12]);
    checkHandValue("pi 3  pi 6  he 7  ka 9  he b", 0, [11, 9, 7, 6, 3]);
    checkHandValue("pi K  he 9  kr 8  kr 4  ka 3", 0, [13, 9, 8, 4, 3]);
})

test("handValueOrNull", () => {
    expect(uut.handValueOrNull(null)).toBeNull();
    expect(uut.handValueOrNull(parseTestHand("pi K  he 9  kr 8  kr 4  ka 3"))).toEqual({
        type: 0,
        vals: [13, 9, 8, 4, 3]
    });
})