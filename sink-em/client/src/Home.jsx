import { useNavigate } from 'react-router-dom'
import "./App.css";
import PersonalLeaderboard from './PersonalLeaderboard';

function Home({ token, username }) { 
    const navigate = useNavigate()

    /*Menu Options 
    Create game /createGame
    Join game via code /joinGame
    Match me with an opponent /matching
    View admin stats /admin
    */

    const makeGame = async () => {
        navigate('/createGame')
    }

    const joinGame = async () => {
        navigate('/joinGame')
    }

    const viewAdmin = async () => {
        navigate('/admin')
    }

    const matchGame = async () => {
        navigate('/matching')
    }

    return (
        <div className="page">
            <div className="flex flex-row w-3/4 min-h-screen items-center justify-center">
                <main className="flex flex-col items-center justify-center w-7/8">
                    <div className="text-center">
                        <h1 className="h1">
                        <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                            Sink ’Em 🚢
                        </span>
                        </h1>
                        <p className="subtext">The Classic Naval Combat Game</p>
                    </div>
    
                    <div className="card-empty w-full max-w-lg mx-auto">
                        <div className="grid gap-3">
                            <button className ="btn" onClick={makeGame}>⚓ Create Game</button>
                            <button className ="btn-1" onClick={joinGame}>
                                {/* link icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.657 5.657l-2.121 2.121a4 4 0 01-5.657-5.657M10.172 13.828a4 4 0 01-5.657-5.657l2.121-2.121a4 4 0 015.657 5.657" />
                                </svg>
                                Join via Code</button>
                            <button className ="btn" onClick={matchGame}>Match me with an opponent</button>
                            <button className ="btn" onClick={viewAdmin}>View Admin Stats</button>
                        </div>
                    </div>
                </main>

            <div className="flex flex-col items-center justify-center w-7/8">
                <PersonalLeaderboard token={token} username={username} />
            </div>
            </div>

        </div>
        );
}

export default Home;
