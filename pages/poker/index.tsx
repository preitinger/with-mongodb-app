import React, {ChangeEvent} from "react";
import {useState, useEffect} from "react";
import Types from "../../lib/poker/Game";

type PlayerProps = {
  player: Types.Player;
}

const Player:  React.FunctionComponent<{ player: Types.Player, className: string}> = 
({player, className}) => {

  return (
    <div className={className ? "player " + className : "player"}>
      {player.name}
    </div>
  )
}

const PokerHome: React.FunctionComponent<any> = () => {
  const [game, setGame] = useState<Types.GameWithIdOrNull>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (game) {
      const hasCanceled = {
        canceled: false
      }
      console.log("vor fetch watchGame: game.id=", game.id);
      
      fetch(`/api/poker/watchGame/${game.id}`, {
        method: "GET"
      })
      .then(res => {
        if (hasCanceled.canceled) return;
        if (res.ok) {
          res.json()
          .then(newGame => {
            setGame(newGame);
          })
        }
      })
      
      return (() => {
        hasCanceled.canceled = true;
      })
    }
  }, [game])
  
  const ownPos = (): number|null => {
    if (game) {
      const game1: Types.GameWithId = game;
      const index: number = game1.players.findIndex(player => player.name === name);
      return index === -1 ? null : index;
    } else {
      return null;
    }
  }  

  const nameChange = (event: ChangeEvent<HTMLInputElement>):void => {
    const newName = event.currentTarget.value;
    console.log("nameChange: newName=", newName);
    
    if (newName != null) {
      setName(newName);
    }
  }

  const onSubmit: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    fetch("/api/poker/enter", {
      method: "POST",
      body: JSON.stringify({name: name})
    })
    .then(res => {
      if (!res.ok) {
        console.error("Fehler: status=", res.status);
        throw Error("Fehler");
      } else {
        console.log("kein Fehler")
        return res;
      }
      
    })
    .then(res => res.json())
    .catch(() => {
      console.log("caught error");
      window.alert("Name schon  vergeben!");
      return null;
    })
    .then(data => {
      console.log("nach enter: game=", game);
      setGame(data);
    })
    
  }

  const gameList = [];

  if (game) {
    const game1: Types.GameWithId = game;
    gameList.push(...game1.players.map(p => <Player key={p.name} player={p} className={p.name === name ? "ownPlayer" : ""}/>))
  }

  console.log("render poker index");

  return (
    
    <React.StrictMode>
    <div>
      <h1>Poker</h1>
      <h3>Spieler</h3>
      <div>
        {gameList}
      </div>
      {
        !game ?
        <form>
          <label>Name <input type="text" value={name} onChange={nameChange}/></label>
          <button type="submit" onClick={onSubmit}>Enter</button>
        </form>
        : null
      }
    </div>
    </React.StrictMode>
  )
}

export default PokerHome;
