import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import TensorFlowMusicNeuralNetwork from '../tensorflowNeuralNetwork.js';

const NeuralNetworkContext = createContext();

export function NeuralNetworkProvider({ children }) {
  const [neuralNetwork, setNeuralNetwork] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Lazy initialization with timeout to prevent blocking
  const initializeNeuralNetwork = useCallback(async () => {
    if (initialized) return; // Prevent multiple initializations

    try {
      console.log('🔍 Checking for saved neural network...');
      const nn = new TensorFlowMusicNeuralNetwork(88, 256, 88);

      // First, try to load a saved model
      const hasSavedModel = await nn.hasSavedModel('piano-neural-network');

      if (hasSavedModel) {
        console.log('📂 Found saved model, loading...');
        const loaded = await nn.loadModel('piano-neural-network');
        if (loaded) {
          console.log('✅ Pre-trained neural network loaded successfully!');
          console.log('🎯 Final model status:', {
            isTrained: nn.isTrained,
            modelInitialized: nn.modelInitialized,
            hasModel: !!nn.model
          });

          // Test the loaded model with a simple prediction (non-blocking)
          setTimeout(async () => {
            try {
              // Create a test sequence: [batch_size=1, sequence_length=4, input_size=88]
              const testSequence = tf.tensor3d([
                // One hot encoded test notes (4 notes in sequence)
                [new Array(88).fill(0), new Array(88).fill(0), new Array(88).fill(0), new Array(88).fill(0)]
              ]);

              const testPrediction = nn.model.predict(testSequence);
              console.log('🎵 Test prediction successful:', testPrediction.shape);
              testPrediction.dispose();
              testSequence.dispose();
              console.log('🎉 Model is working correctly!');
            } catch (predError) {
              console.error('❌ Model prediction test failed:', predError);
            }
          }, 100); // Defer test to prevent blocking

          setNeuralNetwork(nn);
          setInitialized(true);
          setIsLoading(false);
          return;
        }
      }

      // No saved model, create and initialize new one (non-blocking)
      console.log('🆕 No saved model found, creating new neural network...');
      setTimeout(async () => {
        try {
          await nn.initializeModel();
          console.log('✅ New neural network initialized successfully');
          setNeuralNetwork(nn);
          setInitialized(true);
        } catch (initError) {
          console.error('❌ Failed to initialize new model:', initError);
        } finally {
          setIsLoading(false);
        }
      }, 50); // Small delay to prevent initial page lag

    } catch (error) {
      console.error('❌ Failed to initialize neural network:', error);
      console.error('Full error details:', error);
      setIsLoading(false);
    }
  }, [initialized]);

  // Initialize with delay to prevent initial page lag
  useEffect(() => {
    const timer = setTimeout(initializeNeuralNetwork, 100);
    return () => clearTimeout(timer);
  }, [initializeNeuralNetwork]);

  const trainModel = async (songData, epochs = 50, batchSize = 32) => {
    if (isLoading) {
      throw new Error('Neural network is still loading...');
    }

    if (!neuralNetwork) {
      throw new Error('Neural network failed to initialize!');
    }

    console.log('🎹 Training status check:', {
      isTrained: neuralNetwork.isTrained,
      modelInitialized: neuralNetwork.modelInitialized,
      hasModel: !!neuralNetwork.model
    });

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      await neuralNetwork.train(songData, epochs, batchSize, (progress, logs) => {
        setTrainingProgress(progress * 100);
      });
      setTrainingProgress(100);
      return true;
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    } finally {
      setIsTraining(false);
      setTimeout(() => setTrainingProgress(0), 2000);
    }
  };

  const generateMusic = (seedNotes, length = 32, temperature = 1.0) => {
    if (!neuralNetwork || !neuralNetwork.isTrained) {
      throw new Error('Model is not trained yet');
    }
    return neuralNetwork.generate(seedNotes, length, temperature);
  };

  const getModelSummary = () => {
    return neuralNetwork ? neuralNetwork.getModelSummary() : null;
  };

  // Manual recheck for saved models
  const recheckSavedModel = async () => {
    if (neuralNetwork && neuralNetwork.isTrained) return true;

    try {
      const nn = new TensorFlowMusicNeuralNetwork(88, 256, 88);
      const hasSavedModel = await nn.hasSavedModel('piano-neural-network');

      if (hasSavedModel) {
        const loaded = await nn.loadModel('piano-neural-network');
        if (loaded) {
          setNeuralNetwork(nn);
          setInitialized(true);
          console.log('🔄 Manual model reload successful!');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Manual model reload failed:', error);
      return false;
    }
  };

  return (
    <NeuralNetworkContext.Provider
      value={{
        neuralNetwork,
        isTraining,
        trainingProgress,
        isLoading,
        trainModel,
        generateMusic,
        getModelSummary,
        recheckSavedModel,
        setIsTraining,
        setTrainingProgress
      }}
    >
      {children}
    </NeuralNetworkContext.Provider>
  );
}

export function useNeuralNetwork() {
  const context = useContext(NeuralNetworkContext);
  if (!context) {
    throw new Error('useNeuralNetwork must be used within a NeuralNetworkProvider');
  }
  return context;
}