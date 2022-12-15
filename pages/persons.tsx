import React from 'react'
import {useState} from 'react'
import Link from "next/link"
import {Person, PersonWithId} from "../lib/Person"

// server only:
import clientPromise from '../lib/mongodb'
import { InferGetServerSidePropsType } from 'next'
import {Db, WithId} from "mongodb"


export async function getServerSideProps(context:any): Promise<{props: {persons: Array<PersonWithId>|null}}> {
    try {

        const client = await clientPromise;
        
        const db = client.db("myFirstDatabase");
        const persons = db.collection<Person>("persons");
        const personList:Array<PersonWithId> = [];
        console.log("vor persons.find()...");
        await persons.find().limit(20)
        .forEach(person => {
            const entries = Object.entries(person);
            console.log("entriers: ", entries)
            const {_id, ...personCopy} = person;


            personList.push({
                ...personCopy,
                id: _id.toJSON()
            });
            console.log("pushed", person.name)
        });
        console.log("personList: ", personList)
        return {
            props: {
                persons: personList
            }
        }

    } catch (e) {
        console.error(e)
        return {
            props: {
                persons: null
            }
        };
    }
}
 
export default function Persons({persons}: InferGetServerSidePropsType<typeof getServerSideProps>)  {

    const [newName, setNewName] = useState<string>("");
    const [newPhone, setNewPhone] = useState<string>("")

    const onNameChange = (event:React.ChangeEvent<HTMLInputElement>) => {
        setNewName(event.currentTarget.value);
    }

    const onPhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPhone(event.currentTarget.value);
    }

    const onSubmit = async (event:React.MouseEvent) => {
        event.preventDefault();
        const person = {
            name: newName,
            phone: newPhone
        }
        fetch("/api/addPerson",
        {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(person)
        }
        )
        .then(res => res.json())
        .then(data => {
            console.log("onSubmit: dat", data);

        })
    }

    console.log("persons", persons);

    return (
        <div>
            <h1>Persons</h1>
            {
                persons?.map(p => (
                    <p key={p.id}>{p.name} - {p.phone} [{p.id}]</p>
                ))
            }
            <p>Bla bla...</p>
            <form>
                <label>
                    Name
                    <input type="text" id="name" name="name" value={newName} onChange={onNameChange}/>
                </label>
                <label>
                    Phone
                    <input type="text" id="phone" name="phone" value={newPhone} onChange={onPhoneChange}/>
                </label>
                <button type="submit" onClick={onSubmit}>Neue Person hinzufügen</button>
            </form>
            <Link href="/page2">page2</Link>
        </div>
    )
}