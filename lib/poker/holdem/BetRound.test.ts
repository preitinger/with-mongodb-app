import { queryAllByRole, render, screen, within, act, fireEvent } from '@testing-library/react';
// import {act, Simulate} from 'react-dom/test-utils'; // ES6
// import ReactTestUtils from 'react-dom/test-utils'; // ES6
import userEvent from '@testing-library/user-event'
import {/*isInaccessable,*/ logRoles} from '@testing-library/dom'
import { notDeepEqual } from "assert";
import * as BetRound from "./BetRound"
import {createTestPlayers} from "./TestPlayers"


test("create heads-up", () => {
    const b = BetRound.create(1, createTestPlayers(2));
    console.log("b: ", b);
    
    expect(b).toEqual({
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 10 - 2,
                blind: "big"
            },
            {
                seat: 1,
                chips: 10 - 1,
                blind: "small"
            }
        ],
        remaining: 2,
        betters: [
            {player: 0, chips: 2, allIn: false}, 
            {player: 1, chips: 1, allIn: false}
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 1,
        foldChips: [],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: false
    })
})

test("create 3 players", () => {
    const b = BetRound.create(1, createTestPlayers(3));
    expect(b).toEqual({
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 10 - 1,
                blind: "small"
            },
            {
                seat: 1,
                chips: 10 - 2,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ],
        remaining: 3,
        betters: [
            {player: 0, chips: 1, allIn: false},
            {player: 1, chips: 2, allIn: false},
            {player: 2, chips: 0, allIn: false}
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 2,
        foldChips: [],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: false
    })
})

test("fold heads-up", () => {
    const b = BetRound.create(1, createTestPlayers(2));
    const res = BetRound.fold(b);
    expect(b).toEqual({
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 10 - 2,
                blind: "big"
            },
            {
                seat: 1,
                chips: 10 - 1,
                blind: "small"
            }
        ],
        remaining: 0,

        betters: [
            {
                player: 0,
                chips: 2,
                allIn: false
            }
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 0,
        foldChips: [1],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: true
    })

    expect(res).not.toBeNull();
    if (res) {
        expect(res[0]).toBe(b.players);
        expect(res[1]).toEqual([
            {
                players: [0],
                chips: 3
            }
        ])
    }
})

test("fold 3 players", () => {
    const b = BetRound.create(1, createTestPlayers(3));
    expect(b).toHaveProperty("active", 2);
    const res = BetRound.fold(b);
    expect(b).toEqual({
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 9,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ],
        remaining: 2,
        betters: [
            {
                player: 0,
                chips: 1,
                allIn: false
            },
            {
                player: 1,
                chips: 2,
                allIn: false
            }
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 0,
        foldChips: [0],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: false
    })
})

test("fold 4 players", () => {
    const b = BetRound.create(1, createTestPlayers(4));
    expect(b).toEqual( {
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 9,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            },
            {
                seat: 3,
                chips: 10,
                blind: "none"
            }
        ],
        remaining: 4,
        betters: [
            {
                player: 0,
                chips: 1,
                allIn: false
            },
            {
                player: 1,
                chips: 2,
                allIn: false
            },
            {
                player: 2,
                chips: 0,
                allIn: false
            },
            {
                player: 3,
                chips: 0,
                allIn: false
            }
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 2,
        foldChips: [],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: false
    })
    const res = BetRound.fold(b);
    expect(b).toEqual( {
        smallBlind: 1,
        players: [
            {
                seat: 0,
                chips: 9,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            },
            {
                seat: 3,
                chips: 10,
                blind: "none"
            }
        ],
        remaining: 3,
        betters: [
            {
                player: 0,
                chips: 1,
                allIn: false
            },
            {
                player: 1,
                chips: 2,
                allIn: false
            },
            {
                player: 3,
                chips: 0,
                allIn: false
            }
        ],
        lastRaise: 2,
        maxBet: 2,
        active: 2,
        foldChips: [0],
        sidePots: [],
        chipsFromLastRound: 0,
        finished: false
    })
    expect(res).toBeNull();
})

