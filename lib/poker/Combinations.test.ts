// Combinations.test.ts

import {rawCombinations, combinationsOf} from "./Combinations"

test("rawCombinations", () => {
    expect(rawCombinations(1, 1))
    .toEqual([[0]]);
    
    expect(rawCombinations(2, 1))
    .toEqual([[0], [1]]);

    expect(rawCombinations(3, 2))
    .toEqual([[0, 1], [0, 2], [1, 2]]);

    expect(rawCombinations(4, 2))
    .toEqual([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);

    console.log("5 aus 7: ", rawCombinations(7, 5));
    expect(rawCombinations(7, 5)).toHaveLength(7 * 6 / 2);
    
})

test("combinationsOf", () => {
    const l = ["a", "b", "c", "d"];
    console.log("combinationsOf(l, 2)=", combinationsOf(l, 2));
    
    expect(combinationsOf(l, 2))
    .toEqual([
        ["a", "b"], 
        ["a", "c"], 
        ["a", "d"],
        ["b", "c"],
        ["b", "d"],
        ["c", "d"]
    ])
})