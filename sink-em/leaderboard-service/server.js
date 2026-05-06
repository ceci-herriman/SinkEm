import express from 'express'
import {MongoClient, ObjectId, ServerApiVersion} from 'mongodb'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

const app = express();
app.use(express.json());

dotenv.config()

const user = process.env.DB_USER
const pass = process.env.DB_PASSWORD
const url = process.env.DB_URL

const uri = `mongodb+srv://${user}:${pass}@${url}/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1, strict: true, deprecationErrors: true,
    }
});
const userData = client.db("webware-sink-em").collection("users")


app.get('/public', async (req, res) => { 
    //get top ten users with the best win percentage
    const result = await userData.aggregate([
        { $addFields: {ratio: { $cond: {
            if: { $eq: ["$gamesPlayed", 0] },
            then: 0,
            else: { $divide: ["$wins", "$gamesPlayed"] }
            }
        }}},
        { $sort: { ratio: -1 }},
        { $limit: 10 }
    ]).toArray()

    const json = {data: result}
    res.json(json)
});

app.get('/private', async (req, res) => {
    //get top ten users with the best win percentage + add personal stats
    const token = req.headers.authorization?.split(' ')[1]
    let requestingUsername = null
    
    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET)
            requestingUsername = user.username

            //calculate rankings, then find where user lies in the rankings
            
            const result = await userData.aggregate([

                //get ratios of everyone
                { $addFields: { ratio: { $cond: {
                    if: { $eq: ["$gamesPlayed", 0] },
                    then: 0,
                    else: { $divide: ["$wins", "$gamesPlayed"] }
                }}}},

                //sort and then apply rank across window
                { $setWindowFields: {
                    sortBy: { ratio: -1 },
                    output: {
                        rank: { $rank: {} }
                    }
                }},

                // filter rankings/ratios to get the top 10 + the user
                { $sort: { rank: 1 } },
                { $match: {
                    $or: [
                        { rank: { $lte: 10 } },
                        { username: requestingUsername }
                    ]
                }}
            ]).toArray()

            const json = {data: result}
            res.json(json)

        } catch {
            console.log("error getting username in private")
            res.status(401).json({ error: 'Cannot get username' });
        }
    }
 });

app.listen(3003, () => console.log('Leaderboard running on :3003'));