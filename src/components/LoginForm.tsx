"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace(redirect);
    router.refresh();
  };

  return (
    <AppFrame>
      <div className="login">
        <div className="login-brandmark">C</div>
        <div className="login-eyebrow">Craig&apos;s Saloon</div>
        <h1 className="login-title">Franchise Platform</h1>
        <p className="login-sub">Sign in to manage the saloon.</p>

        <form className="login-form" onSubmit={onSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div>
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="login-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@craigssaloon.co.zw"
              required
            />
          </div>
          <div>
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="login-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-hint">
          <b>Demo accounts</b> — password <b>CraigsGold!2026</b>
          <br />
          Owner: craig@craigssaloon.co.zw
          <br />
          Admin (Avondale): avondale@craigssaloon.co.zw
          <br />
          Technician: stylist@craigssaloon.co.zw
        </div>
      </div>
    </AppFrame>
  );
}
