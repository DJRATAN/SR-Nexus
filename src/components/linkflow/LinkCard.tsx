import { DynamicIcon } from "./DynamicIcon";
import { Link as LinkType, Category } from "@/lib/linkflow-storage";

interface LinkCardProps {
  link: LinkType;
  category?: Category;
}

export function LinkCard({ link, category }: LinkCardProps) {
  return (
    <a 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group p-3 rounded-xl flex items-center gap-3 transition-all duration-300 bg-zinc-950/40 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-blue-500/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-white shadow-inner overflow-hidden">
        {link.customIcon ? (
          <img src={link.customIcon} alt={link.title} className="w-7 h-7 object-contain" />
        ) : (
          <DynamicIcon name={link.icon || "globe"} className="w-6 h-6 text-zinc-900" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-blue-400 truncate tracking-tight group-hover:text-blue-300 transition-colors">
          {link.title}
        </h3>
      </div>
    </a>
  );
}
