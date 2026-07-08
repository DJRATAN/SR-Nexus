import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — EmailCardFlow" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type EmailRow = { id: string; subject: string; sender: string | null; recipient: string | null; tags: string[]; status: string };
type CardRow = { id: string; email_id: string; title: string; subtitle: string | null; icon: string | null; links: { label: string; url: string }[]; sort_order: number };

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
        <p className="text-sm text-muted-foreground">Manage emails and cards.</p>
      </header>
      <Tabs defaultValue="emails">
        <TabsList>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>
        <TabsContent value="emails" className="mt-6"><EmailsAdmin /></TabsContent>
        <TabsContent value="cards" className="mt-6"><CardsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function EmailsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailRow | null>(null);
  const [form, setForm] = useState({ subject: "", sender: "", recipient: "", tags: "", status: "active" });

  const q = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emails").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmailRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        subject: form.subject.trim(),
        sender: form.sender.trim() || null,
        recipient: form.recipient.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("emails").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("emails").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Email updated" : "Email created");
      qc.invalidateQueries({ queryKey: ["admin-emails"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emails").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-emails"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ subject: "", sender: "", recipient: "", tags: "", status: "active" });
    setOpen(true);
  };
  const openEdit = (row: EmailRow) => {
    setEditing(row);
    setForm({ subject: row.subject, sender: row.sender ?? "", recipient: row.recipient ?? "", tags: (row.tags ?? []).join(", "), status: row.status });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New email</Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(q.data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.subject}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.sender ?? "—"}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(r.tags ?? []).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div></td>
                <td className="px-4 py-3"><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this email and its cards?")) del.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No emails yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit email" : "New email"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sender</Label><Input value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} /></div>
              <div><Label>Recipient</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} /></div>
            </div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="marketing, q4, launch" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.subject.trim() || save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardsAdmin() {
  const qc = useQueryClient();
  const [emailId, setEmailId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", icon: "", linksText: "" });

  const emailsQ = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emails").select("id, subject").order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; subject: string }[];
    },
  });

  const cardsQ = useQuery({
    queryKey: ["admin-cards", emailId],
    enabled: !!emailId,
    queryFn: async () => {
      const { data, error } = await supabase.from("cards").select("*").eq("email_id", emailId).order("sort_order");
      if (error) throw error;
      return data as unknown as CardRow[];
    },
  });

  const parseLinks = (text: string) =>
    text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      return url ? { label, url } : { label: label, url: label };
    });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        email_id: emailId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        icon: form.icon.trim() || null,
        links: parseLinks(form.linksText),
      };
      if (editing) {
        const { error } = await supabase.from("cards").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Card updated" : "Card created");
      qc.invalidateQueries({ queryKey: ["admin-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", icon: "", linksText: "" });
    setOpen(true);
  };
  const openEdit = (row: CardRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      subtitle: row.subtitle ?? "",
      icon: row.icon ?? "",
      linksText: (row.links ?? []).map((l) => `${l.label} | ${l.url}`).join("\n"),
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-sm">
          <Label>Select an email</Label>
          <Select value={emailId} onValueChange={setEmailId}>
            <SelectTrigger><SelectValue placeholder="Choose an email…" /></SelectTrigger>
            <SelectContent>
              {(emailsQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.subject}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} disabled={!emailId}><Plus className="mr-2 h-4 w-4" /> New card</Button>
      </div>

      {!emailId ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          <Layers className="mx-auto mb-2 h-6 w-6" />
          Select an email above to manage its cards.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(cardsQ.data ?? []).map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{c.icon ?? "✉️"}</div>
                  <div>
                    <div className="font-medium">{c.title}</div>
                    {c.subtitle && <div className="text-sm text-muted-foreground">{c.subtitle}</div>}
                    <div className="mt-1 text-xs text-muted-foreground">{(c.links ?? []).length} link(s)</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this card?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          {(cardsQ.data ?? []).length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No cards yet. Click <b>New card</b> to add one.
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit card" : "New card"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div><Label>Icon (emoji or short text)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📊" /></div>
            <div>
              <Label>Links (one per line — <code>Label | https://url</code>)</Label>
              <Textarea rows={4} value={form.linksText} onChange={(e) => setForm({ ...form, linksText: e.target.value })} placeholder={"Docs | https://docs.example.com\nDashboard | https://app.example.com"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.title.trim() || save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
