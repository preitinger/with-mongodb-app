// Card.test.ts

import {Card, parse, format} from "./Card"

test("charPointAt", () => {
    const s = "0123456789";

    for (let i = 0; i < s.length; ++i) {
        console.log(`charCodeAt[${i}]=${s.charCodeAt(i)}`);
        
    }
})

test("parse", () => {
    const s = "He A   Kr B   He 7  Pi 2   Kr 10   Kr A   Pi K  Pi B Pi D"
    .toLowerCase();
    let pos = 0;
    let card: Card;
    [card, pos] = parse(s, pos);
    expect(card).toBe(2 * 13 + 12);
    [card, pos] = parse(s, pos);
    expect(card).toBe(0*13 + 9);

    [card, pos] = parse(s, pos);
    expect(card).toBe(2*13+5);

    [card, pos] = parse(s, pos);
    expect(card).toBe(1*13+0);

    [card, pos] = parse(s, pos);
    expect(card).toBe(0*13+8);

    [card, pos] = parse(s, pos);
    expect(card).toBe(0*13+12);

    [card, pos] = parse(s, pos);
    expect(card).toBe(1*13+11);

    [card, pos] = parse(s, pos);
    expect(card).toBe(1*13+9);

    [card, pos] = parse(s, pos);
    expect(card).toBe(1*13+10);
})

test("format and parse", () => {
    for (let i = 0; i < 52; ++i) {
        const c: Card = i;
        console.log("c", c);
        
        const cardText = format(c).toLocaleLowerCase();
        console.log("cardText", cardText);
        
        let pos = 0;
        let parsedCard: Card;
        [parsedCard, pos] = parse(cardText, pos);
        expect(parsedCard).toBe(c);
    }
})