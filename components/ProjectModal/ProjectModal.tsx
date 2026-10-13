
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

import type { Project } from "@/types/Project";
import ProjectPlayer from "./ProjectPlayer";

interface ProjectModalProps {
    project: Project;
    onClose: () => void;
}

export default function ProjectModal({
    project,
    onClose,
}: ProjectModalProps) {
    useEffect(() => {
        document.documentElement.dataset.projectModalOpen = "true";

        return () => {
            delete document.documentElement.dataset.projectModalOpen;
        };
    }, []);

    return (
        <motion.main
            className="fixed inset-0 z-[100] overflow-hidden bg-black/80 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            {/* Fondo: pulsarlo cierra el proyecto */}
            <button
                type="button"
                aria-label="Volver a work"
                className="absolute inset-0 z-0 h-full w-full cursor-default"
                onClick={onClose}
            />

            {/* El reproductor queda por encima del fondo */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <ProjectPlayer
                    project={project}
                    onClose={onClose}
                />
            </div>
        </motion.main>
    );
}
