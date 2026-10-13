"use client";

import Player, {
    VimeoUrl,
} from "@vimeo/player";

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
import type { Project } from "@/types/Project";

type HomeProject = Project & {
    homeOrder?: number;
};

// ==================================================
// HOME VIDEO
// ==================================================

function HomeVideo({
    video,
    title,
}: {
    video: string;
    title: string;
}) {
    const videoContainerRef =
        useRef<HTMLDivElement | null>(null);

    const playerRef =
        useRef<Player | null>(null);

    const [
        vimeoReady,
        setVimeoReady,
    ] = useState(false);

    // --------------------------------------------------
    // Vimeo ID
    // --------------------------------------------------

    const getVimeoId = (
        url: string
    ): string | null => {
        const match = url.match(
            /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
        );

        return match ? match[1] : null;
    };

    // --------------------------------------------------
    // Resize / cover Vimeo
    // --------------------------------------------------
    const videoRatioRef = useRef(16 / 9);

    const resizeVimeo = useCallback(() => {
        const container = videoContainerRef.current;

        if (!container) return;

        const iframe = container.querySelector("iframe");

        if (!(iframe instanceof HTMLIFrameElement)) return;

        const rect = container.getBoundingClientRect();

        const containerWidth = rect.width;
        const containerHeight = rect.height;

        if (!containerWidth || !containerHeight) return;

        const videoRatio = videoRatioRef.current;
        const containerRatio = containerWidth / containerHeight;

        let width: number;
        let height: number;

        if (videoRatio > containerRatio) {
            height = containerHeight;
            width = height * videoRatio;
        } else {
            width = containerWidth;
            height = width / videoRatio;
        }

        Object.assign(iframe.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${Math.ceil(width)}px`,
            height: `${Math.ceil(height)}px`,
            transform: "translate(-50%, -50%)",
            border: "0",
            display: "block",
            maxWidth: "none",
            maxHeight: "none",
        });
    }, []);

    // --------------------------------------------------
    // Vimeo setup
    // --------------------------------------------------

    useEffect(() => {
        const container =
            videoContainerRef.current;

        if (
            !container ||
            !video
        ) {
            return;
        }

        const vimeoId =
            getVimeoId(video);

        if (!vimeoId) {
            return;
        }

        container.innerHTML = "";

        const iframe =
            document.createElement(
                "iframe"
            );

        iframe.src =
            `https://player.vimeo.com/video/${vimeoId}` +
            "?background=1" +
            "&autoplay=1" +
            "&muted=1" +
            "&loop=1" +
            "&title=0" +
            "&byline=0" +
            "&portrait=0" +
            "&controls=0";

        iframe.allow =
            "autoplay; fullscreen; picture-in-picture";

        iframe.setAttribute(
            "allowfullscreen",
            ""
        );

        iframe.setAttribute(
            "title",
            title
        );

        iframe.style.position =
            "absolute";

        iframe.style.border =
            "0";

        container.appendChild(
            iframe
        );

        // ----------------------------------------------
        // Primer cálculo inmediatamente
        // ----------------------------------------------

        requestAnimationFrame(() => {
            resizeVimeo();
        });

        const player =
            new Player(
                iframe,
                {
                    url:
                        video as VimeoUrl,

                    controls:
                        false,

                    autoplay:
                        true,

                    muted:
                        true,

                    loop:
                        true,

                    title:
                        false,

                    byline:
                        false,

                    portrait:
                        false,

                    responsive:
                        false,
                }
            );

        playerRef.current =
            player;

        // ----------------------------------------------
        // Vimeo loaded
        // ----------------------------------------------

        player.on(
            "loaded",
            () => {
                setVimeoReady(
                    true
                );

                resizeVimeo();

                player
                    .setVolume(0)
                    .catch(() => { });

                player
                    .play()
                    .catch(() => { });
            }
        );

        // ----------------------------------------------
        // Vimeo metadata loaded
        // ----------------------------------------------

        player.on("loadedmetadata", async () => {
            try {
                const [width, height] = await Promise.all([
                    player.getVideoWidth(),
                    player.getVideoHeight(),
                ]);

                if (width > 0 && height > 0) {
                    videoRatioRef.current = width / height;
                }
            } catch (error) {
                console.warn(
                    "No se pudo obtener la proporción del vídeo",
                    error
                );
            }

            resizeVimeo();
        });

        // ----------------------------------------------
        // Cleanup
        // ----------------------------------------------

        return () => {
            setVimeoReady(
                false
            );

            player.off(
                "loaded"
            );

            player.off(
                "loadedmetadata"
            );

            player
                .destroy()
                .catch(() => { });

            playerRef.current =
                null;

            container.innerHTML =
                "";
        };
    }, [
        video,
        title,
        resizeVimeo,
    ]);

    // --------------------------------------------------
    // Resize listeners
    // --------------------------------------------------

    useEffect(() => {
        const container = videoContainerRef.current;

        if (!container) return;

        let animationFrame = 0;

        const handleResize = () => {
            cancelAnimationFrame(animationFrame);

            animationFrame = requestAnimationFrame(() => {
                resizeVimeo();
            });
        };

        const observer = new ResizeObserver(handleResize);

        observer.observe(container);

        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        window.visualViewport?.addEventListener("resize", handleResize);

        handleResize();

        return () => {
            cancelAnimationFrame(animationFrame);
            observer.disconnect();

            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);

            window.visualViewport?.removeEventListener(
                "resize",
                handleResize
            );
        };
    }, [resizeVimeo]);

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <motion.div
            ref={videoContainerRef}
            className="
                absolute
                inset-0
                w-full
                h-full
                overflow-hidden
                pointer-events-none
                bg-black
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
                duration: 0.45,
                ease: "easeOut",
            }}
        />
    );
}

