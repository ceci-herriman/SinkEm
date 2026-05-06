import { useEffect, useState } from "react";
import "./App.css";

function Admin({ token }) {
    const [adminStats, setAdminStats] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        //get stats from stream and continuously loop to read 
        const streamStats = async () => {
            const res = await fetch("http://localhost:8080/admin/stream", {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n");

                for (const line of lines) {
                    //"data:" means start of new sent data
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            setAdminStats(data);
                        } catch (e) {
                            console.log("Parse error:", e);
                        }
                    }
                }
            }
        };

        streamStats();
        return () => controller.abort();
    }, [token]);

    if (!adminStats) {
        return <div className="loading">Loading stats...</div>;
    }
    
    return (
        <div className="admin-container">
            <h1 className="title">Gateway Request Statistics</h1>

            <div className="stats-overview">
                <div className="stat-box">
                    <h2>Total Requests</h2>
                    <p>{adminStats.totalRequests}</p>
                </div>
                <div className="stat-box error">
                    <h2>Errors</h2>
                    <p>{adminStats.errors}</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="card">
                    <h3>Requests Per Route</h3>
                    <ul>
                        {Object.entries(adminStats.requestsPerRoute).map(([key, value]) => (
                            <li key={key}>
                                <span className="key">{key}</span>
                                <span className="value">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h3>Requests Per Method</h3>
                    <ul>
                        {Object.entries(adminStats.requestsPerMethod).map(([key, value]) => (
                            <li key={key}>
                                <span className="key">{key}</span>
                                <span className="value">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h3>Requests Per User</h3>
                    <ul>
                        {Object.entries(adminStats.requestsPerUser).map(([key, value]) => (
                            <li key={key}>
                                <span className="key">{key}</span>
                                <span className="value">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Admin;