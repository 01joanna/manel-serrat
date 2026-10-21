
"use client";

import Player, { VimeoUrl } from "@vimeo/player";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import MainBar from "@/components/MainBar/MainBar";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types/Project";

type HomeProject = Project & {
    homeOrder?: number;
};

type HomeVideoProps = {
    video: string;
    title: string;
};

function getVimeoId(url: string): string | null {
    const match = url.match(
        /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
    );

    return match?.[1] ?? null;
}

function HomeVideo({ video, title }: HomeVideoProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Player | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        const videoId = getVimeoId(video);

        if (!container || !videoId) return;

        let player: Player | null = null;
        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        let animationFrame = 0;
        let videoWidth = 16;
        let videoHeight = 9;

        container.replaceChildren();

        const iframe = document.createElement("iframe");

        iframe.src =
            `https://player.vimeo.com/video/${videoId}` +
            "?background=1" +
            "&autoplay=1" +
            "&muted=1" +
            "&loop=1" +
            "&title=0" +
            "&byline=0" +
            "&portrait=0" +
            "&controls=0";

        iframe.title = title || "Vídeo del proyecto";
        iframe.allow =
            "autoplay; fullscreen; picture-in-picture";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("frameborder", "0");

        Object.assign(iframe.style, {
            position: "absolute",
            display: "block",
            border: "0",
            maxWidth: "none",
            maxHeight: "none",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
        });

        container.appendChild(iframe);

        player = new Player(iframe, {
            url: video as VimeoUrl,
            controls: false,
            autoplay: true,
            muted: true,
            loop: true,
            title: false,
            byline: false,
            portrait: false,
            responsive: false,
        });

        playerRef.current = player;

        const resizeVideo = () => {
            if (cancelled) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width <= 0 || height <= 0) return;

            const scale = Math.max(
                width / videoWidth,
                height / videoHeight
            );

            const iframeWidth = Math.ceil(videoWidth * scale);
            const iframeHeight = Math.ceil(videoHeight * scale);

            iframe.style.width = `${iframeWidth}px`;
            iframe.style.height = `${iframeHeight}px`;
        };

        const scheduleResize = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(resizeVideo);
        };

        const loadDimensions = async () => {
            if (!player || cancelled) return;

            try {
                const [width, height] = await Promise.all([
                    player.getVideoWidth(),
                    player.getVideoHeight(),
                ]);

                if (cancelled) return;

                if (width > 0 && height > 0) {
                    videoWidth = width;
                    videoHeight = height;
                }
            } catch {
                // Mantiene la proporción provisional 16:9.
            }

            scheduleResize();
        };

        const startPlayback = async () => {
            if (!player || cancelled) return;

            void loadDimensions();

            try {
                await player.setVolume(0);
                await player.play();
            } catch {
                // El navegador puede bloquear el autoplay.
            }
        };

        player.on("loaded", startPlayback);
        player.on("loadedmetadata", scheduleResize);

        resizeObserver = new ResizeObserver(scheduleResize);
        resizeObserver.observe(container);

        window.addEventListener("resize", scheduleResize);
        window.addEventListener("orientationchange", scheduleResize);

        window.visualViewport?.addEventListener(
            "resize",
            scheduleResize
        );

        scheduleResize();

        return () => {
            cancelled = true;

            cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();

            window.removeEventListener("resize", scheduleResize);
            window.removeEventListener(
                "orientationchange",
                scheduleResize
            );

            window.visualViewport?.removeEventListener(
                "resize",
                scheduleResize
            );

            if (player) {
                player.off("loaded", startPlayback);
                player.off("loadedmetadata", scheduleResize);
                void player.destroy().catch(() => {});
            }

            if (playerRef.current === player) {
                playerRef.current = null;
            }

            container.replaceChildren();
        };
    }, [video, title]);

    return (
        <div
            ref={containerRef}
            className="home-video"
            aria-label={title}
        />
    );
}

