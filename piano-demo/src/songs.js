/* Famous Piano Songs (short excerpts for training) */
export const SONGS = [
  {
    id: "fur_elise",
    name: "Für Elise",
    composer: "Ludwig van Beethoven",
    category: "Classical",
    difficulty: "Intermediate",
    era: "Classical",
    notes: [
      { pitch: "E5", time: 0.0, duration: 0.25 },
      { pitch: "D#5", time: 0.25, duration: 0.25 },
      { pitch: "E5", time: 0.5, duration: 0.25 },
      { pitch: "D#5", time: 0.75, duration: 0.25 },
      { pitch: "E5", time: 1.0, duration: 0.25 },
      { pitch: "B4", time: 1.25, duration: 0.25 },
      { pitch: "D5", time: 1.5, duration: 0.25 },
      { pitch: "C5", time: 1.75, duration: 0.25 },
      { pitch: "A4", time: 2.0, duration: 0.5 },
    ],
    tempo: 120,
    key: "A minor",
    description: "One of Beethoven's most famous melodies"
  },
  {
    id: "moonlight_sonata",
    name: "Moonlight Sonata",
    composer: "Ludwig van Beethoven",
    category: "Classical",
    difficulty: "Advanced",
    era: "Classical",
    notes: [
      { pitch: "G#3", time: 0.0, duration: 1.0 },
      { pitch: "C#4", time: 0.0, duration: 1.0 },
      { pitch: "E4", time: 0.0, duration: 1.0 },
      { pitch: "G#4", time: 1.0, duration: 0.5 },
      { pitch: "F#4", time: 1.5, duration: 0.5 },
      { pitch: "E4", time: 2.0, duration: 0.5 },
      { pitch: "D#4", time: 2.5, duration: 0.5 },
      { pitch: "E4", time: 3.0, duration: 1.0 },
    ],
    tempo: 60,
    key: "C# minor",
    description: "Beethoven's famous haunting melody"
  },
  {
    id: "canon_in_d",
    name: "Canon in D",
    composer: "Johann Pachelbel",
    category: "Classical",
    difficulty: "Intermediate",
    era: "Baroque",
    notes: [
      { pitch: "D4", time: 0.0, duration: 0.5 },
      { pitch: "A3", time: 0.0, duration: 0.5 },
      { pitch: "B3", time: 0.0, duration: 0.5 },
      { pitch: "F#3", time: 0.0, duration: 0.5 },
      { pitch: "G4", time: 0.5, duration: 0.5 },
      { pitch: "D4", time: 0.5, duration: 0.5 },
      { pitch: "A4", time: 1.0, duration: 0.5 },
      { pitch: "F#4", time: 1.0, duration: 0.5 },
      { pitch: "B4", time: 1.5, duration: 0.5 },
      { pitch: "G4", time: 1.5, duration: 0.5 },
    ],
    tempo: 90,
    key: "D major",
    description: "The famous wedding canon progression"
  },
  {
    id: "clair_de_lune",
    name: "Clair de Lune",
    composer: "Claude Debussy",
    category: "Classical",
    difficulty: "Advanced",
    era: "Impressionist",
    notes: [
      { pitch: "F4", time: 0.0, duration: 0.75 },
      { pitch: "G4", time: 0.75, duration: 0.75 },
      { pitch: "A4", time: 1.5, duration: 0.75 },
      { pitch: "B4", time: 2.25, duration: 0.75 },
      { pitch: "D5", time: 3.0, duration: 0.5 },
      { pitch: "C#5", time: 3.5, duration: 0.5 },
      { pitch: "D5", time: 4.0, duration: 1.0 },
    ],
    tempo: 70,
    key: "D major",
    description: "Debussy's dreamlike impressionist masterpiece"
  },
  {
    id: "river_flows_in_you",
    name: "River Flows in You",
    composer: "Yiruma",
    category: "Modern",
    difficulty: "Intermediate",
    era: "Contemporary",
    notes: [
      { pitch: "A4", time: 0.0, duration: 0.5 },
      { pitch: "E5", time: 0.0, duration: 0.5 },
      { pitch: "F#5", time: 0.5, duration: 0.5 },
      { pitch: "E5", time: 1.0, duration: 0.5 },
      { pitch: "D5", time: 1.5, duration: 0.5 },
      { pitch: "E5", time: 2.0, duration: 1.0 },
      { pitch: "A4", time: 2.5, duration: 0.5 },
      { pitch: "E5", time: 3.0, duration: 1.0 },
    ],
    tempo: 85,
    key: "A major",
    description: "Beautiful contemporary piano piece"
  },
  {
    id: "happy_birthday",
    name: "Happy Birthday",
    composer: "Traditional",
    category: "Traditional",
    difficulty: "Beginner",
    era: "Folk",
    notes: [
      { pitch: "C4", time: 0.0, duration: 0.25 },
      { pitch: "C4", time: 0.25, duration: 0.25 },
      { pitch: "D4", time: 0.5, duration: 0.5 },
      { pitch: "C4", time: 1.0, duration: 0.5 },
      { pitch: "F4", time: 1.5, duration: 0.5 },
      { pitch: "E4", time: 2.0, duration: 1.0 },
    ],
    tempo: 120,
    key: "C major",
    description: "The classic birthday celebration song"
  },
  {
    id: "chopsticks",
    name: "Chopsticks",
    composer: "Traditional",
    category: "Traditional",
    difficulty: "Beginner",
    era: "Folk",
    notes: [
      { pitch: "F4", time: 0.0, duration: 0.25 },
      { pitch: "G4", time: 0.25, duration: 0.25 },
      { pitch: "F4", time: 0.5, duration: 0.25 },
      { pitch: "E4", time: 0.75, duration: 0.25 },
      { pitch: "D4", time: 1.0, duration: 0.5 },
      { pitch: "C4", time: 1.5, duration: 0.5 },
      { pitch: "D4", time: 2.0, duration: 0.25 },
      { pitch: "E4", time: 2.25, duration: 0.25 },
      { pitch: "F4", time: 2.5, duration: 0.25 },
      { pitch: "G4", time: 2.75, duration: 0.25 },
    ],
    tempo: 140,
    key: "C major",
    description: "Simple and fun piano exercise"
  },
  {
    id: "heart_and_soul",
    name: "Heart and Soul",
    composer: "Hoagy Carmichael",
    category: "Jazz",
    difficulty: "Beginner",
    era: "1930s",
    notes: [
      { pitch: "C4", time: 0.0, duration: 0.5 },
      { pitch: "E4", time: 0.5, duration: 0.5 },
      { pitch: "G4", time: 1.0, duration: 0.5 },
      { pitch: "C5", time: 1.5, duration: 0.5 },
      { pitch: "G4", time: 2.0, duration: 0.5 },
      { pitch: "E4", time: 2.5, duration: 0.5 },
      { pitch: "C4", time: 3.0, duration: 1.0 },
    ],
    tempo: 100,
    key: "C major",
    description: "Classic jazz progression everyone knows"
  },
  {
    id: "ode_to_joy",
    name: "Ode to Joy",
    composer: "Ludwig van Beethoven",
    category: "Classical",
    difficulty: "Beginner",
    era: "Classical",
    notes: [
      { pitch: "E4", time: 0.0, duration: 0.5 },
      { pitch: "E4", time: 0.5, duration: 0.5 },
      { pitch: "F4", time: 1.0, duration: 0.5 },
      { pitch: "G4", time: 1.5, duration: 0.5 },
      { pitch: "G4", time: 2.0, duration: 0.5 },
      { pitch: "F4", time: 2.5, duration: 0.5 },
      { pitch: "E4", time: 3.0, duration: 0.5 },
      { pitch: "D4", time: 3.5, duration: 0.5 },
    ],
    tempo: 120,
    key: "C major",
    description: "Beethoven's joyful and uplifting melody"
  },
  {
    id: "piano_man",
    name: "Piano Man Intro",
    composer: "Billy Joel",
    category: "Pop",
    difficulty: "Intermediate",
    era: "1970s",
    notes: [
      { pitch: "G3", time: 0.0, duration: 0.5 },
      { pitch: "C4", time: 0.5, duration: 0.5 },
      { pitch: "E4", time: 1.0, duration: 0.5 },
      { pitch: "F4", time: 1.5, duration: 0.5 },
      { pitch: "G4", time: 2.0, duration: 0.5 },
      { pitch: "E4", time: 2.5, duration: 0.5 },
      { pitch: "C4", time: 3.0, duration: 1.0 },
    ],
    tempo: 110,
    key: "C major",
    description: "The iconic opening of Billy Joel's classic"
  }
];

