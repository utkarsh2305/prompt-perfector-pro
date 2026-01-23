import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";

export type AppRole = "admin" | "moderator" | "user";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isAdminAllowlisted: boolean;
  isLoading: boolean;

  signUp: (params: { email: string; password: string; fullName: string }) => Promise<{ error: unknown }>;
  signIn: (params: { email: string; password: string }) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;

  resetPassword: (params: { email: string }) => Promise<{ error: unknown }>;
  updatePassword: (params: { newPassword: string }) => Promise<{ error: unknown }>;

  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function upsertProfileForUser(user: User): Promise<void> {
  // We intentionally create the profile from the client (instead of triggers on auth.users)
  // to avoid modifying Supabase reserved schemas.
  const email = user.email ?? null;
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;

  await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email,
      full_name: fullName,
      last_login_at: new Date().toISOString(),
    } as unknown as Profile);
}

async function fetchProfileForUser(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) return null;
  return (data as unknown as Profile) ?? null;
}

async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r) => r.role as AppRole);
}

async function fetchAdminAllowlistStatus(): Promise<boolean> {
  // Server-side enforcement: Edge Function checks BOTH (role + allowlist).
  // Client never trusts itself; it only asks the server.
  try {
    const { data, error } = await supabase.functions.invoke("admin-check");
    if (error) {
      console.warn("admin-check failed:", error.message);
      return false;
    }
    return Boolean((data as { is_admin?: boolean } | null)?.is_admin);
  } catch (err) {
    console.warn("admin-check exception:", err);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isAdminAllowlisted, setIsAdminAllowlisted] = useState(false);
  // isLoading = true ONLY until we know if user is logged in or not
  // Profile/roles are loaded in background without blocking navigation
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(false);

  // Lightweight hydration: quickly set user/session, then load profile in background
  const hydrateForSession = useCallback(async (nextSession: Session | null, isInitial = false) => {
    try {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      // If no user, clear everything immediately
      if (!nextUser) {
        setProfile(null);
        setRoles([]);
        setIsAdminAllowlisted(false);
        return;
      }

      // For initial load, we already have the user - stop blocking
      // Profile & roles load in the background
      if (isInitial) {
        setIsLoading(false);
      }

      setIsHydrating(true);

      // Upsert and fetch profile/roles in parallel (non-blocking)
      await upsertProfileForUser(nextUser);
      const [nextProfile, nextRoles] = await Promise.all([
        fetchProfileForUser(nextUser.id),
        fetchRolesForUser(nextUser.id),
      ]);
      setProfile(nextProfile);
      setRoles(nextRoles);

      // Admin check only if they have admin role
      if (nextRoles.includes("admin")) {
        const allowlisted = await fetchAdminAllowlistStatus();
        setIsAdminAllowlisted(allowlisted);
      } else {
        setIsAdminAllowlisted(false);
      }
    } catch (err) {
      console.error("hydrateForSession error:", err);
      setProfile(null);
      setRoles([]);
      setIsAdminAllowlisted(false);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up listener BEFORE getSession to avoid missing auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;
      
      // Handle signout event immediately
      if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
        setIsAdminAllowlisted(false);
        setIsLoading(false);
        return;
      }
      
      // For other auth changes, hydrate session (don't set isLoading=true to avoid flicker)
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        hydrateForSession(nextSession, false);
      }
    });

    // Initial session check - this is the only time we block on isLoading
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        // User is logged in - set user immediately, load profile in background
        await hydrateForSession(data.session, true);
      }
      // Always clear loading after initial check
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [hydrateForSession]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const [nextProfile, nextRoles] = await Promise.all([
      fetchProfileForUser(user.id),
      fetchRolesForUser(user.id),
    ]);
    setProfile(nextProfile);
    setRoles(nextRoles);

    if (nextRoles.includes("admin")) {
      const allowlisted = await fetchAdminAllowlistStatus();
      setIsAdminAllowlisted(allowlisted);
    } else {
      setIsAdminAllowlisted(false);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = roles.includes("admin") && isAdminAllowlisted;

    return {
      user,
      session,
      profile,
      roles,
      isAdmin,
      isAdminAllowlisted,
      isLoading,

      signUp: async ({ email, password, fullName }) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        return { error };
      },

      signIn: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
          // Immediately reset local state for faster UI response
          setUser(null);
          setSession(null);
          setProfile(null);
          setRoles([]);
          setIsAdminAllowlisted(false);
        }
        return { error };
      },

      resetPassword: async ({ email }) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
      },

      updatePassword: async ({ newPassword }) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
      },

      refreshProfile,
    };
  }, [isAdminAllowlisted, isLoading, profile, refreshProfile, roles, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
