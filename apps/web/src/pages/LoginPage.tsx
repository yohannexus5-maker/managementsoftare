import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Input, Label } from "../components/ui";

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-sm uppercase tracking-widest text-ink-400">Studio Meridian</div>
          <div className="mt-1 text-xl font-semibold text-ink-900">Practice Platform</div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <Label>Email</Label>
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studiomeridian.com"
            />
          </div>
          <div className="mb-5">
            <Label>Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="mb-4 text-sm text-danger-600">{error}</div>}
          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-400">
          Demo accounts: principal@studiomeridian.com · architect@studiomeridian.com ·
          designer1@studiomeridian.com · admin@studiomeridian.com ·
          consultant@bedrockstructural.com · client@vantagedevelopers.com — password: password123
        </p>
      </div>
    </div>
  );
}