export default function Home() {
    const {
        projects,
        loading,
        error,
    } = useProjects() as {
        projects: Project[] | undefined;
        loading: boolean;
        error?: Error | null;
    };

    const selectedProjects = (
        (projects as HomeProject[] | undefined) ?? []
    )
        .filter((project) => project.selected)
        .sort((a, b) => {
            // Prioriza el proyecto de Esport sobre FIFA.
            const isEsport = (project: HomeProject) => {
                const title = project.titulo?.toLowerCase() ?? "";
                const para = String(project.para ?? "").toLowerCase();
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

    const [activeProject, setActiveProject] = useState(0);

    const activeProjectRef = useRef(0);
    const isChangingRef = useRef(false);
    const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const changeProject = useCallback(
        (direction: "next" | "prev") => {
            const total = selectedProjects.length;

            if (total < 2 || isChangingRef.current) return;

            isChangingRef.current = true;

            const current = activeProjectRef.current;

            const next =
                direction === "next"
                    ? (current + 1) % total
                    : (current - 1 + total) % total;

            activeProjectRef.current = next;
            setActiveProject(next);

            if (changeTimeoutRef.current) {
                clearTimeout(changeTimeoutRef.current);
            }

            changeTimeoutRef.current = setTimeout(() => {
                isChangingRef.current = false;
            }, 1300);
        },
        [selectedProjects.length]
    );

    useEffect(() => {
        if (activeProject >= selectedProjects.length) {
            activeProjectRef.current = 0;
            setActiveProject(0);
        }
    }, [activeProject, selectedProjects.length]);

    useEffect(() => {
        return () => {
            if (changeTimeoutRef.current) {
                clearTimeout(changeTimeoutRef.current);
            }
        };
    }, []);

    // Cambio de proyecto mediante la rueda o el trackpad.
    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            // Ignora desplazamientos principalmente horizontales.
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return;
            }

            if (Math.abs(event.deltaY) < 2) return;

            event.preventDefault();

            changeProject(
                event.deltaY > 0 ? "next" : "prev"
            );
        };

        window.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        });

        return () => {
            window.removeEventListener("wheel", handleWheel, true);
        };
    }, [changeProject]);

    // Cambio de proyecto mediante gestos táctiles.
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (event: TouchEvent) => {
            const touch = event.touches[0];

            if (!touch) return;

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        };

        const handleTouchEnd = (event: TouchEvent) => {
            const touch = event.changedTouches[0];

            if (!touch) return;

            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            // Ignora desplazamientos principalmente horizontales
            // y gestos verticales demasiado pequeños.
            if (
                Math.abs(deltaY) < 50 ||
                Math.abs(deltaY) < Math.abs(deltaX)
            ) {
                return;
            }

            changeProject(
                deltaY < 0 ? "next" : "prev"
            );
        };

        window.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });

        window.addEventListener("touchend", handleTouchEnd, {
            passive: true,
        });

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
    }, [changeProject]);

    // Rotación automática en móviles y tabletas.
    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(max-width: 1023px)"
        );

        if (
            !mediaQuery.matches ||
            selectedProjects.length < 2
        ) {
            return;
        }

        const interval = window.setInterval(() => {
            changeProject("next");
        }, 13000);

        return () => {
            window.clearInterval(interval);
        };
    }, [changeProject, selectedProjects.length]);

    if (loading) {
        return (
            <main
                className="home-screen"
                aria-busy="true"
            />
        );
    }

    if (error) {
        return (
            <main className="home-screen home-error">
                <p>No se han podido cargar los proyectos.</p>
            </main>
        );
    }

    if (selectedProjects.length === 0) {
        return (
            <main className="home-screen home-empty">
                No hay proyectos seleccionados.
            </main>
        );
    }

    const project =
        selectedProjects[activeProject] ?? selectedProjects[0];

    const homeVideo = project.reel || project.video;

    return (
        <main className="home-screen">
            <div className="home-visual">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={project.id}
                        className="home-project"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.45,
                            ease: "easeOut",
                        }}
                    >
                        {homeVideo && (
                            <HomeVideo
                                key={project.id}
                                video={homeVideo}
                                title={project.titulo}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <MainBar
                projects={selectedProjects}
                activeProject={activeProject}
                setActiveProject={(index: number) => {
                    activeProjectRef.current = index;
                    setActiveProject(index);
                }}
            />
        </main>
    );
}
