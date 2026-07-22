import { useState, useEffect } from "react";

function App() {
  const [alert, setAlert] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const detection = JSON.parse(event.data);
      setAlert(detection);
    };

    return () => socket.close();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 40, textAlign: "center" }}>
      <p>{connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
      {alert ? (
        <h1 style={{ color: "red" }}>
          ⚠️ {alert.species.toUpperCase()} DETECTED
        </h1>
      ) : (
        <h1 style={{ color: "green" }}>Road clear</h1>
      )}
    </div>
  );
}

export default App;