"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import MainBar from "@/components/MainBar/MainBar";
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    const [activeProject, setActiveProject] =
        useState<number>(0);

    const activeProjectRef =
        useRef<number>(0);

    const scrollingRef =
        useRef<boolean>(false);

    const touchStartY =
        useRef<number | null>(null);

    const autoplayTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    /*
     * CAMBIAR DE PROYECTO
     */
    const changeProject = useCallback(
        (direction: "next" | "previous") => {
            if (
                !projects ||
                projects.length === 0
            ) {
                return;
            }

            if (scrollingRef.current) {
                return;
            }

            scrollingRef.current = true;

            const currentIndex =
                activeProjectRef.current;

            let newIndex: number;

            if (direction === "next") {
                newIndex =
                    (currentIndex + 1) %
                    projects.length;
            } else {
                newIndex =
                    (currentIndex -
                        1 +
                        projects.length) %
                    projects.length;
            }

            activeProjectRef.current =
                newIndex;

            setActiveProject(newIndex);

            setTimeout(() => {
                scrollingRef.current = false;
            }, 1300);
        },
        [projects]
    );

    useEffect(() => {
        if (!projects || projects.length <= 1) {
            return;
        }
    
        // En desktop no hacemos autoplay
        if (window.innerWidth >= 768) {
            return;
        }
    
        const startAutoplay = () => {
            if (autoplayTimeoutRef.current) {
                clearTimeout(
                    autoplayTimeoutRef.current
                );
            }
    
            autoplayTimeoutRef.current =
                setTimeout(() => {
                    const currentIndex =
                        activeProjectRef.current;
    
                    const newIndex =
                        (currentIndex + 1) %
                        projects.length;
    
                    activeProjectRef.current =
                        newIndex;
    
                    setActiveProject(newIndex);
    
                    // Volvemos a empezar los 13 segundos
                    startAutoplay();
                }, 13000);
        };
    
        startAutoplay();
    
        return () => {
            if (autoplayTimeoutRef.current) {
                clearTimeout(
                    autoplayTimeoutRef.current
                );
            }
        };
    }, [projects]);

    /*
     * SCROLL CON RUEDA
     *
     * Desktop.
     */
    useEffect(() => {
        if (
            !projects ||
            projects.length === 0
        ) {
            return;
        }

        const handleWheel = (
            event: WheelEvent
        ) => {
            if (
                Math.abs(event.deltaY) < 5
            ) {
                return;
            }

            if (
                scrollingRef.current
            ) {
                return;
            }

            if (window.innerWidth < 768) {
                return;
            }

            if (event.deltaY > 0) {
                changeProject("next");
            } else {
                changeProject("previous");
            }
        };

        window.addEventListener(
            "wheel",
            handleWheel,
            {
                passive: true,
                capture: true,
            }
        );

        return () => {
            window.removeEventListener(
                "wheel",
                handleWheel,
                {
                    capture: true,
                }
            );
        };
    }, [projects, changeProject]);

    /*
     * SWIPE CON EL DEDO
     *
     * Mobile.
     */
    useEffect(() => {
        if (
            !projects ||
            projects.length === 0
        ) {
            return;
        }

        const handleTouchStart = (
            event: TouchEvent
        ) => {
            touchStartY.current =
                event.touches[0]?.clientY ??
                null;
        };

        const handleTouchEnd = (
            event: TouchEvent
        ) => {
            if (
                touchStartY.current === null
            ) {
                return;
            }

            const touchEndY =
                event.changedTouches[0]
                    ?.clientY;

            if (
                touchEndY === undefined
            ) {
                touchStartY.current = null;
                return;
            }

            const difference =
                touchStartY.current -
                touchEndY;

            touchStartY.current = null;

            /*
             * Ignoramos movimientos pequeños.
             */
            if (
                Math.abs(difference) < 50
            ) {
                return;
            }

            /*
             * Solo en móvil.
             */
            if (window.innerWidth >= 768) {
                return;
            }

            if (difference > 0) {
                // Swipe hacia arriba
                changeProject("next");
            } else {
                // Swipe hacia abajo
                changeProject("previous");
            }
        };

        window.addEventListener(
            "touchstart",
            handleTouchStart,
            {
                passive: true,
            }
        );

        window.addEventListener(
            "touchend",
            handleTouchEnd,
            {
                passive: true,
            }
        );

        return () => {
            window.removeEventListener(
                "touchstart",
                handleTouchStart
            );

            window.removeEventListener(
                "touchend",
                handleTouchEnd
            );
        };
    }, [projects, changeProject]);

    /*
     * LOADING
     */
    if (loading) {
        return null;
    }

    /*
     * ERROR
     */
    if (error) {
        return (
            <div>
                Error: {error.message}
            </div>
        );
    }

    /*
     * SIN PROYECTOS
     */
    if (
        !projects ||
        projects.length === 0
    ) {
        return null;
    }

    const project =
        projects[activeProject];

    if (!project) {
        return null;
    }

    return (
        <main
            className="
                fixed
                inset-0
                w-screen
                h-screen
                overflow-hidden
                bg-black
            "
        >
            <AnimatePresence mode="wait">
                <div
                    key={project.id}
                    className="
                        absolute
                        inset-0
                        overflow-hidden
                    "
                >
                    <motion.iframe
                        src={`${project.video}?autoplay=1&muted=1&loop=1&background=1&responsive=1`}
                        className="
        absolute
        top-1/2
        left-1/2

        -translate-x-1/2
        -translate-y-1/2

        w-[178vh]
        h-[100vh]

        md:w-[100.78vw]
        md:h-[100vw]

        max-w-none
        max-h-none

        border-0
        pointer-events-none
    "
                        allow="autoplay; fullscreen; picture-in-picture"
                        title={project.titulo}
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
                            duration: 0.8,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            </AnimatePresence>

            <MainBar
                projects={projects}
                activeProject={activeProject}
                setActiveProject={(
                    index: number
                ) => {
                    activeProjectRef.current =
                        index;

                    setActiveProject(index);
                }}
            />
        </main>
    );
}