test("all-in small blind", () => {
    for (let sbChips = 1; sbChips <= 2; ++sbChips) {
        const testPlayers: BetRound.Player<number>[] = [
            {
                seat: 0,
                chips: sbChips,
                blind: "small"
            },
            {
                seat: 1,
                chips: 10,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ]
        const b = BetRound.create(2, testPlayers);
        {
            const betterSb = b.betters[0];
            expect(betterSb.allIn).toBeTruthy();
            expect(betterSb.chips).toBe(sbChips);
            const playerSb = b.players[0];
            expect(playerSb.chips).toBe(0);
            const betterBb = b.betters[1];
            expect(betterBb.allIn).toBeFalsy;
            expect(betterBb.chips).toBe(4);
            expect(b.active).toBe(2);
            expect(b.remaining).toBe(3);
            expect(b.betters.length).toBe(3);
        }
        
        console.log("vor call 1");
        let res: (BetRound.BetRoundResult<number>|null) = BetRound.call(b);

        expect(b.active).toBe(1); // da 0 schon all-in ist
        expect(b.remaining).toBe(1);
        expect(res).toBeNull();

        console.log("vor call 2");
        res = BetRound.call(b);
        expect(res).toEqual([
            [ // players
                {
                    seat: 0,
                    chips: 0,
                    blind: "small"
                }
                ,
                {
                    seat: 1,
                    chips: 6,
                    blind: "big"
                }
                ,
                {
                    seat: 2,
                    chips: 6,
                    blind: "none"
                }
    
            ],
            [ // pots
                { // side pot
                    players: [0, 1, 2],
                    chips: sbChips * 3
                },
                { // main pot
                    players: [1, 2],
                    chips: (4-sbChips) * 2
                },
            ]
        ])
    }

})

test("all-in big blind", () => {
    for (let bbChips = 1; bbChips < 4; ++bbChips) {
        const testPlayers: BetRound.Player<number>[] = [
            {
                seat: 0,
                chips: 10,
                blind: "small"
            },
            {
                seat: 1,
                chips: bbChips,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ]
        const b = BetRound.create(2, testPlayers);
        {
            const betterSb = b.betters[0];
            expect(betterSb.allIn).toBeFalsy();
            expect(betterSb.chips).toBe(2);
            const playerSb = b.players[0];
            expect(playerSb.chips).toBe(8);
            const betterBb = b.betters[1];
            expect(betterBb.allIn).toBeTruthy();
            expect(betterBb.chips).toBe(bbChips);
            expect(b.active).toBe(2);
            expect(b.remaining).toBe(3);
            expect(b.betters.length).toBe(3);
        }
        
        console.log("vor call 1");
        let res: (BetRound.BetRoundResult<number>|null) = BetRound.call(b);

        expect(b.active).toBe(0); // da 0 schon all-in ist
        expect(b.remaining).toBe(2);
        expect(res).toBeNull();

        console.log("vor call 2");
        res = BetRound.call(b);
        expect(b.active).toBe(2); // da 1 all-in ist
        expect(res).toEqual([
            [ // players
                {
                    seat: 0,
                    chips: 6,
                    blind: "small"
                }
                ,
                {
                    seat: 1,
                    chips: 0,
                    blind: "big"
                }
                ,
                {
                    seat: 2,
                    chips: 6,
                    blind: "none"
                }
    
            ],
            [ // pots
                { // side pot
                    players: [0, 1, 2],
                    chips: bbChips * 3
                },
                { // main pot
                    players: [0, 2],
                    chips: (4-bbChips) * 2
                },
            ]
        ])
    }

    {
        const bbChips = 4;

        const testPlayers: BetRound.Player<number>[] = [
            {
                seat: 0,
                chips: 10,
                blind: "small"
            },
            {
                seat: 1,
                chips: bbChips,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ]
        const b = BetRound.create(2, testPlayers);
        {
            const betterSb = b.betters[0];
            expect(betterSb.allIn).toBeFalsy();
            expect(betterSb.chips).toBe(2);
            const playerSb = b.players[0];
            expect(playerSb.chips).toBe(8);
            const betterBb = b.betters[1];
            expect(betterBb.allIn).toBeTruthy();
            expect(betterBb.chips).toBe(bbChips);
            expect(b.active).toBe(2);
            expect(b.remaining).toBe(3);
            expect(b.betters.length).toBe(3);
        }
        
        console.log("vor call 1");
        let res: (BetRound.BetRoundResult<number>|null) = BetRound.call(b);

        expect(b.active).toBe(0); // da 0 schon all-in ist
        expect(b.remaining).toBe(2);
        expect(res).toBeNull();

        console.log("vor call 2");
        res = BetRound.call(b);
        expect(b.active).toBe(2); // da 1 all-in ist
        console.log("side pots: ", b.sidePots);
        
        expect(res).toEqual([
            [ // players
                {
                    seat: 0,
                    chips: 6,
                    blind: "small"
                }
                ,
                {
                    seat: 1,
                    chips: 0,
                    blind: "big"
                }
                ,
                {
                    seat: 2,
                    chips: 6,
                    blind: "none"
                }
    
            ],
            [ // pots
                { // kein side pot, sondern nur main pot, da zwar all-in aber nicht zu wenig, sondern "genau passendes bet"
                    players: [0, 1, 2],
                    chips: bbChips * 3
                }
            ]
        ])

    }
})

test("dealer raises", () => {
    const b = BetRound.create(1, createTestPlayers(3));
    let res = BetRound.raise(b, 5);
    expect(res).toBeNull();
    res = BetRound.call(b);
    expect(res).toBeNull();
    res = BetRound.call(b);
    console.log("res nach last call: ", res);
    
    expect(res).toEqual(
        [
            [
                {
                    seat: 0,
                    chips: 5,
                    blind: "small"
                }
                ,
                {
                    seat: 1,
                    chips: 5,
                    blind: "big"
                }
                ,
                {
                    seat: 2,
                    chips: 5,
                    blind: "none"
                }

            ],
            [ // pots
                { // kein side pot, sondern nur main pot, da zwar all-in aber nicht zu wenig, sondern "genau passendes bet"
                    players: [0, 1, 2],
                    chips: 5 * 3
                }
            ]
        ]
    );


})

test("small blind raises", () => {
    const b = BetRound.create(1, createTestPlayers(3));
    let res = BetRound.call(b); // dealer calls paying 2
    expect(res).toBeNull();
    res = BetRound.raise(b, 4); // small blind raises from 2 to 4, paying 3 more
    expect(res).toBeNull();
    res = BetRound.call(b); // big blind calls to 4 paying 2 more
    expect(res).toBeNull();
    res = BetRound.call(b); // dealer calls to 4 paying 2 more
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 6,
                blind: "small"
            },
            {
                seat: 1,
                chips: 6,
                blind: "big"
            },
            {
                seat: 2,
                chips: 6,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 1, 2],
                chips: 4 * 3
            }
        ]
    ])
})

