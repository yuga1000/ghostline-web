import React from 'react';
import GlyphTicker from '../components/GlyphTicker';
import '../style.css';

const blockSymbols = [
  '█','▓','▒','░','▖','▗','▘','▝','▚','▞','▛','▜','▟','▙','▁','▂','▃','▄','▅','▆','▇','◼','◻','▣','▤','▥','▦','▧','▨','▩','⬜','⬒','⬓','⬔','⬕','❒','❖','☐','☑','☒','⧈','⧉','⧠','⧃','⧂','🜁','🜂','🜃','🜄','🝓','🝔','🝕','🝖','🝗','🝘'
];

interface AnimatedSymbolProps {
  index: number;
}

function AnimatedSymbol({ index }: AnimatedSymbolProps) {
  const [symbol, setSymbol] = React.useState(blockSymbols[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSymbol(blockSymbols[Math.floor(Math.random() * blockSymbols.length)]);
    }, 200 + index * 150);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <span className="text-green-500 font-mono text-xl mx-1">
      {symbol}
    </span>
  );
}

export default function Gallery() {
  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col items-center p-4 pb-8">
      <h1 className="text-2xl mb-4 font-bold">GHOSTLINE GALLERY</h1>
      <img src="/IMG_2135.gif" alt="Artwork" className="w-full mx-auto" />

      <div className="flex flex-wrap items-center justify-center mt-4 gap-4">
        <img src="/ghostcoin.gif" alt="Ghost Coin" className="w-16 h-16" />
        <div className="flex">
          {[0, 1, 2, 3, 4].map((idx) => (
            <AnimatedSymbol key={idx} index={idx} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <GlyphTicker />
      </div>
    </div>
  );
}
