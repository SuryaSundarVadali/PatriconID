import React from 'react';
import { Shield } from 'lucide-react';

export const PatriconHero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Gradient Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(160,108,242,0.7),_rgba(230,140,255,0.4),_rgba(166,245,233,0.3),_rgba(255,247,209,0.2))] blur-2xl animate-gradient"></div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full flex items-center justify-between px-8 py-6 z-10">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-semibold tracking-wide">PATRICONID</span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#learn" className="text-base text-black hover:text-[#6B4EFF] transition-colors">
            Learn
          </a>
          <a href="#build" className="text-base text-black hover:text-[#6B4EFF] transition-colors">
            Build
          </a>
          <a href="#verify" className="text-base text-black hover:text-[#6B4EFF] transition-colors">
            Run a node
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden">
          <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
            <span className="block w-full h-0.5 bg-black"></span>
            <span className="block w-full h-0.5 bg-black"></span>
            <span className="block w-full h-0.5 bg-black"></span>
          </div>
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center text-center flex-grow px-6">
        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-black">
            The first modular<br />
            identity verification<br />
            network
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-800/80 max-w-2xl mx-auto">
            PatriconID is a peer-to-peer identity verification platform that makes it easy 
            for anyone to securely prove who they are without revealing personal data.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-black text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#222222] transition duration-200">
              Build modular
            </button>
            <button className="bg-white text-black border border-gray-300 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-200">
              Explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatriconHero;
