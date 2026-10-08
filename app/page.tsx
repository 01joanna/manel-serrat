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

    const [vimeoReady, setVimeoReady] =
        useState(false);

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

    const resizeVimeo = useCallback(() => {
        const container =
            videoContainerRef.current;

        if (!container) {
            return;
        }

        const iframe =
            container.querySelector(
                "iframe"
            ) as HTMLIFrameElement | null;

        if (!iframe) {
            return;
        }

        const viewport =
            window.visualViewport;

        const viewportWidth =
            viewport?.width ??
            window.innerWidth;

        const viewportHeight =
            viewport?.height ??
            window.innerHeight;

        if (
            !viewportWidth ||
            !viewportHeight
        ) {
            return;
        }

        const iframeRect =
            iframe.getBoundingClientRect();

        const videoWidth =
            iframeRect.width;

        const videoHeight =
            iframeRect.height;

        if (
            !videoWidth ||
            !videoHeight
        ) {
            return;
        }

        const videoRatio =
            videoWidth / videoHeight;

        const viewportRatio =
            viewportWidth / viewportHeight;

        let width =
            viewportWidth;

        let height =
            viewportHeight;

        // ----------------------------------------------
        // Cover
        // ----------------------------------------------

        if (
            videoRatio >
            viewportRatio
        ) {
            height =
                viewportHeight;

            width =
                height *
                videoRatio;
        } else {
            width =
                viewportWidth;

            height =
                width /
                videoRatio;
        }

        iframe.style.position =
            "absolute";

        iframe.style.left =
            "50%";

        iframe.style.top =
            "50%";

        iframe.style.width =
            `${width}px`;

        iframe.style.height =
            `${height}px`;

        iframe.style.transform =
            "translate(-50%, -50%)";

        iframe.style.border =
            "0";

        iframe.style.maxWidth =
            "none";

        iframe.style.maxHeight =
            "none";
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

        // Primer cálculo inmediatamente
        requestAnimationFrame(() => {
            resizeVimeo();
        });

        const player =
            new Player(
                iframe,
                {
                    url: video as VimeoUrl,
                    controls: false,
                    autoplay: true,
                    muted: true,
                    loop: true,
                    title: false,
                    byline: false,
                    portrait: false,
                    responsive: false,
                }
            );

        playerRef.current =
            player;

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

        player.on(
            "loadedmetadata",
            () => {
                resizeVimeo();
            }
        );

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
        if (!vimeoReady) {
            return;
        }

        const visualViewport =
            window.visualViewport;

        const handleResize =
            () => {
                requestAnimationFrame(
                    () => {
                        resizeVimeo();
                    }
                );
            };

        window.addEventListener(
            "resize",
            handleResize
        );

        visualViewport?.addEventListener(
            "resize",
            handleResize
        );

        visualViewport?.addEventListener(
            "scroll",
            handleResize
        );

        handleResize();

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            visualViewport?.removeEventListener(
                "resize",
                handleResize
            );

            visualViewport?.removeEventListener(
                "scroll",
                handleResize
            );
        };
    }, [
        vimeoReady,
        resizeVimeo,
    ]);

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

    // --------------------------------------------------
    // Selected projects
    // --------------------------------------------------

    const selectedProjects =
        projects?.filter(
            (project) =>
                project.selected === true
        ) ?? [];

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
    // VIEWPORT REAL DEL DISPOSITIVO
    // --------------------------------------------------

    useEffect(() => {
        const updateViewportHeight =
            () => {
                const viewport =
                    window.visualViewport;

                const height =
                    viewport?.height ??
                    window.innerHeight;

                const width =
                    viewport?.width ??
                    window.innerWidth;

                if (
                    !height ||
                    !width
                ) {
                    return;
                }

                const main =
                    mainRef.current;

                if (!main) {
                    return;
                }

                main.style.setProperty(
                    "--viewport-height",
                    `${height}px`
                );

                main.style.setProperty(
                    "--viewport-width",
                    `${width}px`
                );
            };

        updateViewportHeight();

        window.addEventListener(
            "resize",
            updateViewportHeight
        );

        window.visualViewport?.addEventListener(
            "resize",
            updateViewportHeight
        );

        window.visualViewport?.addEventListener(
            "scroll",
            updateViewportHeight
        );

        return () => {
            window.removeEventListener(
                "resize",
                updateViewportHeight
            );

            window.visualViewport?.removeEventListener(
                "resize",
                updateViewportHeight
            );

            window.visualViewport?.removeEventListener(
                "scroll",
                updateViewportHeight
            );
        };
    }, []);

    // --------------------------------------------------
    // Initial project
    // Empieza siempre por el proyecto con id "4"
    // --------------------------------------------------

    useEffect(() => {
        if (
            !selectedProjects.length ||
            hasInitializedProject.current
        ) {
            return;
        }

        const initialIndex =
            selectedProjects.findIndex(
                (project) =>
                    project.id === "4"
            );

        const initialProjectIndex =
            initialIndex >= 0
                ? initialIndex
                : 0;

        hasInitializedProject.current =
            true;

        activeProjectRef.current =
            initialProjectIndex;

        setActiveProject(
            initialProjectIndex
        );
    }, [
        selectedProjects.length,
    ]);

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

        const handleAutoplay =
            () => {
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
                    w-full
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
                    w-full
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
                    w-full
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
                inset-x-0
                top-0
                w-full
                overflow-hidden
                bg-black
                touch-none
            "
            style={{
                height:
                    "var(--viewport-height, 100dvh)",
            }}
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
                        top-0
                        left-0
                        w-full
                        overflow-hidden
                    "
                    style={{
                        height:
                            "var(--viewport-height, 100dvh)",
                    }}
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