import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function AdvancedNeuralNetworkViz({ neuralNetwork, isTraining = false, trainingProgress = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);

  const networkData = useMemo(() => {
    if (!neuralNetwork) return null;

    return {
      inputSize: neuralNetwork.inputSize || 88,
      hiddenSize: neuralNetwork.hiddenSize || 256,
      outputSize: neuralNetwork.outputSize || 88,
      layers: [
        { name: 'Input', nodes: Math.min(20, neuralNetwork.inputSize || 88), color: '#10b981' },
        { name: 'Hidden LSTM 1', nodes: Math.min(16, Math.floor((neuralNetwork.hiddenSize || 256) / 2)), color: '#3b82f6' },
        { name: 'Hidden LSTM 2', nodes: Math.min(12, Math.floor((neuralNetwork.hiddenSize || 256) / 4)), color: '#8b5cf6' },
        { name: 'Dense', nodes: Math.min(8, Math.floor((neuralNetwork.hiddenSize || 256) / 8)), color: '#ec4899' },
        { name: 'Output', nodes: Math.min(20, neuralNetwork.outputSize || 88), color: '#f59e0b' }
      ]
    };
  }, [neuralNetwork]);

  useEffect(() => {
    if (!networkData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    let time = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw layers and connections
      networkData.layers.forEach((layer, layerIndex) => {
        const x = (canvas.width / (networkData.layers.length + 1)) * (layerIndex + 1);
        const nodeSpacing = canvas.height / (layer.nodes + 1);

        // Draw connections to next layer
        if (layerIndex < networkData.layers.length - 1) {
          const nextLayer = networkData.layers[layerIndex + 1];
          const nextX = (canvas.width / (networkData.layers.length + 1)) * (layerIndex + 2);
          const nextNodeSpacing = canvas.height / (nextLayer.nodes + 1);

          for (let i = 0; i < layer.nodes; i++) {
            const y = nodeSpacing * (i + 1);

            for (let j = 0; j < nextLayer.nodes; j++) {
              const nextY = nextNodeSpacing * (j + 1);

              // Animate connections during training
              const opacity = isTraining
                ? (Math.sin(time * 0.002 + i * 0.1 + j * 0.1) + 1) / 4 + 0.1
                : 0.05;

              const gradient = ctx.createLinearGradient(x, y, nextX, nextY);
              gradient.addColorStop(0, layer.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
              gradient.addColorStop(1, nextLayer.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));

              ctx.strokeStyle = gradient;
              ctx.lineWidth = 0.5 + (isTraining ? Math.sin(time * 0.003 + i * 0.2) * 0.5 : 0);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(nextX, nextY);
              ctx.stroke();
            }
          }
        }

        // Draw nodes
        for (let i = 0; i < layer.nodes; i++) {
          const y = nodeSpacing * (i + 1);
          const nodeRadius = 4 + (isTraining ? Math.sin(time * 0.004 + i * 0.3) * 2 : 0);

          // Node glow effect
          if (isTraining) {
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 3);
            glowGradient.addColorStop(0, layer.color + '40');
            glowGradient.addColorStop(1, layer.color + '00');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(x - nodeRadius * 3, y - nodeRadius * 3, nodeRadius * 6, nodeRadius * 6);
          }

          // Node body
          const nodeGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius);
          nodeGradient.addColorStop(0, layer.color);
          nodeGradient.addColorStop(1, layer.color + 'cc');

          ctx.fillStyle = nodeGradient;
          ctx.beginPath();
          ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();

          // Node border
          ctx.strokeStyle = layer.color + 'ff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Node activity pulse
          if (isTraining) {
            const pulseSize = nodeRadius + Math.sin(time * 0.005 + i * 0.4) * 3;
            ctx.strokeStyle = layer.color + '60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Layer label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(layer.name, x, canvas.height - 10);
      });

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [networkData, isTraining]);

  if (!networkData) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <div className="text-gray-400 text-center">Neural network not initialized</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 shadow-2xl">
      <div className="text-white font-bold mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          Advanced Neural Network Visualization
          {isTraining && (
            <span className="text-sm text-yellow-400 animate-pulse ml-2">
              Training in progress...
            </span>
          )}
        </div>
        {trainingProgress > 0 && (
          <div className="text-sm text-gray-300">
            {trainingProgress.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Network Architecture Info */}
      <div className="grid grid-cols-5 gap-4 mb-4 text-sm">
        {networkData.layers.map((layer, index) => (
          <div
            key={index}
            className={`text-center p-2 rounded-lg transition-all duration-300 cursor-pointer ${
              selectedLayer === index
                ? 'bg-gray-800 border-2 border-gray-600'
                : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedLayer(selectedLayer === index ? null : index)}
          >
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: layer.color }}
            ></div>
            <div className="text-gray-300 text-xs">{layer.name}</div>
            <div className="text-white font-semibold">{layer.nodes} nodes</div>
          </div>
        ))}
      </div>

      {/* Canvas Visualization */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-80"
          style={{ display: 'block' }}
        />
      </div>

      {/* Training Progress Bar */}
      {isTraining && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Training Progress</span>
            <span>{trainingProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${trainingProgress}%` }}
            >
              <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Model Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Input Layer</div>
          <div className="text-green-400 font-semibold">{networkData.inputSize} nodes</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Hidden Layers</div>
          <div className="text-blue-400 font-semibold">{networkData.hiddenSize} total</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Output Layer</div>
          <div className="text-orange-400 font-semibold">{networkData.outputSize} nodes</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Parameters</div>
          <div className="text-purple-400 font-semibold">
            {((networkData.inputSize * networkData.hiddenSize) +
              (networkData.hiddenSize * networkData.hiddenSize) +
              (networkData.hiddenSize * networkData.outputSize)).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Input (88 piano keys)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>LSTM Memory Cells</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Sequence Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Dense Connections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Output Predictions</span>
          </div>
        </div>
      </div>
    </div>
  );
}