test("big blind raises", () => {
    const b = BetRound.create(1, createTestPlayers(3));
    let res = BetRound.call(b); // dealer calls paying 2
    expect(res).toBeNull();
    res = BetRound.call(b); // small blind calls paying 1
    expect(res).toBeNull();
    res = BetRound.raise(b, 4); // big blind raises from 2 to 4, paying 2
    expect(res).toBeNull();
    res = BetRound.call(b); // dealer calls to 4 paying 2 more
    expect(res).toBeNull();
    res = BetRound.call(b); // small blind calls to 4 paying 2 more
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 6,
                blind: "small"
            },
            {
                seat: 1,
                chips: 6,
                blind: "big"
            },
            {
                seat: 2,
                chips: 6,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 1, 2],
                chips: 4 * 3
            }
        ]
    ])
})

test("5 re-raises, 2 calls", () => {
    const b = BetRound.create(1, createTestPlayers(3, 100));
    let res = BetRound.call(b); // dealer calls paying 2
    expect(res).toBeNull();
    res = BetRound.call(b); // small blind calls paying 1
    expect(res).toBeNull();
    res = BetRound.raise(b, 4); // big blind raises from 2 to 4, paying 2
    expect(res).toBeNull();
    res = BetRound.raise(b, 6); // dealer raises from 2 to 6
    expect(res).toBeNull();
    res = BetRound.raise(b, 8); // smallblind
    expect(res).toBeNull();
    res = BetRound.raise(b, 10); // big blind
    expect(res).toBeNull();
    res = BetRound.raise(b, 12); // dealer
    expect(res).toBeNull();
    console.log(b);
    res = BetRound.call(b); // small blind calls paying 1
    expect(res).toBeNull();
    expect(b.finished).toBeFalsy();
    res = BetRound.call(b); // small blind calls paying 1
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 100 - 12,
                blind: "small"
            },
            {
                seat: 1,
                chips: 100 - 12,
                blind: "big"
            },
            {
                seat: 2,
                chips: 100 - 12,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 1, 2],
                chips: 12 * 3
            }
        ]
    ]);
    expect(b.finished).toBeTruthy();
    

})

