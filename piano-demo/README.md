# AI-Driven Piano Music Generator

An interactive piano application with custom deep learning music generation capabilities. Features a full 88-key piano, song library, and trainable neural network for AI music composition.

## 🎹 Features

### Full 88-Key Piano
- Complete piano keyboard from A0 to C8
- Realistic piano sounds using Tone.js sampler
- Touch and mouse support
- Navigation controls for different octaves (C3, C4, C5)
- Responsive design with scrollable interface

### 🎵 Song Library
- **10 Famous Piano Songs** included:
  - Für Elise - Beethoven
  - Moonlight Sonata - Beethoven
  - Canon in D - Pachelbel
  - Clair de Lune - Debussy
  - River Flows in You - Yiruma
  - Happy Birthday - Traditional
  - Chopsticks - Traditional
  - Heart and Soul - Hoagy Carmichael
  - Ode to Joy - Beethoven
  - Piano Man Intro - Billy Joel

- Each song is cut after a few notes, perfect for AI training
- Click songs to load them for training/playback
- Random song selection for variety

### 🧠 Custom Neural Network
- **LSTM-based Architecture** (88 → 256 → 88 neurons)
- Real-time music generation and continuation
- Two training modes:
  - **Full Training**: Train on all song library data (50 epochs)
  - **Quick Training**: Train on your current recording (30 epochs)
- Temperature-controlled generation for creativity control
- Note-to-note prediction with proper timing

### 📊 Neural Network Visualization
- Interactive visualization of network architecture
- Real-time activation heatmaps
- Training loss graph
- Layer-by-layer node representation
- Connection weight visualization
- Live training progress updates

### 🎮 Controls
- **Recording**: Record your piano performances
- **Playback**: Play recordings with AI-generated continuations
- **Training**: Train the neural network with one click
- **Export**: Save recordings as JSON files
- **AI Generation**: Generate musical continuations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd piano-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Play Piano**: Click or touch the piano keys to play
2. **Load Songs**: Click song buttons to load famous melodies
3. **Train Model**:
   - Click "🧠 Train Model" to train on all songs
   - Or record something and click "⚡ Quick Train"
4. **Generate Music**: Click "✨ Generate with AI" to create continuations
5. **View Network**: Watch the neural network visualization during training

## 🎯 How It Works

### Neural Network Architecture
```
Input Layer (88 nodes) → Hidden Layer (256 nodes) → Output Layer (88 nodes)
```
- **Input Layer**: One-hot encoding of current piano note
- **Hidden Layer**: LSTM-style recurrent processing for sequence memory
- **Output Layer**: Probability distribution over all 88 piano keys

### Training Process
1. **Data Preparation**: Convert songs to note sequences
2. **Forward Pass**: Input notes through the network
3. **Loss Calculation**: Cross-entropy loss vs target notes
4. **Backpropagation**: Update weights using gradient descent
5. **Iteration**: Repeat for multiple epochs

### Music Generation
1. **Seed Selection**: Use last 8 notes as context
2. **Prediction**: Generate probability distribution for next note
3. **Sampling**: Sample from distribution with temperature control
4. **Continuation**: Repeat for desired length

## 🛠️ Technical Details

### Technologies Used
- **React 19**: Modern UI framework
- **Tone.js**: High-quality audio synthesis
- **Vite**: Fast development build tool
- **Tailwind CSS**: Utility-first styling
- **Custom Neural Network**: Pure JavaScript implementation

### File Structure
```
src/
├── Piano.jsx              # Main piano component
├── songs.js               # Song library data
├── neuralNetwork.js       # Custom neural network implementation
├── NeuralNetworkViz.jsx   # Network visualization component
├── App.jsx                # Application entry point
└── utils/
    └── conversion.js      # Music data utilities
```

### Network Parameters
- **Input Size**: 88 (full piano range)
- **Hidden Size**: 256 (LSTM units)
- **Output Size**: 88 (full piano range)
- **Learning Rate**: 0.01 (adaptive)
- **Activation**: Tanh (hidden), Softmax (output)
- **Loss Function**: Cross-entropy

## 🎨 Features

### Recording System
- Real-time note capture with timing
- Accurate duration measurement
- Multiple simultaneous notes support
- Export functionality for analysis

### AI Music Generation
- Context-aware continuation
- Creativity control via temperature parameter
- Proper timing and duration generation
- Integration with piano playback

### Visualization
- Real-time network activity display
- Training progress monitoring
- Loss tracking graph
- Interactive node activation

## 🔮 Future Enhancements

- **Advanced Training**: More sophisticated training algorithms
- **Multi-instrument**: Support for different instruments
- **Music Theory**: Incorporate music theory constraints
- **Style Transfer**: Train on different music styles
- **Real-time Collaboration**: Multi-user jam sessions
- **Audio Export**: Generate audio files

## 📝 Notes

- The neural network is implemented from scratch in JavaScript for educational purposes
- Training is performed locally in the browser
- Song excerpts are short and intentionally cut to demonstrate AI continuation
- The visualization provides educational insight into how neural networks process music

## 🐛 Troubleshooting

- **No Sound**: Click anywhere on the page first to unlock audio context
- **Slow Training**: Training is computationally intensive; use "Quick Train" for faster results
- **Poor Generation**: Train the model more or use better quality training data
- **Performance**: The 88-key piano is resource-intensive; consider using fewer keys if needed

---

**Built with ❤️ using React, Tone.js, and Pure JavaScript Neural Networks**
