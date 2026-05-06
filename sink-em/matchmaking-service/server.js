import express from 'express'
import expressWs from 'express-ws'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import {MongoClient, ObjectId, ServerApiVersion} from 'mongodb'
import dotenv from 'dotenv'

dotenv.config({quiet: true})
const user = process.env.DB_USER
const pass = process.env.DB_PASSWORD
const url = process.env.DB_URL
if (!user || !pass || !url) {
    console.log("Environment variables not set up correctly. Please place .env file with\n" +
        "credentials inside sink-em folder or paste contents into Render environment\n" +
        "variables if deploying (download link is in Slack).")
    process.exit(1)
}

const uri = `mongodb+srv://${user}:${pass}@${url}/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1, strict: true, deprecationErrors: true,
    }
});
const gameData = client.db("webware-sink-em").collection("games")
const waitingData = client.db("webware-sink-em").collection("waitingUsers")

const clients = new Map();

const app = express()
const server = createServer(app)
expressWs(app, server)
app.use(express.json());

class Game {
    constructor(nextPlayerID, players, isGameWaiting, isPlacingShips, isFiring, isEnd, winner) {
        this.nextPlayerID = nextPlayerID || 0
        this.players = players || {}
        this.isGameWaiting = isGameWaiting || 1
        this.isPlacingShips = isPlacingShips || 0
        this.isFiring = isFiring || 0
        this.isEnd = isEnd || 0
        this.winner = winner || ''
    }

    getOpponent(playerID) {
        if (playerID === 0) {
            return this.players[1]
        } else {
            return this.players[0]
        }
    }

    isAWinner(playerID, opponentID) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {

                // if opponent has a ship, but player's guessesBoard does not have a hit here
                if (this.isHit(i, j, this.players[opponentID]) && this.players[playerID].guessesBoard[i][j] !== 'H') {
                    return false;
                }

            }
        }
        return true; // all hits match with ships
    }

    checkSunkShip(hitCell, opponentID) {
        //get opponent's ships
        let oppShips = this.players[opponentID].ships

        //go through each ship's cells and see if they contain our hitCell x and y
        for(let i = 0; i < 5; i++) {
            let shipHits = 0
            let isCorrectShip = false

            //for each cell in current ship
            for(let j = 0; j < (oppShips[i].size); j++) {
                if(oppShips[i].cells[j][0] === hitCell.X && oppShips[i].cells[j][1] === hitCell.Y) {
                    //our hit was on ship i, so check if all cells in this ship map to 'H'
                    isCorrectShip = true
                }

                //check if cell maps to a hit
                let x = oppShips[i].cells[j][0]
                let y = oppShips[i].cells[j][1]

                if(this.players[opponentID].personalBoard[x][y] === 'H') {
                    shipHits += 1
                }
            }

            //if this was the ship fired at, check if all the cells are hit, if so, its sunk
            if(isCorrectShip && shipHits === oppShips[i].size) {
                oppShips[i].sunk = true
                this.players[opponentID].sunkShips.push(oppShips[i].name)
                return true
            }
        }

        return false
    }

    isHit(x, y, opponent) {
        if (opponent.personalBoard[x][y] === 'A' || opponent.personalBoard[x][y] === 'B' || opponent.personalBoard[x][y] === 'S' || opponent.personalBoard[x][y] === 'C' || opponent.personalBoard[x][y] === 'D') {
            return true
        }
        else {
            return false
        }
    }


    handleReady(playerID, displayName) {
        this.players[playerID].isReady = true
        this.players[playerID].displayName = displayName

        //check if both are ready, if so, begin!
        if (Object.keys(this.players).length === 2 && this.players[0].isReady && this.players[1].isReady) {
            this.isGameWaiting = 0
            this.isPlacingShips = 1
        }
    }

    handlePlacement(playerID, placements, ships) {
        //update player's placement board
        this.players[playerID].personalBoard = placements
        this.players[playerID].ships = ships
        this.players[playerID].hasPlaced = true

        //check if both are in, if so, begin firing stage!
        if (Object.keys(this.players).length === 2 && this.players[0].hasPlaced && this.players[1].hasPlaced) {
            this.isPlacingShips = 0
            this.isFiring = 1
        }
    }

    handleFiringGuess(playerID, x, y) {
        //determine if player's guess was a hit or miss and update guess board
        let opponent = this.getOpponent(playerID)

        if (this.isHit(x, y, opponent)) {
            //guess was a hit
            this.players[playerID].guessesBoard[x][y] = 'H'
            opponent.personalBoard[x][y] = 'H'
        }
        else {
            //guess was a miss
            this.players[playerID].guessesBoard[x][y] = 'M'
            opponent.personalBoard[x][y] = 'M'
        }

        //check if this sunk a ship
        let didSink = this.checkSunkShip({X: x, Y: y}, opponent.id)

        //check if the player has won
        if (this.isAWinner(playerID, opponent.id)) {
            //if a winner, change game flags
            this.isFiring = 0
            this.isEnd = 1
            this.winner = this.players[playerID].displayName
        }

        return didSink
    }
}

app.get('/create', async (req, res) => {
    let game = new Game()
    const insertedGame = await gameData.insertOne(game)
    const json = {code: insertedGame.insertedId}
    console.log("creating game with code ", insertedGame.insertedId)
    res.json(json)
})


app.ws('/match', async (client, req) => {
    // Verify token and extract user
    const token = req.query.token

    let user;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
        console.log("error")
        client.send(JSON.stringify({ type: 'Unauthorized', payload: {} }))
        client.close()
        return
    }

    const userId = user.id

    client.on('message', async msgSent => {
        let msg

        try {
            msg = JSON.parse(msgSent);
        } catch (e) {
            client.send(JSON.stringify({type: 'error', payload: {message: 'bad json'}}));
            return;
        }

        const {type} = msg;
        console.log("message received ", msg)

        if(type == "matchMe") {
            //see if there is someone to match with 
            let opp = await waitingData.findOneAndDelete({ user_id: { $ne: userId } })
            console.log("opp", opp)

            if(!opp) {
                //if not, add them to the queue 
                await waitingData.insertOne({ user_id: userId })
                clients.set(userId, client)
            }
            else {
                //if yes, then create game code and send to both 
                let game = new Game()
                const insertedGame = await gameData.insertOne(game)
                console.log("creating game with code ", insertedGame.insertedId)

                client.send(JSON.stringify({type: 'startGame', payload: { code: insertedGame.insertedId }}));

                await new Promise(r => setTimeout(r, 500))

                const oppSocket = clients.get(opp.user_id);

                if(oppSocket) {
                    oppSocket.send(JSON.stringify({type: 'startGame', payload: { code: insertedGame.insertedId }}));
                }
                else {
                    console.log("opp socket not valid")    
                }
            }   
        }
    })

    client.on("close", async () => {
        //remove them from waiting list and client list
        await clients.delete(userId)
        await waitingData.deleteOne({ user_id: userId })
    });
})

server.listen(3002, () => console.log('Matchmaking service running on :3002'));