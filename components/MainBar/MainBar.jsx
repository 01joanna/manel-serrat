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

    // Calcula la posición circular de cada número
    const getCircularOffset = (index) => {
        const length = projects.length;

        let offset = index - activeProject;

        if (offset > length / 2) {
            offset -= length;
        }

        if (offset < -length / 2) {
            offset += length;
        }

        return offset;
    };

    return (
        <div className="absolute left-0 top-1/2 z-50 flex w-full -translate-y-1/2 items-center text-white font-overused">

            {/* RUEDA */}
            <div className="relative h-[400px] w-[160px] shrink-0 overflow-hidden">
                <motion.div
                    className="absolute -left-[230px] top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full border border-white/60 mix-blend-difference"
                    animate={{
                        rotate: activeProject * (360 / projects.length),
                    }}
                    transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* INFORMACIÓN */}
            <div className="flex flex-1 items-center justify-between pl-6 pr-40 uppercase">

                {/* NÚMEROS */}
                <div className="relative h-[160px] w-[40px] overflow-hidden">

                    {projects.map((item, index) => {
                        const offset = getCircularOffset(index);

                        const distance = Math.abs(offset);
                        const isActive = offset === 0;

                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveProject(index)}
                                className="absolute left-0 w-full text-left text-xs"
                                animate={{
                                    y: offset * 32,
                                    opacity:
                                        distance === 0
                                            ? 1
                                            : distance === 1
                                                ? 0.5
                                                : 0.2,
                                    scale:
                                        distance === 0
                                            ? 1
                                            : distance === 1
                                                ? 0.9
                                                : 0.8,
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    top: "50%",
                                    marginTop: "-16px",
                                }}
                            >
                                {String(index + 1).padStart(2, "0")}
                            </motion.button>
                        );
                    })}

                </div>

                {/* PARA */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${project.id}-para`}
                        className="text-overused text-3xl font-medium"
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
                            duration: 0.5,
                            ease: "easeInOut",
                        }}
                    >
                        {project.para}
                    </motion.div>
                </AnimatePresence>

                {/* TÍTULO */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${project.id}-title`}
                        className="text-md"
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
                            duration: 0.5,
                            ease: "easeInOut",
                        }}
                    >
                        {project.titulo}
                    </motion.div>
                </AnimatePresence>

            </div>

        </div>
    );

}
