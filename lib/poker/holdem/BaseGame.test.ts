// BaseGame.test.ts

import * as uut from "./BaseGame"
import {createTestPlayers} from "./TestPlayers"
import * as BetRound from "./BetRound"

test("create normal", () => {
    const sb = 1;
    const players = createTestPlayers(4, 10);
    const g = uut.create(sb, players);
    console.log("created game", g);

    expect(g).toEqual({
        state: "betRound",
        smallBlind: sb,
        players: players,
        betRound: BetRound.create(sb, players),
        board: [],
        pots: []
    })

})

test("create all all-in by blinds", () => {
    const sb = 1;
    const players = createTestPlayers(2, 1);
    const g = uut.create(sb, players);
    console.log("created game", g);
    expect(g).toEqual({
        state: "remainingCards",
        smallBlind: sb,
        players: players,
        betRound: null,
        board: [],
        pots: [{
            players: [0, 1],
            chips: 2
        }]
    })
    
})

test("fold leads to continuing bet round", () => {
    const sb = 1;
    const players = createTestPlayers(3, 10);
    let g: uut.BaseGame<number> = uut.create(sb, players);
    let res: (uut.GameResult<number>|null) = uut.fold(g);
    expect(res).toBeNull();

    expect(g).toEqual({
        state: "betRound",
        smallBlind: sb,
        players: players,
        betRound: {
            smallBlind: sb,
            players: players,
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
            lastRaise: sb * 2,
            maxBet: sb * 2,
            active: 0,
            foldChips: [0],
            sidePots: [],
            chipsFromLastRound: 0,
            finished: false
        },
        board: [],
        pots: []
    });
})

test.only("fold leads to flop, check leads to turn, call leads to river, check leads to show-down", () => {
    // 3 Spieler, Dealer raised auf 2bb, small blind callt, big blind foldet.

    const sb = 1;
    const players = createTestPlayers(3, 10);
    const g = uut.create(sb, players);
    let res: uut.GameResult<number>|null = uut.raise(g, 4);
    expect(res).toBeNull();
    res = uut.call(g);
    expect(res).toBeNull();
    res = uut.fold(g);
    expect(res).toBeNull();

    expect(g).toEqual({
        state: "flop",
        smallBlind: sb,
        players: [
            {
                seat: 0,
                chips: 6,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 6,
                blind: "none"
            }
        ],
        betRound: null,
        board: [],
        pots: [
            {
                players: [0, 2],
                chips: 10
            }
        ]
    });

    uut.flop(g, [0, 1, 2]);

    expect(g.state).toBe("betRound");
    res = uut.check(g);
    expect(res).toBeNull();
    res = uut.check(g);
    expect(res).toBeNull();
    expect(g).toEqual({
        state: "turn",
        smallBlind: sb,
        players: [
            {
                seat: 0,
                chips: 6,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 6,
                blind: "none"
            }
        ],
        betRound: null,
        board: [0, 1, 2],
        pots: [
            {
                players: [0, 2],
                chips: 10
            }
        ]
    })

    uut.turn(g, 3);
    expect(g.state).toBe("betRound");

    res = uut.raise(g, 2);
    expect(res).toBeNull();

    res = uut.call(g);
    expect(res).toBeNull();
    expect(g).toEqual({
        state: "river",
        smallBlind: sb,
        players: [
            {
                seat: 0,
                chips: 4,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 4,
                blind: "none"
            }
        ],
        betRound: null,
        board: [0, 1, 2, 3],
        pots: [
            {
                players: [0, 2],
                chips: 14
            }
        ]
    })

    uut.river(g, 4);
    expect(g.state).toBe("betRound");

    res = uut.check(g);
    expect(res).toBeNull();

    res = uut.check(g);
    expect(res).toBeNull();
    expect(g).toEqual({
        state: "showdown",
        smallBlind: sb,
        players: [
            {
                seat: 0,
                chips: 4,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 4,
                blind: "none"
            }
        ],
        betRound: null,
        board: [0, 1, 2, 3, 4],
        pots: [
            {
                players: [0, 2],
                chips: 14
            }
        ]
    })

    // res = uut.showdown(g, [[10, 11], null, [14, 15]]);
    res = uut.showdown(g, [[10, 11], null, [7, 6]]);
    console.log("res of showdown: ", res);
    console.log("res.potWinners: ", res.potWinners);
    
    
    expect(res).toEqual({
        players: [
            {
                seat: 0,
                chips: 4,
                blind: "small"
            },
            {
                seat: 1,
                chips: 8,
                blind: "big"
            },
            {
                seat: 2,
                chips: 4,
                blind: "none"
            }
        ],
        potWinners: [
            {
                players: [0, 2],
                chipsPerWinner: (6 * 2 + 2) / 2
            }
        ]
    })

})