
"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function MainBar({
    projects,
    activeProject,
    setActiveProject,
}) {
    if (!projects || projects.length === 0) {
        return null;
    }

    const project = projects[activeProject];

    const total = projects.length;

    const getCircularOffset = (index) => {
        let offset = index - activeProject;
        if (offset > total / 2) {
            offset -= total;
        }

        if (offset < -total / 2) {
            offset += total;
        }

        return offset;
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-between px-70 text-white font-overused pointer-events-none">
            {/* TÍTULO DEL PROYECTO A LA IZQUIERDA */}
            <div className="w-1/2 uppercase opacity-70 flex flex-col gap-4">
                <div>
                    <span className="uppercase leading-none text-xl font-light">Manel Serrat</span>
                </div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={project.id}
                            initial={{
                                opacity: 0,
                                y: 10,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: -10,
                            }}
                            transition={{
                                duration: 0.35,
                                ease: "easeInOut",
                            }}
                        >
                            <h2 className="text-xl md:text-4xl font-medium">
                                {project.para || project.titulo}
                            </h2>

                            {project.para && (
                                <p className="text-sm md:text-base -mt-2">
                                    {project.titulo}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* LISTA VERTICAL CIRCULAR */}
                <div className="relative flex h-60 w-64 items-center justify-end overflow-hidden text-right uppercase">

                    {projects.map((item, index) => {
                        const offset = getCircularOffset(index);
                        const distance = Math.abs(offset);
                        const isActive = offset === 0;

                        const visible = distance <= 3;

                        if (!visible) return null;

                        const opacity =
                            distance === 0
                                ? 1
                                : distance === 1
                                    ? 0.55
                                    : distance === 2
                                        ? 0.25
                                        : 0.08;

                        const scale =
                            distance === 0
                                ? 1
                                : distance === 1
                                    ? 0.97
                                    : 0.94;

                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveProject(index)}
                                className="
        absolute
        right-0
        w-full
        cursor-pointer
        pointer-events-auto
        text-right
    "
                                animate={{
                                    y: offset * 20,
                                    opacity,
                                    scale,
                                    fontWeight: isActive ? 600 : 400,
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    top: "50%",
                                    transformOrigin: "right center",
                                }}
                            >
                                <span className="inline-flex items-end justify-end gap-2">
                                    <span className="text-md uppercase leading-none">
                                        {item.titulo}
                                    </span>

                                    <span className="text-[11px] uppercase leading-none">
                                        {item.anyo}
                                    </span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
            );
}