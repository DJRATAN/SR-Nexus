import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { getLinks, getCategories, addLink, addCategory, deleteLink, deleteCategory, updateLink, updateCategory } from "@/lib/linkflow-storage";
import type { Link as LinkType, Category } from "@/lib/linkflow-storage";
import { DynamicIcon } from "@/components/linkflow/DynamicIcon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, X, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const ICON_LIST = ['globe', 'share-2', 'code', 'briefcase', 'wrench', 'folder', 'layout', 'settings', 'plus', 'star', 'heart', 'image', 'mail', 'music', 'video', 'github', 'twitter', 'linkedin'];

export const Route = createFileRoute("/_authenticated/links-admin")({
  head: () => ({ meta: [{ title: "Linkflow Admin" }, { name: "robots", content: "noindex" }] }),
  component: LinksAdminPage,
});

function LinksAdminPage() {
  const { isAdmin, loading } = useAuth();
  
  const [links, setLinks] = useState<LinkType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Form States
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCategory, setLinkCategory] = useState("");
  const [linkIcon, setLinkIcon] = useState("globe");
  const [linkCustomIcon, setLinkCustomIcon] = useState<string | null | undefined>(undefined);

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("folder");
  const [categoryCustomIcon, setCategoryCustomIcon] = useState<string | null | undefined>(undefined);

  const linkFileRef = useRef<HTMLInputElement>(null);
  const catFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
    setIsMounted(true);
  }, []);

  const refreshData = async () => {
    const [fetchedLinks, fetchedCategories] = await Promise.all([
      getLinks(),
      getCategories()
    ]);
    setLinks(fetchedLinks);
    setCategories(fetchedCategories);
    if (fetchedCategories.length > 0 && !linkCategory) {
      setLinkCategory(fetchedCategories[0].id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'link' | 'category') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (type === 'link') setLinkCustomIcon(base64);
        else setCategoryCustomIcon(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-8 text-white/50">Loading…</div>;
  if (!isAdmin) return <Navigate to="/links" />;
  if (!isMounted) return null;

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkUrl || !linkCategory) return;
    
    if (editingLinkId) {
      await updateLink(editingLinkId, {
        title: linkTitle,
        url: linkUrl,
        categoryId: linkCategory,
        icon: linkIcon,
        customIcon: linkCustomIcon
      });
      setEditingLinkId(null);
    } else {
      await addLink({
        title: linkTitle,
        url: linkUrl,
        categoryId: linkCategory,
        icon: linkIcon,
        customIcon: linkCustomIcon
      });
    }
    
    setLinkTitle("");
    setLinkUrl("");
    setLinkCustomIcon(undefined);
    await refreshData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    
    if (editingCategoryId) {
      await updateCategory(editingCategoryId, {
        name: categoryName,
        icon: categoryIcon,
        customIcon: categoryCustomIcon
      });
      setEditingCategoryId(null);
    } else {
      await addCategory({
        name: categoryName,
        icon: categoryIcon,
        customIcon: categoryCustomIcon
      });
    }
    
    setCategoryName("");
    setCategoryCustomIcon(undefined);
    await refreshData();
  };

  const startEditLink = (link: LinkType) => {
    setEditingLinkId(link.id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkCategory(link.categoryId);
    if (link.customIcon) {
        setLinkCustomIcon(link.customIcon);
        setLinkIcon("");
    } else {
        setLinkIcon(link.icon || "globe");
        setLinkCustomIcon(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    if (cat.customIcon) {
        setCategoryCustomIcon(cat.customIcon);
        setCategoryIcon("");
    } else {
        setCategoryIcon(cat.icon || "folder");
        setCategoryCustomIcon(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditLink = () => {
    setEditingLinkId(null);
    setLinkTitle("");
    setLinkUrl("");
    setLinkCustomIcon(undefined);
    setLinkIcon("globe");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryCustomIcon(undefined);
    setCategoryIcon("folder");
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm("Delete this link?")) {
      await deleteLink(id);
      await refreshData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Delete this category? Links in this category will be orphaned.")) {
      await deleteCategory(id);
      await refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Manage Links & Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="bg-white/5 border border-white/10 shadow-none text-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
              <CardTitle className="text-xl text-slate-100">{editingLinkId ? 'Edit Link' : 'Add New Link'}</CardTitle>
              {editingLinkId && (
                <Button variant="ghost" size="sm" onClick={cancelEditLink} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddLink} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="linkTitle" className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Title</Label>
                  <Input 
                    id="linkTitle" 
                    placeholder="e.g. My Website" 
                    value={linkTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkTitle(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkUrl" className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">URL</Label>
                  <Input 
                    id="linkUrl" 
                    type="url"
                    placeholder="https://..." 
                    value={linkUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkCategory" className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Category</Label>
                  <select 
                    id="linkCategory"
                    value={linkCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLinkCategory(e.target.value)}
                    className="w-full flex h-10 rounded-xl bg-black/50 px-3 py-2 text-sm border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-800 text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Icon or Logo</Label>
                  <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-5 gap-1.5 p-2 bg-black/50 rounded-xl max-h-32 overflow-y-auto border border-white/10" style={{ scrollbarWidth: 'none' }}>
                          {ICON_LIST.map(icon => (
                              <div 
                              key={icon}
                              onClick={() => {setLinkIcon(icon); setLinkCustomIcon(undefined);}}
                              className={cn(
                                  "aspect-square flex items-center justify-center cursor-pointer rounded-md transition-all duration-200 hover:bg-white/10",
                                  (linkIcon === icon && !linkCustomIcon) ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400"
                              )}
                              >
                              <DynamicIcon name={icon} className="w-4 h-4" />
                              </div>
                          ))}
                          </div>
                      </div>
                      <div className="w-px h-24 bg-white/5"></div>
                      <div className="flex-1 flex flex-col gap-2">
                          <input 
                              type="file" 
                              ref={linkFileRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(e, 'link')}
                          />
                          <button 
                              type="button"
                              onClick={() => linkFileRef.current?.click()}
                              className="flex-1 bg-black/30 border-dashed border-2 border-white/10 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                          >
                              <Upload className="w-5 h-5 text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Upload</span>
                          </button>
                          {linkCustomIcon && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                  <img src={linkCustomIcon} className="w-4 h-4 object-contain rounded" />
                                  <span className="text-[9px] text-indigo-300 font-bold">READY</span>
                                  <button type="button" onClick={() => setLinkCustomIcon(editingLinkId ? null : undefined)}><X className="w-3 h-3 text-red-400" /></button>
                              </div>
                          )}
                      </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11 border-none">
                  {editingLinkId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingLinkId ? 'Update Link' : 'Add Link'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="bg-white/5 border border-white/10 shadow-none text-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                <CardTitle className="text-xl text-slate-100">{editingCategoryId ? 'Edit Category' : 'New Category'}</CardTitle>
                {editingCategoryId && (
                  <Button variant="ghost" size="sm" onClick={cancelEditCategory} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddCategory} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName" className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Category Name</Label>
                    <Input 
                      id="categoryName" 
                      placeholder="e.g. Design Tools" 
                      value={categoryName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryName(e.target.value)}
                      className="bg-black/50 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl"
                      required 
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Icon or Logo</Label>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-5 gap-1.5 p-2 bg-black/50 rounded-xl max-h-32 overflow-y-auto border border-white/10" style={{ scrollbarWidth: 'none' }}>
                              {ICON_LIST.map(icon => (
                                  <div 
                                  key={icon}
                                  onClick={() => {setCategoryIcon(icon); setCategoryCustomIcon(undefined);}}
                                  className={cn(
                                      "aspect-square flex items-center justify-center cursor-pointer rounded-md transition-all duration-200 hover:bg-white/10",
                                      (categoryIcon === icon && !categoryCustomIcon) ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400"
                                  )}
                                  >
                                  <DynamicIcon name={icon} className="w-4 h-4" />
                                  </div>
                              ))}
                          </div>
                        </div>
                        <div className="w-px h-24 bg-white/5"></div>
                        <div className="flex-1 flex flex-col gap-2">
                              <input 
                                  type="file" 
                                  ref={catFileRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => handleFileUpload(e, 'category')}
                              />
                              <button 
                                  type="button"
                                  onClick={() => catFileRef.current?.click()}
                                  className="flex-1 bg-black/30 border-dashed border-2 border-white/10 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                              >
                                  <Upload className="w-5 h-5 text-slate-400" />
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Upload</span>
                              </button>
                              {categoryCustomIcon && (
                                  <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                      <img src={categoryCustomIcon} className="w-4 h-4 object-contain rounded" />
                                      <span className="text-[9px] text-indigo-300 font-bold text-xs uppercase">Uploaded</span>
                                      <button type="button" onClick={() => setCategoryCustomIcon(editingCategoryId ? null : undefined)}><X className="w-3 h-3 text-red-400" /></button>
                                  </div>
                              )}
                        </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11 border-none">
                    {editingCategoryId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {editingCategoryId ? 'Update Category' : 'Create Category'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 shadow-none text-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xl text-slate-100">Existing Categories</CardTitle>
            </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center bg-black/30 px-4 py-3 rounded-xl border border-white/5 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/10 rounded-lg text-indigo-400 font-bold shrink-0">
                           {cat.customIcon ? (
                               <img src={cat.customIcon} className="w-4 h-4 object-contain rounded" />
                           ) : (
                               <DynamicIcon name={cat.icon || 'folder'} className="w-4 h-4" />
                           )}
                        </div>
                        <span className="font-bold text-slate-200 text-sm truncate uppercase tracking-wider">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startEditCategory(cat)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white/5 border border-white/10 shadow-none text-slate-200 mt-2 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle className="text-xl text-slate-100 uppercase tracking-widest text-xs font-bold opacity-70">Saved Directory</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {links.map(link => {
                const category = categories.find(c => c.id === link.categoryId);
                return (
                  <div key={link.id} className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        {link.customIcon ? (
                            <img src={link.customIcon} className="w-6 h-6 object-contain rounded" />
                        ) : (
                            <DynamicIcon name={link.icon || 'globe'} className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-100 truncate text-sm uppercase tracking-tight">{link.title}</h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 truncate tracking-widest font-bold">
                          <span className="text-indigo-400">{category ? category.name : 'Unknown'}</span>
                          <span className="shrink-0 opacity-50">•</span>
                          <span className="truncate opacity-50 uppercase">{link.url}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => startEditLink(link)}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {links.length === 0 && <p className="col-span-full text-center text-slate-500 py-8 italic font-medium">Clear as a summer sky. No links here yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
