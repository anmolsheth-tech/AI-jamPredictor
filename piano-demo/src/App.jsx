import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import PianoModern from "./PianoModern.jsx";
import NeuralNetworkPage from "./pages/NeuralNetworkPage.jsx";
import { NeuralNetworkProvider } from "./contexts/NeuralNetworkContext.jsx";
import { motion } from "framer-motion";
import { Music, Brain, Home } from "lucide-react";

function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AI Piano</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                location.pathname === "/"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Piano</span>
            </Link>

            <Link
              to="/neural-network"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                location.pathname === "/neural-network"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Neural Network</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <NeuralNetworkProvider>
      <Router>
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<PianoModern />} />
            <Route path="/neural-network" element={<NeuralNetworkPage />} />
          </Routes>
        </div>
      </Router>
    </NeuralNetworkProvider>
  );
}
