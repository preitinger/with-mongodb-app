import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb'
import {Db, WithId} from "mongodb"
import {Person, PersonWithId} from "../../lib/Person"

export default async function addPerson(
  req: NextApiRequest,
  res: NextApiResponse,
) {
    // pages/api/[name].ts -> /api/lee
    // req.query.name -> "lee"

    console.log("req.method", req.method);

    const client = await clientPromise;
    const db: Db = client.db("myFirstDatabase");
    const persons = db.collection<Person>("persons");

    switch(req.method) {
        case "POST": {
            const person: Person = req.body;
            if (person.name === "" || person.phone === "") {
                return res.status(400).end();
            }
            const insertRes = await persons.insertOne(person);
            if (insertRes.acknowledged) {
                console.log("acknowledged");
                console.log("insertedId: ", insertRes.insertedId);
            }
        
            const returnVal: PersonWithId = {
                ...person,
                id: insertRes.insertedId.toJSON()
            }
        
            console.log("body", req.body);
            return res.json({body: returnVal});
        }
        case "GET": {
            const personList:Array<WithId<Person>> = [];
            await persons.find().limit(20)
            .forEach(person => {
                personList.push(person);
            })
            return res.json(personList);
            break;
        }
    }

}
