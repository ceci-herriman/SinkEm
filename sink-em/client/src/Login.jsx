import "./App.css";
import { useNavigate } from 'react-router-dom'
import Leaderboard from "./Leaderboard";

function Login({ onLogin }) {
    const navigate = useNavigate()

    const submitLogin = async () => {
        const user = document.getElementById("username").value
        const pass = document.getElementById("password").value
        
        const res = await fetch("http://localhost:8080/auth/login", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, pass})
        })

        if(res.ok) {
            const json = JSON.parse((await res.text()))
            onLogin(json.token, user)
            navigate('/home')
        }
        else {
            console.log(res)
            alert("Invalid credentials")
        }
    }

    return (
    <div className="page">
        <div className="flex flex-row w-1/2 min-h-screen items-center justify-center gap-8">

            <div className="flex flex-col items-center justify-center w-3/4">
                <div className="text-center">
                    <h1 className="h1">
                        <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                            Sink 'Em 🚢
                        </span>
                    </h1>
                    <p className="subtext">The Classic Naval Combat Game</p>
                </div>
                <div className="card-empty w-full max-w-lg mx-auto">
                    <div className="grid gap-3">
                        <h2 className="h2">Log In</h2>
                        <label htmlFor="username" className="block mb-2.5 text-sm font-medium text-heading">Username</label>
                        <input id="username" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Username" required />
                        <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">Password</label>
                        <input id="password" className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Password" required />
                        <button className="btn" onClick={submitLogin}>Log In</button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center w-3/4">
                <Leaderboard />
            </div>
        </div>
    </div>
    )
}

export default Login;
