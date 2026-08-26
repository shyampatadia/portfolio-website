import { useState } from "react";
import { Loader2 } from "lucide-react";

import { login } from "@/admin/lib/api";
import { ErrorNotice, Field } from "@/admin/components/ui";

export function Login({ onSignedIn, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(email.trim(), password);
      onSignedIn();
    } catch (caught) {
      setError(caught);
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-head">
          <h1>Portfolio admin</h1>
          <p>{notice || "Sign in to manage content and read analytics."}</p>
        </div>

        <Field label="Email" htmlFor="admin-email">
          <input
            id="admin-email"
            className="input"
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="admin-password">
          <input
            id="admin-password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {error && <ErrorNotice error={error} />}

        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
