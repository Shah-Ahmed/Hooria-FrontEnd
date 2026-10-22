"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";
import { HOME_BY_ROLE } from "@/lib/roles";

export default function LoginPage() {
  const { profile, loading, error: authError, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in (or just logged in): go to the page of your role.
  useEffect(() => {
    if (!loading && profile) router.replace(HOME_BY_ROLE[profile.role]);
  }, [loading, profile, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const shownError = error || authError;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body p-4">
            <h1 className="h4 mb-3">Login</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {shownError && <div className="alert alert-danger py-2">{shownError}</div>}
              <button className="btn btn-primary w-100" type="submit" disabled={submitting || loading}>
                {submitting || loading ? "Please wait..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