// Song categories configuration
export const SONG_CATEGORIES = {
  Classical: {
    name: "Classical",
    description: "Timeless masterpieces from the greatest composers",
    color: "from-purple-500 to-indigo-500",
    icon: "🎼"
  },
  Modern: {
    name: "Modern & Contemporary",
    description: "Contemporary piano pieces and modern compositions",
    color: "from-blue-500 to-cyan-500",
    icon: "🎹"
  },
  Traditional: {
    name: "Traditional & Folk",
    description: "Classic folk songs and traditional melodies",
    color: "from-green-500 to-emerald-500",
    icon: "🎵"
  },
  Jazz: {
    name: "Jazz & Blues",
    description: "Jazz standards and blues progressions",
    color: "from-orange-500 to-red-500",
    icon: "🎺"
  },
  Pop: {
    name: "Pop & Rock",
    description: "Popular songs and rock piano classics",
    color: "from-pink-500 to-rose-500",
    icon: "🎤"
  }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  Beginner: {
    name: "Beginner",
    description: "Perfect for starting out",
    color: "text-green-400 bg-green-500/20 border-green-500/30"
  },
  Intermediate: {
    name: "Intermediate",
    description: "Some experience required",
    color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
  },
  Advanced: {
    name: "Advanced",
    description: "Challenging pieces",
    color: "text-red-400 bg-red-500/20 border-red-500/30"
  }
};