test("4 raises, 1 call, 1 fold", () => {
    const b = BetRound.create(1, createTestPlayers(3, 100));
    let bet = 2;
    let res: BetRound.BetRoundResult<number>|null;
    
    for (let i = 0; i < 4; ++i) {
        res = BetRound.raise(b, bet += 2);
        expect(res).toBeNull();
        expect(b.finished).toBeFalsy();
    }

    console.log("last bet: ", bet);
    console.log("betters", b.betters)
    

    res = BetRound.call(b); // sb
    expect(res).toBeNull();
    expect(b.finished).toBeFalsy();

    res = BetRound.fold(b); // bb
    expect(b.finished).toBeTruthy();
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 100 - bet,
                blind: "small"
            },
            {
                seat: 1,
                chips: 100 - (bet - 2), // hat letzten raise nicht mehr mit gemacht
                blind: "big"
            },
            {
                seat: 2,
                chips: 100 - bet,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 2],
                chips: bet * 3 - 2
            }
        ]
    ])
})

test("5 players with [100, 50, 90, 10, 80] chips; fold, call, all-in, all-in, fold, call", () => {
    const testPlayers = createTestPlayers(5);
    [100, 50, 90, 10, 80].forEach((chips, i) => {
        testPlayers[i].chips = chips;
    })
    const b = BetRound.create(1, testPlayers);
    expect(b.active).toBe(2);
    
    let res = BetRound.fold(b); // 2
    expect(res).toBeNull();
    expect(b.active).toBe(2);

    res = BetRound.call(b); // 3
    expect(res).toBeNull();
    expect(b.active).toBe(3);

    res = BetRound.raise(b, 80); // 4
    expect(res).toBeNull();
    expect(b.active).toBe(0);

    res = BetRound.raise(b, 100); // 0
    expect(res).toBeNull();
    expect(b.active).toBe(1);

    res = BetRound.fold(b); // 1
    expect(res).toBeNull();

    res = BetRound.call(b); // 1
    console.log("b.active", b.active, "active player", b.players[b.betters[b.active].player]);
    console.log("betters", b.betters);
    
    
    expect(b.remaining).toBe(0);
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 0,
                blind: "small"
            },
            {
                seat: 1,
                chips: 48,
                blind: "big"
            },
            {
                seat: 2,
                chips: 90,
                blind: "none"
            },
            {
                seat: 3,
                chips: 0,
                blind: "none"
            },
            {
                seat: 4,
                chips: 0,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 3, 4],
                chips: 10+2+0+10+10
            },
            {
                players: [0, 4],
                chips: 70+70
            },
            {
                players: [0],
                chips: 20
            }
        ]
    ])


})

test("alle von anfang an all-in schon wegen der blinds", () => {
    const b = BetRound.create(1, createTestPlayers(2, 1));
    const res = BetRound.finishMove(b, false);
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 0,
                blind: "big"
            },
            {
                seat: 1,
                chips: 0,
                blind: "small"
            }
        ],
        [
            {
                players: [0, 1],
                chips: 2
            }
        ]
    ])
    console.log("bet round zu beginn: ", b);
    
})

