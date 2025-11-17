/* Custom Neural Network for Music Generation */

// Neural Network Architecture
class MusicNeuralNetwork {
  constructor(inputSize = 88, hiddenSize = 256, outputSize = 88) {
    this.inputSize = inputSize; // 88 piano keys
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Initialize weights and biases
    this.weightsIH = this.initializeMatrix(hiddenSize, inputSize);
    this.weightsHH = this.initializeMatrix(hiddenSize, hiddenSize);
    this.weightsHO = this.initializeMatrix(outputSize, hiddenSize);

    this.biasH = this.initializeVector(hiddenSize);
    this.biasO = this.initializeVector(outputSize);

    // Training data
    this.trainingData = [];
    this.isTrained = false;
    this.trainingLoss = [];
  }

  // Initialize matrix with random values
  initializeMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() - 0.5) * 0.2;
      }
    }
    return matrix;
  }

  // Initialize vector with random values
  initializeVector(size) {
    return Array(size).fill(0).map(() => (Math.random() - 0.5) * 0.2);
  }

  // Convert note to one-hot encoding
  noteToOneHot(note) {
    const oneHot = new Array(this.inputSize).fill(0);
    const noteToIndex = this.getNoteIndex(note);
    if (noteToIndex >= 0 && noteToIndex < this.inputSize) {
      oneHot[noteToIndex] = 1;
    }
    return oneHot;
  }

  // Convert one-hot encoding back to note
  oneHotToNote(oneHot) {
    const maxIndex = oneHot.indexOf(Math.max(...oneHot));
    return this.indexToNote(maxIndex);
  }

  // Note to index mapping (A0 = 0, C8 = 87)
  getNoteIndex(note) {
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    if (note.length === 2) {
      const pitch = note[0];
      const octave = parseInt(note[1]);
      return octave * 12 + noteMap[pitch] - 9; // A0 is index 0
    } else if (note.length === 3) {
      const pitch = note.substring(0, 2);
      const octave = parseInt(note[2]);
      return octave * 12 + noteMap[pitch] - 9;
    }
    return -1;
  }

  // Index to note mapping
  indexToNote(index) {
    if (index < 0 || index >= this.inputSize) return null;

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor((index + 9) / 12);
    const noteIndex = (index + 9) % 12;
    return notes[noteIndex] + octave;
  }

  // Forward pass through the network
  forward(input, hidden = null) {
    if (!hidden) {
      hidden = new Array(this.hiddenSize).fill(0);
    }

    // Simple forward pass (no gates for simplicity)
    const newHidden = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = this.biasH[i];
      for (let j = 0; j < this.inputSize; j++) {
        sum += input[j] * this.weightsIH[i][j];
      }
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += hidden[j] * this.weightsHH[i][j];
      }
      newHidden[i] = this.tanh(sum);
    }

    // Output layer
    const output = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.biasO[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += newHidden[j] * this.weightsHO[i][j];
      }
      output[i] = this.tanh(sum);
    }

    // Apply softmax to output
    const softmaxOutput = this.softmax(output);

    return { output: softmaxOutput, hidden: newHidden };
  }

  // Activation functions
  tanh(x) {
    return Math.tanh(x);
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }

  // Generate music sequence
  generate(seedNotes, length = 32, temperature = 1.0) {
    if (!this.isTrained) {
      console.warn('Model is not trained yet');
      return [];
    }

    const sequence = [];
    let hidden = null;

    // Process seed notes
    for (const note of seedNotes) {
      const input = this.noteToOneHot(note.pitch);
      const result = this.forward(input, hidden);
      hidden = result.hidden;
      sequence.push({
        pitch: note.pitch,
        time: note.time,
        duration: note.duration
      });
    }

    // Generate new notes
    for (let i = 0; i < length; i++) {
      const lastNote = sequence[sequence.length - 1];
      const input = this.noteToOneHot(lastNote.pitch);
      const result = this.forward(input, hidden);
      hidden = result.hidden;

      // Sample from output distribution with temperature
      const outputWithTemp = result.output.map(x => Math.pow(x, 1 / temperature));
      const sum = outputWithTemp.reduce((a, b) => a + b, 0);
      const normalizedOutput = outputWithTemp.map(x => x / sum);

      // Sample from distribution
      let random = Math.random();
      let selectedIndex = 0;
      for (let j = 0; j < normalizedOutput.length; j++) {
        random -= normalizedOutput[j];
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      const newNote = this.oneHotToNote(normalizedOutput);
      if (newNote) {
        sequence.push({
          pitch: newNote,
          time: lastNote.time + (Math.random() * 0.5 + 0.25), // Random timing
          duration: Math.random() * 0.5 + 0.25 // Random duration
        });
      }
    }

    return sequence.slice(seedNotes.length); // Return only generated notes
  }

  // Training function
  train(songData, epochs = 100, learningRate = 0.01) {
    console.log('Starting training...');
    this.trainingData = this.preprocessTrainingData(songData);

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;

      for (let i = 0; i < this.trainingData.length - 1; i++) {
        const input = this.trainingData[i];
        const target = this.trainingData[i + 1];

        // Forward pass
        const result = this.forward(input);

        // Calculate loss (cross-entropy)
        let loss = 0;
        for (let j = 0; j < this.outputSize; j++) {
          loss -= target[j] * Math.log(result.output[j] + 1e-10);
        }
        totalLoss += loss;

        // Simple gradient descent update (simplified for demo)
        if (epoch % 10 === 0) {
          this.updateWeights(input, result.output, target, result.hidden, learningRate);
        }
      }

      const avgLoss = totalLoss / (this.trainingData.length - 1);
      this.trainingLoss.push(avgLoss);

      if (epoch % 10 === 0) {
        console.log(`Epoch ${epoch}, Loss: ${avgLoss.toFixed(4)}`);
      }
    }

    this.isTrained = true;
    console.log('Training completed!');
    return this.trainingLoss;
  }

  // Preprocess training data from songs
  preprocessTrainingData(songData) {
    const processed = [];

    for (const song of songData) {
      for (const note of song.notes) {
        processed.push(this.noteToOneHot(note.pitch));
      }
    }

    return processed;
  }

  // Update weights (simplified gradient descent)
  updateWeights(input, output, target, hidden, learningRate) {
    // Calculate output error
    const outputError = [];
    for (let i = 0; i < this.outputSize; i++) {
      outputError[i] = output[i] - target[i];
    }

    // Update output weights
    for (let i = 0; i < this.outputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsHO[i][j] -= learningRate * outputError[i] * hidden[j];
      }
      this.biasO[i] -= learningRate * outputError[i];
    }

    // Simplified hidden weight update
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.inputSize; j++) {
        this.weightsIH[i][j] -= learningRate * 0.01 * (Math.random() - 0.5);
      }
      this.biasH[i] -= learningRate * 0.01 * (Math.random() - 0.5);
    }
  }

  // Get network visualization data
  getVisualizationData() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      isTrained: this.isTrained,
      trainingLoss: this.trainingLoss,
      connections: {
        inputToHidden: this.weightsIH.length * this.weightsIH[0].length,
        hiddenToHidden: this.weightsHH.length * this.weightsHH[0].length,
        hiddenToOutput: this.weightsHO.length * this.weightsHO[0].length
      }
    };
  }
}

export default MusicNeuralNetwork;