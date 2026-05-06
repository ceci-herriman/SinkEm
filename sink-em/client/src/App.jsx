import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {useState, useRef} from "react";
import Login from './Login.jsx'
import Home from './Home.jsx'
import CreateGame from './CreateGame.jsx'
import JoinGame from './JoinGame.jsx'
import Game from './Game.jsx'
import Admin from './Admin.jsx'
import MatchGame from './MatchGame.jsx'

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('token'))
    const [username, setUsername] = useState(sessionStorage.getItem('user'))
    const [displayName, setDisplayName] = useState(sessionStorage.getItem('user'))

    const ws = useRef(null);

    const handleLogin = (token, username) => {
        sessionStorage.setItem('token', token) 
        sessionStorage.setItem('user', username) 
        setToken(token)
        setUsername(username)
        setDisplayName(username)
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login onLogin={handleLogin} />} />
                <Route path="/home" element={<Home token={token} username={username} />} />
                <Route path="/matching" element={<MatchGame token={token} ws={ws} setDisplay={setDisplayName} />} />
                <Route path="/createGame" element={<CreateGame token={token} ws={ws} setDisplay={setDisplayName} />} />
                <Route path="/joinGame" element={<JoinGame token={token} ws={ws} setDisplay={setDisplayName} />} />
                <Route path="/game" element={<Game token={token} ws={ws} displayName={displayName}/>} />
                <Route path="/admin" element={<Admin token={token} />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App