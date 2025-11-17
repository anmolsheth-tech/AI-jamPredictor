import * as tf from '@tensorflow/tfjs';

class TensorFlowMusicNeuralNetwork {
  constructor(inputSize = 88, hiddenSize = 256, outputSize = 88) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    this.model = null;
    this.isTrained = false;
    this.trainingHistory = [];
    this.modelInitialized = false;
  }

  async initializeModel() {
    const SEQUENCE_LENGTH = 4; // Must match preprocessTrainingData

    // Create LSTM-based neural network for sequence prediction
    this.model = tf.sequential({
      layers: [
        // First LSTM layer - directly processes 3D input
        tf.layers.lstm({
          inputShape: [SEQUENCE_LENGTH, this.inputSize], // [timesteps, features]
          units: 256,
          returnSequences: true, // Return full sequence for next LSTM layer
          kernelInitializer: 'glorotNormal',
          dropout: 0.2,
          recurrentDropout: 0.2
        }),

        // Second LSTM layer
        tf.layers.lstm({
          units: 128,
          returnSequences: false, // Return only final output
          kernelInitializer: 'glorotNormal',
          dropout: 0.2,
          recurrentDropout: 0.2
        }),

        // Dense layers for processing
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),

        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),

        // Output layer - predict next note
        tf.layers.dense({
          units: this.outputSize,
          activation: 'softmax',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    // Compile the model with optimized learning rate for music generation
    this.model.compile({
      optimizer: tf.train.adam(0.001), // Standard learning rate for LSTM
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    console.log('TensorFlow LSTM model initialized successfully');
    console.log(`Input shape: [null, ${SEQUENCE_LENGTH}, ${this.inputSize}]`);
    this.modelInitialized = true;
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
  oneHotToNote(oneHotTensor) {
    const values = oneHotTensor.arraySync();
    const maxIndex = values.indexOf(Math.max(...values));
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

  // Preprocess training data for LSTM sequences (3D tensors)
  preprocessTrainingData(songData) {
    const SEQUENCE_LENGTH = 4; // Use 4-note sequences for context
    const sequences = [];
    const labels = [];

    console.log('Preprocessing training data for LSTM sequences...');

    songData.forEach((song, songIndex) => {
      if (song.notes && song.notes.length > SEQUENCE_LENGTH) {
        // Create sliding window sequences
        for (let i = 0; i <= song.notes.length - SEQUENCE_LENGTH - 1; i++) {
          const sequence = [];

          // Create input sequence (SEQUENCE_LENGTH notes)
          for (let j = 0; j < SEQUENCE_LENGTH; j++) {
            sequence.push(this.noteToOneHot(song.notes[i + j].pitch));
          }

          // Create output label (next note)
          const nextNote = this.noteToOneHot(song.notes[i + SEQUENCE_LENGTH].pitch);

          sequences.push(sequence);
          labels.push(nextNote);
        }

        // Add augmented sequences by transposing
        if (song.notes.length > SEQUENCE_LENGTH + 2) {
          const originalLength = sequences.length;

          // Create transposed versions (up and down semitones)
          for (let transpose of [-2, -1, 1, 2]) {
            for (let i = 0; i <= song.notes.length - SEQUENCE_LENGTH - 1; i++) {
              const augmentedSequence = [];
              let validSequence = true;

              // Create transposed input sequence
              for (let j = 0; j < SEQUENCE_LENGTH; j++) {
                const transposedNote = this.transposeNote(song.notes[i + j].pitch, transpose);
                if (transposedNote) {
                  augmentedSequence.push(this.noteToOneHot(transposedNote));
                } else {
                  validSequence = false;
                  break;
                }
              }

              // Create transposed output note
              const transposedNext = this.transposeNote(song.notes[i + SEQUENCE_LENGTH].pitch, transpose);

              if (validSequence && transposedNext) {
                sequences.push(augmentedSequence);
                labels.push(this.noteToOneHot(transposedNext));
              }
            }
          }

          console.log(`Song ${songIndex + 1}: ${originalLength} sequences -> ${sequences.length} sequences with augmentation`);
        }
      }
    });

    if (sequences.length === 0) {
      throw new Error('No valid training sequences generated. Please check your song data.');
    }

    console.log(`Generated ${sequences.length} training sequences of length ${SEQUENCE_LENGTH}`);

    // Shuffle sequences to improve training
    const indices = Array.from({length: sequences.length}, (_, i) => i);
    this.shuffleArray(indices);

    const shuffledSequences = indices.map(i => sequences[i]);
    const shuffledLabels = indices.map(i => labels[i]);

    // Convert to 3D tensors for LSTM: [batch_size, sequence_length, features]
    return {
      sequences: tf.tensor3d(shuffledSequences, [shuffledSequences.length, SEQUENCE_LENGTH, this.inputSize]),
      labels: tf.tensor2d(shuffledLabels)
    };
  }

  // Transpose note by semitones
  transposeNote(note, semitones) {
    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteRegex = /^([A-G]#?)(\d+)$/;
    const match = note.match(noteRegex);

    if (!match) return null;

    let [, noteName, octave] = match;
    const noteIndex = noteMap.indexOf(noteName);

    if (noteIndex === -1) return null;

    let newNoteIndex = (noteIndex + semitones + 12) % 12;
    let newOctave = parseInt(octave) + Math.floor((noteIndex + semitones) / 12);

    if (newOctave < 1 || newOctave > 8) return null;

    return noteMap[newNoteIndex] + newOctave;
  }

  // Shuffle array in place
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Train the model
  async train(songData, epochs = 50, batchSize = 32, onProgress = null) {
    if (!this.modelInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    console.log('Starting TensorFlow training...');

    // Preprocess data
    const { sequences, labels } = this.preprocessTrainingData(songData);

    const callbacks = {
      onEpochEnd: (epoch, logs) => {
        const trainAcc = logs.acc || logs.accuracy;
        const valAcc = logs.val_acc || logs.val_accuracy;
        const trainLoss = logs.loss;
        const valLoss = logs.val_loss;

        console.log(`Epoch ${epoch + 1}: train_loss = ${trainLoss.toFixed(4)}, val_loss = ${valLoss?.toFixed(4) || 'N/A'}, train_acc = ${trainAcc.toFixed(4)}, val_acc = ${valAcc?.toFixed(4) || 'N/A'}`);
        this.trainingHistory.push({
          epoch: epoch + 1,
          loss: trainLoss,
          valLoss: valLoss,
          accuracy: trainAcc,
          valAccuracy: valAcc
        });

        if (onProgress) {
          onProgress((epoch + 1) / epochs, logs);
        }
      }
    };

    // Get the actual sequence count from tensor shape
    const sequenceCount = sequences.shape[0];
    console.log(`Training with ${sequenceCount} sequences`);

    // Use safe batch size calculation
    let dynamicBatchSize;
    if (sequenceCount >= 32) {
      dynamicBatchSize = 16; // Good for medium datasets
    } else if (sequenceCount >= 16) {
      dynamicBatchSize = 8; // Good for small datasets
    } else {
      dynamicBatchSize = Math.max(1, Math.floor(sequenceCount / 2)); // Very small datasets
    }

    console.log(`Using batch size: ${dynamicBatchSize} for ${sequenceCount} sequences`);

    const history = await this.model.fit(sequences, labels, {
      epochs: epochs,
      batchSize: dynamicBatchSize,
      shuffle: true,
      validationSplit: 0.15,
      callbacks: callbacks
    });

    this.isTrained = true;

    // Clean up tensors
    sequences.dispose();
    labels.dispose();

    console.log('Training completed!');

    // Automatically save the trained model
    await this.saveModel('piano-neural-network');
    console.log('Model saved to browser storage!');

    return history;
  }

  // Generate music sequence using LSTM
  generate(seedNotes, length = 32, temperature = 1.0) {
    if (!this.modelInitialized || !this.model) {
      console.warn('Model is not initialized yet');
      return [];
    }

    if (!this.isTrained) {
      console.warn('Model is not trained yet');
      return [];
    }

    const SEQUENCE_LENGTH = 4; // Must match training
    const generatedNotes = [];

    // Use the last SEQUENCE_LENGTH notes from seed, or pad if not enough
    let sequence = [];
    if (seedNotes.length >= SEQUENCE_LENGTH) {
      sequence = seedNotes.slice(-SEQUENCE_LENGTH);
    } else {
      // Pad with repeated first note if not enough seed notes
      sequence = Array(SEQUENCE_LENGTH - seedNotes.length).fill(seedNotes[0]).concat(seedNotes);
    }

    for (let i = 0; i < length; i++) {
      // Convert sequence to 3D tensor for LSTM
      const sequenceTensor = sequence.map(note => this.noteToOneHot(note.pitch));
      const inputTensor = tf.tensor3d([sequenceTensor], [1, SEQUENCE_LENGTH, this.inputSize]);

      try {
        // Get model prediction
        const prediction = this.model.predict(inputTensor);
        const predictionData = prediction.arraySync()[0];

        // Apply temperature and normalize
        const adjustedPrediction = predictionData.map(x =>
          Math.log(x + 1e-10) / temperature
        );

        // Softmax
        const expPrediction = adjustedPrediction.map(x => Math.exp(x));
        const sum = expPrediction.reduce((a, b) => a + b, 0);
        const probabilities = expPrediction.map(x => x / sum);

        // Sample from distribution
        const random = Math.random();
        let cumulative = 0;
        let selectedIndex = 0;

        for (let j = 0; j < probabilities.length; j++) {
          cumulative += probabilities[j];
          if (random <= cumulative) {
            selectedIndex = j;
            break;
          }
        }

        const newNote = this.indexToNote(selectedIndex);
        if (newNote) {
          const newNoteObj = {
            pitch: newNote,
            time: sequence[sequence.length - 1].time + (Math.random() * 0.5 + 0.25),
            duration: Math.random() * 0.5 + 0.25
          };

          generatedNotes.push(newNoteObj);

          // Update sequence: remove first note, add new note
          sequence.shift();
          sequence.push(newNoteObj);
        }

        // Clean up tensors
        prediction.dispose();
      } catch (error) {
        console.error('Error during generation:', error);
        break;
      } finally {
        inputTensor.dispose();
      }
    }

    return generatedNotes;
  }

  // Get model weights for visualization
  async getWeights() {
    if (!this.model) return null;

    const weights = [];
    const layerWeights = await this.model.getWeights();

    for (let i = 0; i < layerWeights.length; i += 2) {
      const kernel = layerWeights[i].arraySync();
      const bias = layerWeights[i + 1].arraySync();

      weights.push({
        kernel: kernel,
        bias: bias,
        shape: {
          kernel: layerWeights[i].shape,
          bias: layerWeights[i + 1].shape
        }
      });
    }

    return weights;
  }

  // Get model summary
  getModelSummary() {
    if (!this.model) return null;

    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      isTrained: this.isTrained,
      trainingHistory: this.trainingHistory,
      layers: this.model.layers.map(layer => ({
        name: layer.name,
        className: layer.getClassName(),
        inputShape: layer.inputShape,
        outputShape: layer.outputShape,
        countParams: layer.countParams()
      }))
    };
  }

  // Save model to local storage
  async saveModel(name = 'piano-neural-network') {
    if (!this.model) return;

    await this.model.save(`localstorage://${name}`);
    console.log(`Model saved as ${name}`);
  }

  // Load model from local storage
  async loadModel(name = 'piano-neural-network') {
    try {
      this.model = await tf.loadLayersModel(`localstorage://${name}`);
      this.isTrained = true;
      this.modelInitialized = true;
      console.log(`✅ Model ${name} loaded successfully from browser storage!`);
      return true;
    } catch (error) {
      console.log(`❌ No saved model found, will create new model`);
      return false;
    }
  }

  // Check if saved model exists
  async hasSavedModel(name = 'piano-neural-network') {
    try {
      // Try to load model metadata without loading the full model
      const modelExists = localStorage.getItem(`tensorflowjs_models/localstorage://${name}/info`);
      return modelExists !== null;
    } catch (error) {
      return false;
    }
  }

  // Dispose of tensors
  dispose() {
    if (this.model) {
      this.model.dispose();
    }
    tf.disposeVariables();
  }
}

export default TensorFlowMusicNeuralNetwork;