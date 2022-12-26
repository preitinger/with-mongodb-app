// TestPlayers.ts

import * as BetRound from "./BetRound"

export function createTestPlayers(n: number, chips?: number):BetRound.Player<number>[] {
    if (chips === undefined) {
        chips = 10;
    }
    const a:BetRound.Player<number>[] = []
    for (let i = 0; i < n; ++i) {
        a.push({
            seat: i,
            chips: chips,
            blind: (
                n === 2 ?
                (
                    i === 0 ? "big" : "small"
                )
                :
                (
                    i === 0 ? "small" : i === 1 ? "big" : "none"
                )
            )
        })
    }
    return a;
}
