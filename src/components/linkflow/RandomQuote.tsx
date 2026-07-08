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
    <div className="apple-project-card p-6 md:p-8 mb-12 flex flex-col md:flex-row gap-6 items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px' }}>
      <div className="flex gap-4 items-start flex-1 min-w-0">
        <div className="mt-1 w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <Quote size={20} />
        </div>
        <div ref={quoteRef} className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-medium text-white/90 leading-snug tracking-tight">
            "{quotes[quoteIndex]}"
          </h2>
        </div>
      </div>
      
      <button 
        onClick={handleNext}
        className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white/90 font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>Next</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
