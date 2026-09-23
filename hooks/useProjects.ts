"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types/Project";

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const getProjects = async () => {
            console.log("🔥 Intentando conectar con Firestore...");

            try {
                const snapshot = await getDocs(collection(db, "proyectos"));

                console.log("🔥 Firestore conectado");
                console.log("📦 Número de documentos:", snapshot.size);
                console.log("📄 Documentos:", snapshot.docs);

                const projectsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Project[];

                console.log("🎬 Proyectos:", projectsData);

                setProjects(projectsData);
            } catch (error) {
                console.error("❌ ERROR FIREBASE:", error);

                setError(
                    error instanceof Error
                        ? error
                        : new Error("Error getting projects")
                );
            } finally {
                setLoading(false);
            }
        };

        getProjects();
    }, []);

    return {
        projects,
        loading,
        error,
    };
}