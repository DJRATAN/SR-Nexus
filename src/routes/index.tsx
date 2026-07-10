import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Mail, Layers, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Mail className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Ryze</span>
        </div>
        <Link to="/auth">
          <Button variant="outline">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Interactive email metadata workspace
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Email data,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              made visual.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A split-view interface that turns your email lists into hover-rich, clickable cards.
            Admins manage content — everyone gets a beautiful browsing experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="shadow-[var(--shadow-elegant)]">Get started free</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">Sign in</Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Layers, title: "Split view", body: "Emails on the left, dynamic cards on the right — one click away." },
            { icon: Shield, title: "Admin controls", body: "Role-based CRUD for emails and cards, with per-user permissions." },
            { icon: Sparkles, title: "Interactive cards", body: "Titles, subtitles, icons, and clickable links per email." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
