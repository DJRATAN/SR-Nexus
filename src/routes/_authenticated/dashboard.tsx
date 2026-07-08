import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ExternalLink, Mail as MailIcon, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";

import { usePc } from "@/contexts/PcContext";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EmailCardFlow" }] }),
  component: Dashboard,
});

type EmailRow = { id: string; subject: string; recipient: string | null; url: string | null; created_at: string; tags?: string[]; cards?: { title: string }[] };
type CardRow = { id: string; email_id: string; title: string; subtitle: string | null; icon: string | null; links: { label: string; url: string }[]; sort_order: number; date?: string };

function ProjectCard({ card }: { card: CardRow }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Smooth Apple-style tilt (less aggressive than before)
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    
    gsap.to(cardRef.current, { rotateX, rotateY, duration: 0.4, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <div 
      ref={cardRef}
      className="apple-project-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px', color: 'var(--accent)', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
          {card.icon ? <span>{card.icon}</span> : <LinkIcon size={24} />}
        </div>
        <a href="https://technoml.in/products" target="_blank" rel="noreferrer" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '6px 12px', borderRadius: '12px', color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', transition: 'all 0.2s', fontWeight: 500 }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
               e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
               e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
             }}>
          Live Link
        </a>
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>{card.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>{card.subtitle}</p>
      
      {card.links?.length > 0 && (
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {card.links.map((l, i) => (
             <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '8px 12px', borderRadius: '12px', color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
               e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
               e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
             }}>
                {l.label || l.url}
                <ExternalLink size={14} />
             </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { activePc } = usePc();
  const { isAdmin } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const detailsRef = useRef<HTMLDivElement>(null);

  const emailsQ = useQuery({
    queryKey: ["emails"],
    queryFn: async (): Promise<EmailRow[]> => {
      const { data, error } = await supabase.from("emails").select("*, cards(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as EmailRow[];
    },
  });

  const cardsQ = useQuery({
    queryKey: ["cards", selectedId],
    enabled: !!selectedId,
    queryFn: async (): Promise<CardRow[]> => {
      const { data, error } = await supabase.from("cards").select("*").eq("email_id", selectedId!).order("sort_order");
      if (error) throw error;
      return (data as unknown as CardRow[]);
    },
  });

  const filtered = useMemo(() => {
    const list = emailsQ.data ?? [];
    
    // 1. Filter by PC context (PC2 has "PC2" tag, PC1 does not)
    const pcFiltered = list.filter(e => {
       const isPc2 = Array.isArray(e.tags) && e.tags.includes("PC2");
       return activePc === "PC2" ? isPc2 : !isPc2;
    });

    // 2. Filter by search query
    if (!query.trim()) return pcFiltered;
    const q = query.toLowerCase();
    return pcFiltered.filter((e) =>
      e.subject.toLowerCase().includes(q) ||
      (e.recipient ?? "").toLowerCase().includes(q) ||
      (e.cards ?? []).some(c => c.title.toLowerCase().includes(q))
    );
  }, [emailsQ.data, query, activePc]);

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0];

  const displayedCards = useMemo(() => {
    const list = cardsQ.data ?? [];
    if (!query.trim()) return list;
    
    const q = query.toLowerCase();
    
    const emailMatches = selected?.subject.toLowerCase().includes(q) || (selected?.recipient ?? "").toLowerCase().includes(q);
    
    const matchingCards = list.filter(c => 
       c.title.toLowerCase().includes(q) || 
       (c.subtitle ?? "").toLowerCase().includes(q)
    );
    
    if (matchingCards.length > 0) return matchingCards;
    
    return emailMatches ? list : [];
  }, [cardsQ.data, query, selected]);

  // Initial enter animation for cards
  useEffect(() => {
    if (detailsRef.current && !cardsQ.isLoading && (cardsQ.data?.length ?? 0) > 0) {
      gsap.fromTo(detailsRef.current.querySelectorAll('.apple-project-card'), 
        { y: 30, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" }
      );
    }
  }, [cardsQ.data, cardsQ.isLoading, selectedId]);

  return (
    <div className="apple-glass-theme">
      <div className="apple-app-container">
        
        {/* Glassmorphism Sidebar */}
        <aside className="apple-sidebar">
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>Accounts</h2>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.4)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'all 0.2s' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>
          
          <ul style={{ listStyle: 'none', padding: '0 12px', overflowY: 'auto', flex: 1 }}>
            {emailsQ.isLoading ? (
               <li style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>Loading...</li>
            ) : filtered.length === 0 ? (
               <li style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>No matches</li>
            ) : (
              filtered.map((e) => {
                const active = selectedId === e.id;
                return (
                  <li 
                    key={e.id}
                    style={{ 
                      padding: '12px 16px', margin: '4px 0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      background: active ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: active ? 'white' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${active ? 'rgba(139, 92, 246, 0.3)' : 'transparent'}`
                    }}
                    onClick={() => setSelectedId(e.id)}
                    onMouseEnter={(ev) => { if (!active) ev.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(ev) => { if (!active) ev.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0 4px',
                        borderRadius: '10px',
                        background: active ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                        color: active ? 'white' : 'currentColor',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {e.cards?.length || 0}
                      </div>
                      <span style={{ fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.subject || e.recipient || 'Unnamed Account'}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className="apple-main-content">
          <div ref={detailsRef} className="apple-details-card">
            {!selected ? (
              <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Select an email account from the sidebar to view projects.</h1>
              </div>
            ) : (
              <>
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {selected.subject}
                </div>
                
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: '8px', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>Projects</h2>
                
                {selected.recipient && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: '8px' }}>{selected.recipient}</p>}
                {selected.url && (
                   <a href={selected.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-glow)', textDecoration: 'none', borderBottom: '1px solid var(--accent-glow)', display: 'inline-block', marginBottom: '32px', transition: 'opacity 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.opacity='0.8'} onMouseLeave={(e)=>e.currentTarget.style.opacity='1'}>
                     {selected.url}
                   </a>
                )}

                {cardsQ.isLoading ? (
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading cards...</div>
                ) : (
                  <div className="apple-projects-grid">
                    {displayedCards.map((card) => (
                      <ProjectCard key={card.id} card={card} />
                    ))}
                    {displayedCards.length === 0 && (
                       <div style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1 / -1', padding: '40px 0' }}>No projects found for this account.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
