import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import type { Link as LinkType, Category } from "@/lib/linkflow-storage";
import { getLinks, getCategories } from "@/lib/linkflow-storage";
import { LinkCard } from "@/components/linkflow/LinkCard";
import { DynamicIcon } from "@/components/linkflow/DynamicIcon";
import { cn } from "@/lib/utils";
import { Link2Off } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/links")({
  component: LinksDashboard,
});

function LinksDashboard() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
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

  const filteredLinks = activeCategoryId === "all"
    ? links
    : links.filter(l => l.categoryId === activeCategoryId);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="text-center mb-12 mt-4">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-white drop-shadow-sm">
          My Digital Space
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Your favorite links, exactly where you need them.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 max-w-full" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveCategoryId("all")}
          className={cn(
            "px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium transition-all duration-200 whitespace-nowrap",
            activeCategoryId === "all" ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/10"
          )}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
              activeCategoryId === cat.id ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/10"
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

      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredLinks.map(link => (
            <LinkCard 
              key={link.id} 
              link={link} 
              category={categories.find(c => c.id === link.categoryId)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
          <Link2Off className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2 text-slate-300">No links found</h3>
          <p className="text-slate-400">
            Start by adding some links in the <Link to="/admin" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30">admin panel</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
