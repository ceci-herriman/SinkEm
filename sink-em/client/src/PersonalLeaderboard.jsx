import { useState, useEffect } from "react";
import "./App.css";

function PersonalLeaderboard( { token, username } ) {
    const [leaderboardData, setLeaderboardData] = useState([])

    const getLeaderboard = async () => {
        
        const res = await fetch("http://localhost:8080/leaderboardPrivate/private", {
            method: "GET", 
            headers: {
                "Content-Type": "application/json",
                'Authorization': 'Bearer ' + token
            }
        })

        if(res.ok) {
            const json = JSON.parse((await res.text()))
            setLeaderboardData(json.data)
        }
        else {
            console.log("cant get leaderboard info", res)
        }
    }

    useEffect(() => {
        getLeaderboard()
    }, []);

    return (
        <div className="page">
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4">
                <div className="card-empty w-full max-w-lg mx-auto">
                    <div className="grid gap-3">
                        <h2 className="h2"> Leaderboard </h2>
                        <table>
                            <thead>
                                <tr> 
                                    <th className="text-center py-2"> Rank </th>
                                    <th className="text-center py-2"> Username </th>
                                    <th className="text-center py-2"> Win % </th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((item, index) => {
                                    if(item.username == username) {
                                        return (
                                        <tr style={{ outline: '1px solid white' }} key={item._id}>
                                            <td className="text-center py-1"> {index + 1} </td>
                                            <td className="text-center py-1"> {item.username} </td>
                                            <td className="text-center py-1"> {item.ratio.toFixed(2) * 100}%</td>
                                        </tr>
                                        )
                                    }
                                    else {
                                        return (
                                        <tr key={item._id}>
                                            <td className="text-center py-1"> {index + 1} </td>
                                            <td className="text-center py-1"> {item.username} </td>
                                            <td className="text-center py-1"> {item.ratio.toFixed(2) * 100}%</td>
                                        </tr>
                                        )
                                    }
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
        </main>
        </div>
    );
}

export default PersonalLeaderboard;
