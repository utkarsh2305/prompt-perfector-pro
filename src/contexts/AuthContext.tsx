import React, { createContext, useMemo, useState } from "react";

export type AppRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  roles: AppRole[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async ({ email }) => {
        // Placeholder auth only. Supabase will replace this.
        setUser({ id: "local", email, roles: ["user"] });
      },
      signUp: async ({ email }) => {
        // Placeholder auth only. Supabase will replace this.
        setUser({ id: "local", email, roles: ["user"] });
      },
      signOut: async () => {
        setUser(null);
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