// Utility function to get all songs for training
export const getAllSongsForTraining = () => {
  return SONGS.map(song => ({
    ...song,
    id: song.id || song.name.replace(/\s+/g, '_').toLowerCase()
  }));
};

// Utility function to get a random song
export const getRandomSong = () => {
  const randomIndex = Math.floor(Math.random() * SONGS.length);
  return SONGS[randomIndex];
};

// Utility function to get songs by category
export const getSongsByCategory = (category) => {
  return SONGS.filter(song => song.category === category);
};

// Utility function to get songs by difficulty
export const getSongsByDifficulty = (difficulty) => {
  return SONGS.filter(song => song.difficulty === difficulty);
};

// Utility function to get unique categories
export const getCategories = () => {
  return [...new Set(SONGS.map(song => song.category))];
};

// Utility function to search songs
export const searchSongs = (query) => {
  const searchTerm = query.toLowerCase();
  return SONGS.filter(song =>
    song.name.toLowerCase().includes(searchTerm) ||
    song.composer.toLowerCase().includes(searchTerm) ||
    song.category.toLowerCase().includes(searchTerm) ||
    song.description?.toLowerCase().includes(searchTerm)
  );
};

// Utility function to normalize note timing for training
export const normalizeSongForTraining = (song) => {
  const notes = song.notes.map(note => ({
    ...note,
    time: note.time / song.tempo * 60, // Convert to absolute time
  }));

  return {
    ...song,
    notes: notes.sort((a, b) => a.time - b.time)
  };
};