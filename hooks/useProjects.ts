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

            try {
                const snapshot = await getDocs(collection(db, "proyectos"));

                const projectsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Project[];

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