
"use client";

import React, {
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import Player, { VimeoUrl } from "@vimeo/player";

import { db } from "@/lib/firebase";
import ProjectModal from "@/components/ProjectModal/ProjectModal";

type VimeoVideoProps = {
    video: string;
    limitedToFiveSeconds: boolean;
    active: boolean;
    onVideoReady: () => void;
};

function VimeoVideo({
    video,
    limitedToFiveSeconds,
    active,
    onVideoReady,
}: VimeoVideoProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Player | null>(null);
    const readyCallbackRef = useRef(onVideoReady);

    const [playerReady, setPlayerReady] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        readyCallbackRef.current = onVideoReady;
    }, [onVideoReady]);

    // Crear y configurar el reproductor de Vimeo.
    useEffect(() => {
        const container = containerRef.current;

        if (!container || !video) return;

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        let resizeFrame = 0;

        setPlayerReady(false);
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
            preload: "auto",
        });

        playerRef.current = player;

        const resizeVimeo = () => {
            const iframe = container.querySelector("iframe");

            if (!iframe) return;

            const cw = container.clientWidth;
            const ch = container.clientHeight;

            if (!cw || !ch) return;

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

            void player.setCurrentTime(0).catch(() => {});
        };

        player.on("timeupdate", handleTimeUpdate);

        resizeObserver = new ResizeObserver(scheduleResize);
        resizeObserver.observe(container);

        const mutationObserver = new MutationObserver(scheduleResize);

        mutationObserver.observe(container, {
            childList: true,
            subtree: true,
        });

        void player
            .ready()
            .then(async () => {
                if (cancelled) return;

                scheduleResize();

                await player.setVolume(0);

                if (cancelled) return;

                setPlayerReady(true);
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error("Error al preparar Vimeo:", error);
                }
            });

        return () => {
            cancelled = true;

            cancelAnimationFrame(resizeFrame);
            resizeObserver?.disconnect();
            mutationObserver.disconnect();

            player.off("timeupdate", handleTimeUpdate);

            if (playerRef.current === player) {
                playerRef.current = null;
            }

            void player.destroy().catch(() => {});
        };
    }, [video, limitedToFiveSeconds]);

    // Reproducir solamente cuando la tarjeta está activa.
    useEffect(() => {
        const player = playerRef.current;

        if (!player || !playerReady) return;

        let cancelled = false;

        if (!active) {
            setVideoReady(false);

            void player.pause().catch(() => {});

            return () => {
                cancelled = true;
            };
        }

        void player
            .play()
            .then(() => {
                if (cancelled) return;

                setVideoReady(true);
                readyCallbackRef.current();
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error(
                        "No se pudo reproducir Vimeo:",
                        error
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [active, playerReady]);

    return (
        <div
            ref={containerRef}
            className={`
                absolute inset-0 h-full w-full overflow-hidden
                pointer-events-none
                transition-opacity duration-400 ease-in-out
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

    const [activeProjectId, setActiveProjectId] = useState<string | null>(
        null
    );

    const [readyVideoId, setReadyVideoId] = useState<string | null>(
        null
    );

    const [selectedProject, setSelectedProject] = useState<any | null>(
        null
    );

    const [isTouchDevice, setIsTouchDevice] = useState(false);

    const [visibleProjectIds, setVisibleProjectIds] = useState<
        Set<string>
    >(new Set());

    const scrollRef = useRef<HTMLDivElement | null>(null);

    // Detectar móvil y dispositivos táctiles.
    useEffect(() => {
        const mediaQuery = window.matchMedia("(hover: none)");

        const updateDevice = () => {
            setIsTouchDevice(mediaQuery.matches);
        };

        updateDevice();
        mediaQuery.addEventListener("change", updateDevice);

        return () => {
            mediaQuery.removeEventListener("change", updateDevice);
        };
    }, []);

    // Cargar proyectos de Firestore.
    useEffect(() => {
        let cancelled = false;

        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(
                    collection(db, "proyectos")
                );

                if (cancelled) return;

                setProjects(
                    snapshot.docs.map((document) => ({
                        id: document.id,
                        ...document.data(),
                    }))
                );
            } catch (error) {
                if (!cancelled) {
                    console.error("Error loading projects:", error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchProjects();

        return () => {
            cancelled = true;
        };
    }, []);

    // Filtrar y ordenar proyectos.
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

    // Detectar qué tarjetas están visibles en móvil.
    useEffect(() => {
        if (loading || !isTouchDevice) {
            setVisibleProjectIds(new Set());
            return;
        }

        const container = scrollRef.current;

        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                setVisibleProjectIds((previous) => {
                    const next = new Set(previous);

                    for (const entry of entries) {
                        const id = (
                            entry.target as HTMLElement
                        ).dataset.projectId;

                        if (!id) continue;

                        if (
                            entry.isIntersecting &&
                            entry.intersectionRatio >= 0.25
                        ) {
                            next.add(id);
                        } else {
                            next.delete(id);
                        }
                    }

                    return next;
                });
            },
            {
                root: null,
                threshold: [0, 0.25, 0.5],
            }
        );

        const cards = container.querySelectorAll(
            "[data-work-project]"
        );

        cards.forEach((card) => observer.observe(card));

        return () => {
            observer.disconnect();
        };
    }, [loading, isTouchDevice, category, projects.length]);

    // Mantener el comportamiento de scroll de escritorio.
    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            const modalOpen =
                document.documentElement.dataset.projectModalOpen ===
                "true";

            if (modalOpen) {
                const target = event.target;

                if (
                    target instanceof Element &&
                    target.closest(
                        "[data-project-images-scroll='true']"
                    )
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

            const maxScroll =
                container.scrollWidth - container.clientWidth;

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

        window.addEventListener("wheel", handleWheel, {
            passive: false,
        });

        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    const handleVideoReady = useCallback((id: string) => {
        setReadyVideoId(id);
    }, []);

    if (loading) return null;

    return (
        <>
            <main className="w-full min-w-0 min-h-screen overflow-x-clip md:pt-40 pt-30 font-overused">
                <div
                    ref={scrollRef}
                    className="
                        w-full min-w-0 h-full
                        overflow-x-hidden overflow-y-auto
                        md:overflow-x-auto md:overflow-y-auto
                        px-6 pb-10 no-scrollbar
                        md:touch-pan-x
                    "
                >
                    <div className="flex w-full min-w-0 flex-col gap-4 md:w-max md:flex-row md:gap-2">
                        {filteredProjects.map((project) => {
                            const reelUrl = project.reel || project.video;
                            const hasReel = Boolean(project.reel);
                            const id = String(project.id);

                            const coverImage = Array.isArray(
                                project.imagenes
                            )
                                ? project.imagenes.find((image: any) =>
                                      typeof image === "string"
                                          ? image.trim() !== ""
                                          : Boolean(
                                                image?.url || image?.src
                                            )
                                  )
                                : null;

                            const imageUrl =
                                typeof coverImage === "string"
                                    ? coverImage
                                    : coverImage?.url ||
                                      coverImage?.src ||
                                      "";

                            const hasImage = Boolean(imageUrl);

                            const shouldPlayReel =
                                !hasImage && Boolean(reelUrl);

                            // En móvil, el vídeo depende de la visibilidad.
                            // En escritorio, depende del hover.
                            const isActive = isTouchDevice
                                ? visibleProjectIds.has(id) &&
                                  Boolean(reelUrl)
                                : activeProjectId === id ||
                                  shouldPlayReel;

                            const isVideoReady = readyVideoId === id;

                            const handleProjectClick = () => {
                                setActiveProjectId(null);
                                setReadyVideoId(null);
                                setSelectedProject(project);
                            };

                            return (
                                <button
                                    key={project.id}
                                    type="button"
                                    data-work-project
                                    data-project-id={id}
                                    onClick={handleProjectClick}
                                    onMouseEnter={() => {
                                        if (
                                            !isTouchDevice &&
                                            reelUrl
                                        ) {
                                            setActiveProjectId(id);
                                            setReadyVideoId(null);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (
                                            !isTouchDevice &&
                                            !shouldPlayReel
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
                                                    ${
                                                        isActive &&
                                                        isVideoReady
                                                            ? "opacity-0"
                                                            : "opacity-100"
                                                    }
                                                `}
                                            />
                                        )}

                                        {isActive && reelUrl && (
                                            <VimeoVideo
                                                key={`${id}-${reelUrl}`}
                                                active={isActive}
                                                video={reelUrl}
                                                limitedToFiveSeconds={
                                                    !hasReel
                                                }
                                                onVideoReady={() =>
                                                    handleVideoReady(id)
                                                }
                                            />
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

            {/* {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )} */}
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
