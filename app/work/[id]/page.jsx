"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProjectPage() {
    const params = useParams();
    const id = params.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const projectRef = doc(db, "proyectos", id);
                const projectSnapshot = await getDoc(projectRef);

                if (projectSnapshot.exists()) {
                    setProject({
                        id: projectSnapshot.id,
                        ...projectSnapshot.data(),
                    });
                } else {
                    console.log("Project not found");
                }
            } catch (error) {
                console.error("Error loading project:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id]);

    if (loading) {
        return null;
    }

    if (!project) {
        return (
            <main className="w-full h-screen flex items-center justify-center">
                <p>Project not found</p>
            </main>
        );
    }

    return (
        <main className="w-full h-screen flex bg-white text-black">
            {/* VIDEO */}
            <section className="w-1/2 h-full flex items-center justify-center p-6">
                {project.video && (
                    <iframe
                        src={project.video}
                        className="w-full aspect-video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={project.titulo || "Project video"}
                    />
                )}
            </section>

            {/* CREDITS */}
            <section className="w-1/2 h-full flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        {project.titulo}
                    </h1>

                    <p className="mt-2 text-sm opacity-50">
                        {project.anyo}
                    </p>

                    <div className="mt-8 text-sm leading-relaxed">
                        {project.para && (
                            <p>
                                <span className="opacity-50">Client</span>
                                <br />
                                {project.para}
                            </p>
                        )}

                        {project.direccion && (
                            <p className="mt-4">
                                <span className="opacity-50">Direction</span>
                                <br />
                                {project.direccion}
                            </p>
                        )}

                        {project.produccion && (
                            <p className="mt-4">
                                <span className="opacity-50">Production</span>
                                <br />
                                {project.produccion}
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}