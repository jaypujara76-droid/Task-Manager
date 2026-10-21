"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type SignupResponse = {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
};

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiRequest<SignupResponse>("/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      setSuccess(result.message);

      // Signup creates an account but does not return a JWT.
      // Send the user to login after successful registration.
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-500">Sign up to start managing your tasks.</p>
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-2 block font-sans text-sm font-medium text-slate-800"
          >
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-sans text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block font-sans text-sm font-medium text-slate-800"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-sans text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block font-sans text-sm font-medium text-slate-800"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-sans text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block font-sans text-sm font-medium text-slate-800"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-sans text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            placeholder="Enter password again"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success} Redirecting to login...
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
