import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setSession(data.session);
      setUser(currentUser);
      
      if (currentUser) {
        setIsAdmin(true); // Forced bypass
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // 2. Listen for changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const currentUser = s?.user ?? null;
      setSession(s);
      setUser(currentUser);
      
      if (currentUser) {
        setIsAdmin(true); // Forced bypass
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, session, loading, isAdmin };
}
