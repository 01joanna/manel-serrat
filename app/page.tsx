
"use client";

import Player, {
    VimeoUrl,
} from "@vimeo/player";

import YouTube from "react-youtube";

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

const isYouTube = (
    url?: string
) => {
    if (!url) {
        return false;
    }

    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be")
    );
};

const getYouTubeId = (
    url: string
) => {
    try {
        if (
            url.includes("youtu.be/")
        ) {
            return url
                .split("youtu.be/")[1]
                ?.split("?")[0]
                ?.split("&")[0];
        }

        if (
            url.includes("/embed/")
        ) {
            return url
                .split("/embed/")[1]
                ?.split("?")[0]
                ?.split("&")[0];
        }

        const parsedUrl =
            new URL(url);

        return (
            parsedUrl.searchParams.get(
                "v"
            ) || undefined
        );
    } catch {
        return undefined;
    }
};

type HomeVideoProps = {
    video: string;
    title: string;
};

function HomeVideo({
    video,
    title,
}: HomeVideoProps) {
    const videoContainerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const vimeoPlayerRef =
        useRef<Player | null>(null);

    if (isYouTube(video)) {
        const youtubeId =
            getYouTubeId(video);

        if (!youtubeId) {
            return null;
        }

        return (
            <motion.div
                className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    overflow-hidden
                    pointer-events-none
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
                    duration: 0.8,
                    ease: "easeInOut",
                }}
            >
                <YouTube
                    videoId={
                        youtubeId
                    }
                    opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                            autoplay: 1,
                            mute: 1,
                            loop: 1,
                            playlist:
                                youtubeId,
                            controls: 0,
                            modestbranding: 1,
                            rel: 0,
                            playsinline: 1,
                        },
                    }}
                    className="
                        absolute
                        inset-0
                        w-full
                        h-full
                    "
                    iframeClassName="
                        absolute
                        top-1/2
                        left-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        w-full
                        h-full
                        border-0
                    "
                />
            </motion.div>
        );
    }

    useEffect(() => {
        if (
            !video ||
            !videoContainerRef.current
        ) {
            return;
        }

        const container =
            videoContainerRef.current;

        const player = new Player(
            container,
            {
                url:
                    video as VimeoUrl,
                controls: false,
                autoplay: true,
                muted: true,
                loop: true,
                title: false,
                byline: false,
                portrait: false,
                responsive: false,
                width:
                    window.innerWidth,
                height:
                    window.innerHeight,
            }
        );

        vimeoPlayerRef.current =
            player;

        const resizeVimeo =
            async () => {
                try {
                    const iframe =
                        container.querySelector(
                            "iframe"
                        ) as HTMLIFrameElement | null;

                    if (!iframe) {
                        return;
                    }

                    const [
                        videoWidth,
                        videoHeight,
                    ] =
                        await Promise.all(
                            [
                                player.getVideoWidth(),
                                player.getVideoHeight(),
                            ]
                        );

                    if (
                        !videoWidth ||
                        !videoHeight
                    ) {
                        return;
                    }

                    const viewportWidth =
                        window.innerWidth;

                    const viewportHeight =
                        window.innerHeight;

                    const videoRatio =
                        videoWidth /
                        videoHeight;

                    const viewportRatio =
                        viewportWidth /
                        viewportHeight;

                    let width: number;
                    let height: number;

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

                    const zoom = 1.03;

                    width *= zoom;
                    height *= zoom;

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
                } catch (error) {
                    console.error(
                        "Error resizing Home Vimeo:",
                        error
                    );
                }
            };

        player.on(
            "loaded",
            resizeVimeo
        );

        player
            .ready()
            .then(() => {
                resizeVimeo();
            })
            .catch((error) => {
                console.error(
                    "Error preparing Vimeo:",
                    error
                );
            });

        const handleResize = () => {
            resizeVimeo();
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            player.destroy();

            vimeoPlayerRef.current =
                null;
        };
    }, [video]);

    return (
        <motion.div
            ref={
                videoContainerRef
            }
            className="
                absolute
                inset-0
                w-full
                h-full
                overflow-hidden
                pointer-events-none
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
                duration: 0.8,
                ease: "easeInOut",
            }}
            aria-label={title}
        />
    );
}

