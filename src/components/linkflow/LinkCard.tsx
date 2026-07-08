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
      className="group p-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-sm hover:-translate-y-1.5 hover:shadow-xl apple-project-card"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      }}
    >
      <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-white shadow-inner overflow-hidden">
        {link.customIcon ? (
          <img src={link.customIcon} alt={link.title} className="w-7 h-7 object-contain" />
        ) : (
          <DynamicIcon name={link.icon || "globe"} className="w-6 h-6 text-zinc-900" />
        )}
      </div>
      <div className="max-w-[250px]">
        <h3 className="text-sm font-semibold text-white/90 break-words group-hover:text-white transition-colors tracking-tight">
          {link.title}
        </h3>
      </div>
    </a>
  );
}
