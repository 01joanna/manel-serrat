"use client";

import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useParams,
    useRouter,
} from "next/navigation";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import Player from "@vimeo/player";
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

import { db } from "@/lib/firebase";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id;

    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const vimeoPlayerRef = useRef<Player | null>(null);
    const youtubePlayerRef = useRef<any>(null);
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [showCredits, setShowCredits] = useState(false);
    const [showImages, setShowImages] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [isHoveringProgress, setIsHoveringProgress] = useState(false);

    // --------------------------------------------------
    // GET PROJECT
    // --------------------------------------------------
    console.log(project)

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const projectRef = doc(db, "proyectos", id as string);
                const projectSnapshot = await getDoc(projectRef);

                if (projectSnapshot.exists()) {
                    setProject({
                        id: projectSnapshot.id,
                        ...projectSnapshot.data(),
                    });
                } else {
                    console.log("Project not found");
                }
            } catch (error) {
                console.error("Error loading project:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id]);

    const isYouTube = (url?: string) => {
        if (!url) return false;

        return (
            url.includes("youtube.com") ||
            url.includes("youtu.be")
        );
    };

    const getYouTubeId = (url: string) => {
        try {
            const parsedUrl = new URL(url);

            if (parsedUrl.hostname.includes("youtu.be")) {
                return parsedUrl.pathname.slice(1);
            }

            if (parsedUrl.pathname.includes("/embed/")) {
                return parsedUrl.pathname.split("/embed/")[1];
            }

            return parsedUrl.searchParams.get("v");
        } catch {
            return null;
        }
    };

    // --------------------------------------------------
    // VIMEO PLAYER
    // --------------------------------------------------

    useEffect(() => {
        if (
            !project?.video ||
            !videoContainerRef.current ||
            isYouTube(project.video)
        ) {
            return;
        }

        const container = videoContainerRef.current;

        const player = new Player(container, {
            url: project.video,
            controls: false,
            autoplay: false,
            title: false,
            byline: false,
            portrait: false,
            responsive: false,
            width: window.innerWidth,
            height: window.innerHeight,
        });

        vimeoPlayerRef.current = player;

        const setupPlayer = async () => {
            try {
                const videoDuration = await player.getDuration();
                setDuration(videoDuration);

                const muted = await player.getMuted();
                setIsMuted(muted);
            } catch (error) {
                console.error(
                    "Error getting Vimeo data:",
                    error
                );
            }
        };

        setupPlayer();

        const resizeVimeo = async () => {
            try {
                const iframe = container.querySelector(
                    "iframe"
                ) as HTMLIFrameElement | null;

                if (!iframe) return;

                const [videoWidth, videoHeight] =
                    await Promise.all([
                        player.getVideoWidth(),
                        player.getVideoHeight(),
                    ]);

                if (!videoWidth || !videoHeight) return;

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const videoRatio =
                    videoWidth / videoHeight;

                const viewportRatio =
                    viewportWidth / viewportHeight;

                let width: number;
                let height: number;

                // ----------------------------------------
                // COVER
                // ----------------------------------------

                if (videoRatio > viewportRatio) {
                    height = viewportHeight;
                    width = height * videoRatio;
                } else {
                    width = viewportWidth;
                    height = width / videoRatio;
                }

                // ----------------------------------------
                // PEQUEÑO MARGEN EXTRA
                // ----------------------------------------

                const zoom = 1.03;

                width *= zoom;
                height *= zoom;

                iframe.style.position = "absolute";
                iframe.style.left = "50%";
                iframe.style.top = "50%";
                iframe.style.width = `${width}px`;
                iframe.style.height = `${height}px`;
                iframe.style.transform =
                    "translate(-50%, -50%)";
                iframe.style.border = "0";
                iframe.style.maxWidth = "none";
                iframe.style.maxHeight = "none";
            } catch (error) {
                console.error(
                    "Error resizing Vimeo:",
                    error
                );
            }
        };

        const handleResize = () => {
            resizeVimeo();
        };

        // Vimeo ya ha creado y cargado el iframe
        player.on("loaded", () => {
            resizeVimeo();
        });

        player.on("play", () => {
            setIsPlaying(true);
        });

        player.on("pause", () => {
            setIsPlaying(false);
        });

        player.on("ended", () => {
            setIsPlaying(false);
            setCurrentTime(0);
        });

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

            vimeoPlayerRef.current = null;
        };
    }, [project]);

    // --------------------------------------------------
    // YOUTUBE PLAYER
    // --------------------------------------------------

    const handleYouTubeReady = (event: any) => {
        youtubePlayerRef.current = event.target;

        const player = event.target;

        setDuration(player.getDuration());
        setIsMuted(player.isMuted());
    };

    const handleYouTubeStateChange = (event: any) => {
        const playerState = event.data;

        // PLAYING
        if (playerState === 1) {
            setIsPlaying(true);
        }

        // PAUSED
        if (playerState === 2) {
            setIsPlaying(false);
        }

        // ENDED
        if (playerState === 0) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };


    // --------------------------------------------------
    // VIDEO TIME
    // --------------------------------------------------

    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(async () => {
            try {
                if (isYouTube(project?.video || "")) {
                    const player = youtubePlayerRef.current;

                    if (!player) return;

                    setCurrentTime(player.getCurrentTime());
                } else {
                    const player = vimeoPlayerRef.current;

                    if (!player) return;

                    const time = await player.getCurrentTime();
                    setCurrentTime(time);
                }
            } catch (error) {
                console.error("Error getting current time:", error);
            }
        }, 250);

        return () => {
            clearInterval(interval);
        };
    }, [isPlaying, project]);

    // --------------------------------------------------
    // PLAY / PAUSE
    // --------------------------------------------------

    const togglePlay = async () => {
        if (!project?.video) return;

        try {
            if (isYouTube(project.video)) {
                const player = youtubePlayerRef.current;

                if (!player) return;

                const state = player.getPlayerState();

                if (state === 1) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }

                resetHideTimer();
                return;
            }

            const player = vimeoPlayerRef.current;

            if (!player) return;

            const paused = await player.getPaused();

            if (paused) {
                await player.play();
            } else {
                await player.pause();
            }

            resetHideTimer();
        } catch (error) {
            console.error("Error controlling video:", error);
        }
    };

    // --------------------------------------------------
    // CONTROLS VISIBILITY
    // --------------------------------------------------

    const resetHideTimer = () => {
        setShowControls(true);

        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }

        hideControlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 2300);
    };

    const handleMouseMove = () => {
        resetHideTimer();
    };

    // --------------------------------------------------
    // PROGRESS
    // --------------------------------------------------

    const handleProgressClick = async (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        if (!progressBarRef.current || !duration) {
            return;
        }

        const rect =
            progressBarRef.current.getBoundingClientRect();

        const position =
            (event.clientX - rect.left) / rect.width;

        const newTime =
            Math.max(0, Math.min(1, position)) * duration;

        try {
            if (isYouTube(project?.video || "")) {
                const player = youtubePlayerRef.current;

                if (!player) return;

                player.seekTo(newTime, true);
            } else {
                const player = vimeoPlayerRef.current;

                if (!player) return;

                await player.setCurrentTime(newTime);
            }

            setCurrentTime(newTime);
            resetHideTimer();
        } catch (error) {
            console.error("Error seeking video:", error);
        }
    };

    // --------------------------------------------------
    // MUTE
    // --------------------------------------------------

    const toggleMute = async () => {
        try {
            if (isYouTube(project?.video || "")) {
                const player = youtubePlayerRef.current;

                if (!player) return;

                if (player.isMuted()) {
                    player.unMute();
                    setIsMuted(false);
                } else {
                    player.mute();
                    setIsMuted(true);
                }

                resetHideTimer();
                return;
            }

            const player = vimeoPlayerRef.current;

            if (!player) return;

            const muted = await player.getMuted();

            await player.setMuted(!muted);

            setIsMuted(!muted);

            resetHideTimer();
        } catch (error) {
            console.error("Error muting video:", error);
        }
    };

    // --------------------------------------------------
    // FULLSCREEN
    // --------------------------------------------------

    const toggleFullscreen = async () => {
        try {
            if (isYouTube(project?.video || "")) {
                const iframe =
                    document.querySelector(
                        ".youtube-player iframe"
                    ) as HTMLIFrameElement | null;

                if (!iframe) return;

                if (!document.fullscreenElement) {
                    await iframe.requestFullscreen();
                    setIsFullscreen(true);
                } else {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                }

                resetHideTimer();
                return;
            }

            const player = vimeoPlayerRef.current;

            if (!player) return;

            if (isFullscreen) {
                await player.exitFullscreen();
                setIsFullscreen(false);
            } else {
                await player.requestFullscreen();
                setIsFullscreen(true);
            }

            resetHideTimer();
        } catch (error) {
            console.error("Error with fullscreen:", error);
        }
    };

    // --------------------------------------------------
    // FORMAT TIME
    // --------------------------------------------------

    const formatTime = (seconds: number) => {
        if (!seconds || Number.isNaN(seconds)) {
            return "00:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    // --------------------------------------------------
    // PROGRESS %
    // --------------------------------------------------

    const progressPercentage =
        duration > 0
            ? (currentTime / duration) * 100
            : 0;

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    useEffect(() => {
        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, []);

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {
        return null;
    }

    // --------------------------------------------------
    // NOT FOUND
    // --------------------------------------------------

    if (!project) {
        return (
            <main className="fixed inset-0 flex items-center justify-center bg-black text-white">
                <p>Project not found</p>
            </main>
        );
    }

    const toggleCredits = () => {
        setShowCredits((prev) => !prev);
        resetHideTimer();
    };

    const toggleImages = () => {
        setShowImages((prev) => !prev);
        resetHideTimer();
    };

    const creditItems: {
        rol: string;
        personas: string[];
    }[] = [];

    if (Array.isArray(project.creditos)) {
        project.creditos.forEach((credit: any) => {

            // NUEVA ESTRUCTURA
            if (
                credit &&
                typeof credit.rol === "string" &&
                Array.isArray(credit.personas)
            ) {
                if (credit.personas.length > 0) {
                    creditItems.push({
                        rol: credit.rol,
                        personas: credit.personas,
                    });
                }

                return;
            }

            // ESTRUCTURA ANTIGUA
            if (credit && typeof credit === "object") {
                Object.entries(credit).forEach(([rol, persona]) => {
                    if (
                        persona === null ||
                        persona === undefined ||
                        persona === ""
                    ) {
                        return;
                    }

                    creditItems.push({
                        rol,
                        personas: Array.isArray(persona)
                            ? persona.map(String)
                            : [String(persona)],
                    });
                });
            }
        });
    }
    // --------------------------------------------------
    // PROJECT VIEWER
    // --------------------------------------------------

    return (
        <motion.main
            className="fixed inset-0 z-50 bg-black text-white overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.5,
                ease: "easeInOut",
            }}
        >
            {/* ---------------------------------------- */}
            {/* VIDEO */}
            {/* ---------------------------------------- */}

            <div
                className={`
        absolute
        inset-0
        transition-all
        duration-700
        ease-in-out
        ${showCredits ||
                        showImages ||
                        selectedImage
                        ? "blur-sm scale-[1.01]"
                        : "blur-0 scale-100"
                    }
    `}
            >
                {isYouTube(project.video) ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <YouTube
                            videoId={getYouTubeId(project.video) || ""}
                            onReady={handleYouTubeReady}
                            onStateChange={handleYouTubeStateChange}
                            opts={{
                                width: "100%",
                                height: "100%",
                                playerVars: {
                                    controls: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                    playsinline: 1,
                                },
                            }}
                            iframeClassName="youtube-player"
                        />
                    </div>
                ) : (
                    <div
                        ref={videoContainerRef}
                        className="vimeo-container absolute inset-0 w-full h-full overflow-hidden"
                    />
                )}
            </div>

            {/* ---------------------------------------- */}
            {/* MOUSE DETECTION */}
            {/* ---------------------------------------- */}

            <div
                className="absolute inset-0 z-10"
                onPointerMove={handleMouseMove}
                onPointerEnter={handleMouseMove}
                onPointerDown={handleMouseMove}
            />

            {/* ---------------------------------------- */}
            {/* CLOSE */}
            {/* ---------------------------------------- */}

            <AnimatePresence>
                {(showControls || showImages || showCredits) && (
                    <motion.button
                        type="button"
                        onPointerMove={handleMouseMove}
                        onClick={() => router.push("/work")}
                        className="absolute top-6 right-6 z-40 w-10 h-10 flex items-center justify-center cursor-pointer"
                        initial={{
                            opacity: 0,
                            y: -10,
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
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        aria-label="Close project"
                    >
                        <span className="relative block w-6 h-6">
                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white rotate-45" />
                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white -rotate-45" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ---------------------------------------- */}
            {/* PLAY / PAUSE */}
            {/* ---------------------------------------- */}

            <AnimatePresence>
                {showControls && (
                    <motion.button
                        type="button"
                        onPointerMove={handleMouseMove}
                        onClick={togglePlay}
                        className="absolute inset-0 z-30 m-auto w-20 h-20 flex items-center justify-center cursor-pointer"
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
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        aria-label={
                            isPlaying
                                ? "Pause video"
                                : "Play video"
                        }
                    >
                        {isPlaying ? (
                            <span className="flex gap-[5px]">
                                <span className="block w-[3px] h-7 bg-white" />
                                <span className="block w-[3px] h-7 bg-white" />
                            </span>
                        ) : (
                            <span
                                className="block ml-1"
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: "14px solid transparent",
                                    borderBottom: "14px solid transparent",
                                    borderLeft: "20px solid white",
                                }}
                            />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ---------------------------------------- */}
            {/* BOTTOM INFO / PLAYER */}
            {/* ---------------------------------------- */}

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        className="absolute left-6 right-6 bottom-6 z-40"
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
                            ease: "easeInOut",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onPointerMove={handleMouseMove}
                                onClick={toggleCredits}
                                className="text-2xl font-thin hover:font-normal cursor-pointer uppercase"
                            >
                                Credits
                            </button>

                            {project.imagenes?.length > 0 && (
                                <button
                                    type="button"
                                    onPointerMove={handleMouseMove}
                                    onClick={toggleImages}
                                    className="text-2xl font-thin hover:font-normal cursor-pointer uppercase"
                                >
                                    Imatges
                                </button>
                            )}
                        </div>
                        {/* PLAYER BAR */}

                        <div className="flex items-center gap-3">
                            {/* PROGRESS BAR */}

                            <div className="flex items-end justify-between uppercase">
                                <div className="text-xl">
                                    {project.titulo} - <span className="opacity-40">
                                        {Array.isArray(project.para)
                                            ? project.para.join(", ")
                                            : project.para}
                                    </span>
                                </div>
                            </div>

                            <div
                                ref={progressBarRef}
                                className="relative flex-1 h-[12px] flex items-center cursor-pointer"
                                onMouseEnter={() =>
                                    setIsHoveringProgress(true)
                                }
                                onMouseLeave={() =>
                                    setIsHoveringProgress(false)
                                }
                                onClick={handleProgressClick}
                            >
                                {/* BACKGROUND */}

                                <div className="absolute left-0 right-0 h-[2px] bg-white/35" />

                                {/* PLAYED */}

                                <div
                                    className="absolute left-0 h-[2px] bg-white/70"
                                    style={{
                                        width: `${progressPercentage}%`,
                                    }}
                                />

                                {/* CIRCLE */}

                                <AnimatePresence>
                                    {isHoveringProgress && (
                                        <motion.div
                                            className="absolute w-[8px] h-[8px] rounded-full bg-white"
                                            style={{
                                                left: `${progressPercentage}%`,
                                                transform: "translateX(-50%)",
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

                            <div className="text-md whitespace-nowrap tabular-nums">
                                {formatTime(currentTime)} /{" "}
                                {formatTime(duration)}
                            </div>

                            {/* MUTE */}

                            <button
                                type="button"
                                onPointerMove={handleMouseMove}
                                onClick={toggleMute}
                                className="w-5 h-5 flex items-center justify-center cursor-pointer"
                                aria-label={isMuted ? "Unmute video" : "Mute video"}
                            >
                                {isMuted ? (
                                    <FaVolumeMute size={20} />
                                ) : (
                                    <FaVolumeUp size={20} />
                                )}
                            </button>

                            {/* FULLSCREEN */}

                            <button
                                type="button"
                                onPointerMove={handleMouseMove}
                                onClick={toggleFullscreen}
                                className="w-5 h-5 flex items-center justify-center cursor-pointer"
                                aria-label="Fullscreen"
                            >
                                <span className="text-2xl">
                                    ⛶
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showCredits && (
                    <motion.div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowCredits(false)}
                        onPointerMove={handleMouseMove}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw]  text-white text-shadow"
                            onClick={(event) => event.stopPropagation()}
                            initial={{ opacity: 0, x: "-70%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "-70%" }}
                            transition={{
                                duration: 0.6,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            {/* TITLE + YEAR */}
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
        text-white
    "
                            >

                                {project.direccion &&
                                    (Array.isArray(project.direccion)
                                        ? project.direccion.length > 0
                                        : project.direccion !== "") && (
                                        <div className="flex gap-2">
                                            <div className="w-32 shrink-0 opacity-50">
                                                Direcció
                                            </div>

                                            <div>
                                                {Array.isArray(project.direccion)
                                                    ? project.direccion.map(
                                                        (
                                                            persona: string,
                                                            index: number
                                                        ) => (
                                                            <div key={index}>
                                                                {persona}
                                                            </div>
                                                        )
                                                    )
                                                    : project.direccion}
                                            </div>
                                        </div>
                                    )}

                                {project.produccion &&
                                    (Array.isArray(project.produccion)
                                        ? project.produccion.length > 0
                                        : project.produccion !== "") && (
                                        <div className="flex gap-2">
                                            <div className="w-32 shrink-0 opacity-50">
                                                Producció
                                            </div>

                                            <div>
                                                {Array.isArray(project.produccion)
                                                    ? project.produccion.map(
                                                        (
                                                            persona: string,
                                                            index: number
                                                        ) => (
                                                            <div key={index}>
                                                                {persona}
                                                            </div>
                                                        )
                                                    )
                                                    : project.produccion}
                                            </div>
                                        </div>
                                    )}

                                {project.productora &&
                                    (Array.isArray(project.productora)
                                        ? project.productora.length > 0
                                        : project.productora !== "") && (
                                        <div className="flex gap-2">
                                            <div className="w-32 shrink-0 opacity-50">
                                                Productora
                                            </div>

                                            <div>
                                                {Array.isArray(project.productora)
                                                    ? project.productora.map(
                                                        (
                                                            empresa: string,
                                                            index: number
                                                        ) => (
                                                            <div key={index}>
                                                                {empresa}
                                                            </div>
                                                        )
                                                    )
                                                    : project.productora}
                                            </div>
                                        </div>
                                    )}

                                {/* CREDITS */}
                                {creditItems.length > 0 && (
                                    <div
                                        className="
            mt-4
            max-h-[60vh]
            columns-1
            md:columns-2
            gap-x-12
        "
                                        style={{ columnFill: "auto" }}
                                    >
                                        {creditItems.map((credit, index) => (
                                            <div
                                                key={`${credit.rol}-${index}`}
                                                className="flex gap-2 break-inside-avoid"
                                            >
                                                <div className="w-32 shrink-0 opacity-50">
                                                    {credit.rol}
                                                </div>

                                                <div>
                                                    {credit.personas.map(
                                                        (persona, personIndex) => (
                                                            <div key={personIndex}>
                                                                {persona}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showImages && (
                    <motion.div
                        className="fixed top-0 right-0 bottom-0 z-20 w-full"
                        onPointerMove={handleMouseMove}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0"
                            onClick={() => setShowImages(false)}
                        />

                        {/* imágenes */}
                        <motion.div
                            className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            w-[33vw]
            max-h-[80vh]
            overflow-y-auto
            pr-6
            flex
            flex-col
            gap-0.5
            z-10
            scrollbar-hide
        "
                            onClick={(event) => event.stopPropagation()}
                            initial={{ opacity: 0, x: "70%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "70%" }}
                            transition={{
                                duration: 0.6,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            {project.imagenes.map(
                                (imagen: string, index: number) => (
                                    <img
                                        key={index}
                                        src={imagen}
                                        alt={`${project.titulo} ${index + 1}`}
                                        onClick={() => setSelectedImage(imagen)}
                                        className="
    w-full
    h-auto
    object-contain
    opacity-70
    hover:opacity-100
    transition-opacity
    duration-300
    ease-in-out
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
            {createPortal(
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            onPointerMove={handleMouseMove}
                            onClick={() => setSelectedImage(null)}
                        >
                            {/* IMAGEN */}
                            <motion.img
                                src={selectedImage}
                                alt={project.titulo}
                                className="
            max-w-[85vw]
            max-h-[85vh]
            w-auto
            h-auto
            object-contain
            cursor-default
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
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                onClick={(event) =>
                                    event.stopPropagation()
                                }
                            />

                            {/* X */}
                            <AnimatePresence>
                                {showControls && (
                                    <motion.button
                                        type="button"
                                        onClick={() => setSelectedImage(null)}
                                        onPointerMove={handleMouseMove}
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
                                        initial={{
                                            opacity: 0,
                                            y: -10,
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
                                            duration: 0.3,
                                            ease: "easeInOut",
                                        }}
                                        aria-label="Close image"
                                    >
                                        <span className="relative block w-6 h-6">
                                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white rotate-45" />
                                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white -rotate-45" />
                                        </span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.main>
    );
}