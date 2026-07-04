import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

type AuthStatus = "disabled" | "loading" | "guest" | "signed-in" | "error";

export const useSupabaseSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(hasSupabaseConfig() ? "loading" : "disabled");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let mounted = true;

    const verifyCurrentUser = () => {
      client.auth.getUser().then(({ data, error: userError }) => {
        if (!mounted) return;
        if (userError) {
          setUser(null);
          setError(userError.message);
          setStatus("error");
          return;
        }
        setUser(data.user);
        setStatus(data.user ? "signed-in" : "guest");
        setError(null);
      });
    };

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
        setStatus("error");
        return;
      }
      setSession(data.session);
      if (data.session) verifyCurrentUser();
      else {
        setUser(null);
        setStatus("guest");
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setUser(null);
        setStatus("guest");
        setError(null);
        return;
      }
      setStatus("loading");
      verifyCurrentUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { ok: false, error: "Connexion de compte indisponible." };
    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}${window.location.pathname}${window.location.hash || "#/"}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
      return { ok: false, error: error.message };
    }
    setError(null);
    return { ok: true, error: null };
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { ok: false, error: "Connexion de compte indisponible." };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setError(error.message);
      setStatus("error");
      return { ok: false, error: error.message };
    }
    setError(null);
    return { ok: true, error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    configured: hasSupabaseConfig(),
    error,
    sendMagicLink,
    session,
    signOut,
    status,
    user: user || undefined,
    verifyEmailOtp,
  };
};
