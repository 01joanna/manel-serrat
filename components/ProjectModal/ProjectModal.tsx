"use client";

import React from "react";
import {
    AnimatePresence,
    motion,
} from "framer-motion";

import type { Project } from "@/types/Project";
import ProjectPlayer from "./ProjectPlayer";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export interface ProjectCredit {
    rol: string;
    personas: string[];
}

interface ProjectModalProps {
    project: Project;
    onClose: () => void;
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function ProjectModal({
    project,
    onClose,
}: ProjectModalProps) {
    return (
        <motion.main
            className="
                fixed
                inset-0
                z-[100]
                bg-black/80
                text-white
                overflow-hidden
                flex
                items-center
                justify-center
            "
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
            }}
            exit={{
                opacity: 0,
            }}
            transition={{
                duration: 0.4,
                ease: "easeInOut",
            }}
            onClick={onClose}
        >
            <ProjectPlayer
                project={project}
                onClose={onClose}
            />
        </motion.main>
    );
}