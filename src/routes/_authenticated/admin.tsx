import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Layers, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SR Nexus" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type EmailRow = { id: string; subject: string; sender: string | null; recipient: string | null; url: string | null; tags: string[]; status: string };
type CardRow = { id: string; email_id: string; title: string; subtitle: string | null; icon: string | null; links: { label: string; url: string }[]; sort_order: number };

import { usePc } from "@/contexts/PcContext";

function AdminPage() {
  const { activePc, setActivePc } = usePc();
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;



  return (
    <div className="apple-glass-theme">
      <div className="apple-app-container" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <main className="apple-main-content w-full max-w-6xl mx-auto">
          <div className="apple-details-card" style={{ padding: '24px' }}>
            <header className="mb-6 border-b border-white/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Panel</h1>
                  <p className="text-sm text-white/60">Manage your accounts, projects, and metadata.</p>
                </div>
                <div className="flex items-center bg-background/50 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => setActivePc("PC1")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-all",
                      activePc === "PC1" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    PC1
                  </button>
                  <button
                    onClick={() => setActivePc("PC2")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-all",
                      activePc === "PC2" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    PC2
                  </button>
                </div>
              </div>
            </header>
            <Tabs defaultValue="emails">
              <TabsList className="bg-white/5 border border-white/10 mb-6 p-1 rounded-lg">
                <TabsTrigger value="emails" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/60 rounded-md transition-all">Emails</TabsTrigger>
                <TabsTrigger value="cards" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/60 rounded-md transition-all">Cards</TabsTrigger>
              </TabsList>
              <TabsContent value="emails"><EmailsAdmin /></TabsContent>
              <TabsContent value="cards"><CardsAdmin /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmailsAdmin() {
  const { activePc } = usePc();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", recipient: "", url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const q = useQuery({
    queryKey: ["admin-emails", activePc],
    queryFn: async () => {
      const { data, error } = await supabase.from("emails").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const list = data as EmailRow[];
      return list.filter(e => {
         const isPc2 = Array.isArray(e.tags) && e.tags.includes("PC2");
         return activePc === "PC2" ? isPc2 : !isPc2;
      });
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        subject: form.subject.trim(),
        recipient: form.recipient.trim() || null,
        url: form.url.trim() || null,
        sender: null,
        tags: activePc === "PC2" ? ["PC2"] : [],
        status: "active",
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
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast.loading("Importing Excel file...", { id: "excel-import" });
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        for (const row of data as any[]) {
          const payload = {
            subject: row.Title?.toString().trim() || "Imported Title",
            recipient: row.Email?.toString().trim() || null,
            url: row.URL?.toString().trim() || null,
            sender: null,
            tags: [],
            status: "active",
            created_by: user?.id
          };
          await supabase.from("emails").insert(payload);
        }
        
        toast.success("Excel imported successfully!", { id: "excel-import" });
        qc.invalidateQueries({ queryKey: ["admin-emails"] });
        qc.invalidateQueries({ queryKey: ["emails"] });
      } catch (err: any) {
        toast.error("Failed to parse Excel file: " + err.message, { id: "excel-import" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const openNew = () => {
    setEditing(null);
    setForm({ subject: "", recipient: "", url: "" });
    setOpen(true);
  };
  const openEdit = (row: EmailRow) => {
    setEditing(row);
    setForm({ subject: row.subject, recipient: row.recipient ?? "", url: row.url ?? "" });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
        />
        <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/10" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Import Excel
        </Button>
        <Button className="bg-[var(--accent)] text-white hover:opacity-90 border-none shadow-lg" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New email
        </Button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-lg">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase text-white/60 bg-white/5">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white">
            {(q.data ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 font-medium">{r.subject}</td>
                <td className="px-4 py-4 text-white/70">{r.recipient ?? "—"}</td>
                <td className="px-4 py-4 text-right">
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-red-400 hover:bg-white/10" onClick={() => setDeletingId(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-white/50">No emails yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit email" : "New email"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Welcome to SR Nexus" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="user@example.com" />
            </div>
            <div>
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.subject.trim() || save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this email and all of its associated cards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && del.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CardsAdmin() {
  const { activePc } = usePc();
  const qc = useQueryClient();
  const [emailId, setEmailId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", icon: "", linksText: "" });

  const emailsQ = useQuery({
    queryKey: ["admin-emails", activePc],
    queryFn: async () => {
      const { data, error } = await supabase.from("emails").select("id, subject, tags").order("created_at", { ascending: false });
      if (error) throw error;
      const list = data as { id: string; subject: string; tags: string[] }[];
      return list.filter(e => {
         const isPc2 = Array.isArray(e.tags) && e.tags.includes("PC2");
         return activePc === "PC2" ? isPc2 : !isPc2;
      });
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
      setDeletingId(null);
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
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-sm p-12 text-center text-white/60 shadow-inner">
          <Layers className="mx-auto mb-3 h-8 w-8 text-white/40" />
          Select an email above to manage its cards.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(cardsQ.data ?? []).map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 transition-colors shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white border border-white/10 text-xl shadow-sm">{c.icon ?? "✉️"}</div>
                  <div>
                    <div className="font-semibold text-white text-base">{c.title}</div>
                    {c.subtitle && <div className="text-sm text-white/70 mt-0.5">{c.subtitle}</div>}
                    <div className="mt-2 text-[0.7rem] font-medium text-white/60 bg-white/5 inline-block px-2 py-1 rounded-md border border-white/10">{(c.links ?? []).length} link(s)</div>
                  </div>
                </div>
                <div className="flex gap-1 bg-white/5 rounded-lg border border-white/5">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-lg" onClick={() => setDeletingId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          {(cardsQ.data ?? []).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-sm text-white/60 shadow-inner">
              No cards yet. Click <b className="text-white">New card</b> to add one.
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

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this card. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && del.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
