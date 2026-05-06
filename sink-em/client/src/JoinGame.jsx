import {useEffect, useRef, useState} from "react";
import { useNavigate } from 'react-router-dom'
import "./App.css";

function JoinGame({ token, ws, setDisplay }) {
    const navigate = useNavigate()
    const [userMessage, setUserMessage] = useState('')
    const [gameCode, setGameCode] = useState('')
    const [isWaiting, setIsWaiting] = useState(false)
   
    const adj = ["frosty", "regal", "flustered", "fiery", "dapper", "zesty", "vibrant", "sneaky", "breezy", "grumpy", "bright", "charmed", "bashful", "eager", "weepy", "jovial", "active", "agile", "awkward", "quick", "slow", "fast", "speedy", "unhurried", "swift", "rapid", "deliberate", "aggressive", "wild", "tame", "docile", "harmless", "dangerous", "loud", "bold", "calm", "kind", "tough", "quiet", "urban", "funny", "rural", "messy", "goofy", "rowdy", "sad", "mad", "pro", "shy", "sly", "happy", "smart", "busy", "glad", "mean", "wise", "rude", "civil", "angry", "tired", "proud", "harsh", "upset", "loyal", "vocal", "brave", "alert", "bored", "naive", "weary", "merry", "dizzy", "witty", "moody", "timid", "jolly", "sassy", "picky", "irate", "social", "honest", "modest", "hungry", "scared", "gifted", "gentle", "decent", "casual", "strict", "brutal", "fierce", "clever", "mature", "loving", "polite", "lively", "amazed", "humble", "mighty", "heroic", "poetic", "tricky", "sleepy", "wicked", "ragged", "amused", "clumsy", "caring", "daring", "upbeat", "gloomy", "quirky", "frigid", "raging", "wanted", "unruly", "feeble", "dreamy", "sullen", "expert", "cranky", "nimble", "fickle", "frugal", "drowsy", "serious", "popular", "healthy", "careful", "violent", "leading", "nervous", "capable", "unknown", "helpful", "curious", "worried", "ethical", "excited", "patient", "wealthy", "dynamic", "content", "anxious", "elegant", "logical", "unhappy", "skilled", "hopeful", "devoted", "notable", "furious", "passive", "ashamed", "foolish", "relaxed", "jealous", "smiling", "fearful", "vicious", "puzzled", "sincere", "cynical", "frantic", "annoyed", "playful", "stylish", "stunned", "defiant", "runaway", "robotic", "trusted", "focused", "erratic", "worldly", "unnamed", "pitiful", "naughty", "cunning", "unlucky", "alarmed", "likable", "comical", "lovable", "envious", "zealous", "valiant", "tearful", "enraged", "aimless", "tactful", "positive", "powerful", "negative", "creative", "innocent", "friendly", "detailed", "artistic", "peaceful", "grateful", "generous", "talented", "tropical", "charming", "cautious", "confused", "sleeping", "credible", "sensible", "vigorous", "decisive", "obsessed", "imminent", "outraged", "affluent", "cheerful", "renowned", "graceful", "restless", "worrying", "stubborn", "thankful", "gracious", "outgoing", "ruthless", "reserved", "startled", "hesitant", "humorous", "eloquent", "aspiring", "fearless", "skillful", "nameless", "carefree", "diligent", "laughing", "lonesome", "selfless", "concerned", "emotional", "surprised", "technical", "confident", "brilliant", "skeptical", "respected", "dedicated", "energetic", "civilized", "impatient", "exhausted", "terrified", "talkative", "unfair", "shocked", "unaware", "seasick", "jubilant", "sheepish", "dejected", "likeable", "frazzled", "effective", "sensitive", "anonymous", "competent", "fictional", "qualified", "scholarly", "unwilling", "committed", "delighted", "suspected", "honorable", "executive", "eccentric", "visionary", "listening", "attentive", "traveling", "motivated", "proactive", "hilarious", "nostalgic", "admirable", "dignified", "forgiving", "welcoming", "righteous", "insistent", "assertive", "ferocious", "deserving", "acclaimed", "impartial", "secretive", "exuberant", "heartfelt", "sarcastic", "leisurely", "nocturnal", "agreeable", "indignant", "tenacious", "courteous", "easygoing", "irritated", "observant", "wandering", "merciless", "perplexed", "overjoyed", "contented", "unselfish", "forgetful", "immune", "mortal", "serene", "cheesy", "olympic", "pleased", "neutral", "adverse", "ominous", "festive", "ghostly", "adamant", "budding", "knowing", "glaring", "resting", "nagging", "honored", "mocking", "wishful", "wayward", "howling", "forlorn", "fleeing", "amiable", "lenient", "sketchy", "jittery", "dashing", "dutiful", "gleeful", "baffled", "admired", "thrifty", "untamed", "suspect", "bookish", "lurking", "cloaked", "involved", "academic", "dramatic", "unlikely", "handsome", "prepared", "rigorous", "animated", "coherent", "informed", "gleaming", "inspired", "tolerant", "discrete", "eclectic", "engaging", "honorary", "tutoring", "relieved", "discreet", "truthful", "vigilant", "literate", "virtuous", "watchful", "appalled", "marching", "tranquil", "charging", "brooding", "fearsome", "trusting", "tireless", "resolute", "exacting", "cultured", "rambling", "amenable", "unbiased", "dogmatic", "ordained", "olympian", "thrilled", "dismayed", "merciful", "blissful", "vengeful", "laudable", "skittish", "sociable", "vehement", "crawling", "stealthy", "downcast", "scornful", "reverent", "amicable", "princely", "pampered", "cheering", "fatigued", "juggling"]
    const animal = ["alligator", "alpaca", "anteater", "antelope", "armadillo", "baboon", "badger", "bat", "bear", "beaver", "bird", "bison", "boa", "boar", "buffalo", "butterfly", "camel", "cat", "cheetah", "chimpanzee", "chipmunk", "cobra", "cow", "coyote", "crab", "crane", "crocodile", "crow", "deer", "dog", "dolphin", "dove", "dragonfly", "duck", "eagle", "elephant", "elk", "emu", "falcon", "ferret", "fish", "flamingo", "flicker", "fox", "gazelle", "gecko", "giraffe", "goat", "goose", "gorilla", "grizzly", "groundhog", "hawk", "hedgehog", "hen", "hippopotamus", "hyena", "iguana", "insect", "jackal", "jaguar", "kangaroo", "koala", "lemur", "leopard", "lion", "lizard", "llama", "lynx", "magpie", "manatee", "mockingbird", "mongoose", "monkey", "moose", "mouse", "orca", "ostrich", "otter", "owl", "ox", "peacock", "pelican", "penguin", "pigeon", "platypus", "porcupine", "possum", "puma", "python", "rabbit", "raccoon", "rat", "rattlesnake", "rhinoceros", "salmon", "seal", "shark", "sheep", "skunk", "sloth", "snake", "sparrow", "spider", "squirrel", "starfish", "swan", "tarantula", "tiger", "tortoise", "turkey", "turtle", "viper", "vulture", "whale", "wolf", "wombat", "woodpecker", "yak", "zebra"]
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const username = capitalize(adj[Math.floor(Math.random() * adj.length)]) + capitalize(animal[Math.floor(Math.random() * animal.length)])
    const [displayName, setDisplayName] = useState(username)

    const makeNewWS = (code) => {
        console.log("making game ws")
        
        if (ws.current) {
            console.log("Closing current ws")
            ws.current.close()
        }
        console.log(code)
        ws.current = new WebSocket(`ws://localhost:8080/game/ws?id=${code}&token=${token}`)

        ws.current.onopen = () => {
            console.log("Connected to WS server");

            ws.current.onmessage = async msgSent => {
                let msg;
                try {
                    msg = JSON.parse(msgSent.data);
                } catch (e) {
                    console.error("Invalid JSON:", msgSent);
                    return;
                }

                console.log("received", msg)
                const {type, payload} = msg;
                if (type === "Waiting") {
                    setUserMessage(type)
                } else if (type === "Full") {
                    setUserMessage(type)
                } else if (type === "InvalidCode") {
                    setUserMessage("Invalid code.")
                    setGameCode('')
                } else if (type === "StartPlacing") {
                    //switch to <game>
                    setUserMessage("Start placing")
                    navigate("/game")
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

        }
    }

    const joinGame = async () => {
        const code = gameCode.trim();
        if (!code) {
            return
        }
        setGameCode(code)
        makeNewWS(code)
        setIsWaiting(true)
    }

    const sendReadyToStart = () => {
        if (displayName.length > 0){
            console.log("sending ready")
            setDisplay(displayName)
            ws.current.send(JSON.stringify({type: 'Ready', payload: {Ready: true, DisplayName: displayName}}));
            setIsWaiting(false)
        } else {
            alert("You must choose a display name!")
        }
    }

    return (
        <div className="page">

        <main className="flex-1 w-full flex flex-col items-center justify-center px-4">


            {userMessage}
            {/* <br /> */}

            <div className="card-empty w-full max-w-lg mx-auto">
            {isWaiting ? (
                <div>
            <h3 className="h3"> Display Name: </h3>
            <input type="text" value={displayName} onChange={(i) => setDisplayName(i.target.value)} className="border-2 border-gray-300 rounded-md p-2 text-black bg-white" placeholder="Display Name"/>
            <button className ="btn" onClick={sendReadyToStart}> Ready! </button>
            </div>) : (<div className="grid gap-3">
                        <h2 className="h2"> Enter Game Code 🛳️ </h2>
                        <p className="subtext">Join an existing battleship game.</p>
                    <input type="text" value={gameCode} onChange={(i) => setGameCode(i.target.value)} className="border-2 border-gray-300 rounded-md p-2 text-black bg-white" placeholder="e.g. 68e827987889fd33716f834e"/>
                    <button className ="btn" onClick={joinGame}>Join game</button>
                </div>)
            }

            </div>
        </main>
    </div>
    );
}

export default JoinGame;
