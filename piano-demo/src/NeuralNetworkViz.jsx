import React, { useState, useEffect } from 'react';

export default function NeuralNetworkViz({ neuralNetwork, isTraining = false }) {
  const [weights, setWeights] = useState([]);
  const [activations, setActivations] = useState({
    input: [],
    hidden: [],
    output: []
  });

  useEffect(() => {
    if (neuralNetwork && neuralNetwork.isTrained) {
      updateVisualization();
    }
  }, [neuralNetwork]);

  const updateVisualization = () => {
    // Generate sample activations for visualization
    const sampleInput = new Array(neuralNetwork.inputSize).fill(0)
      .map(() => Math.random());
    const sampleHidden = new Array(neuralNetwork.hiddenSize).fill(0)
      .map(() => Math.random());
    const sampleOutput = new Array(neuralNetwork.outputSize).fill(0)
      .map(() => Math.random());

    setActivations({
      input: sampleInput,
      hidden: sampleHidden,
      output: sampleOutput
    });
  };

  const renderNode = (x, y, size, activation, isInput = false, isOutput = false) => {
    const intensity = Math.abs(activation);
    const color = activation > 0
      ? `rgba(59, 130, 246, ${intensity})` // Blue for positive
      : `rgba(239, 68, 68, ${intensity})`;  // Red for negative

    return (
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        stroke={isInput ? "#10b981" : isOutput ? "#8b5cf6" : "#6b7280"}
        strokeWidth="2"
      />
    );
  };

  const renderConnection = (x1, y1, x2, y2, weight) => {
    const opacity = Math.abs(weight);
    const color = weight > 0 ? "#10b981" : "#ef4444";
    const strokeWidth = Math.abs(weight) * 2;

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  };

  const width = 600;
  const height = 400;
  const padding = 40;

  // Layer positions
  const inputLayerX = padding + 50;
  const hiddenLayerX = width / 2;
  const outputLayerX = width - padding - 50;

  // Calculate node positions
  const inputNodes = neuralNetwork ?
    Array.from({ length: Math.min(20, neuralNetwork.inputSize) }, (_, i) => ({
      x: inputLayerX,
      y: padding + (i * (height - 2 * padding)) / Math.min(19, neuralNetwork.inputSize - 1),
      activation: activations.input[i] || 0
    })) : [];

  const hiddenNodes = neuralNetwork ?
    Array.from({ length: Math.min(16, neuralNetwork.hiddenSize) }, (_, i) => ({
      x: hiddenLayerX,
      y: padding + (i * (height - 2 * padding)) / Math.min(15, neuralNetwork.hiddenSize - 1),
      activation: activations.hidden[i] || 0
    })) : [];

  const outputNodes = neuralNetwork ?
    Array.from({ length: Math.min(20, neuralNetwork.outputSize) }, (_, i) => ({
      x: outputLayerX,
      y: padding + (i * (height - 2 * padding)) / Math.min(19, neuralNetwork.outputSize - 1),
      activation: activations.output[i] || 0
    })) : [];

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="text-white font-semibold mb-4">
        Neural Network Visualization
        {isTraining && (
          <span className="ml-2 text-yellow-400 animate-pulse">
            Training in progress...
          </span>
        )}
      </div>

      {!neuralNetwork ? (
        <div className="text-gray-400 text-center py-8">
          Neural network not initialized
        </div>
      ) : (
        <div className="space-y-4">
          {/* Network Architecture Info */}
          <div className="flex gap-4 text-sm text-gray-300">
            <div>
              <span className="text-green-400">Input:</span> {neuralNetwork.inputSize} nodes
            </div>
            <div>
              <span className="text-blue-400">Hidden:</span> {neuralNetwork.hiddenSize} nodes
            </div>
            <div>
              <span className="text-purple-400">Output:</span> {neuralNetwork.outputSize} nodes
            </div>
            <div>
              <span className="text-yellow-400">Trained:</span> {neuralNetwork.isTrained ? '✓' : '✗'}
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="flex justify-center">
            <svg width={width} height={height} className="border border-gray-600 rounded">
              {/* Background */}
              <rect width={width} height={height} fill="#111827" />

              {/* Connections (simplified - showing only a few) */}
              {neuralNetwork.isTrained && inputNodes.length > 0 && hiddenNodes.length > 0 && (
                <g opacity="0.3">
                  {inputNodes.slice(0, 5).map((inputNode, i) =>
                    hiddenNodes.slice(0, 5).map((hiddenNode, j) => (
                      <line
                        key={`ih-${i}-${j}`}
                        x1={inputNode.x}
                        y1={inputNode.y}
                        x2={hiddenNode.x}
                        y2={hiddenNode.y}
                        stroke="#4b5563"
                        strokeWidth="0.5"
                      />
                    ))
                  )}
                  {hiddenNodes.slice(0, 5).map((hiddenNode, i) =>
                    outputNodes.slice(0, 5).map((outputNode, j) => (
                      <line
                        key={`ho-${i}-${j}`}
                        x1={hiddenNode.x}
                        y1={hiddenNode.y}
                        x2={outputNode.x}
                        y2={outputNode.y}
                        stroke="#4b5563"
                        strokeWidth="0.5"
                      />
                    ))
                  )}
                </g>
              )}

              {/* Nodes */}
              {/* Input Layer */}
              {inputNodes.map((node, i) => (
                <g key={`input-${i}`}>
                  {renderNode(node.x, node.y, 8, node.activation, true, false)}
                  {i % 4 === 0 && (
                    <text
                      x={node.x - 20}
                      y={node.y + 3}
                      fill="#10b981"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {neuralNetwork.indexToNote ? neuralNetwork.indexToNote(i) : ''}
                    </text>
                  )}
                </g>
              ))}

              {/* Hidden Layer */}
              {hiddenNodes.map((node, i) => (
                <circle
                  key={`hidden-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={6}
                  fill={`rgba(59, 130, 246, ${Math.abs(node.activation)})`}
                  stroke="#3b82f6"
                  strokeWidth="1"
                />
              ))}

              {/* Output Layer */}
              {outputNodes.map((node, i) => (
                <g key={`output-${i}`}>
                  {renderNode(node.x, node.y, 8, node.activation, false, true)}
                  {i % 4 === 0 && (
                    <text
                      x={node.x + 20}
                      y={node.y + 3}
                      fill="#8b5cf6"
                      fontSize="10"
                    >
                      {neuralNetwork.indexToNote ? neuralNetwork.indexToNote(i) : ''}
                    </text>
                  )}
                </g>
              ))}

              {/* Layer Labels */}
              <text x={inputLayerX} y={padding - 10} fill="#10b981" fontSize="12" textAnchor="middle">
                Input Layer
              </text>
              <text x={hiddenLayerX} y={padding - 10} fill="#3b82f6" fontSize="12" textAnchor="middle">
                Hidden Layer
              </text>
              <text x={outputLayerX} y={padding - 10} fill="#8b5cf6" fontSize="12" textAnchor="middle">
                Output Layer
              </text>
            </svg>
          </div>

          {/* Training Progress */}
          {neuralNetwork.trainingLoss && neuralNetwork.trainingLoss.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-300 mb-2">
                Training Loss: {neuralNetwork.trainingLoss[neuralNetwork.trainingLoss.length - 1]?.toFixed(4)}
              </div>
              <div className="h-20 bg-gray-800 rounded p-2">
                <svg width="100%" height="100%" viewBox="0 0 400 60">
                  {neuralNetwork.trainingLoss.map((loss, i) => {
                    const x = (i / neuralNetwork.trainingLoss.length) * 400;
                    const y = 60 - (Math.min(loss, 2) / 2) * 60;
                    const prevX = ((i - 1) / neuralNetwork.trainingLoss.length) * 400;
                    const prevY = neuralNetwork.trainingLoss[i - 1]
                      ? 60 - (Math.min(neuralNetwork.trainingLoss[i - 1], 2) / 2) * 60
                      : y;

                    return i > 0 ? (
                      <line
                        key={i}
                        x1={prevX}
                        y1={prevY}
                        x2={x}
                        y2={y}
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                    ) : null;
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Positive Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Negative Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Input Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Output Nodes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}