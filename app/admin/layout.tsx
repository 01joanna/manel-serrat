
"use client";

import React, { useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const ADMIN_UID = "Me79JyhSMUWHbn8iJePLhG2XZ803";

type AuthStatus = "loading" | "signed-out" | "authorized";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user: User | null) => {
                if (!user) {
                    setStatus("signed-out");
                    return;
                }

                if (user.uid !== ADMIN_UID) {
                    setStatus("signed-out");
                    setError(
                        "Aquest compte no té permisos per accedir al panell."
                    );

                    try {
                        await signOut(auth);
                    } catch (signOutError) {
                        console.error(
                            "Error tancant la sessió:",
                            signOutError
                        );
                    }

                    return;
                }

                setError("");
                setStatus("authorized");
            }
        );

        return unsubscribe;
    }, []);

    async function handleLogin(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSubmitting(true);

        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            if (credential.user.uid !== ADMIN_UID) {
                await signOut(auth);

                setError(
                    "Aquest compte no té permisos per accedir al panell."
                );

                return;
            }

            setPassword("");
            setStatus("authorized");
        } catch (loginError: unknown) {
            console.error("Error iniciant sessió:", loginError);

            const code =
                typeof loginError === "object" &&
                loginError !== null &&
                "code" in loginError
                    ? String(loginError.code)
                    : "";

            if (
                code === "auth/invalid-credential" ||
                code === "auth/user-not-found" ||
                code === "auth/wrong-password" ||
                code === "auth/invalid-email"
            ) {
                setError("El correu o la contrasenya no són correctes.");
            } else if (code === "auth/too-many-requests") {
                setError(
                    "Hi ha hagut massa intents. Torna-ho a provar més tard."
                );
            } else if (
                code === "auth/network-request-failed"
            ) {
                setError(
                    "No s'ha pogut connectar. Comprova la connexió a internet."
                );
            } else if (code === "auth/operation-not-allowed") {
                setError(
                    "Activa Email/Password a Firebase Authentication."
                );
            } else {
                setError(
                    "No s'ha pogut iniciar la sessió. Revisa les dades i la configuració de Firebase."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleLogout() {
        setLoggingOut(true);
        setError("");

        try {
            await signOut(auth);
            setPassword("");
            setStatus("signed-out");
        } catch (logoutError) {
            console.error("Error tancant la sessió:", logoutError);
            setError("No s'ha pogut tancar la sessió.");
        } finally {
            setLoggingOut(false);
        }
    }

    const inputClass =
        "w-full border border-white/25 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white";

    const buttonClass =
        "w-full border border-white bg-white px-4 py-3 text-sm text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

    if (status === "loading") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white font-overused">
                <p className="text-xs uppercase tracking-widest text-white/50">
                    Comprovant accés…
                </p>
            </main>
        );
    }

    if (status === "signed-out") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-5 py-10 text-white font-overused">
                <div className="w-full max-w-sm">

                    <h1 className="mt-3 text-2xl">
                        Administració
                    </h1>

                    <form
                        onSubmit={handleLogin}
                        className="mt-10 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="admin-email"
                                className="mb-2 block text-xs uppercase tracking-wider text-white/60"
                            >
                                Correu electrònic
                            </label>

                            <input
                                id="admin-email"
                                type="email"
                                autoComplete="username"
                                className={inputClass}
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="Correu electrònic"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="admin-password"
                                className="mb-2 block text-xs uppercase tracking-wider text-white/60"
                            >
                                Contrasenya
                            </label>

                            <input
                                id="admin-password"
                                type="password"
                                autoComplete="current-password"
                                className={inputClass}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Contrasenya"
                                required
                            />
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="text-sm text-red-400"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className={buttonClass}
                        >
                            {submitting
                                ? "Iniciant sessió…"
                                : "Inicia sessió"}
                        </button>
                    </form>
                </div>
            </main>
        );
    }
    
return (
    <>
        {children}

        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3">
            <button
                type="button"
                onClick={() => {
                    window.location.href = "/";
                }}
                className="border border-white/30 bg-black px-3 py-2 text-xs uppercase tracking-wider text-white/70 transition-colors hover:border-white hover:text-white"
            >
                Inici
            </button>

            <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="border border-white/30 bg-black px-3 py-2 text-xs uppercase tracking-wider text-white/70 transition-colors hover:border-white hover:text-white disabled:opacity-40"
            >
                {loggingOut ? "Sortint…" : "Tanca sessió"}
            </button>
        </div>
    </>
);
            }