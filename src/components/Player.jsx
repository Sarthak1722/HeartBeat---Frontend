import React, { useEffect, useRef, useState } from "react";

/**
 * Simple player using Web Audio API oscillator as a placeholder "song".
 * Play / Pause and shows elapsed time.
 */
export default function Player() {
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const startRef = useRef(0); // audioContext time when playback started (adjusted by elapsed)
  const rafRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopOsc();
      if (audioCtxRef.current && audioCtxRef.current.close) {
        audioCtxRef.current.close();
      }
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function startOsc() {
    const ctx = ensureAudioContext();

    // create oscillator + small gain so it's not loud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime); // audible tone
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    oscRef.current = { osc, gain };

    // resume counting from previous elapsed
    startRef.current = ctx.currentTime - elapsed;
    tick();
  }

  function stopOsc() {
    if (oscRef.current) {
      try {
        oscRef.current.osc.stop();
      } catch (e) {}
      try {
        oscRef.current.osc.disconnect();
        oscRef.current.gain.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
  }

  function tick() {
    const ctx = audioCtxRef.current;
    function update() {
      // safe check
      if (!ctx) return;
      setElapsed(ctx.currentTime - startRef.current);
      rafRef.current = requestAnimationFrame(update);
    }
    rafRef.current = requestAnimationFrame(update);
  }

  function handlePlayPause() {
    // if first time and context is suspended, resume it
    const ctx = audioCtxRef.current;
    if (!playing) {
      if (ctx && ctx.state === "suspended" && ctx.resume) ctx.resume();
      startOsc();
      setPlaying(true);
    } else {
      // pause: stop oscillator but keep elapsed value
      stopOsc();
      setPlaying(false);
    }
  }

  function handleRestart() {
    setElapsed(0);
    if (playing) {
      stopOsc();
      // small timeout to ensure stop, then start fresh
      setTimeout(() => startOsc(), 50);
    } else {
      // not playing: reset elapsed only
      startRef.current = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, width: 400, borderRadius: 8 }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {playing ? "Playing" : "Paused"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Elapsed:</strong> {elapsed ? elapsed.toFixed(2) : "0.00"} s
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handlePlayPause} style={{ padding: "8px 12px" }}>
          {playing ? "Pause" : "Play"}
        </button>

        <button onClick={handleRestart} style={{ padding: "8px 12px" }}>
          Restart
        </button>
      </div>

      <p style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
        Note: this demo uses a generated tone as a placeholder. We'll replace this with real audio tracks later.
      </p>
    </div>
  );
}
