import React from "react";
import PlayerSocket from "./components/PlayerSocket";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h1>heartBeat</h1>
      <PlayerSocket />
    </div>
  );
}
