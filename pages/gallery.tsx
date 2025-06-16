import React from 'react';
import GlyphTicker from '../components/GlyphTicker';
import '../style.css';

export default function Gallery() {
  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col items-center p-4">
      <h1 className="text-2xl mb-4 font-bold">GHOSTLINE GALLERY</h1>
      <img src="/IMG_2135.gif" alt="Artwork" className="w-full max-w-md" />
      <div className="mt-4 w-full overflow-hidden">
        <GlyphTicker />
      </div>
    </div>
  );
}
