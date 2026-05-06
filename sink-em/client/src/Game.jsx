import {useEffect, useRef, useState} from "react";
import { useNavigate } from 'react-router-dom'
import "./App.css";
import Grid from "./Grid.jsx";
import BoardWithAxes from "./axis.jsx"
import ShipPlacement from "./ShipPlacement.jsx";
import Header from "./Header.jsx";

function Game({ token, ws, displayName }) {
    const [placingGridVals, setPlacingGridVals] = useState(Array.from({length: 10}, () => Array(10).fill(null)));
    const [firingGridVals, setFiringGridVals] = useState(Array.from({length: 10}, () => Array(10).fill(null)));
    const [userMessage, setUserMessage] = useState('')
    const [isPlacing, setIsPlacing] = useState(true)
    const [firingCoords, setFiringCoords] = useState(false)
    const [isFiring, setIsFiring] = useState(false)
    const [isMyFireTurn, setIsMyFireTurn] = useState(false)
    const [timer, setTimer] = useState(30)
    const [isGameEnded, setIsGameEnded] = useState(false)

    let opponentDisplayName = useRef("Opponent")
    const [switchTurnsCooldown, setSwitchTurnsCooldown] = useState(false)
    const [personalSunkShips, setPersonalSunkShips] = useState([])
    const [oppSunkShips, setOppSunkShips] = useState([])

    const navigate = useNavigate()

    // track winner
    const [winner, setWinner] = useState("");

    // show header only when game in session
    // show header only during actual gameplay boards
    const showHeader =
    (isPlacing || isFiring) &&
    !!displayName &&
    !isGameEnded; // hide once game ends

    const updateSquareChoiceFiring = (x, y) => {
        if (!isMyFireTurn) {
          return
        }

        //check if square has already been guessed, if not, set
        if(firingGridVals[x][y] === 'H' || firingGridVals[x][y] === 'M') {
            return
        }
        else {
            setFiringCoords ({x, y})
        }
    };

    const submitFiringCoords = () => {
      if (!firingCoords){
        return
      }

      const {x, y} = firingCoords
      sendFiringSquare(x, y)
      setFiringCoords(null)

      setTimeout (() => {
        setIsMyFireTurn(false)
      }, 4000)
    }

    const sendFiringSquare = (x, y) => {
        ws.current.send(JSON.stringify({type: 'FiringGuess', payload: {GuessX: x, GuessY: y}}));
    }

    const forfeit = () => {
        ws.current.send(JSON.stringify({type: 'Forfeit'}));
    }

    const goHome = () => {
        try { ws.current?.close(); } catch {}
        ws.current = null;

        navigate('/home')
    };

    const killTimer = useRef(null)

    useEffect(() => {
        if (!ws.current) return

        ws.current.onmessage = async (msgSent) => {
            let msg;
            try {
            msg = JSON.parse(msgSent.data);
            } catch (e) {
            console.error("Invalid JSON:", msgSent);
            return;
            }

            console.log("received", msg)
            const { type, payload } = msg;

            console.log("msg type", type, payload)

            if (type === "StartPlacing") {
                    setUserMessage("Start placing")
                    opponentDisplayName.current = payload.OpponentDisplayName
                    //change game state
                    setIsWaitingForReady(false)
                    setIsPlacing(true)

            } else if (type === "Firing") {
                //update boards
                setFiringGridVals(payload.guessGrid)
                setPlacingGridVals(payload.placingGrid)

                //start the firing stage of the game!
                setIsPlacing(false)
                setIsFiring(true)

                //set sunk ships
                setPersonalSunkShips(payload.PersonalSunkShips)
                setOppSunkShips(payload.OppSunkShips)

                //check if current player's turn
                if (payload.YourTurn) {
                    //upon receiving the opponent's hit/miss update, show your personal board 
                    //for 5 seconds before moving to showing your firing board
                    if(payload.Result === 'H') {
                        setUserMessage(`${opponentDisplayName.current} hit your ship! 💥`)
                    }
                    else if(payload.Result === 'M') {
                        setUserMessage(`${opponentDisplayName.current} missed! 🌊`)
                    }
                    else if(payload.Result === "None") {
                        setUserMessage("Both players ready. Starting game soon...")
                    }
                    else if(payload.Result === "No Fire") {
                        setUserMessage(`${opponentDisplayName.current} did not make a guess in time, no shot fired.`)
                    }

                    //do firing functionality to get user's guess square coordinates
                    setTimeout(() => {
                        setUserMessage("It is your turn to fire. You have 30 seconds.")
                        setIsMyFireTurn(true)
                    }, 4000)

                    //after firing has completed, send coordinates of square back to the server
                } else {
                    //upon receiving your previous shot's hit/miss update, show your guess board
                    //for 5 seconds before moving to showing your personal board
                    if(payload.Result === 'H') {
                        if(payload.DidSink) {
                            setSwitchTurnsCooldown(true)
                            setUserMessage("You sunk a ship! ☠️")
                        }
                        else {
                            setSwitchTurnsCooldown(true)
                            setUserMessage("You hit a ship! 💥")
                        }
                    }
                    else if(payload.Result === 'M') {
                        setSwitchTurnsCooldown(true)
                        setUserMessage("You missed! 🌊")
                    }
                    else if(payload.Result === "None") {
                        setUserMessage("Both players ready. Starting game soon...")
                    }
                    else if(payload.Result === "No Fire") {
                        setUserMessage("You did not make a guess in time, no shot fired.")
                    }

                    setTimeout(() => {
                        //wait on other user to fire
                        setUserMessage(`Waiting for ${opponentDisplayName.current} to fire..`)
                        setIsMyFireTurn(false)
                        setSwitchTurnsCooldown(false)
                    }, 4000)
                }

            } else if (type === "End") {
                //game has ended, display winner
                console.log(payload.Winner)
                setUserMessage('')
                setWinner(payload.Winner)
                setIsMyFireTurn(false)
                setIsFiring(false)
                setIsGameEnded(true)
            } else {
                setUserMessage(type)
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket connection closed");
        };

        return () => {
            console.log("Cleaning up WS connection");
            ws.current?.close();
        };
    }, [])  

      useEffect(() => {
        if (isMyFireTurn) {
          setTimer (30)

          killTimer.current = setInterval(() => {
            setTimer (t => {
              if (t <= 0) {
                clearInterval(killTimer.current)
                setIsMyFireTurn(false)

                //send non-guess to server
                ws.current.send(JSON.stringify({type: 'FiringNonGuess', payload: "None"}));
                return 0
              }
              return t - 1
            })
          }, 1000)
        }
        return () => {
          if (killTimer.current) {
            clearInterval(killTimer.current)
            killTimer.current = null
          }
        }
      }, [isMyFireTurn])

      // show sunken ships to the rigth of board
      function SunkenShipsCard({ title, ships }) {
        return (
            <div className="card-empty w-56 p-3 text-sm">
            <h3 className="font-semibold mb-2">{title}</h3>
            {ships?.length ? (
                <ul className="list-disc list-inside space-y-1">
                {ships.map((s) => <li key={s}>{s}</li>)}
                </ul>
            ) : (
                <p className="text-gray-600">None yet</p>
            )}
            </div>
        );
        }

    return (
        <div className="page">
            {showHeader && (
            <Header
                title="Sink ’Em 🚢"
                displayName={displayName}
                opponentName={opponentDisplayName.current}
                userMessage={userMessage}
                timer={timer}
                isMyFireTurn={isMyFireTurn && !switchTurnsCooldown}
                onHome={goHome}
            />
            )}
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4">
            {!showHeader && (
                <div className="text-center">
                    <h1 className="h1">
                    <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                        Sink ’Em 🚢
                    </span>
                    </h1>
                    <p className="subtext">The Classic Naval Combat Game</p>
                    {/* {userMessage} */}
                </div>
            )}

            {/* Start placing ships */}
            {isPlacing ? (
                <div>
                    <ShipPlacement onDone={(board, ships) => {
                        // send the board colors/values to server as Placements
                        console.log("SENDING:", board, ships)
                        ws.current.send(JSON.stringify({type: 'Placed', payload: {Placements: board, Ships: ships}}));
                        setIsPlacing(false);
                        setUserMessage("Waiting...")
                    }} />
                </div>
            ) : ''}

            {/* your turn to fire */}
            {isFiring && isMyFireTurn && (
                <div className="mx-auto max-w-6xl px-4">
                    <div className="w-full text-center mb-4">
                        {!switchTurnsCooldown && <p>Time remaining ⏳: {timer}</p>}
                    </div>
                    <div className="flex flex-row items-start gap-8">
                    <button onClick={forfeit}>Forfeit</button>
                    {/* headings centered + board */}
                    <div className="flex-1">
                        <div className="text-center space-y-2">
                        <p className="h3">Your Targeting Grid:</p>
                        </div>

                        <div className="flex justify-center mt-2">
                        <BoardWithAxes>
                            <Grid
                            gridVals={firingGridVals}
                            handleSquareChoice={updateSquareChoiceFiring}
                            selected={firingCoords}
                            isForPlacing={false}
                            isFleetGrid={false}
                            />
                        </BoardWithAxes>
                        </div>

                        {!switchTurnsCooldown && (
                        <div className="flex justify-center mt-3">
                            <button className="btn" onClick={submitFiringCoords} disabled={!firingCoords}>
                            Submit Fire Location
                            </button>
                        </div>
                        )}
                    </div>

                    {/* stacked cards */}
                    <div className="flex flex-col gap-4 self-start mt-30">
                        <div className="card-empty w-56 p-3 text-sm">
                        <h3 className="font-semibold mb-2">Legend</h3>
                        <ul className="space-y-1">
                            <li>💥 = Hit</li>
                            <li>🌊 = Miss</li>
                        </ul>
                        </div>

                        {/* Ships you've sunk (against opponent) */}
                        <SunkenShipsCard title="Ships You've Sunk" ships={oppSunkShips} />
                    </div>
                </div>
            </div>
            )}

            {/* oppenents turn to fire */}
            {isFiring && !isMyFireTurn && (
                <div className="mx-auto max-w-6xl px-4">
                    <div className="flex flex-row items-start gap-8">
                    {/* LEFT: headings centered + board */}
                    <div className="flex-1">
                        <div className="text-center space-y-2">
                        <p className="h3">Your Fleet Grid:</p>
                        </div>

                        <div className="flex justify-center mt-2">
                        <BoardWithAxes>
                            <Grid
                            gridVals={placingGridVals}
                            handleSquareChoice={() => {}}
                            isForPlacing={false}
                            isFleetGrid={true}
                            />
                        </BoardWithAxes>
                        </div>
                    </div>

                    {/* stacked cards - legend and sunken ships*/}
                    <div className="flex flex-col gap-4 self-start mt-30">
                        <div className="card-empty w-56 p-3 text-sm">
                        <h3 className="font-semibold mb-2">Legend</h3>
                        <ul className="space-y-1">
                            <li>💥 = Hit</li>
                            <li>🌊 = Miss</li>
                        </ul>
                        </div>

                        {/* show your sunken ships */}
                        <SunkenShipsCard title="Your Sunken Ships" ships={personalSunkShips} />
                    </div>
                    </div>
                </div>
            )}
            
            {/* game over */}
            {isGameEnded ? (
                <div className="flex flex-col items-center space-y-4">
                    <h2 className="text-2xl font-bold">Game Over</h2>
                    <p className="text-lg">Winner: <strong>{winner}</strong></p>
                    <p> Game has ended</p>
                    <button className="btn" onClick={goHome}>Play again!</button>
                </div>
            ) : ''
            }
        </main>
    </div>
    );
}

export default Game;
