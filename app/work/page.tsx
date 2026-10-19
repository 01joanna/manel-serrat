"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import Player, { VimeoUrl } from "@vimeo/player";

import { db } from "@/lib/firebase";
import ProjectModal from "@/components/ProjectModal/ProjectModal";

type VimeoVideoProps = {
    video: string;
    limitedToFiveSeconds: boolean;
    onVideoReady: () => void;
};

function VimeoVideo({
    video,
    limitedToFiveSeconds,
    onVideoReady,
}: VimeoVideoProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const readyCallbackRef = useRef(onVideoReady);
    const [videoReady, setVideoReady] = useState(false);

    // Mantiene el callback actualizado sin reiniciar el reproductor.
    useEffect(() => {
        readyCallbackRef.current = onVideoReady;
    }, [onVideoReady]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !video) return;

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        let resizeFrame = 0;

        setVideoReady(false);

        const player = new Player(container, {
            url: video as VimeoUrl,
            controls: false,
            autoplay: true,
            muted: true,
            loop: !limitedToFiveSeconds,
            title: false,
            byline: false,
            portrait: false,
            responsive: false,
            playsinline: true,
        });

        const resizeVimeo = () => {
            const iframe = container.querySelector("iframe");
            if (!iframe) return;

            const cw = container.clientWidth;
            const ch = container.clientHeight;

            if (!cw || !ch) return;

            // El iframe debe cubrir todo el contenedor sin deformarse.
            const ratio = 16 / 9;
            const scale = Math.max(cw / 16, ch / 9);

            const width = Math.ceil(scale * 16 * 1.03);
            const height = Math.ceil(scale * 9 * 1.03);

            Object.assign(iframe.style, {
                position: "absolute",
                display: "block",
                width: `${width}px`,
                height: `${height}px`,
                maxWidth: "none",
                maxHeight: "none",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: "0",
            });
        };

        const scheduleResize = () => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(resizeVimeo);
        };

        const handleTimeUpdate = (data: { seconds: number }) => {
            if (!limitedToFiveSeconds || data.seconds < 4.8) return;
            void player.setCurrentTime(0).catch(() => { });
        };

        player.on("timeupdate", handleTimeUpdate);

        resizeObserver = new ResizeObserver(scheduleResize);
        resizeObserver.observe(container);

        // También detecta cuándo Vimeo inserta el iframe.
        const mutationObserver = new MutationObserver(scheduleResize);
        mutationObserver.observe(container, {
            childList: true,
            subtree: true,
        });

        void player.ready()
            .then(async () => {
                if (cancelled) return;

                scheduleResize();

                await player.setVolume(0);

                if (cancelled) return;

                try {
                    await player.play();
                } catch (error) {
                    console.error("No se pudo reproducir el reel de Vimeo:", error);
                    return;
                }

                if (cancelled) return;

                scheduleResize();

                // La portada desaparece cuando el reproductor está listo.
                setVideoReady(true);
                readyCallbackRef.current();
            })
            .catch((error) => {
                console.error("Error al cargar el reel de Vimeo:", error);
            });

        return () => {
            cancelled = true;

            cancelAnimationFrame(resizeFrame);
            resizeObserver?.disconnect();
            mutationObserver.disconnect();
            player.off("timeupdate", handleTimeUpdate);

            void player.destroy().catch(() => { });
        };
    }, [video, limitedToFiveSeconds]);

    return (
        <div
            ref={containerRef}
            className={`
                absolute inset-0 h-full w-full overflow-hidden
                pointer-events-none
                transition-opacity duration-300 ease-in-out
                ${videoReady ? "opacity-100" : "opacity-0"}
            `}
        />
    );
}

function WorkContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [readyVideoId, setReadyVideoId] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(collection(db, "proyectos"));

                setProjects(
                    snapshot.docs.map((document) => ({
                        id: document.id,
                        ...document.data(),
                    }))
                );
            } catch (error) {
                console.error("Error loading projects:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchProjects();
    }, []);

    const filteredProjects = projects
        .filter((project) => {
            if (!category) return true;
            if (!project.categoria) return false;

            const categories = Array.isArray(project.categoria)
                ? project.categoria
                : [project.categoria];

            return categories.some(
                (item: string) =>
                    String(item).toLowerCase().trim() ===
                    category.toLowerCase().trim()
            );
        })
        .sort((a, b) => {
            if (category?.toLowerCase() !== "videoclip") return 0;

            const order: Record<string, number> = {
                "4": 0,
                "9": 1,
                "7": 2,
                "11": 3,
                "5": 4,
            };

            const aOrder = order[String(a.id)];
            const bOrder = order[String(b.id)];

            if (aOrder !== undefined && bOrder !== undefined) {
                return aOrder - bOrder;
            }

            if (aOrder !== undefined) return -1;
            if (bOrder !== undefined) return 1;

            return 0;
        });

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            const modalOpen =
                document.documentElement.dataset.projectModalOpen === "true";

            if (modalOpen) {
                const target = event.target;

                if (
                    target instanceof Element &&
                    target.closest("[data-project-images-scroll='true']")
                ) {
                    return;
                }

                event.preventDefault();
                return;
            }

            if (window.innerWidth < 768) return;

            const container = scrollRef.current;
            if (!container) return;

            const delta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY;

            if (!delta) return;

            const maxScroll = container.scrollWidth - container.clientWidth;
            const nextScroll = container.scrollLeft + delta;

            if (
                (delta < 0 && container.scrollLeft > 0) ||
                (delta > 0 && container.scrollLeft < maxScroll)
            ) {
                event.preventDefault();
                container.scrollLeft = Math.max(
                    0,
                    Math.min(maxScroll, nextScroll)
                );
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });

        return () => window.removeEventListener("wheel", handleWheel);
    }, [loading]);

    const handleVideoReady = useCallback((id: string) => {
        setReadyVideoId(id);
    }, []);

    if (loading) return null;

    return (
        <>
            <main className="w-full min-h-screen overflow-hidden md:pt-40 pt-30 font-overused">
                <div
                    ref={scrollRef}
                    className="w-full h-full overflow-y-auto md:overflow-x-auto md:overflow-y-auto px-6 pb-10 no-scrollbar md:touch-pan-x"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:gap-2 w-full md:w-max">
                        {filteredProjects.map((project) => {
                            // IMPORTANTE: el reel tiene prioridad sobre el vídeo.
                            const reelUrl = project.reel || project.video;
                            const hasReel = Boolean(project.reel);
                            const id = String(project.id);

                            const isActive = activeProjectId === id;
                            const isVideoReady = readyVideoId === id;

                            // PORTADA: primer elemento del campo imagenes de Firestore.
                            const coverImage = Array.isArray(project.imagenes)
                                ? project.imagenes[0]
                                : null;

                            const imageUrl =
                                typeof coverImage === "string"
                                    ? coverImage
                                    : coverImage?.url || coverImage?.src || "";

                            const handleProjectClick = () => {
                                const isTouchDevice =
                                    window.matchMedia("(hover: none)").matches;

                                if (isTouchDevice && reelUrl && !isActive) {
                                    setActiveProjectId(id);
                                    setReadyVideoId(null);
                                    return;
                                }

                                setActiveProjectId(null);
                                setReadyVideoId(null);
                                setSelectedProject(project);
                            };

                            return (
                                <button
                                    key={project.id}
                                    type="button"
                                    onClick={handleProjectClick}
                                    onMouseEnter={() => {
                                        if (reelUrl) {
                                            setActiveProjectId(id);
                                            setReadyVideoId(null);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (
                                            window.matchMedia("(hover: hover)").matches
                                        ) {
                                            setActiveProjectId(null);
                                            setReadyVideoId(null);
                                        }
                                    }}
                                    className="
                                        group flex-shrink-0 w-full
                                        md:w-[min(calc(50vw-27px),calc((100dvh-230px)*4/3))]
                                        md:max-w-[900px]
                                        text-left cursor-pointer
                                    "
                                    aria-label={`Abrir proyecto ${project.titulo}`}
                                >
                                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 isolate">
                                        {imageUrl && (
                                            <img
                                                src={imageUrl}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className={`
                                                    absolute inset-0 w-full h-full
                                                    object-cover
                                                    transition-opacity duration-700
                                                    ease-in-out
                                                    ${isActive && isVideoReady
                                                        ? "opacity-0"
                                                        : "opacity-100"
                                                    }
                                                `}
                                            />
                                        )}

                                        {isActive && reelUrl && (
                                            <VimeoVideo
                                                key={`${id}-${reelUrl}`}
                                                video={reelUrl}
                                                limitedToFiveSeconds={!hasReel}
                                                onVideoReady={() => handleVideoReady(id)}
                                            />
                                        )}

                                        {!isActive && reelUrl && (
                                            <span className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white md:hidden">
                                                ▶
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 flex justify-between items-start gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold leading-tight">
                                                {project.titulo}
                                            </h2>

                                            <p className="text-sm uppercase leading-tight opacity-50">
                                                {Array.isArray(project.para)
                                                    ? project.para.join(", ")
                                                    : project.para}
                                            </p>
                                        </div>

                                        <p className="text-sm leading-tight shrink-0">
                                            {project.anyo}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </>
    );
}

export default function WorkPage() {
    return (
        <Suspense fallback={null}>
            <WorkContent />
        </Suspense>
    );
}