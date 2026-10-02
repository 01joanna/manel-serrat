"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MainBar from "@/components/MainBar/MainBar";
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
    const { projects, loading, error } = useProjects();

    const [activeProject, setActiveProject] = useState(0);

    const activeProjectRef = useRef(0);
    const scrollingRef = useRef(false);

    useEffect(() => {
        if (!projects || projects.length === 0) return;

        const handleWheel = (event: WheelEvent) => {
            // Ignorar movimientos demasiado pequeños
            if (Math.abs(event.deltaY) < 5) return;

            // Evitar que un mismo gesto cambie varios proyectos
            if (scrollingRef.current) return;

            scrollingRef.current = true;

            const currentIndex = activeProjectRef.current;

            let newIndex: number;

            if (event.deltaY > 0) {
                // ↓ siguiente proyecto
                newIndex = (currentIndex + 1) % projects.length;
            } else {
                // ↑ proyecto anterior
                newIndex =
                    (currentIndex - 1 + projects.length) %
                    projects.length;
            }

            activeProjectRef.current = newIndex;
            setActiveProject(newIndex);

            // Bloqueamos durante un momento
            setTimeout(() => {
                scrollingRef.current = false;
            }, 500);
        };
        
        window.addEventListener("wheel", handleWheel, {
            passive: true,
            capture: true,
        });

        return () => {
            window.removeEventListener("wheel", handleWheel, {
                capture: true,
            });
        };
    }, [projects]);

    if (loading) {
        return null;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!projects || projects.length === 0) {
        return null;
    }

    const project = projects[activeProject];

    if (!project) {
        return null;
    }

    return (
        <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">

            {/* VÍDEO */}
            <AnimatePresence mode="wait">
                <motion.iframe
                    key={project.id}
                    src={`${project.video}?autoplay=1&muted=1&loop=1&background=1`}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                    allow="autoplay; fullscreen; picture-in-picture"
                    title={project.titulo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                />
            </AnimatePresence>

            {/* MAIN BAR */}
            <MainBar
                projects={projects}
                activeProject={activeProject}
                setActiveProject={(index: number) => {
                    activeProjectRef.current = index;
                    setActiveProject(index);
                }}
            />

        </main>
    );
}