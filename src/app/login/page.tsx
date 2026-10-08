"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password }) });
    if (res.ok) window.location.href = "/";
    else setError("Falsches Passwort");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <h1 className="text-lg font-semibold">Flathunting Sydney</h1>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md bg-neutral-900 px-3 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
          Öffnen
        </button>
      </form>
    </main>
  );
}