export default function Home() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    const selectedProjects =
        projects?.filter(
            (project) =>
                project.selected === true
        ) ?? [];

    const [
        activeProject,
        setActiveProject,
    ] = useState<number>(0);

    const activeProjectRef =
        useRef<number>(0);

    const scrollingRef =
        useRef<boolean>(false);

    const touchStartY =
        useRef<number | null>(null);

    const autoplayTimeoutRef =
        useRef<
            ReturnType<
                typeof setTimeout
            > | null
        >(null);

    const homeInitializedRef =
        useRef<boolean>(false);

    useEffect(() => {
        if (
            !selectedProjects ||
            selectedProjects.length === 0
        ) {
            return;
        }

        if (
            homeInitializedRef.current
        ) {
            return;
        }

        const initialIndex =
            selectedProjects.findIndex(
                (project) =>
                    String(
                        project.id
                    ) === "4"
            );

        const index =
            initialIndex !== -1
                ? initialIndex
                : 0;

        activeProjectRef.current =
            index;

        setActiveProject(index);

        homeInitializedRef.current =
            true;
    }, [selectedProjects]);

    const project =
        selectedProjects[
            activeProject
        ];

    const changeProject =
        useCallback(
            (
                direction:
                    | "next"
                    | "previous"
            ) => {
                if (
                    !selectedProjects ||
                    selectedProjects.length ===
                        0
                ) {
                    return;
                }

                if (
                    scrollingRef.current
                ) {
                    return;
                }

                scrollingRef.current =
                    true;

                const currentIndex =
                    activeProjectRef.current;

                let newIndex: number;

                if (
                    direction ===
                    "next"
                ) {
                    newIndex =
                        (currentIndex +
                            1) %
                        selectedProjects.length;
                } else {
                    newIndex =
                        (currentIndex -
                            1 +
                            selectedProjects.length) %
                        selectedProjects.length;
                }

                activeProjectRef.current =
                    newIndex;

                setActiveProject(
                    newIndex
                );

                setTimeout(() => {
                    scrollingRef.current =
                        false;
                }, 1300);
            },
            [selectedProjects]
        );

    useEffect(() => {
        if (
            !selectedProjects ||
            selectedProjects.length <= 1
        ) {
            return;
        }

        if (
            window.innerWidth >= 768
        ) {
            return;
        }

        const startAutoplay =
            () => {
                if (
                    autoplayTimeoutRef.current
                ) {
                    clearTimeout(
                        autoplayTimeoutRef.current
                    );
                }

                autoplayTimeoutRef.current =
                    setTimeout(() => {
                        const currentIndex =
                            activeProjectRef.current;

                        const newIndex =
                            (currentIndex +
                                1) %
                            selectedProjects.length;

                        activeProjectRef.current =
                            newIndex;

                        setActiveProject(
                            newIndex
                        );

                        startAutoplay();
                    }, 13000);
            };

        startAutoplay();

        return () => {
            if (
                autoplayTimeoutRef.current
            ) {
                clearTimeout(
                    autoplayTimeoutRef.current
                );

                autoplayTimeoutRef.current =
                    null;
            }
        };
    }, [
        selectedProjects,
        activeProject,
    ]);

    useEffect(() => {
        if (
            !selectedProjects ||
            selectedProjects.length === 0
        ) {
            return;
        }

        const handleWheel = (
            event: WheelEvent
        ) => {
            if (
                Math.abs(
                    event.deltaY
                ) < 5
            ) {
                return;
            }

            if (
                scrollingRef.current
            ) {
                return;
            }

            if (
                window.innerWidth < 768
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
    }, [
        selectedProjects,
        changeProject,
    ]);

    useEffect(() => {
        if (
            !selectedProjects ||
            selectedProjects.length === 0
        ) {
            return;
        }

        const handleTouchStart = (
            event: TouchEvent
        ) => {
            touchStartY.current =
                event.touches[0]
                    ?.clientY ??
                null;
        };

        const handleTouchEnd = (
            event: TouchEvent
        ) => {
            if (
                touchStartY.current ===
                null
            ) {
                return;
            }

            const touchEndY =
                event.changedTouches[0]
                    ?.clientY;

            if (
                touchEndY ===
                undefined
            ) {
                touchStartY.current =
                    null;

                return;
            }

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
                window.innerWidth >=
                768
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
    }, [
        selectedProjects,
        changeProject,
    ]);

    if (loading) {
        return null;
    }

    if (error) {
        return (
            <div>
                Error:{" "}
                {error.message}
            </div>
        );
    }

    if (
        selectedProjects.length === 0 ||
        !project
    ) {
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
            <AnimatePresence
                mode="wait"
            >
                <div
                    key={project.id}
                    className="
                        absolute
                        inset-0
                        overflow-hidden
                    "
                >
                    <HomeVideo
                        key={project.id}
                        video={
                            project.video
                        }
                        title={
                            project.titulo
                        }
                    />
                </div>
            </AnimatePresence>

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