test("alle raisen bzw. callen zum all-in mit exakt gleicher chip-zahl", () => {
    const b = BetRound.create(1, createTestPlayers(5, 10));
    
    let res = BetRound.raise(b, 10);
    expect(res).toBeNull();

    for (let i = 0; i < 3; ++i) {
        res = BetRound.call(b);
        expect(res).toBeNull();
    }

    res = BetRound.call(b);
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 0,
                blind: "small"
            },
            {
                seat: 1,
                chips: 0,
                blind: "big"
            },
            {
                seat: 2,
                chips: 0,
                blind: "none"
            },
            {
                seat: 3,
                chips: 0,
                blind: "none"
            },
            {
                seat: 4,
                chips: 0,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 1, 2, 3, 4],
                chips: 10 * 5
            }
        ]
    ])

})

test("heads-up call check", () => {
    const b = BetRound.create(1, createTestPlayers(2, 10));
    let res: BetRound.BetRoundResult<number>|null = BetRound.call(b);
    expect(res).toBeNull();
    res = BetRound.check(b);
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 8,
                blind: "big"
            },
            {
                seat: 1,
                chips: 8,
                blind: "small"
            }
        ],
        [
            {
                players: [0, 1],
                chips: 4
            }
        ]
    ])

})

test("following round, all check", () => {
    const players: BetRound.Player<number>[] = [
        {
            seat: 0,
            chips: 10,
            blind: "small"
        },
        {
            seat: 1,
            chips: 10,
            blind: "big"
        },
        {
            seat: 2,
            chips: 10,
            blind: "none"
        }
    ];
    const lastPot: BetRound.Pot = {
        players: [0, 1, 2],
        chips: 30
    }
    const b = BetRound.createFollowing(1, players, lastPot);
    
    let res = BetRound.check(b);
    expect(res).toBeNull();

    res = BetRound.check(b);
    expect(res).toBeNull();

    res = BetRound.check(b);
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 10,
                blind: "small"
            },
            {
                seat: 1,
                chips: 10,
                blind: "big"
            },
            {
                seat: 2,
                chips: 10,
                blind: "none"
            }
        ],
        [
            {
                players: [0, 1, 2],
                chips: 30
            }
        ]
    ])

})

test("following round, check, all-in raise, all-in call, fold", () => {
    const testPlayers = createTestPlayers(3);
    testPlayers[0].chips = 10;
    testPlayers[1].chips = 12;
    testPlayers[2].chips = 8;
    const lastPot = {
        players: [0, 1, 2],
        chips: 6
    }
    const b = BetRound.createFollowing(1, testPlayers, lastPot);
    expect(b.chipsFromLastRound).toBe(6);
    expect(b.active).toBe(0);
    
    let res = BetRound.check(b);
    expect(res).toBeNull();
    expect(b.active).toBe(1);

    res = BetRound.raise(b, 12);
    expect(res).toBeNull();
    expect(b.active).toBe(2);
    expect(b.betters[0].allIn).toBeFalsy();
    expect(b.betters[1].allIn).toBeTruthy();
    expect(b.betters[2].allIn).toBeFalsy();

    res = BetRound.call(b);
    expect(b.active).toBe(0);
    expect(b.betters[0].allIn).toBeFalsy();
    expect(b.betters[1].allIn).toBeTruthy();
    expect(b.betters[2].allIn).toBeTruthy();

    res = BetRound.fold(b);
    expect(b.finished).toBeTruthy();
    expect(res).toEqual([
        [
            {
                seat: 0,
                chips: 10,
                blind: "small"
            },
            {
                seat: 1,
                chips: 0,
                blind: "big"
            },
            {
                seat: 2,
                chips: 0,
                blind: "none"
            }
        ],
        [
            {
                players: [1, 2],
                chips: 6 + 8 * 2
            },
            {
                players: [1],
                chips: 4
            }
        ]
    ])

})