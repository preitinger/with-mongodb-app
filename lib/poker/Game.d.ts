export type Player = {
  name: string
}

export type Game = {
  players: Array<Player>
}

export type GameWithId = Game & {
  id: string
}

export type GameWithIdOrNull = GameWithId | null;


// export interface Game {
//   players: Array<Player>
// }

