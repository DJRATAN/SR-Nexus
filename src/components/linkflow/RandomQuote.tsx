import { useState, useEffect, useRef } from "react";
import { quotes } from "@/lib/quotes";
import { ArrowRight, Quote } from "lucide-react";
import gsap from "gsap";

export function RandomQuote() {
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const quoteRef = useRef<HTMLDivElement>(null);

  // Initialize with a random quote
  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * quotes.length));
  }, []);

  const handleNext = () => {
    if (!quoteRef.current) return;
    
    // Animate out
    gsap.to(quoteRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.2,
      onComplete: () => {
        // Change quote
        setQuoteIndex(Math.floor(Math.random() * quotes.length));
        
        // Animate in
        gsap.to(quoteRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
  };

  if (quotes.length === 0) return null;

  return (
    <div className="apple-project-card p-6 md:p-10 mb-12 flex flex-col gap-6 items-center justify-center text-center relative overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px' }}>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-50 pointer-events-none" />
      
      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] mb-2 relative z-10">
        <Quote size={24} className="opacity-90" />
      </div>
      
      <div ref={quoteRef} className="max-w-3xl relative z-10 min-h-[80px] flex items-center justify-center">
        <h2 className="text-xl md:text-3xl font-medium text-white/90 leading-relaxed tracking-tight italic">
          "{quotes[quoteIndex]}"
        </h2>
      </div>
      
      <button 
        onClick={handleNext}
        className="mt-2 relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>Next Quote</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
