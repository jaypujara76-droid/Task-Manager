"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
    message: string,
    token: string
};

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await apiRequest<LoginResponse>("/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            })

            sessionStorage.setItem("token", result.token);
            setUsername("");
            setPassword("");
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to log in",);
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <form
                onSubmit={handleLogin}
                className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Login
                    </h1>

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
                        placeholder="Enter your username"
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
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 font-sans text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                        placeholder="Enter your password"
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-center text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-semibold text-indigo-600 hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </form>
        </main>
    );
}