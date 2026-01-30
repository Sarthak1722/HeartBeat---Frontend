import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";
import Chat from "./chat";

const ROOM_ID = "room-123";
const AUDIO_URL = "/audio/Lovin_U.mp3";

export default function PlayerSocket() {
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    socket.connect();
    socket.emit("join", ROOM_ID);

    socket.on("state", (s) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = s.position || 0;
      if (s.playing) {
        audioRef.current.play();
        setPlaying(true);
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    });

    socket.on("play", ({ position }) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = position || 0;
      audioRef.current.play();
      setPlaying(true);
    });

    socket.on("pause", ({ position }) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = position || audioRef.current.currentTime;
      audioRef.current.pause();
      setPlaying(false);
    });

    socket.on("seek", ({ position }) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = position || 0;
    });

    return () => {
      socket.disconnect();
      socket.off("state");
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
    };
  }, []);

  // keep elapsed updated
  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setElapsed(audioRef.current.currentTime);
  }

  function handlePlay() {
    const pos = audioRef.current.currentTime;
    socket.emit("play", { roomId: ROOM_ID, trackId: "sample", position: pos });
    audioRef.current.play();
    setPlaying(true);
  }

  function handlePause() {
    const pos = audioRef.current.currentTime;
    socket.emit("pause", { roomId: ROOM_ID, position: pos });
    audioRef.current.pause();
    setPlaying(false);
  }

  function handleRestart() {
    socket.emit("seek", { roomId: ROOM_ID, position: 0 });
    socket.emit("play", { roomId: ROOM_ID, trackId: "sample", position: 0 });
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setPlaying(true);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, width: 420, borderRadius: 8 }}>
      <h3>heartBeat</h3>

      <audio
        ref={audioRef}
        src={AUDIO_URL}
        onTimeUpdate={handleTimeUpdate}
      />

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {playing ? "Playing" : "Paused"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Elapsed:</strong> {elapsed.toFixed(2)} s
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {!playing ? (
          <button onClick={handlePlay}>Play</button>
        ) : (
          <button onClick={handlePause}>Pause</button>
        )}
        <button onClick={handleRestart}>Restart</button>
      </div>

      <Chat roomId={ROOM_ID} />
    </div>
  );
}
