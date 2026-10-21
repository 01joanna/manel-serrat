
"use client";

import {
    motion,
    AnimatePresence,
} from "framer-motion";

import type { Project } from "@/types/Project";

type MainBarProps = {
    projects: Project[];
    activeProject: number;
    setActiveProject: (index: number) => void;
};

export default function MainBar({
    projects,
    activeProject,
    setActiveProject,
}: MainBarProps) {
    if (!projects || projects.length === 0) {
        return null;
    }

    const project = projects[activeProject];
    const total = projects.length;

    const getCircularOffset = (index: number): number => {
        let offset = index - activeProject;

        if (offset > total / 2) {
            offset -= total;
        }

        if (offset < -total / 2) {
            offset += total;
        }

        return offset;
    };

    const getProjectPara = (item: Project) =>
        Array.isArray(item.para) ? item.para[0] : item.para;

    const projectPara = getProjectPara(project);

    const mobileOpacities = [1, 0.55, 0.35, 0.22, 0.12, 0.06];

    const mobileProjects = projects
        .map((item, index) => ({
            item,
            index,
            offset: (index - activeProject + total) % total,
        }))
        .filter(({ offset }) => offset < mobileOpacities.length)
        .sort((a, b) => a.offset - b.offset);

    return (
        <div
            className="
                absolute
                inset-0
                z-50
                flex
                items-end
                justify-end
                px-6
                pb-6
                lg:flex-row
                lg:items-center
                lg:justify-between
                lg:px-70
                lg:pb-0
                text-white
                font-overused
                pointer-events-none
            "
        >
            {/* LISTA DE PROYECTOS EN MÓVIL */}

            <div
                className="
                    flex
                    flex-col
                    items-end
                    justify-end
                    w-auto
                    max-w-[85vw]
                    text-right
                    uppercase
                    pointer-events-auto
                    lg:hidden
                "
            >
                <AnimatePresence initial={false} mode="popLayout">
                    {mobileProjects.map(({ item, index, offset }) => (
                        <motion.button
                            key={`${item.id}-${offset}`}
                            type="button"
                            onClick={() => setActiveProject(index)}
                            className="
                                flex
                                items-end
                                gap-1
                                text-right
                                cursor-pointer
                                pointer-events-auto
                            "
                            initial={{
                                opacity: 0,
                                x: 8,
                            }}
                            animate={{
                                opacity: mobileOpacities[offset],
                                x: 0,
                            }}
                            exit={{
                                opacity: 0,
                                x: -8,
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{
                                position: "relative",
                                willChange: "opacity, transform",
                            }}
                        >
                            <span
                                className="
                                    text-[clamp(15px,4vw,22px)]
                                    leading-tight
                                    font-medium
                                    uppercase
                                "
                            >
                                {item.titulo}
                            </span>

                            <span
                                className="
                                    text-[11px]
                                    leading-tight
                                    opacity-70
                                "
                            >
                                {item.anyo}
                            </span>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* INFORMACIÓN DEL PROYECTO — SOLO ESCRITORIO */}

            <div
                className="
                    hidden
                    lg:flex
                    w-1/2
                    text-left
                    uppercase
                    opacity-70
                    flex-col
                    gap-0
                    pointer-events-none
                "
            >
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
                        <h2
                            className="
                                text-[clamp(15px,4vw,36px)]
                                lg:text-4xl
                                font-medium
                                leading-tight
                            "
                        >
                            {project.titulo}
                        </h2>

                        {projectPara && (
                            <p
                                className="
                                    text-[clamp(12px,3vw,18px)]
                                    lg:text-base
                                    leading-tight
                                    opacity-40
                                "
                            >
                                {projectPara}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* LISTA VERTICAL CIRCULAR — SOLO ESCRITORIO */}

            <div
                className="
                    hidden
                    lg:flex
                    relative
                    h-60
                    w-64
                    items-center
                    justify-end
                    overflow-hidden
                    text-right
                    uppercase
                    pointer-events-auto
                "
            >
                {projects.map((item, index) => {
                    const offset = getCircularOffset(index);
                    const distance = Math.abs(offset);
                    const isActive = offset === 0;

                    const visible = distance <= 3;

                    if (!visible) {
                        return null;
                    }

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
                                ease: [
                                    0.22,
                                    1,
                                    0.36,
                                    1,
                                ],
                            }}
                            style={{
                                top: "50%",
                                transformOrigin: "right center",
                            }}
                        >
                            <span
                                className="
                                    inline-flex
                                    items-end
                                    justify-end
                                    gap-2
                                "
                            >
                                <span
                                    className="
                                        text-md
                                        uppercase
                                        leading-none
                                    "
                                >
                                    {item.titulo}
                                </span>

                                <span
                                    className="
                                        text-[11px]
                                        uppercase
                                        leading-none
                                    "
                                >
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
