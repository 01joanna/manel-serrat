
"use client";

import { useEffect, useRef, useState } from "react";

import MainBar from "@/components/MainBar/MainBar";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types/Project";

type HomeProject = Project & {
    homeOrder?: number;
    reel?: string;
};

function getVimeoId(url: string): string | null {
    const match = url.match(
        /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
    );

    return match?.[1] ?? null;
}

function HomeVideo({
    video,
    title,
}: {
    video: string;
    title: string;
}) {
    const videoId = getVimeoId(video);

    if (!videoId) return null;

    return (
        <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
            <iframe
                key={videoId}
                src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&controls=0`}
                title={title || "Vídeo del proyecto"}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="home-video-frame"
            />
        </div>
    );
}

export default function Home() {
    const { projects, loading, error } = useProjects() as {
        projects: Project[] | undefined;
        loading: boolean;
        error?: Error | null;
    };

    const [activeProject, setActiveProject] = useState(0);

    const mainRef = useRef<HTMLElement>(null);
    const wheelDelta = useRef(0);
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const lastChange = useRef(0);

    const selectedProjects = (
        (projects as HomeProject[] | undefined) ?? []
    )
        .filter((project) => project.selected)
        .sort((a, b) => {
            const isEsport = (project: HomeProject) => {
                const title = project.titulo?.toLowerCase() ?? "";

                const para = Array.isArray(project.para)
                    ? project.para.join(" ").toLowerCase()
                    : String(project.para ?? "").toLowerCase();

                const categories = Array.isArray(project.categoria)
                    ? project.categoria.join(" ").toLowerCase()
                    : String(project.categoria ?? "").toLowerCase();

                return (
                    title.includes("esport") ||
                    para.includes("esport") ||
                    categories.includes("esport")
                );
            };

            const aIsEsport = isEsport(a);
            const bIsEsport = isEsport(b);

            if (aIsEsport && !bIsEsport) return -1;
            if (!aIsEsport && bIsEsport) return 1;

            return (a.homeOrder ?? 9999) - (b.homeOrder ?? 9999);
        });

    function changeProject(direction: number) {
        const now = Date.now();

        // Evita que un solo gesto salte varios proyectos.
        if (now - lastChange.current < 700) return;

        if (selectedProjects.length < 2) return;

        lastChange.current = now;

        setActiveProject((current) => {
            const next = current + direction;

            // Navegación circular: del último se vuelve al primero.
            if (next < 0) return selectedProjects.length - 1;
            if (next >= selectedProjects.length) return 0;

            return next;
        });
    }

    useEffect(() => {
        const element = mainRef.current;
        if (!element) return;

        function handleWheel(event: WheelEvent) {
            event.preventDefault();

            // Ignora gestos principalmente horizontales.
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            wheelDelta.current += event.deltaY;

            // Umbral para rueda y trackpad.
            if (Math.abs(wheelDelta.current) >= 70) {
                const direction = wheelDelta.current > 0 ? 1 : -1;

                wheelDelta.current = 0;
                changeProject(direction);
            }
        }

        function handleTouchStart(event: TouchEvent) {
            if (event.touches.length !== 1) {
                touchStart.current = null;
                return;
            }

            const target = event.target;

            // No interferir con controles ni enlaces del MainBar.
            if (
                target instanceof Element &&
                target.closest("button, a, input, select, textarea")
            ) {
                touchStart.current = null;
                return;
            }

            const touch = event.touches[0];

            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
            };
        }

        function handleTouchEnd(event: TouchEvent) {
            if (!touchStart.current || !event.changedTouches.length) return;

            const start = touchStart.current;
            const touch = event.changedTouches[0];

            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;

            touchStart.current = null;

            // Solo cuenta los gestos verticales suficientemente claros.
            if (
                Math.abs(deltaY) < 50 ||
                Math.abs(deltaY) < Math.abs(deltaX)
            ) {
                return;
            }

            changeProject(deltaY < 0 ? 1 : -1);
        }

        element.addEventListener("wheel", handleWheel, {
            passive: false,
        });
        element.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        element.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

        return () => {
            element.removeEventListener("wheel", handleWheel);
            element.removeEventListener("touchstart", handleTouchStart);
            element.removeEventListener("touchend", handleTouchEnd);
        };
    }, [selectedProjects.length]);

    if (loading) {
        return <main className="fixed inset-0 bg-black" />;
    }

    if (error || selectedProjects.length === 0) {
        return (
            <main className="fixed inset-0 flex items-center justify-center bg-black px-6 text-center text-white">
                {error
                    ? "No se han podido cargar los proyectos."
                    : "No hay proyectos seleccionados."}
            </main>
        );
    }

    const safeIndex = Math.min(
        activeProject,
        selectedProjects.length - 1
    );

    const project = selectedProjects[safeIndex];
    const homeVideo = project.reel || project.video;

    return (
        <main
            ref={mainRef}
            className="fixed inset-0 h-[100vh] h-[100dvh] w-full overflow-hidden bg-black"
        >
            {/* Vídeo a pantalla completa */}
            <div className="absolute inset-0">
                {homeVideo && (
                    <HomeVideo
                        video={homeVideo}
                        title={project.titulo}
                    />
                )}
            </div>

            {/* MainBar por encima del vídeo */}
            <div className="absolute inset-0 z-50">
                <MainBar
                    projects={selectedProjects}
                    activeProject={safeIndex}
                    setActiveProject={(index: number) => {
                        setActiveProject(
                            Math.max(
                                0,
                                Math.min(
                                    index,
                                    selectedProjects.length - 1
                                )
                            )
                        );
                    }}
                />
            </div>
        </main>
    );
}
