import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import type { Link as LinkType, Category } from "@/lib/linkflow-storage";
import { getLinks, getCategories } from "@/lib/linkflow-storage";
import { LinkCard } from "@/components/linkflow/LinkCard";
import { DynamicIcon } from "@/components/linkflow/DynamicIcon";
import { RandomQuote } from "@/components/linkflow/RandomQuote";
import { cn } from "@/lib/utils";
import { Link2Off, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/links")({
  component: LinksDashboard,
});

function LinksDashboard() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [fetchedLinks, fetchedCategories] = await Promise.all([
        getLinks(),
        getCategories()
      ]);
      setLinks(fetchedLinks);
      setCategories(fetchedCategories);
      setIsMounted(true);
    }
    fetchData();
  }, []);

  if (!isMounted) return <div className="text-white p-8">Loading...</div>;

  const filteredLinks = useMemo(() => {
    let filtered = links;
    if (activeCategoryId !== "all") {
      filtered = filtered.filter(l => l.categoryId === activeCategoryId);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.url.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [links, activeCategoryId, searchQuery]);

  const categoriesToRender = useMemo(() => {
    let cats = categories;
    if (activeCategoryId !== "all") {
      cats = cats.filter(c => c.id === activeCategoryId);
    }
    if (searchQuery.trim() !== "") {
      // Only keep categories that have matching links
      const activeCatIds = new Set(filteredLinks.map(l => l.categoryId));
      cats = cats.filter(c => activeCatIds.has(c.id));
    }
    return cats;
  }, [categories, activeCategoryId, searchQuery, filteredLinks]);

  return (
    <div className="apple-glass-theme">
      <div className="apple-app-container" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <main className="apple-main-content w-full max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <header className="text-center mb-12 mt-4">
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-white drop-shadow-sm">
              SR Nexus
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto font-medium">
              Your favorite links, exactly where you need them.
            </p>
          </header>

          <RandomQuote />

          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search links by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all shadow-sm"
            />
          </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 max-w-full" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveCategoryId("all")}
          className={cn(
            "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 whitespace-nowrap shadow-sm hover:-translate-y-0.5",
            activeCategoryId === "all" ? "bg-[var(--accent)] text-white border-transparent shadow-[var(--accent-glow)]" : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-sm hover:-translate-y-0.5",
              activeCategoryId === cat.id ? "bg-[var(--accent)] text-white border-transparent shadow-[var(--accent-glow)]" : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            {cat.customIcon ? (
                <img src={cat.customIcon} alt={cat.name} className="w-4 h-4 object-contain rounded" />
            ) : (
                <DynamicIcon name={cat.icon || "globe"} className="w-4 h-4" />
            )}
            {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {categoriesToRender.map(category => {
          const categoryLinks = filteredLinks.filter(link => link.categoryId === category.id);
          if (categoryLinks.length === 0) return null;

          return (
            <section key={category.id} className="animate-in fade-in duration-500 apple-details-card" style={{ padding: '24px' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  {category.customIcon ? (
                      <img src={category.customIcon} className="w-5 h-5 object-contain rounded" />
                  ) : (
                      <DynamicIcon name={category.icon || "folder"} className="w-5 h-5" />
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{category.name}</h2>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {categoryLinks.map(link => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    category={category} 
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {links.length === 0 && (
        <div className="text-center py-20 text-white/50 flex flex-col items-center justify-center apple-details-card" style={{ padding: '40px' }}>
          <Link2Off className="w-16 h-16 mb-4 opacity-40" />
          <h3 className="text-xl font-semibold mb-2 text-white/80">No links found</h3>
          <p className="text-white/60">
            Start by adding some links in the <Link to="/links-admin" className="text-[var(--accent)] hover:text-white underline underline-offset-4 decoration-[var(--accent)]/30 transition-colors">admin panel</Link>.
          </p>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
