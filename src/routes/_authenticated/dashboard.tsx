import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Mail as MailIcon, ExternalLink, Tag, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EmailCardFlow" }] }),
  component: Dashboard,
});

type EmailRow = { id: string; subject: string; sender: string | null; recipient: string | null; tags: string[]; status: string; created_at: string };
type CardRow = { id: string; email_id: string; title: string; subtitle: string | null; icon: string | null; links: { label: string; url: string }[]; sort_order: number };

function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const emailsQ = useQuery({
    queryKey: ["emails"],
    queryFn: async (): Promise<EmailRow[]> => {
      const { data, error } = await supabase.from("emails").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmailRow[];
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
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((e) =>
      e.subject.toLowerCase().includes(q) ||
      (e.sender ?? "").toLowerCase().includes(q) ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [emailsQ.data, query]);

  const selected = filtered.find((e) => e.id === selectedId) ?? (emailsQ.data ?? []).find((e) => e.id === selectedId);

  return (
    <div className="grid h-[100dvh] md:h-screen grid-cols-1 md:grid-cols-[340px_1fr]">
      {/* Left: email list */}
      <div className="flex min-h-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Emails</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} items</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search subject, sender, tag…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emailsQ.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState label={emailsQ.data?.length ? "No matches" : "No emails yet"} />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((e) => {
                const active = e.id === selectedId;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className={cn(
                        "block w-full px-4 py-3 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-muted",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MailIcon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate text-sm font-medium">{e.subject}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{e.sender ?? "—"}</span>
                      </div>
                      {e.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right: cards */}
      <div className="min-h-0 overflow-y-auto p-6" style={{ background: "var(--gradient-subtle)" }}>
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Select an email</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Pick an email from the list to see its cards, links, and metadata here.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">{selected.subject}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span><span className="font-medium text-foreground">From:</span> {selected.sender ?? "—"}</span>
                <span className="text-border">•</span>
                <span><span className="font-medium text-foreground">To:</span> {selected.recipient ?? "—"}</span>
                <span className="text-border">•</span>
                <span>{new Date(selected.created_at).toLocaleDateString()}</span>
              </div>
              {selected.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <Badge key={t} variant="secondary"><Tag className="mr-1 h-3 w-3" />{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            {cardsQ.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
              </div>
            ) : (cardsQ.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">No cards for this email yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(cardsQ.data ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary text-lg">
                        {c.icon ?? "✉️"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground">{c.title}</h3>
                        {c.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{c.subtitle}</p>}
                      </div>
                    </div>
                    {c.links?.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {c.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
                          >
                            <span className="truncate">{l.label || l.url}</span>
                            <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">{label}</div>
  );
}
