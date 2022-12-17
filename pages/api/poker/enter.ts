import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb'
import {Db, WithId, Filter} from "mongodb"
import {Game, GameWithId, Player} from "../../../lib/poker/Game";

export default async function enter(
  req: NextApiRequest,
  res: NextApiResponse
) {

  console.log("in serverless function enter");

  interface TestPlayer {
    _id: string,
    chips: number
  }
  

  switch(req.method) {
    case "POST": {
      const client = await clientPromise;
      const db = client.db("myFirstDatabase");
      const games = db.collection<Game>("poker.games");
      const body = JSON.parse(req.body);
      const name: string = body.name;
      console.log("name=", name);

      db.collection<TestPlayer>("poker.players").insertOne({
        _id: name,
        chips: 0
      })
      .then(async insertResult => {
        console.log("insertResult.acknowledged: ", insertResult.acknowledged);
        const gameQuery: Filter<Game> = {
        }
  
        const updateResult = await games.updateOne(
          gameQuery,
          {
            $addToSet: { players: { name: name } }
          },
          {
            upsert: true
          }
        );
        if (!updateResult.acknowledged) {
          console.log("upsert(game) not acknowledged")
          return res.status(400).end(`Could not add player ${name}`);
        }
  
        const gameWithIdOrNull = await games.findOne(gameQuery);
        if (!gameWithIdOrNull) {
          return res.status(400).end("Game nicht gefunden nachdem es geaendert wurde?!");
        } else {
          const {_id, ...game} = gameWithIdOrNull;
          const result: GameWithId = {...game, id: gameWithIdOrNull._id.toHexString()};
          console.log("result: ", result);
  
          // // vorher:
          // res.json(result);
          // nun:
          res.send(result);
          res.end();
  
        }
        })
      .catch(error => {
        console.log("status 400 with duplicate name");
        
        res.status(400).end("Duplicate name");
        
      })
      
      break;
    }
    default: {
      res.status(400).end();
    }
  }
}