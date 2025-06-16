import React, { useEffect, useRef } from 'react';
import './GlyphTicker.css';

const glyphs = [
  '█','▓','▒','░','▖','▗','▘','▝','▚','▞','▛','▜','▟','▙','▁','▂','▃','▄','▅','▆','▇','◼','◻','▣','▤','▥','▦','▧','▨','▩','⬒','⬓','⬔','⬕','❒','❖','☐','☑','☒','⧈','⧉','⧠','⧃','⧂'
];

export default function GlyphTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const interval = setInterval(() => {
      if (container.firstChild) {
        const first = container.firstChild as Node;
        container.appendChild(first.cloneNode(true));
        container.removeChild(first);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="glyph-ticker">
      {glyphs.map((g, idx) => (
        <span key={idx}>{g}</span>
      ))}
    </div>
  );
}