// ==================================================
// HOME
// ==================================================

export default function Home() {
    const {
        projects,
        loading,
        error,
    } = useProjects() as {
        projects:
        | Project[]
        | undefined;
        loading: boolean;
        error?: Error | null;
    };


    const selectedProjects: HomeProject[] = (
        (projects as HomeProject[] | undefined) ?? []
    )
        .filter((project) => project.selected === true)
        .sort(
            (a, b) =>
                Number(a.homeOrder ?? 9999) -
                Number(b.homeOrder ?? 9999)
        );


    // --------------------------------------------------
    // State
    // --------------------------------------------------

    const [
        activeProject,
        setActiveProject,
    ] = useState(0);

    // --------------------------------------------------
    // Refs
    // --------------------------------------------------

    const activeProjectRef =
        useRef(0);

    const scrollingRef =
        useRef(false);

    const touchStartY =
        useRef<number | null>(
            null
        );

    const mainRef =
        useRef<HTMLElement | null>(
            null
        );

    const hasInitializedProject =
        useRef(false);

    // --------------------------------------------------
    // VIEWPORT DEL DISPOSITIVO
    // --------------------------------------------------

    useEffect(() => {
        const main = mainRef.current;

        if (!main) return;

        const updateViewport = () => {
            const viewport = window.visualViewport;

            const height = viewport?.height ?? window.innerHeight;
            const width = viewport?.width ?? window.innerWidth;

            main.style.setProperty("--viewport-height", `${height}px`);
            main.style.setProperty("--viewport-width", `${width}px`);
        };

        updateViewport();

        window.addEventListener("resize", updateViewport);
        window.visualViewport?.addEventListener("resize", updateViewport);

        return () => {
            window.removeEventListener("resize", updateViewport);
            window.visualViewport?.removeEventListener("resize", updateViewport);
        };
    }, []);

    // --------------------------------------------------
    // Initial project
    // Empieza por el primer proyecto ordenado en el panel
    // --------------------------------------------------

    useEffect(() => {
        if (!selectedProjects.length) {
            return;
        }

        activeProjectRef.current = 0;
        setActiveProject(0);
        hasInitializedProject.current = true;
    }, [selectedProjects.length]);

    // --------------------------------------------------
    // Keep active index valid
    // --------------------------------------------------

    useEffect(() => {
        if (
            !selectedProjects.length
        ) {
            return;
        }

        if (
            activeProject >=
            selectedProjects.length
        ) {
            setActiveProject(0);

            activeProjectRef.current =
                0;
        }
    }, [
        selectedProjects.length,
        activeProject,
    ]);

    // --------------------------------------------------
    // Change project
    // --------------------------------------------------

    const changeProject =
        useCallback(
            (
                direction:
                    | "next"
                    | "previous"
            ) => {
                if (
                    scrollingRef.current ||
                    !selectedProjects.length
                ) {
                    return;
                }

                scrollingRef.current =
                    true;

                const current =
                    activeProjectRef.current;

                let nextIndex: number;

                if (
                    direction ===
                    "next"
                ) {
                    nextIndex =
                        (current + 1) %
                        selectedProjects.length;
                } else {
                    nextIndex =
                        (current - 1 +
                            selectedProjects.length) %
                        selectedProjects.length;
                }

                activeProjectRef.current =
                    nextIndex;

                setActiveProject(
                    nextIndex
                );

                window.setTimeout(
                    () => {
                        scrollingRef.current =
                            false;
                    },
                    1300
                );
            },
            [
                selectedProjects.length,
            ]
        );

    // --------------------------------------------------
    // MOBILE / TABLET AUTOPLAY
    // < 1024px
    // --------------------------------------------------

    useEffect(() => {
        if (
            !selectedProjects.length
        ) {
            return;
        }

        const handleAutoplay = () => {
            if (
                window.innerWidth >=
                1024
            ) {
                return;
            }

            changeProject(
                "next"
            );
        };

        const interval =
            window.setInterval(
                handleAutoplay,
                13000
            );

        return () => {
            window.clearInterval(
                interval
            );
        };
    }, [
        selectedProjects.length,
        changeProject,
    ]);

    // --------------------------------------------------
    // WHEEL
    // Desktop + tablet/mobile
    // --------------------------------------------------

    useEffect(() => {
        const handleWheel = (
            event: WheelEvent
        ) => {
            if (
                scrollingRef.current
            ) {
                return;
            }

            // Evitamos pequeños movimientos
            // accidentales del trackpad
            if (
                Math.abs(
                    event.deltaY
                ) < 10
            ) {
                return;
            }

            if (
                event.deltaY > 0
            ) {
                changeProject(
                    "next"
                );
            } else {
                changeProject(
                    "previous"
                );
            }
        };

        window.addEventListener(
            "wheel",
            handleWheel,
            {
                passive: true,
            }
        );

        return () => {
            window.removeEventListener(
                "wheel",
                handleWheel
            );
        };
    }, [
        changeProject,
    ]);

    // --------------------------------------------------
    // TABLET / MOBILE SWIPE
    // < 1024px
    // --------------------------------------------------

    useEffect(() => {
        const handleTouchStart = (
            event: TouchEvent
        ) => {
            if (
                window.innerWidth >=
                1024
            ) {
                return;
            }

            if (
                !event.touches.length
            ) {
                return;
            }

            touchStartY.current =
                event.touches[0]
                    .clientY;
        };

        const handleTouchEnd = (
            event: TouchEvent
        ) => {
            if (
                window.innerWidth >=
                1024
            ) {
                return;
            }

            if (
                touchStartY.current ===
                null
            ) {
                return;
            }

            if (
                !event.changedTouches
                    .length
            ) {
                touchStartY.current =
                    null;

                return;
            }

            const touchEndY =
                event.changedTouches[0]
                    .clientY;

            const difference =
                touchStartY.current -
                touchEndY;

            touchStartY.current =
                null;

            if (
                Math.abs(
                    difference
                ) < 50
            ) {
                return;
            }

            if (
                scrollingRef.current
            ) {
                return;
            }

            if (
                difference > 0
            ) {
                changeProject(
                    "next"
                );
            } else {
                changeProject(
                    "previous"
                );
            }
        };

        const handleTouchCancel =
            () => {
                touchStartY.current =
                    null;
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

        window.addEventListener(
            "touchcancel",
            handleTouchCancel,
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

            window.removeEventListener(
                "touchcancel",
                handleTouchCancel
            );
        };
    }, [
        changeProject,
    ]);

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {
        return (
            <main
                className="
                    fixed
                    inset-0
                    w-screen
                    h-[100dvh]
                    bg-black
                "
            />
        );
    }

    // --------------------------------------------------
    // ERROR
    // --------------------------------------------------

    if (error) {
        return (
            <main
                className="
                    fixed
                    inset-0
                    flex
                    items-center
                    justify-center
                    w-screen
                    h-[100dvh]
                    bg-black
                    text-white
                    font-overused
                "
            >
                <p>
                    Error loading
                    projects.
                </p>
            </main>
        );
    }

    // --------------------------------------------------
    // NO PROJECTS
    // --------------------------------------------------

    if (
        !selectedProjects.length
    ) {
        return (
            <main
                className="
                    fixed
                    inset-0
                    flex
                    items-center
                    justify-center
                    w-screen
                    h-[100dvh]
                    bg-black
                    text-white
                    font-overused
                "
            >
                <p>
                    No selected
                    projects.
                </p>
            </main>
        );
    }

    // --------------------------------------------------
    // Current project
    // --------------------------------------------------

    const project =
        selectedProjects[
        activeProject
        ] ??
        selectedProjects[0];

    const homeVideo =
        project.reel ||
        project.video;

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <main
            ref={mainRef}
            className="
                fixed
                inset-0
                w-auto
                overflow-hidden
                bg-black
                touch-none
                h-[100dvh]
            "
        >
            {/* ==========================================
                VIDEO
            ========================================== */}

            <AnimatePresence
                mode="wait"
            >
                <div
                    key={
                        project.id
                    }
                    className="
                        absolute
                        inset-0
                        w-full
                        overflow-hidden
                    "
                >
                    {homeVideo && (
                        <HomeVideo
                            key={
                                project.id
                            }
                            video={
                                homeVideo
                            }
                            title={
                                project.titulo
                            }
                        />
                    )}
                </div>
            </AnimatePresence>

            {/* ==========================================
                MAIN BAR

                Desktop:
                información + lista

                Tablet/mobile:
                solo información
            ========================================== */}

            <MainBar
                projects={
                    selectedProjects
                }
                activeProject={
                    activeProject
                }
                setActiveProject={(
                    index: number
                ) => {
                    activeProjectRef.current =
                        index;

                    setActiveProject(
                        index
                    );
                }}
            />
        </main>
    );
}