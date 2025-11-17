import React, { createContext, useContext, useState, useEffect } from 'react';
import TensorFlowMusicNeuralNetwork from '../tensorflowNeuralNetwork.js';

const NeuralNetworkContext = createContext();

export function NeuralNetworkProvider({ children }) {
  const [neuralNetwork, setNeuralNetwork] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize neural network on mount
  useEffect(() => {
    const initializeNeuralNetwork = async () => {
      try {
        console.log('🔍 Checking for saved neural network...');
        const nn = new TensorFlowMusicNeuralNetwork(88, 256, 88);

        // First, try to load a saved model
        const hasSavedModel = await nn.hasSavedModel('piano-neural-network');

        if (hasSavedModel) {
          console.log('📂 Found saved model, loading...');
          const loaded = await nn.loadModel('piano-neural-network');
          if (loaded) {
            setNeuralNetwork(nn);
            console.log('✅ Pre-trained neural network loaded successfully!');
            setIsLoading(false);
            return;
          }
        }

        // No saved model, create and initialize new one
        console.log('🆕 No saved model found, creating new neural network...');
        await nn.initializeModel();
        console.log('✅ New neural network initialized successfully');
        setNeuralNetwork(nn);

      } catch (error) {
        console.error('❌ Failed to initialize neural network:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNeuralNetwork();
  }, []);

  const trainModel = async (songData, epochs = 50, batchSize = 32) => {
    if (isLoading) {
      throw new Error('Neural network is still loading...');
    }

    if (!neuralNetwork) {
      throw new Error('Neural network failed to initialize!');
    }

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