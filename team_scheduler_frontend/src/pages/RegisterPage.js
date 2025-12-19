import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiClient } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

// PUBLIC_INTERFACE
export function RegisterPage() {
  /** Registration page. */
  const auth = useAuth();
  const navigate = useNavigate();

  const api = useMemo(() => new ApiClient(), []);
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("demo@company.com");
  const [password, setPassword] = useState("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const register = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.register({ name, email, password });
      auth.setSession({ accessToken: res.accessToken, user: res.user });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to register");
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
            <div className="auth-title">Create account</div>
            <div className="auth-sub">Get started in minutes.</div>
          </div>
        </div>

        <form onSubmit={register} className="form">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error ? <div className="alert alert-error">{error}</div> : null}

          <Button type="submit" disabled={busy} className="w-100">
            {busy ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
