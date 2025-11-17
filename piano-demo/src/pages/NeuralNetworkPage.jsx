import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, Zap, TrendingUp, Cpu, Layers } from 'lucide-react';
import AdvancedNeuralNetworkViz from '../AdvancedNeuralNetworkViz.jsx';
import { useNeuralNetwork } from '../contexts/NeuralNetworkContext.jsx';

export default function NeuralNetworkPage() {
  const { neuralNetwork, isTraining, trainingProgress, getModelSummary } = useNeuralNetwork();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (neuralNetwork) {
      setStats(getModelSummary());
    }
  }, [neuralNetwork, getModelSummary]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"
        >
          <Brain className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          Neural Network Visualization
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Watch the AI learn and create music in real-time. See how neural networks process musical notes and generate compositions.
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          {/* Network Stats */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Network Architecture</h2>
            </div>

            {stats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Input Layer</span>
                  <span className="font-mono text-green-400">{stats.inputSize} nodes</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Hidden Layers</span>
                  <span className="font-mono text-blue-400">{stats.hiddenSize} total</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Output Layer</span>
                  <span className="font-mono text-orange-400">{stats.outputSize} nodes</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Parameters</span>
                  <span className="font-mono text-purple-400">
                    {((stats.inputSize * stats.hiddenSize) +
                      (stats.hiddenSize * stats.hiddenSize) +
                      (stats.hiddenSize * stats.outputSize)).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No network data available</p>
              </div>
            )}
          </div>

          {/* Training Status */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Training Status</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  neuralNetwork?.isTrained
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {neuralNetwork?.isTrained ? 'Trained' : 'Not Trained'}
                </span>
              </div>

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-purple-400 font-mono">{trainingProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${trainingProgress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${trainingProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Zap className="w-4 h-4" />
                  <span>Deep Learning</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <Layers className="w-4 h-4" />
                  <span>LSTM Architecture</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Visualization */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 h-full">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">Live Network Visualization</h2>
              {isTraining && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6"
                >
                  <Zap className="w-full h-full text-yellow-400" />
                </motion.div>
              )}
            </div>

            <div className="h-full min-h-[500px]">
              <AdvancedNeuralNetworkViz
                neuralNetwork={neuralNetwork}
                isTraining={isTraining}
                trainingProgress={trainingProgress}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div variants={itemVariants} className="text-center mt-16">
        <div className="inline-flex items-center gap-2 text-gray-400 mb-2">
          <Brain className="w-5 h-5" />
          <span>Powered by TensorFlow.js</span>
        </div>
        <p className="text-sm text-gray-500">
          Watch as the neural network learns patterns from piano music and generates new compositions
        </p>
      </motion.div>
    </motion.div>
  );
}