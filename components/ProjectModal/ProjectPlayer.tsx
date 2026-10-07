"use client";

import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import Player, {
    VimeoUrl,
} from "@vimeo/player";

import YouTube from "react-youtube";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    FaVolumeMute,
    FaVolumeUp,
} from "react-icons/fa";

import { createPortal } from "react-dom";

import type { Project } from "@/types/Project";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface ProjectPlayerProps {
    project: Project;
    onClose: () => void;
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function ProjectPlayer({
    project,
    onClose,
}: ProjectPlayerProps) {
    // --------------------------------------------------
    // REFS
    // --------------------------------------------------

    const videoContainerRef =
        useRef<HTMLDivElement | null>(null);

    const fullscreenContainerRef =
        useRef<HTMLDivElement | null>(null);

    const vimeoPlayerRef =
        useRef<Player | null>(null);

    const youtubePlayerRef =
        useRef<any>(null);

    const hideControlsTimeout =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const progressBarRef =
        useRef<HTMLDivElement | null>(null);

    // --------------------------------------------------
    // STATE
    // --------------------------------------------------

    const [showCredits, setShowCredits] =
        useState(false);

    const [showImages, setShowImages] =
        useState(false);

    const [selectedImage, setSelectedImage] =
        useState<string | null>(null);

    const [isPlaying, setIsPlaying] =
        useState(false);

    const [showControls, setShowControls] =
        useState(true);

    const [currentTime, setCurrentTime] =
        useState(0);

    const [duration, setDuration] =
        useState(0);

    const [isMuted, setIsMuted] =
        useState(false);

    const [isFullscreen, setIsFullscreen] =
        useState(false);

    const [isHoveringProgress, setIsHoveringProgress] =
        useState(false);

    const [videoAspectRatio, setVideoAspectRatio] =
        useState(16 / 9);

    const [videoSize, setVideoSize] =
        useState({
            width: 0,
            height: 0,
        });

    // --------------------------------------------------
    // YOUTUBE
    // --------------------------------------------------

    const isYouTube = (url?: string) => {
        if (!url) {
            return false;
        }

        return (
            url.includes("youtube.com") ||
            url.includes("youtu.be")
        );
    };

    const getYouTubeId = (url: string) => {
        try {
            const parsedUrl =
                new URL(url);

            if (
                parsedUrl.hostname.includes(
                    "youtu.be"
                )
            ) {
                return parsedUrl.pathname.slice(1);
            }

            if (
                parsedUrl.pathname.includes(
                    "/embed/"
                )
            ) {
                return parsedUrl.pathname.split(
                    "/embed/"
                )[1];
            }

            return parsedUrl.searchParams.get(
                "v"
            );
        } catch {
            return null;
        }
    };

    // --------------------------------------------------
    // CALCULATE VIDEO SIZE
    // --------------------------------------------------

    const calculateVideoSize = (
        ratio: number
    ) => {
        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }

        const viewportWidth =
            window.innerWidth;

        const viewportHeight =
            window.innerHeight;

        const availableWidth =
            viewportWidth * 0.94;

        const availableHeight =
            viewportHeight * 0.94;

        let width =
            availableWidth;

        let height =
            width / ratio;

        if (
            height >
            availableHeight
        ) {
            height =
                availableHeight;

            width =
                height * ratio;
        }

        setVideoSize({
            width,
            height,
        });
    };

    // --------------------------------------------------
    // INITIAL VIDEO SIZE
    // --------------------------------------------------

    useEffect(() => {
        calculateVideoSize(
            videoAspectRatio
        );

        const handleResize = () => {
            calculateVideoSize(
                videoAspectRatio
            );
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
        };
    }, [
        videoAspectRatio,
    ]);

    // --------------------------------------------------
    // VIMEO PLAYER
    // --------------------------------------------------

    useEffect(() => {
        if (!project.video) {
            return;
        }

        // --------------------------------------------------
        // YOUTUBE
        // --------------------------------------------------

        if (isYouTube(project.video)) {
            setVideoAspectRatio(16 / 9);
            return;
        }

        if (!videoContainerRef.current) {
            return;
        }

        const container =
            videoContainerRef.current;

        let isMounted = true;

        container.innerHTML = "";

        const player =
            new Player(
                container,
                {
                    url:
                        project.video as VimeoUrl,
                    controls: false,
                    autoplay: false,
                    title: false,
                    byline: false,
                    portrait: false,
                    responsive: false,
                }
            );

        vimeoPlayerRef.current =
            player;

        // --------------------------------------------------
        // SETUP PLAYER
        // --------------------------------------------------

        const setupPlayer =
            async () => {
                try {
                    const videoDuration =
                        await player.getDuration();

                    if (!isMounted) {
                        return;
                    }

                    setDuration(
                        videoDuration
                    );

                    const muted =
                        await player.getMuted();

                    if (!isMounted) {
                        return;
                    }

                    setIsMuted(
                        muted
                    );
                } catch (error) {
                    if (!isMounted) {
                        return;
                    }

                    console.error(
                        "Error getting Vimeo data:",
                        error
                    );
                }
            };

        // --------------------------------------------------
        // RESIZE VIMEO
        // --------------------------------------------------

        const resizeVimeo =
            async () => {
                try {
                    if (!isMounted) {
                        return;
                    }

                    const [
                        videoWidth,
                        videoHeight,
                    ] =
                        await Promise.all([
                            player.getVideoWidth(),
                            player.getVideoHeight(),
                        ]);

                    if (!isMounted) {
                        return;
                    }

                    if (
                        !videoWidth ||
                        !videoHeight
                    ) {
                        return;
                    }

                    const ratio =
                        videoWidth /
                        videoHeight;

                    setVideoAspectRatio(
                        ratio
                    );

                    const iframe =
                        container.querySelector(
                            "iframe"
                        ) as
                        | HTMLIFrameElement
                        | null;

                    if (!iframe) {
                        return;
                    }

                    iframe.style.position =
                        "absolute";

                    iframe.style.left =
                        "0";

                    iframe.style.top =
                        "0";

                    iframe.style.width =
                        "100%";

                    iframe.style.height =
                        "100%";

                    iframe.style.border =
                        "0";

                    iframe.style.maxWidth =
                        "none";

                    iframe.style.maxHeight =
                        "none";
                } catch (error) {
                    if (!isMounted) {
                        return;
                    }

                    console.error(
                        "Error resizing Vimeo:",
                        error
                    );
                }
            };

        // --------------------------------------------------
        // EVENTS
        // --------------------------------------------------

        const handleLoaded =
            () => {
                if (!isMounted) {
                    return;
                }

                resizeVimeo();
            };

        const handlePlay =
            () => {
                if (!isMounted) {
                    return;
                }

                setIsPlaying(true);
            };

        const handlePause =
            () => {
                if (!isMounted) {
                    return;
                }

                setIsPlaying(false);
            };

        const handleEnded =
            () => {
                if (!isMounted) {
                    return;
                }

                setIsPlaying(false);
                setCurrentTime(0);
            };

        player.on(
            "loaded",
            handleLoaded
        );

        player.on(
            "play",
            handlePlay
        );

        player.on(
            "pause",
            handlePause
        );

        player.on(
            "ended",
            handleEnded
        );

        // --------------------------------------------------
        // READY
        // --------------------------------------------------

        player
            .ready()
            .then(
                async () => {
                    if (!isMounted) {
                        return;
                    }

                    await setupPlayer();

                    if (!isMounted) {
                        return;
                    }

                    await resizeVimeo();

                    if (!isMounted) {
                        return;
                    }

                    try {
                        await player.pause();

                        if (!isMounted) {
                            return;
                        }

                        setIsPlaying(false);
                    } catch (error) {
                        if (isMounted) {
                            console.error(
                                "Error pausing Vimeo:",
                                error
                            );
                        }
                    }
                }
            )
            .catch(
                (error) => {
                    if (!isMounted) {
                        return;
                    }

                    console.error(
                        "Error preparing Vimeo:",
                        error
                    );
                }
            );

        // --------------------------------------------------
        // CLEANUP
        // --------------------------------------------------

        return () => {
            isMounted = false;

            player.off(
                "loaded",
                handleLoaded
            );

            player.off(
                "play",
                handlePlay
            );

            player.off(
                "pause",
                handlePause
            );

            player.off(
                "ended",
                handleEnded
            );

            if (
                vimeoPlayerRef.current ===
                player
            ) {
                vimeoPlayerRef.current =
                    null;
            }

            player
                .destroy()
                .catch(() => { });
        };
    }, [
        project.video,
    ]);

    // --------------------------------------------------
    // YOUTUBE READY
    // --------------------------------------------------

    const handleYouTubeReady = (
        event: any
    ) => {
        youtubePlayerRef.current =
            event.target;

        const player =
            event.target;

        setDuration(
            player.getDuration()
        );

        setIsMuted(
            player.isMuted()
        );

        try {
            player.pauseVideo();

            setIsPlaying(false);
        } catch { }
    };

    // --------------------------------------------------
    // YOUTUBE STATE
    // --------------------------------------------------

    const handleYouTubeStateChange = (
        event: any
    ) => {
        const playerState =
            event.data;

        if (
            playerState === 1
        ) {
            setIsPlaying(true);
        }

        if (
            playerState === 2
        ) {
            setIsPlaying(false);
        }

        if (
            playerState === 0
        ) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    // --------------------------------------------------
    // VIDEO TIME
    // --------------------------------------------------

    useEffect(() => {
        if (!isPlaying) {
            return;
        }

        const interval =
            setInterval(
                async () => {
                    try {
                        if (
                            isYouTube(
                                project.video
                            )
                        ) {
                            const player =
                                youtubePlayerRef.current;

                            if (!player) {
                                return;
                            }

                            setCurrentTime(
                                player.getCurrentTime()
                            );
                        } else {
                            const player =
                                vimeoPlayerRef.current;

                            if (!player) {
                                return;
                            }

                            const time =
                                await player.getCurrentTime();

                            setCurrentTime(
                                time
                            );
                        }
                    } catch { }
                },
                250
            );

        return () => {
            clearInterval(
                interval
            );
        };
    }, [
        isPlaying,
        project.video,
    ]);

    // --------------------------------------------------
    // CONTROLS VISIBILITY
    // --------------------------------------------------

    const resetHideTimer =
        () => {
            setShowControls(
                true
            );

            if (
                hideControlsTimeout.current
            ) {
                clearTimeout(
                    hideControlsTimeout.current
                );
            }

            hideControlsTimeout.current =
                setTimeout(
                    () => {
                        setShowControls(
                            false
                        );
                    },
                    2300
                );
        };

        const handleMouseMove = () => {
            resetHideTimer();
        };

        useEffect(() => {
            const container =
                fullscreenContainerRef.current;
        
            if (!container) {
                return;
            }
        
            const handleFullscreenChange = () => {
                const fullscreen =
                    document.fullscreenElement ===
                    container;
        
                setIsFullscreen(fullscreen);
        
                if (fullscreen) {
                    setShowControls(true);
                    resetHideTimer();
                }
            };
        
            document.addEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        
            return () => {
                document.removeEventListener(
                    "fullscreenchange",
                    handleFullscreenChange
                );
            };
        }, []);

    // --------------------------------------------------
    // PLAY / PAUSE
    // --------------------------------------------------

    const togglePlay =
        async () => {
            if (!project.video) {
                return;
            }

            try {
                // --------------------------------------------------
                // YOUTUBE
                // --------------------------------------------------

                if (
                    isYouTube(
                        project.video
                    )
                ) {
                    const player =
                        youtubePlayerRef.current;

                    if (!player) {
                        return;
                    }

                    const state =
                        player.getPlayerState();

                    if (
                        state === 1
                    ) {
                        setIsPlaying(
                            false
                        );

                        player.pauseVideo();
                    } else {
                        setIsPlaying(
                            true
                        );

                        player.playVideo();
                    }

                    resetHideTimer();

                    return;
                }

                // --------------------------------------------------
                // VIMEO
                // --------------------------------------------------

                const player =
                    vimeoPlayerRef.current;

                if (!player) {
                    return;
                }

                const paused =
                    await player.getPaused();

                if (paused) {
                    setIsPlaying(
                        true
                    );

                    await player.play();
                } else {
                    setIsPlaying(
                        false
                    );

                    await player.pause();
                }

                resetHideTimer();
            } catch (
                error
            ) {
                console.error(
                    "Error controlling video:",
                    error
                );
            }
        };

    // --------------------------------------------------
    // PROGRESS
    // --------------------------------------------------

    const handleProgressClick =
        async (
            event: React.MouseEvent<HTMLDivElement>
        ) => {
            if (
                !progressBarRef.current ||
                !duration
            ) {
                return;
            }

            const rect =
                progressBarRef.current.getBoundingClientRect();

            const position =
                (
                    event.clientX -
                    rect.left
                ) /
                rect.width;

            const newTime =
                Math.max(
                    0,
                    Math.min(
                        1,
                        position
                    )
                ) *
                duration;

            try {
                if (
                    isYouTube(
                        project.video
                    )
                ) {
                    const player =
                        youtubePlayerRef.current;

                    if (!player) {
                        return;
                    }

                    player.seekTo(
                        newTime,
                        true
                    );
                } else {
                    const player =
                        vimeoPlayerRef.current;

                    if (!player) {
                        return;
                    }

                    await player.setCurrentTime(
                        newTime
                    );
                }

                setCurrentTime(
                    newTime
                );

                resetHideTimer();
            } catch (
                error
            ) {
                console.error(
                    "Error seeking video:",
                    error
                );
            }
        };

    // --------------------------------------------------
    // MUTE
    // --------------------------------------------------

    const toggleMute =
        async () => {
            try {
                if (
                    isYouTube(
                        project.video
                    )
                ) {
                    const player =
                        youtubePlayerRef.current;

                    if (!player) {
                        return;
                    }

                    if (
                        player.isMuted()
                    ) {
                        player.unMute();

                        setIsMuted(
                            false
                        );
                    } else {
                        player.mute();

                        setIsMuted(
                            true
                        );
                    }

                    resetHideTimer();

                    return;
                }

                const player =
                    vimeoPlayerRef.current;

                if (!player) {
                    return;
                }

                const muted =
                    await player.getMuted();

                await player.setMuted(
                    !muted
                );

                setIsMuted(
                    !muted
                );

                resetHideTimer();
            } catch (
                error
            ) {
                console.error(
                    "Error muting video:",
                    error
                );
            }
        };

    // --------------------------------------------------
    // FULLSCREEN
    // --------------------------------------------------

    const toggleFullscreen =
        async () => {
            try {
                const container =
                    fullscreenContainerRef.current;

                if (!container) {
                    return;
                }

                // EXIT FULLSCREEN

                if (
                    document.fullscreenElement
                ) {
                    await document.exitFullscreen();

                    setIsFullscreen(
                        false
                    );

                    resetHideTimer();

                    return;
                }

                // ENTER FULLSCREEN

                await container.requestFullscreen();

                setIsFullscreen(
                    true
                );

                resetHideTimer();
            } catch (
                error
            ) {
                console.error(
                    "Error with fullscreen:",
                    error
                );
            }
        };

    // --------------------------------------------------
    // FORMAT TIME
    // --------------------------------------------------

    const formatTime = (
        seconds: number
    ) => {
        if (
            !seconds ||
            Number.isNaN(
                seconds
            )
        ) {
            return "00:00";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        const remainingSeconds =
            Math.floor(
                seconds % 60
            );

        return `${String(
            minutes
        ).padStart(
            2,
            "0"
        )}:${String(
            remainingSeconds
        ).padStart(
            2,
            "0"
        )}`;
    };

    // --------------------------------------------------
    // PROGRESS %
    // --------------------------------------------------

    const progressPercentage =
        duration > 0
            ? (
                currentTime /
                duration
            ) *
            100
            : 0;

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    useEffect(() => {
        return () => {
            if (
                hideControlsTimeout.current
            ) {
                clearTimeout(
                    hideControlsTimeout.current
                );
            }
        };
    }, []);

    // --------------------------------------------------
    // CREDITS
    // --------------------------------------------------

    const creditItems: {
        rol: string;
        personas: string[];
    }[] = [];

    if (
        Array.isArray(
            project.creditos
        )
    ) {
        project.creditos.forEach(
            (credit: any) => {
                // NEW STRUCTURE

                if (
                    credit &&
                    typeof credit.rol ===
                    "string" &&
                    Array.isArray(
                        credit.personas
                    )
                ) {
                    if (
                        credit.personas
                            .length > 0
                    ) {
                        creditItems.push({
                            rol:
                                credit.rol,
                            personas:
                                credit.personas,
                        });
                    }

                    return;
                }

                // OLD STRUCTURE

                if (
                    credit &&
                    typeof credit ===
                    "object"
                ) {
                    Object.entries(
                        credit
                    ).forEach(
                        ([
                            rol,
                            persona,
                        ]) => {
                            if (
                                persona ===
                                null ||
                                persona ===
                                undefined ||
                                persona ===
                                ""
                            ) {
                                return;
                            }

                            creditItems.push({
                                rol,
                                personas:
                                    Array.isArray(
                                        persona
                                    )
                                        ? persona.map(
                                            String
                                        )
                                        : [
                                            String(
                                                persona
                                            ),
                                        ],
                            });
                        }
                    );
                }
            }
        );
    }

    // --------------------------------------------------
    // CLOSE IMAGE
    // --------------------------------------------------

    const closeSelectedImage =
        () => {
            setSelectedImage(
                null
            );

            resetHideTimer();
        };

    // --------------------------------------------------
    // RETURN
    // --------------------------------------------------

    return (
        <>
            {/* ================================================== */}
            {/* VIDEO + CLOSE */}
            {/* ================================================== */}

            <div
                ref={
                    fullscreenContainerRef
                }
                className="
                    fullscreen-container
                    relative
                    shrink-0
                    bg-black
                    w-full
                    h-full
                "
                style={{
                    width:
                        videoSize.width ||
                        undefined,
                    height:
                        videoSize.height ||
                        undefined,
                }}
            >
                {/* ================================================== */}
                {/* VIDEO WINDOW */}
                {/* ================================================== */}

                <motion.div
                    className="
                        relative
                        overflow-hidden
                        bg-black
                        w-full
                        h-full
                    "
                    style={{
                        aspectRatio:
                            videoAspectRatio,
                    }}
                    initial={{
                        opacity: 0,
                        scale: 0.96,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0.96,
                    }}
                    transition={{
                        duration: 0.5,
                        ease: [
                            0.22,
                            1,
                            0.36,
                            1,
                        ],
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    onPointerMove={
                        handleMouseMove
                    }
                >
                    {/* ================================================== */}
                    {/* VIDEO */}
                    {/* ================================================== */}

                    <div
                        className={`
                            absolute
                            inset-0
                            transition-all
                            duration-700
                            ease-in-out
                            ${
                                showCredits ||
                                showImages ||
                                selectedImage
                                    ? "blur-sm scale-[1.01]"
                                    : "blur-0 scale-100"
                            }
                        `}
                    >
                        {isYouTube(
                            project.video
                        ) ? (
                            <div
                                className="
                                    absolute
                                    inset-0
                                    w-full
                                    h-full
                                    overflow-hidden
                                "
                            >
                                <YouTube
                                    videoId={
                                        getYouTubeId(
                                            project.video
                                        ) || ""
                                    }
                                    onReady={
                                        handleYouTubeReady
                                    }
                                    onStateChange={
                                        handleYouTubeStateChange
                                    }
                                    opts={{
                                        width:
                                            "100%",
                                        height:
                                            "100%",
                                        playerVars:
                                            {
                                                controls: 0,
                                                modestbranding: 1,
                                                rel: 0,
                                                playsinline: 1,
                                            },
                                    }}
                                    iframeClassName="
                                        youtube-player
                                        absolute
                                        inset-0
                                        w-full
                                        h-full
                                    "
                                />
                            </div>
                        ) : (
                            <div
                                ref={
                                    videoContainerRef
                                }
                                className="
                                    vimeo-container
                                    absolute
                                    inset-0
                                    w-full
                                    h-full
                                    overflow-hidden
                                "
                            />
                        )}
                    </div>

                                        {/* ================================================== */}
                    {/* VIDEO INTERACTION LAYER */}
                    {/* ================================================== */}

                    <div
                        className={`
                            absolute
                            inset-0
                            z-10
                            ${
                                showCredits ||
                                showImages ||
                                selectedImage
                                    ? "pointer-events-none"
                                    : "cursor-pointer"
                            }
                        `}
                        onPointerMove={
                            handleMouseMove
                        }
                        onMouseMove={
                            handleMouseMove
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                            togglePlay();
                        }}
                    />

                    {/* ================================================== */}
                    {/* PLAY / PAUSE */}
                    {/* ================================================== */}

                    <AnimatePresence>
                        {showControls && (
                            <motion.button
                                type="button"
                                onClick={
                                    togglePlay
                                }
                                className="
                                    absolute
                                    inset-0
                                    z-30
                                    m-auto
                                    w-20
                                    h-20
                                    flex
                                    items-center
                                    justify-center
                                    cursor-pointer
                                "
                                initial={{
                                    opacity: 0,
                                    scale: 0.9,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.9,
                                }}
                                transition={{
                                    duration: 0.12,
                                }}
                                aria-label={
                                    isPlaying
                                        ? "Pause video"
                                        : "Play video"
                                }
                            >
                                {isPlaying ? (
                                    <span className="flex gap-[5px]">
                                        <span
                                            className="
                                                block
                                                w-[3px]
                                                h-7
                                                bg-white
                                            "
                                        />

                                        <span
                                            className="
                                                block
                                                w-[3px]
                                                h-7
                                                bg-white
                                            "
                                        />
                                    </span>
                                ) : (
                                    <span
                                        className="block ml-1"
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderTop:
                                                "14px solid transparent",
                                            borderBottom:
                                                "14px solid transparent",
                                            borderLeft:
                                                "20px solid white",
                                        }}
                                    />
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* ================================================== */}
                    {/* BOTTOM CONTROLS */}
                    {/* ================================================== */}

                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                className="
                                    absolute
                                    left-6
                                    right-6
                                    bottom-6
                                    z-40
                                "
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                transition={{
                                    duration: 0.35,
                                }}
                            >
                                {/* BUTTONS */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        mb-2
                                    "
                                >
                                    <button
                                        type="button"
                                        onClick={(
                                            event
                                        ) => {
                                            event.stopPropagation();

                                            setShowCredits(
                                                (
                                                    previous
                                                ) =>
                                                    !previous
                                            );

                                            setShowImages(
                                                false
                                            );

                                            resetHideTimer();
                                        }}
                                        className="
                                            text-2xl
                                            font-thin
                                            hover:font-normal
                                            cursor-pointer
                                            uppercase
                                        "
                                    >
                                        Credits
                                    </button>

                                    {project.imagenes &&
                                        project.imagenes
                                            .length >
                                            0 && (
                                            <button
                                                type="button"
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    setShowImages(
                                                        (
                                                            previous
                                                        ) =>
                                                            !previous
                                                    );

                                                    setShowCredits(
                                                        false
                                                    );

                                                    resetHideTimer();
                                                }}
                                                className="
                                                    text-2xl
                                                    font-thin
                                                    hover:font-normal
                                                    cursor-pointer
                                                    uppercase
                                                "
                                            >
                                                Imatges
                                            </button>
                                        )}
                                </div>

                                {/* PLAYER BAR */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >
                                    {/* TITLE */}

                                    <div
                                        className="
                                            text-xl
                                            uppercase
                                            whitespace-nowrap
                                            shrink-0
                                        "
                                    >
                                        {project.titulo}

                                        {" - "}

                                        <span className="opacity-40">
                                            {Array.isArray(
                                                project.para
                                            )
                                                ? project.para.join(
                                                    ", "
                                                )
                                                : project.para}
                                        </span>
                                    </div>

                                    {/* PROGRESS */}

                                    <div
                                        ref={
                                            progressBarRef
                                        }
                                        className="
                                            relative
                                            flex-1
                                            h-[12px]
                                            flex
                                            items-center
                                            cursor-pointer
                                            min-w-0
                                        "
                                        onMouseEnter={() =>
                                            setIsHoveringProgress(
                                                true
                                            )
                                        }
                                        onMouseLeave={() =>
                                            setIsHoveringProgress(
                                                false
                                            )
                                        }
                                        onClick={
                                            handleProgressClick
                                        }
                                    >
                                        <div
                                            className="
                                                absolute
                                                left-0
                                                right-0
                                                h-[2px]
                                                bg-white/35
                                            "
                                        />

                                        <div
                                            className="
                                                absolute
                                                left-0
                                                h-[2px]
                                                bg-white/70
                                            "
                                            style={{
                                                width: `${progressPercentage}%`,
                                            }}
                                        />

                                        <AnimatePresence>
                                            {isHoveringProgress && (
                                                <motion.div
                                                    className="
                                                        absolute
                                                        w-[8px]
                                                        h-[8px]
                                                        rounded-full
                                                        bg-white
                                                    "
                                                    style={{
                                                        left: `${progressPercentage}%`,
                                                        transform:
                                                            "translateX(-50%)",
                                                    }}
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.7,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.7,
                                                    }}
                                                    transition={{
                                                        duration: 0.15,
                                                    }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* TIME */}

                                    <div
                                        className="
                                            text-md
                                            whitespace-nowrap
                                            tabular-nums
                                            shrink-0
                                        "
                                    >
                                        {formatTime(
                                            currentTime
                                        )}

                                        {" / "}

                                        {formatTime(
                                            duration
                                        )}
                                    </div>

                                    {/* MUTE */}

                                    <button
                                        type="button"
                                        onClick={(
                                            event
                                        ) => {
                                            event.stopPropagation();

                                            toggleMute();
                                        }}
                                        className="
                                            w-5
                                            h-5
                                            flex
                                            items-center
                                            justify-center
                                            cursor-pointer
                                            shrink-0
                                        "
                                        aria-label={
                                            isMuted
                                                ? "Unmute video"
                                                : "Mute video"
                                        }
                                    >
                                        {isMuted ? (
                                            <FaVolumeMute
                                                size={20}
                                            />
                                        ) : (
                                            <FaVolumeUp
                                                size={20}
                                            />
                                        )}
                                    </button>

                                    {/* FULLSCREEN */}

                                    <button
                                        type="button"
                                        onClick={(
                                            event
                                        ) => {
                                            event.stopPropagation();

                                            toggleFullscreen();
                                        }}
                                        className="
                                            w-5
                                            h-5
                                            flex
                                            items-center
                                            justify-center
                                            cursor-pointer
                                            shrink-0
                                        "
                                        aria-label={
                                            isFullscreen
                                                ? "Exit fullscreen"
                                                : "Fullscreen"
                                        }
                                    >
                                        <span className="text-2xl">
                                            ⛶
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ================================================== */}
                    {/* CREDITS */}
                    {/* ================================================== */}

                    <AnimatePresence>
                        {showCredits && (
                            <motion.div
                                className="
                                    absolute
                                    inset-0
                                    z-20
                                    overflow-auto
                                    bg-black/10
                                "
                                onClick={() =>
                                    setShowCredits(
                                        false
                                    )
                                }
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                            >
                                <motion.div
                                    className="
                                        absolute
                                        left-1/2
                                        top-1/2
                                        -translate-x-1/2
                                        -translate-y-1/2
                                        w-[80%]
                                        max-h-[75%]
                                        overflow-y-auto
                                        text-white
                                    "
                                    onClick={() =>
                                        setShowCredits(
                                            false
                                        )
                                    }
                                    initial={{
                                        opacity: 0,
                                        x: "-70%",
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: "-70%",
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [
                                            0.22,
                                            1,
                                            0.36,
                                            1,
                                        ],
                                    }}
                                >
                                    {/* TITLE */}

                                    <div className="mb-8">
                                        <div className="text-2xl uppercase">
                                            {project.titulo}
                                        </div>

                                        <div className="text-sm opacity-50">
                                            {project.anyo}
                                        </div>
                                    </div>

                                    {/* BASIC INFO */}

                                    <div
                                        className="
                                            text-sm
                                            leading-relaxed
                                            uppercase
                                        "
                                    >
                                        {/* DIRECCIÓN */}

                                        {project.direccion &&
                                            (
                                                Array.isArray(
                                                    project.direccion
                                                )
                                                    ? project
                                                        .direccion
                                                        .length >
                                                    0
                                                    : project.direccion !==
                                                    ""
                                            ) && (
                                                <div className="flex gap-2">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Direcció
                                                    </div>

                                                    <div>
                                                        {Array.isArray(
                                                            project.direccion
                                                        )
                                                            ? project.direccion.map(
                                                                (
                                                                    persona,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                    >
                                                                        {
                                                                            persona
                                                                        }
                                                                    </div>
                                                                )
                                                            )
                                                            : project.direccion}
                                                    </div>
                                                </div>
                                            )}

                                        {/* PRODUCCIÓN */}

                                        {project.produccion &&
                                            (
                                                Array.isArray(
                                                    project.produccion
                                                )
                                                    ? project
                                                        .produccion
                                                        .length >
                                                    0
                                                    : project.produccion !==
                                                    ""
                                            ) && (
                                                <div className="flex gap-2">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Producció
                                                    </div>

                                                    <div>
                                                        {Array.isArray(
                                                            project.produccion
                                                        )
                                                            ? project.produccion.map(
                                                                (
                                                                    persona,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                    >
                                                                        {
                                                                            persona
                                                                        }
                                                                    </div>
                                                                )
                                                            )
                                                            : project.produccion}
                                                    </div>
                                                </div>
                                            )}

                                        {/* PRODUCTORA */}

                                        {project.productora &&
                                            (
                                                Array.isArray(
                                                    project.productora
                                                )
                                                    ? project
                                                        .productora
                                                        .length >
                                                    0
                                                    : project.productora !==
                                                    ""
                                            ) && (
                                                <div className="flex gap-2">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Productora
                                                    </div>

                                                    <div>
                                                        {Array.isArray(
                                                            project.productora
                                                        )
                                                            ? project.productora.map(
                                                                (
                                                                    empresa,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                    >
                                                                        {
                                                                            empresa
                                                                        }
                                                                    </div>
                                                                )
                                                            )
                                                            : project.productora}
                                                    </div>
                                                </div>
                                            )}

                                        {/* CREDITS */}

                                        {creditItems.length >
                                            0 && (
                                            <div
                                                className="
                                                    mt-4
                                                    grid
                                                    grid-cols-1
                                                    md:grid-cols-3
                                                    gap-x-2
                                                    gap-y-1
                                                "
                                            >
                                                {creditItems.map(
                                                    (
                                                        credit,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={`${credit.rol}-${index}`}
                                                            className="
                                                                flex
                                                                gap-2
                                                                break-inside-avoid
                                                            "
                                                        >
                                                            <div
                                                                className="
                                                                    w-32
                                                                    shrink-0
                                                                    opacity-50
                                                                "
                                                            >
                                                                {
                                                                    credit.rol
                                                                }
                                                            </div>

                                                            <div>
                                                                {credit.personas.map(
                                                                    (
                                                                        persona,
                                                                        personIndex
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                personIndex
                                                                            }
                                                                        >
                                                                            {
                                                                                persona
                                                                            }
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ================================================== */}
                    {/* IMAGES */}
                    {/* ================================================== */}

                    <AnimatePresence>
                        {showImages && (
                            <motion.div
                                className="
                                    absolute
                                    inset-0
                                    z-20
                                    overflow-hidden
                                "
                                onClick={() =>
                                    setShowImages(
                                        false
                                    )
                                }
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                            >
                                <div
                                    className="
                                        absolute
                                        inset-0
                                    "
                                />

                                <motion.div
                                    className="
                                        absolute
                                        right-0
                                        top-1/2
                                        -translate-y-1/2
                                        w-[33%]
                                        max-h-[80%]
                                        overflow-y-auto
                                        pr-6
                                        flex
                                        flex-col
                                        gap-0.5
                                        z-10
                                        scrollbar-hide
                                    "
                                    onClick={(
                                        event
                                    ) =>
                                        event.stopPropagation()
                                    }
                                    initial={{
                                        opacity: 0,
                                        x: "70%",
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: "70%",
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [
                                            0.22,
                                            1,
                                            0.36,
                                            1,
                                        ],
                                    }}
                                >
                                    {project.imagenes?.map(
                                        (
                                            imagen,
                                            index
                                        ) => (
                                            <img
                                                key={
                                                    index
                                                }
                                                src={
                                                    imagen
                                                }
                                                alt={`${project.titulo} ${index + 1}`}
                                                onClick={() =>
                                                    setSelectedImage(
                                                        imagen
                                                    )
                                                }
                                                className="
                                                    w-full
                                                    h-auto
                                                    object-contain
                                                    opacity-70
                                                    hover:opacity-100
                                                    transition-opacity
                                                    duration-300
                                                    cursor-pointer
                                                    rounded-sm
                                                "
                                            />
                                        )
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ================================================== */}
                {/* CLOSE */}
                {/* ================================================== */}

                <AnimatePresence>
                    {(
                        showControls ||
                        showImages ||
                        showCredits
                    ) && (
                        <motion.button
                            type="button"
                            onClick={(
                                event
                            ) => {
                                event.stopPropagation();
                                onClose();
                            }}
                            className="
                                absolute
                                -top-1
                                -right-12
                                z-[100]
                                w-10
                                h-10
                                flex
                                items-center
                                justify-center
                                cursor-pointer
                            "
                            initial={{
                                opacity: 0,
                                y: -6,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: -6,
                            }}
                            transition={{
                                duration: 0.3,
                            }}
                            aria-label="Close project"
                        >
                            <span
                                className="
                                    relative
                                    block
                                    w-6
                                    h-6
                                "
                            >
                                <span
                                    className="
                                        absolute
                                        top-1/2
                                        left-0
                                        w-full
                                        h-[1.5px]
                                        bg-white
                                        rotate-45
                                    "
                                />

                                <span
                                    className="
                                        absolute
                                        top-1/2
                                        left-0
                                        w-full
                                        h-[1.5px]
                                        bg-white
                                        -rotate-45
                                    "
                                />
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* ================================================== */}
            {/* SELECTED IMAGE */}
            {/* ================================================== */}

            {typeof document !==
                "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                className="
                                    fixed
                                    inset-0
                                    z-[200]
                                    flex
                                    items-center
                                    justify-center
                                    bg-black/80
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
                                    duration: 0.3,
                                }}
                                onClick={
                                    closeSelectedImage
                                }
                            >
                                <motion.img
                                    src={
                                        selectedImage
                                    }
                                    alt={
                                        project.titulo
                                    }
                                    className="
                                        max-w-[85vw]
                                        max-h-[85vh]
                                        w-auto
                                        h-auto
                                        object-contain
                                        rounded-sm
                                    "
                                    initial={{
                                        opacity: 0,
                                        scale: 0.95,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.95,
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: [
                                            0.22,
                                            1,
                                            0.36,
                                            1,
                                        ],
                                    }}
                                    onClick={(
                                        event
                                    ) =>
                                        event.stopPropagation()
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={
                                        closeSelectedImage
                                    }
                                    className="
                                        absolute
                                        top-6
                                        right-6
                                        z-10
                                        w-10
                                        h-10
                                        flex
                                        items-center
                                        justify-center
                                        cursor-pointer
                                    "
                                    aria-label="Close image"
                                >
                                    <span
                                        className="
                                            relative
                                            block
                                            w-6
                                            h-6
                                        "
                                    >
                                        <span
                                            className="
                                                absolute
                                                top-1/2
                                                left-0
                                                w-full
                                                h-[1px]
                                                bg-white
                                                rotate-45
                                            "
                                        />

                                        <span
                                            className="
                                                absolute
                                                top-1/2
                                                left-0
                                                w-full
                                                h-[1px]
                                                bg-white
                                                -rotate-45
                                            "
                                        />
                                    </span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}