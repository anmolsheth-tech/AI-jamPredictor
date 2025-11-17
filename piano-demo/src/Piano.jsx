import TensorFlowMusicNeuralNetwork from "./tensorflowNeuralNetwork.js";
import { SONGS, getAllSongsForTraining, getRandomSong } from "./songs.js";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Square, Trash2, Download, Brain, Zap, Piano as PianoIcon, Volume2, Mic, MicOff, Settings } from "lucide-react";
import * as Tone from "tone";

/* ---------- Sampler (realistic piano) ---------- */
const piano = new Tone.Sampler({
  urls: {
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

/* ---------- Piano Component ---------- */
export default function Piano() {
  const WHITE_W = 50;
  const WHITE_H = 200;
  const BLACK_W = 35;
  const BLACK_H = 120;

  // Generate all white keys from A0 to C8 (7 full octaves + minor third)
  const generateWhiteKeys = () => {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const keys = [];

    // Start from A0 (first key on piano)
    keys.push({ n: "A0" }, { n: "B0" });

    // Add full octaves C1-B7
    for (let octave = 1; octave <= 7; octave++) {
      notes.forEach(note => {
        keys.push({ n: `${note}${octave}` });
      });
    }

    // End with C8
    keys.push({ n: "C8" });

    return keys;
  };

  // Generate all black keys
  const generateBlackKeys = () => {
    const keys = [];
    const blackNotePattern = ['C#', 'D#', null, 'F#', 'G#', 'A#'];
    let whiteKeyIndex = 0;

    // Start from A0 (no black key between A0 and B0)
    whiteKeyIndex += 2; // A0, B0

    // Process octaves 1-7
    for (let octave = 1; octave <= 7; octave++) {
      blackNotePattern.forEach((blackNote, patternIndex) => {
        if (blackNote) {
          keys.push({
            n: `${blackNote}${octave}`,
            between: whiteKeyIndex + patternIndex
          });
        }
      });
      whiteKeyIndex += 7; // 7 white keys in an octave
    }

    return keys;
  };

  const whites = generateWhiteKeys();
  const blacks = generateBlackKeys();

  const totalWidth = WHITE_W * whites.length;

  // For better mobile experience - track visible portion
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const pianoRef = useRef(null);

  // Center keyboard on C4 when component mounts
  useEffect(() => {
    const c4Index = whites.findIndex(k => k.n === "C4");
    if (c4Index >= 0 && pianoRef.current) {
      const scrollTo = Math.max(0, (c4Index * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2);
      setScrollPosition(scrollTo);
    }
  }, []);

  // recording state
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartRef = useRef(0);
  const activeNotesRef = useRef({});
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [aiNotes, setAiNotes] = useState([]);

  // song playing state
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  // neural network state
  const [neuralNetwork, setNeuralNetwork] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Initialize neural network on component mount
  useEffect(() => {
    const nn = new TensorFlowMusicNeuralNetwork(88, 256, 88);
    setNeuralNetwork(nn);
  }, []);

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
    setAiNotes([]);
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

  /* ---------- AI Continuation with Custom Neural Network ---------- */
  const continueWithAI = async () => {
    if (recordedNotes.length === 0) {
      alert("Record something first or load a song!");
      return;
    }

    if (!neuralNetwork) {
      alert("Neural network not initialized!");
      return;
    }

    if (!neuralNetwork.isTrained) {
      alert("Please train the neural network first!");
      return;
    }

    // Generate continuation using our custom neural network
    try {
      const seedNotes = recordedNotes.slice(-8); // Use last 8 notes as seed
      const generatedNotes = neuralNetwork.generate(seedNotes, 16, 1.2);

      if (generatedNotes.length > 0) {
        // Align generated notes to end of recorded performance
        const recordedDuration = recordedNotes.length
          ? Math.max(...recordedNotes.map(n => n.time + n.duration))
          : 0;

        const alignedNotes = generatedNotes.map((note, i) => ({
          ...note,
          time: recordedDuration + note.time
        }));

        console.log("AI generated notes:", alignedNotes);
        setAiNotes(alignedNotes);

        // Play AI continuation
        const now = Tone.now() + 0.5;
        alignedNotes.forEach(n => {
          piano.triggerAttackRelease(n.pitch, n.duration, now + n.time);
        });
      } else {
        alert("No notes generated. Try training the model with more data.");
      }
    } catch (error) {
      console.error("Error generating music:", error);
      alert("Error generating music. Check console for details.");
    }
  };

  /* ---------- Train Neural Network ---------- */
  const trainNeuralNetwork = async () => {
    if (!neuralNetwork) {
      alert("Neural network not initialized!");
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Use all songs for training
      const allSongs = getAllSongsForTraining();
      console.log('Training TensorFlow neural network with', allSongs.length, 'songs...');

      // Train with progress callback
      await neuralNetwork.train(allSongs, 50, 32, (progress, logs) => {
        setTrainingProgress(progress * 100);
        console.log(`Training progress: ${(progress * 100).toFixed(1)}% - Loss: ${logs.loss.toFixed(4)}`);
      });

      setTrainingProgress(100);
      alert('TensorFlow neural network training completed! You can now generate music.');
    } catch (error) {
      console.error('Training error:', error);
      alert('Error during training. Check console for details.');
    } finally {
      setIsTraining(false);
      setTimeout(() => setTrainingProgress(0), 2000);
    }
  };

  /* ---------- Quick Train with Current Recording ---------- */
  const quickTrainWithRecording = async () => {
    if (recordedNotes.length === 0) {
      alert("Record something first!");
      return;
    }

    if (!neuralNetwork) {
      alert("Neural network not initialized!");
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Create training data from current recording
      const songData = [{
        name: "User Recording",
        notes: recordedNotes
      }];

      // Train with current recording
      const loss = neuralNetwork.train(songData, 30, 0.02);
      setTrainingProgress(100);

      alert('Quick training completed! Try generating music now.');
    } catch (error) {
      console.error('Quick training error:', error);
      alert('Error during training. Check console for details.');
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  /* ---------- Song Playback ---------- */
  const playSong = async (song) => {
    if (isPlayingSong) return;

    setIsPlayingSong(true);
    setCurrentSong(song);
    await Tone.start();

    const now = Tone.now() + 0.1;

    // Schedule each note in the song
    song.notes.forEach(note => {
      piano.triggerAttackRelease(
        note.pitch,
        note.duration,
        now + note.time
      );
    });

    // Calculate song duration to reset playing state
    const songDuration = Math.max(...song.notes.map(n => n.time + n.duration));
    setTimeout(() => {
      setIsPlayingSong(false);
      setCurrentSong(null);
    }, (songDuration + 1) * 1000); // Add 1 second buffer
  };

  /* ---------- Recording Playback ---------- */
  const playRecording = async () => {
    if (recordedNotes.length === 0) return;
    await Tone.start();
    const now = Tone.now() + 0.1;
    recordedNotes.forEach(n => {
      piano.triggerAttackRelease(n.pitch, Math.max(0.05, n.duration || 0.25), now + n.time);
    });
    aiNotes.forEach(n => {
      piano.triggerAttackRelease(n.pitch, n.duration, now + n.time);
    });
  };

  // Load song as recorded notes for AI training
  const loadSongForTraining = (song) => {
    setRecordedNotes(song.notes);
    setAiNotes([]);
    // Scroll to the appropriate octave range
    const highestNote = song.notes.reduce((highest, note) =>
      note.pitch > highest ? note.pitch : highest, 'C4');
    const highestIndex = whites.findIndex(k => k.n === highestNote);
    if (highestIndex >= 0) {
      setScrollPosition(Math.max(0, (highestIndex * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
    }
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
  /* ---------- UI ---------- */
const recordingDuration = isRecording
  ? ((performance.now() - recordingStartRef.current) / 1000).toFixed(2)
  : (recordedNotes.length
    ? (Math.max(...recordedNotes.map(n => n.time + n.duration))).toFixed(2)
    : "0.00");

return (
  <div className="min-h-screen relative overflow-hidden">
    {/* Main Piano UI with modern styling */}
    <div className="relative z-10 p-6 max-w-7xl mx-auto animate-fadeInUp">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          AI Piano Music Generator
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Create music with artificial intelligence. Play the piano, train the neural network, and generate amazing compositions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {!isRecording ? (
          <button
            className="modern-button error"
            onClick={startRecording}
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Record
          </button>
        ) : (
          <button
            className="modern-button secondary"
            onClick={stopRecording}
          >
            <span className="w-2 h-2 bg-white"></span>
            Stop
          </button>
        )}

        <button
          className="modern-button info"
          onClick={playRecording}
        >
          <span className="w-2 h-2 bg-white"></span>
          Play
        </button>

        <button
          className="modern-button secondary"
          onClick={clearRecording}
        >
          <span className="w-2 h-2 bg-white"></span>
          Clear
        </button>

        <button
          className="modern-button success"
          onClick={exportRecording}
        >
          <span className="w-2 h-2 bg-white"></span>
          Export JSON
        </button>

        <button
          className="modern-button primary"
          onClick={continueWithAI}
          disabled={isTraining || !neuralNetwork?.isTrained}
        >
          <span className="w-2 h-2 bg-white"></span>
          Generate with AI
        </button>

        <button
          className="modern-button warning"
          onClick={trainNeuralNetwork}
          disabled={isTraining}
        >
          {isTraining ? (
            <>
              <span className="w-2 h-2 bg-white animate-spin"></span>
              Training...
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-white"></span>
              Train Model
            </>
          )}
        </button>

        <button
          className="modern-button info"
          onClick={quickTrainWithRecording}
          disabled={isTraining || recordedNotes.length === 0}
        >
          <span className="w-2 h-2 bg-white"></span>
          Quick Train
        </button>

        <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <span className="text-gray-400 text-sm">Duration:</span>
          <span className="text-white font-mono ml-2">{recordingDuration}s</span>
        </div>
      </div>

      {/* Song Library */}
      <div className="song-library">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Song Library</h3>
          <p className="text-gray-400 text-sm">Click to load for AI training</p>
        </div>
        <div className="song-grid">
          {SONGS.map((song, index) => (
            <button
              key={index}
              className={`song-button ${currentSong?.name === song.name ? 'active' : ''}`}
              onClick={() => loadSongForTraining(song)}
              disabled={isPlayingSong}
            >
              {song.name}
            </button>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap mt-4">
          <button
            className="modern-button success"
            onClick={() => {
              const randomSong = getRandomSong();
              playSong(randomSong);
            }}
            disabled={isPlayingSong}
          >
            🎵 Play Random Song
          </button>
          <button
            className="modern-button info"
            onClick={() => {
              const randomSong = getRandomSong();
              loadSongForTraining(randomSong);
            }}
          >
            📚 Load Random Song
          </button>
          {currentSong && (
            <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 flex items-center">
              <span className="text-gray-400 text-sm mr-2">Current:</span>
              <span className="text-purple-400 font-semibold">{currentSong.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Piano Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-white w-full text-center mb-2">Piano Keyboard</h3>
        <button
          className="modern-button info"
          onClick={() => {
            const c3Index = whites.findIndex(k => k.n === "C3");
            if (c3Index >= 0) {
              setScrollPosition(Math.max(0, (c3Index * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
            }
          }}
        >
          C3
        </button>
        <button
          className="modern-button primary"
          onClick={() => {
            const c4Index = whites.findIndex(k => k.n === "C4");
            if (c4Index >= 0) {
              setScrollPosition(Math.max(0, (c4Index * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
            }
          }}
        >
          C4 (Middle)
        </button>
        <button
          className="modern-button info"
          onClick={() => {
            const c5Index = whites.findIndex(k => k.n === "C5");
            if (c5Index >= 0) {
              setScrollPosition(Math.max(0, (c5Index * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
            }
          }}
        >
          C5
        </button>
        <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <span className="text-gray-400 text-sm">88-Key Range:</span>
          <span className="text-white font-mono ml-2">A0 → C8</span>
        </div>
      </div>

      {/* Piano Keyboard Container */}
      <div className="piano-container">
        <div className="piano-keyboard">
          <div
            ref={pianoRef}
            className="relative select-none transition-all duration-300 ease-in-out"
            style={{
              width: totalWidth,
              height: WHITE_H,
              transform: `translateX(${-scrollPosition}px)`
            }}
          >
            {/* White keys */}
            {whites.map((k, i) => (
              <div
                key={k.n}
                className={`piano-key white ${activeNotesRef.current[k.n] ? 'active' : ''}`}
                onMouseDown={() => handleKeyDown(k.n)}
                onMouseUp={() => handleKeyUp(k.n)}
                onMouseLeave={() => handleKeyUp(k.n)}
                onTouchStart={(e) => { e.preventDefault(); handleKeyDown(k.n); }}
                onTouchEnd={() => handleKeyUp(k.n)}
                style={{
                  left: i * WHITE_W,
                }}
              >
                <span className="label">{k.n}</span>
              </div>
            ))}

            {/* Black keys */}
            {blacks.map((b) => {
              const left = (b.between + 1) * WHITE_W - BLACK_W / 2;
              return (
                <div
                  key={b.n}
                  className={`piano-key black ${activeNotesRef.current[b.n] ? 'active' : ''}`}
                  style={{
                    left: left,
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); handleKeyDown(b.n); }}
                  onMouseUp={() => handleKeyUp(b.n)}
                  onMouseLeave={() => handleKeyUp(b.n)}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleKeyDown(b.n); }}
                  onTouchEnd={() => handleKeyUp(b.n)}
                >
                  <span className="label">{b.n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Neural Network Visualization */}
      <div className="w-full">
        <AdvancedNeuralNetworkViz
          neuralNetwork={neuralNetwork}
          isTraining={isTraining}
          trainingProgress={trainingProgress}
        />
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 text-sm font-medium">Recording</h4>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{recordedNotes.length}</div>
          <div className="text-xs text-gray-500">Notes captured</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 text-sm font-medium">AI Generated</h4>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{aiNotes.length}</div>
          <div className="text-xs text-gray-500">AI notes created</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 text-sm font-medium">Neural Network</h4>
            <div className={`w-2 h-2 rounded-full ${neuralNetwork?.isTrained ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
          </div>
          <div className="text-lg font-bold text-white mb-1">
            {neuralNetwork?.isTrained ? 'Trained' : 'Ready'}
          </div>
          <div className="text-xs text-gray-500">
            {neuralNetwork?.isTrained ? 'Model is ready to generate' : 'Train to unlock AI features'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>AI Piano Music Generator • Built with React, TensorFlow.js & Tone.js</p>
        <p className="mt-2">Create amazing music with the power of artificial intelligence</p>
      </div>
    </div>
  </div>
  );
}
