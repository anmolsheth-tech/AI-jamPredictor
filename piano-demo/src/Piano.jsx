import * as mm from "@magenta/music";
import { toNoteSequence } from "./utils/conversion.js";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

/* ---------- Sampler (realistic piano) ---------- */
const piano = new Tone.Sampler({
  urls: {
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

/* ---------- Piano Component ---------- */
export default function Piano() {
  const WHITE_W = 70;
  const WHITE_H = 280;
  const BLACK_W = 45;
  const BLACK_H = 170;

  const whites = [
    { n: "C4" }, { n: "D4" }, { n: "E4" }, { n: "F4" },
    { n: "G4" }, { n: "A4" }, { n: "B4" }, { n: "C5" }
  ];

  const blacks = [
    { n: "C#4", between: 0 }, { n: "D#4", between: 1 },
    { n: "F#4", between: 3 }, { n: "G#4", between: 4 },
    { n: "A#4", between: 5 }
  ];

  const totalWidth = WHITE_W * whites.length;

  // recording state
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartRef = useRef(0);
  const activeNotesRef = useRef({});
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [aiNotes, setAiNotes] = useState([]);

  // UI timer
  const [, setTick] = useState(0);
  useEffect(() => {
    let id;
    if (isRecording) id = setInterval(() => setTick(t => t + 1), 120);
    return () => clearInterval(id);
  }, [isRecording]);

  // Ensure Tone is unlocked after user click
  useEffect(() => {
    const start = () => Tone.start();
    window.addEventListener("click", start, { once: true });
    return () => window.removeEventListener("click", start);
  }, []);

  /* ---------- Recording ---------- */
  const startRecording = () => {
    setRecordedNotes([]);
    recordingStartRef.current = performance.now();
    activeNotesRef.current = {};
    setIsRecording(true);
  };

  const stopRecording = () => {
    const now = performance.now();
    Object.keys(activeNotesRef.current).forEach(pitch => {
      const startMs = activeNotesRef.current[pitch];
      const dur = Math.max(0.05, (now - startMs) / 1000);
      const time = (startMs - recordingStartRef.current) / 1000;
      setRecordedNotes(prev => [...prev, { pitch, time, duration: dur }]);
    });
    activeNotesRef.current = {};
    setIsRecording(false);
  };

  const clearRecording = () => {
    setRecordedNotes([]);
    activeNotesRef.current = {};
  };

  const exportRecording = () => {
    if (recordedNotes.length === 0) return alert("No notes to export");
    const blob = new Blob([JSON.stringify(recordedNotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ---------- AI Continuation ---------- */
  const continueWithAI = async () => {
    if (recordedNotes.length === 0) {
      alert("Record something first!");
      return;
    }

    const model = new mm.MusicRNN(
      "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn"
    );
    await model.initialize();

    // Convert and quantize
    let seq = toNoteSequence(recordedNotes);
    const quantized = mm.sequences.quantizeNoteSequence(seq, 4);

    // Ask model for continuation (32 steps = ~2 bars)
    const continuation = await model.continueSequence(quantized, 32, 1.0);

    // Convert to Tone.js format
    const newNotes = continuation.notes.map(n => ({
      pitch: Tone.Frequency(n.pitch, "midi").toNote(),
      time: n.startTime || 0,
      duration: (n.endTime - n.startTime) || 0.25,
    }));

    console.log("AI notes:", newNotes);
    setAiNotes(newNotes);

    // Play AI notes right after the recording ends
    const recordedDuration = recordedNotes.length
      ? Math.max(...recordedNotes.map(n => n.time + n.duration))
      : 0;

    const now = Tone.now() + 0.5;
    newNotes.forEach(n => {
      piano.triggerAttackRelease(n.pitch, n.duration, now + recordedDuration + n.time);
    });
  };

  /* ---------- Playback ---------- */
  const playRecording = async () => {
    if (recordedNotes.length === 0) return;
    await Tone.start();
    const now = Tone.now() + 0.1;
    recordedNotes.forEach(n => {
      piano.triggerAttackRelease(n.pitch, Math.max(0.05, n.duration || 0.25), now + n.time);
    });
  };

  /* ---------- Live play ---------- */
  const handleKeyDown = async (pitch) => {
    await Tone.start();
    piano.triggerAttack(pitch);
    if (isRecording) {
      activeNotesRef.current[pitch] = performance.now();
    }
  };

  const handleKeyUp = (pitch) => {
    piano.triggerRelease(pitch);
    if (isRecording && activeNotesRef.current[pitch]) {
      const startMs = activeNotesRef.current[pitch];
      const dur = Math.max(0.05, (performance.now() - startMs) / 1000);
      const time = (startMs - recordingStartRef.current) / 1000;
      setRecordedNotes(prev => [...prev, { pitch, time, duration: dur }]);
      delete activeNotesRef.current[pitch];
    }
  };

  /* ---------- UI ---------- */
  const recordingDuration = isRecording
    ? ((performance.now() - recordingStartRef.current) / 1000).toFixed(2)
    : (recordedNotes.length
      ? (Math.max(...recordedNotes.map(n => n.time + n.duration))).toFixed(2)
      : "0.00");

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <button
            className="px-3 py-1 rounded bg-red-600 text-white font-semibold"
            onClick={startRecording}
          >
            ● Record
          </button>
        ) : (
          <button
            className="px-3 py-1 rounded bg-gray-200 text-black font-semibold"
            onClick={stopRecording}
          >
            ■ Stop
          </button>
        )}

        <button
          className="px-3 py-1 rounded bg-blue-600 text-white font-semibold"
          onClick={playRecording}
        >
          ▶ Play
        </button>

        <button
          className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold"
          onClick={clearRecording}
        >
          ✖ Clear
        </button>

        <button
          className="px-3 py-1 rounded bg-green-600 text-white font-semibold"
          onClick={exportRecording}
        >
          ⤓ Export JSON
        </button>

        <button
          className="px-3 py-1 rounded bg-purple-600 text-white font-semibold"
          onClick={continueWithAI}
        >
          ✨ Continue with AI
        </button>

        <div className="ml-4 text-sm text-gray-700">
          Duration: <span className="font-mono">{recordingDuration}s</span>
        </div>
      </div>

      {/* Keyboard */}
      <div
        className="relative rounded-xl shadow-2xl bg-gradient-to-b from-stone-800 to-stone-900 p-4"
        style={{ width: totalWidth + 32 }}
      >
        <div
          className="relative select-none"
          style={{ width: totalWidth, height: WHITE_H }}
        >
          {/* White keys */}
          {whites.map((k, i) => (
            <div
              key={k.n}
              onMouseDown={() => handleKeyDown(k.n)}
              onMouseUp={() => handleKeyUp(k.n)}
              onMouseLeave={() => handleKeyUp(k.n)}
              onTouchStart={(e) => { e.preventDefault(); handleKeyDown(k.n); }}
              onTouchEnd={() => handleKeyUp(k.n)}
              className="absolute cursor-pointer transition-transform"
              style={{
                left: i * WHITE_W,
                top: 0,
                width: WHITE_W,
                height: WHITE_H,
                background: "#fff",
                border: "1px solid #000",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              <span style={{ marginBottom: 8, fontSize: 12, color: "#374151" }}>{k.n}</span>
            </div>
          ))}

          {/* Black keys */}
          {blacks.map((b) => {
            const left = (b.between + 1) * WHITE_W - BLACK_W / 2;
            return (
              <div
                key={b.n}
                onMouseDown={(e) => { e.stopPropagation(); handleKeyDown(b.n); }}
                onMouseUp={() => handleKeyUp(b.n)}
                onMouseLeave={() => handleKeyUp(b.n)}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleKeyDown(b.n); }}
                onTouchEnd={() => handleKeyUp(b.n)}
                className="absolute z-10 cursor-pointer"
                style={{
                  left,
                  top: 0,
                  width: BLACK_W,
                  height: BLACK_H,
                  background: "#000",
                  border: "1px solid #000",
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                  boxShadow: "0 6px 8px rgba(0,0,0,0.45)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                <span style={{ marginBottom: 6, fontSize: 10, color: "#fff" }}>{b.n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600">
        Recorded notes: <span className="font-mono">{recordedNotes.length}</span>
      </div>
    </div>
  );
}
