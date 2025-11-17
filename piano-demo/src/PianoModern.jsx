import {
  SONGS,
  SONG_CATEGORIES,
  DIFFICULTY_LEVELS,
  getAllSongsForTraining,
  getRandomSong,
  getSongsByCategory,
  getSongsByDifficulty,
  getCategories,
  searchSongs
} from "./songs.js";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Square, Trash2, Download, Brain, Zap, Piano as PianoIcon, Volume2, Mic, MicOff, Settings, RefreshCw } from "lucide-react";
import * as Tone from "tone";
import { Link } from "react-router-dom";
import { useNeuralNetwork } from "./contexts/NeuralNetworkContext.jsx";

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

/* ---------- Modern Piano Component ---------- */
export default function PianoModern() {
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

  // Song library state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSong, setExpandedSong] = useState(null);

  // Use neural network context
  const { neuralNetwork, isTraining, trainingProgress, isLoading, trainModel, generateMusic, recheckSavedModel } = useNeuralNetwork();

  // Song library dropdown state
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const [justPlayedSong, setJustPlayedSong] = useState(false);

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
      const generatedNotes = generateMusic(seedNotes, 16, 1.2);

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
    try {
      if (isLoading) {
        alert('Neural network is still loading. Please wait a moment and try again.');
        return;
      }

      // Use all songs for training
      const allSongs = getAllSongsForTraining();
      console.log('Training TensorFlow neural network with', allSongs.length, 'songs...');

      // Train with optimized parameters for better convergence
      await trainModel(allSongs, 30, 16); // Fewer epochs, smaller batch size for better generalization

      alert('🎉 Training completed! Model saved automatically and ready to use.');
    } catch (error) {
      console.error('Training error:', error);
      alert('Error during training. Check console for details.');
    }
  };

  /* ---------- Quick Train with Current Recording ---------- */
  const quickTrainWithRecording = async () => {
    if (recordedNotes.length === 0) {
      alert("Record something first!");
      return;
    }

    try {
      // Create training data from current recording
      const songData = [{
        name: "User Recording",
        notes: recordedNotes
      }];

      // Train with current recording
      await trainModel(songData, 30, 8);

      alert('Quick training completed! Try generating music now.');
    } catch (error) {
      console.error('Quick training error:', error);
      alert('Error during training. Check console for details.');
    }
  };

  /* ---------- Song Playback ---------- */
  const playSong = async (song) => {
    if (isPlayingSong) return;

    setIsPlayingSong(true);
    setCurrentSong(song);
    setJustPlayedSong(false);
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
      setJustPlayedSong(true);
    }, (songDuration + 0.5) * 1000); // Reduced buffer
  };

  // Continue song with AI
  const continueSongWithAI = async () => {
    if (!currentSong || !neuralNetwork?.isTrained) return;

    try {
      // Use the last few notes of the played song as seed
      const seedNotes = currentSong.notes.slice(-6);
      const generatedNotes = generateMusic(seedNotes, 12, 1.2);

      if (generatedNotes.length > 0) {
        // Calculate where to start the AI continuation
        const songDuration = Math.max(...currentSong.notes.map(n => n.time + n.duration));

        const alignedNotes = generatedNotes.map((note, i) => ({
          ...note,
          time: songDuration + note.time
        }));

        // Play AI continuation
        const now = Tone.now() + 0.5;
        alignedNotes.forEach(n => {
          piano.triggerAttackRelease(n.pitch, n.duration, now + n.time);
        });

        // Add to AI notes for tracking
        setAiNotes(prev => [...prev, ...alignedNotes]);
      }
    } catch (error) {
      console.error("Error generating AI continuation:", error);
    }
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
    setExpandedSong(song.id);
    // Scroll to the appropriate octave range
    const highestNote = song.notes.reduce((highest, note) =>
      note.pitch > highest ? note.pitch : highest, 'C4');
    const highestIndex = whites.findIndex(k => k.n === highestNote);
    if (highestIndex >= 0) {
      setScrollPosition(Math.max(0, (highestIndex * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
    }
  };

  // Filter songs based on selected criteria
  const getFilteredSongs = () => {
    let filtered = SONGS;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(song => song.category === selectedCategory);
    }

    if (selectedDifficulty !== "All") {
      filtered = filtered.filter(song => song.difficulty === selectedDifficulty);
    }

    if (searchQuery) {
      filtered = searchSongs(searchQuery);
    }

    return filtered;
  };

  // Get song count for each category
  const getCategoryCount = (category) => {
    if (category === "All") return SONGS.length;
    return getSongsByCategory(category).length;
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

  // Calculate recording duration
  const recordingDuration = isRecording
    ? ((performance.now() - recordingStartRef.current) / 1000).toFixed(2)
    : (recordedNotes.length
      ? (Math.max(...recordedNotes.map(n => n.time + n.duration))).toFixed(2)
      : "0.00");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 pt-20">
      <div className="flex h-screen pt-0">
        {/* Left Sidebar - Recording Controls */}
        <div className="w-80 bg-gray-800/50 backdrop-blur-lg border-r border-purple-500/20 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Controls</h2>
            <p className="text-sm text-gray-400">Record, play, and create music</p>
          </div>

          {/* Recording Status */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-xs text-gray-300">{isRecording ? 'Recording' : 'Idle'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Notes</span>
              <span className="text-sm text-white">{recordedNotes.length}</span>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="space-y-3 mb-6">
            <AnimatePresence mode="wait">
              {!isRecording ? (
                <motion.button
                  key="record"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={startRecording}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-3 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">Record</span>
                </motion.button>
              ) : (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={stopRecording}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  <MicOff className="w-5 h-5" />
                  <span className="font-medium">Stop ({recordingDuration}s)</span>
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={playRecording}
              disabled={recordedNotes.length === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span className="font-medium">Play Recording</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearRecording}
              disabled={recordedNotes.length === 0 && aiNotes.length === 0}
              className="w-full bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Clear</span>
            </motion.button>
          </div>

          {/* AI Controls */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">AI Assistant</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={continueWithAI}
                disabled={isTraining || !neuralNetwork?.isTrained}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Brain className="w-5 h-5" />
                <span className="font-medium">Generate with AI</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={trainNeuralNetwork}
                disabled={isTraining || isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTraining ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Settings className="w-5 h-5" />
                    </motion.div>
                    <span className="font-medium">Training...</span>
                  </>
                ) : isLoading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Settings className="w-5 h-5" />
                    </motion.div>
                    <span className="font-medium">Loading AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">
                      {neuralNetwork?.isTrained ? '🔄 Retrain AI' : '⚡ Train AI'}
                    </span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Training Progress */}
            {isTraining && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Progress</span>
                  <span>{trainingProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    style={{ width: `${trainingProgress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${trainingProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Manual Model Reload (for debugging) */}
            {!isTraining && !neuralNetwork?.isTrained && (
              <div className="mt-4">
                <button
                  onClick={async () => {
                    const reloaded = await recheckSavedModel();
                    if (reloaded) {
                      alert('✅ Model loaded successfully!');
                    } else {
                      alert('❌ No saved model found. Please train the AI first.');
                    }
                  }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>🔄 Reload Saved Model</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Status */}
          <div className="mt-6 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${neuralNetwork?.isTrained ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                <span className="text-xs text-gray-300">
                  AI: {neuralNetwork?.isTrained ? '✅ Ready' : '⏳ Not Trained'}
                </span>
              </div>

              {neuralNetwork?.isTrained && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="text-green-400">💾</span>
                  <span>Model loaded from browser storage</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
        {/* Simplified Header */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              AI Piano Studio
            </h1>
            <p className="text-gray-300">Play, record, and create music with AI</p>
          </div>

          {/* Song Library Dropdown */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSongDropdown(!showSongDropdown)}
                className="w-full bg-gray-800/50 backdrop-blur-lg border border-purple-500/20 rounded-lg p-4 flex items-center justify-between text-white hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5" />
                  <span>Choose a song to play</span>
                </div>
                <motion.div
                  animate={{ rotate: showSongDropdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Play className="w-5 h-5" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showSongDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-lg border border-purple-500/20 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="p-2">
                      {getFilteredSongs().map((song) => (
                        <motion.button
                          key={song.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            loadSongForTraining(song);
                            playSong(song);
                            setShowSongDropdown(false);
                          }}
                          disabled={isPlayingSong}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-700/50 transition-all text-white disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{song.name}</div>
                              <div className="text-xs text-gray-400">{song.composer} • {song.category}</div>
                            </div>
                            <Play className="w-4 h-4 text-purple-400" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Continue Option */}
          {justPlayedSong && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-center text-white mb-3">Continue this song with AI?</p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={continueSongWithAI}
                    disabled={!neuralNetwork?.isTrained}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Brain className="w-4 h-4 inline mr-2" />
                    Continue with AI
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setJustPlayedSong(false)}
                    className="flex-1 bg-gray-600 text-white rounded-lg p-2"
                  >
                    No thanks
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Piano Keyboard */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Virtual Piano</h2>
            <p className="text-gray-400">Click the keys to play, or use the recording controls on the left</p>
          </div>

        {/* Piano Navigation */}
        <div className="flex justify-center gap-4 mb-6">
          {['C3', 'C4', 'C5'].map((note) => (
            <motion.button
              key={note}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const index = whites.findIndex(k => k.n === note);
                if (index >= 0) {
                  setScrollPosition(Math.max(0, (index * WHITE_W) - (window.innerWidth / 2) + WHITE_W / 2));
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                note === 'C4'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {note}
              {note === 'C4' && ' (Middle)'}
            </motion.button>
          ))}
        </div>

        {/* Piano Keyboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #06b6d4 50%, #7c3aed 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            border: '2px solid #3b82f6',
            margin: '2rem auto',
            maxWidth: '100%',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: WHITE_H,
            position: 'relative',
            borderRadius: '1rem',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #2a2f3e 0%, #1a1f2e 100%)'
          }}>
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
                <motion.div
                  key={k.n}
                  className={`piano-key ${activeNotesRef.current[k.n] ? 'active' : ''}`}
                  onMouseDown={() => handleKeyDown(k.n)}
                  onMouseUp={() => handleKeyUp(k.n)}
                  onMouseLeave={() => handleKeyUp(k.n)}
                  onTouchStart={(e) => { e.preventDefault(); handleKeyDown(k.n); }}
                  onTouchEnd={() => handleKeyUp(k.n)}
                  style={{
                    position: 'absolute',
                    left: i * WHITE_W,
                    top: 0,
                    width: WHITE_W,
                    height: WHITE_H,
                    background: activeNotesRef.current[k.n]
                      ? 'linear-gradient(180deg, #e9ecef 0%, #dee2e6 50%, #ced4da 100%)'
                      : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
                    border: '1px solid #dee2e6',
                    borderRadius: '0 0 8px 8px',
                    margin: '0 -1px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    boxShadow: activeNotesRef.current[k.n]
                      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
                      : 'inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
                    transform: activeNotesRef.current[k.n] ? 'translateY(2px)' : 'translateY(0)',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    userSelect: 'none',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    pointerEvents: 'none'
                  }}>{k.n}</span>
                </motion.div>
              ))}

              {/* Black keys */}
              {blacks.map((b) => {
                const left = (b.between + 1) * WHITE_W - BLACK_W / 2;
                return (
                  <motion.div
                    key={b.n}
                    className={`piano-key ${activeNotesRef.current[b.n] ? 'active' : ''}`}
                    style={{
                      position: 'absolute',
                      left: left,
                      top: 0,
                      width: BLACK_W,
                      height: BLACK_H,
                      background: activeNotesRef.current[b.n]
                        ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
                        : 'linear-gradient(180deg, #343a40 0%, #212529 50%, #000000 100%)',
                      borderRadius: '0 0 6px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      boxShadow: activeNotesRef.current[b.n]
                        ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.2)'
                        : '0 6px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      transform: activeNotesRef.current[b.n] ? 'translateY(2px)' : 'translateY(0)',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: 2,
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); handleKeyDown(b.n); }}
                    onMouseUp={() => handleKeyUp(b.n)}
                    onMouseLeave={() => handleKeyUp(b.n)}
                    onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleKeyDown(b.n); }}
                    onTouchEnd={() => handleKeyUp(b.n)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{
                      marginBottom: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: activeNotesRef.current[b.n] ? '#fbbf24' : '#ffffff',
                      pointerEvents: 'none'
                    }}>{b.n}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Neural Network CTA */}
        <div className="text-center mt-8">
          <Link
            to="/neural-network"
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            <Brain className="w-5 h-5" />
            <span>View Neural Network Visualization</span>
          </Link>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}