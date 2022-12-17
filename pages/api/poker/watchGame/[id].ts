import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../../lib/mongodb'
import {Db, WithId, Filter, ObjectId, ChangeStreamUpdateDocument} from "mongodb"
import {Game, Player} from "../../../../lib/poker/Game";

export default async function watchGame(
  req: NextApiRequest,
  res: NextApiResponse
) {

  console.log("watchGame");
  

  if (typeof req.query.id === "string") {
    const queryId: string = req.query.id;
    console.log("queryId: ", queryId);
    if (queryId == undefined) {
      console.log("leaving because queryId == null");
      
      return res.status(400).end();
    } else {
      console.log("not leaving because queryId != null");
      
    }
    
    const id: ObjectId = ObjectId.createFromHexString(queryId);
    

    switch (req.method) {

      case "GET": {
        const client = await clientPromise;
        const db = client.db("myFirstDatabase");
        const games = db.collection<Game>("poker.games");
        const pipeline = [{ $match: { _id: id }}];
        const watchStream = games.watch<Game, ChangeStreamUpdateDocument<Game>>(
          [],
          {
            fullDocument: "updateLookup"
          }
        ).on("change", change => {
          console.log("vor json: fullDocument=", change.fullDocument);
          if (change.fullDocument) {
            const result = {
              ...change.fullDocument,
              id: id
            }
            res.json(result);
            console.log("nach json before end: queryId=", queryId, ", change._id=", change._id);
            watchStream.close();
            
            res.end();
  
          } else {
            res.status(400).end();
          }
        })
      }
    }
  } else {
    res.status(400).end();
  }
}