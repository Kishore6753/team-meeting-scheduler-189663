import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiClient } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login page. */
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  const api = useMemo(() => new ApiClient(), []);
  const [email, setEmail] = useState("demo@company.com");
  const [password, setPassword] = useState("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      auth.setSession({ accessToken: res.accessToken, user: res.user });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark lg">TS</div>
          <div>
            <div className="auth-title">Sign in</div>
            <div className="auth-sub">Schedule meetings, invite team members, and get reminders.</div>
          </div>
        </div>

        <form onSubmit={login} className="form">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error ? <div className="alert alert-error">{error}</div> : null}

          <Button type="submit" disabled={busy} className="w-100">
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </div>

        <div className="auth-note">
          If backend is not configured, the app automatically runs in mock mode.
        </div>
      </div>
    </div>
  );
}
