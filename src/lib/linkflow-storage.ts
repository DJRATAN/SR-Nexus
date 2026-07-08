import { supabase } from "@/integrations/supabase/client";

export interface Link {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  icon: string;
  customIcon?: string | null;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  customIcon?: string | null;
}

export async function getLinks(): Promise<Link[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching links:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    url: item.url,
    categoryId: item.category_id,
    icon: item.icon,
    customIcon: item.custom_icon,
    createdAt: new Date(item.created_at).getTime()
  }));
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    customIcon: item.custom_icon
  }));
}

export async function addLink(link: Omit<Link, 'id' | 'createdAt'>): Promise<Link | null> {
  const { data, error } = await supabase
    .from('links')
    .insert([{
      title: link.title,
      url: link.url,
      category_id: link.categoryId,
      icon: link.icon,
      custom_icon: link.customIcon
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding link:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    url: data.url,
    categoryId: data.category_id,
    icon: data.icon,
    customIcon: data.custom_icon,
    createdAt: new Date(data.created_at).getTime()
  };
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      icon: category.icon,
      custom_icon: category.customIcon
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding category:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
    customIcon: data.custom_icon
  };
}

export async function deleteLink(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting link:', error);
    return false;
  }
  return true;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }
  return true;
}

export async function updateLink(id: string, updates: Partial<Link>): Promise<boolean> {
  const supabaseUpdates: any = {};
  if (updates.title !== undefined) supabaseUpdates.title = updates.title;
  if (updates.url !== undefined) supabaseUpdates.url = updates.url;
  if (updates.categoryId !== undefined) supabaseUpdates.category_id = updates.categoryId;
  if (updates.icon !== undefined) supabaseUpdates.icon = updates.icon;
  if (updates.customIcon !== undefined) supabaseUpdates.custom_icon = updates.customIcon;

  if (updates.customIcon === null) supabaseUpdates.custom_icon = null;

  const { error } = await supabase
    .from('links')
    .update(supabaseUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating link:', error);
    return false;
  }
  return true;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<boolean> {
  const supabaseUpdates: any = {};
  if (updates.name !== undefined) supabaseUpdates.name = updates.name;
  if (updates.icon !== undefined) supabaseUpdates.icon = updates.icon;
  if (updates.customIcon !== undefined) supabaseUpdates.custom_icon = updates.customIcon;

  if (updates.customIcon === null) supabaseUpdates.custom_icon = null;

  const { error } = await supabase
    .from('categories')
    .update(supabaseUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return false;
  }
  return true;
}
