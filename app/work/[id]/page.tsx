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

import {
    AnimatePresence,
    motion,
} from "framer-motion";
import {
    FaVolumeMute,
    FaVolumeUp,
} from "react-icons/fa";

import { db } from "@/lib/firebase";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id;

    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<Player | null>(null);
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [showCredits, setShowCredits] = useState(false);

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

    // --------------------------------------------------
    // VIMEO PLAYER
    // --------------------------------------------------

    useEffect(() => {
        if (!project?.video || !videoContainerRef.current) {
            return;
        }

        const player = new Player(videoContainerRef.current, {
            url: project.video,
            controls: false,
            autoplay: false,
            title: false,
            byline: false,
            portrait: false,
            responsive: true,
        });

        playerRef.current = player;

        const setupPlayer = async () => {
            try {
                const videoDuration = await player.getDuration();

                setDuration(videoDuration);

                const muted = await player.getMuted();

                setIsMuted(muted);
            } catch (error) {
                console.error("Error getting Vimeo data:", error);
            }
        };

        setupPlayer();

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

        return () => {
            player.destroy();
            playerRef.current = null;
        };
    }, [project]);

    // --------------------------------------------------
    // VIDEO TIME
    // --------------------------------------------------

    useEffect(() => {
        if (!playerRef.current) return;

        let interval: ReturnType<typeof setInterval>;

        if (isPlaying) {
            interval = setInterval(async () => {
                try {
                    if (!playerRef.current) return;

                    const time = await playerRef.current.getCurrentTime();

                    setCurrentTime(time);
                } catch (error) {
                    console.error("Error getting current time:", error);
                }
            }, 250);
        }

        return () => {
            clearInterval(interval);
        };
    }, [isPlaying]);

    // --------------------------------------------------
    // PLAY / PAUSE
    // --------------------------------------------------

    const togglePlay = async () => {
        if (!playerRef.current) return;

        try {
            const paused = await playerRef.current.getPaused();

            if (paused) {
                await playerRef.current.play();
            } else {
                await playerRef.current.pause();
            }

            resetHideTimer();
        } catch (error) {
            console.error("Error controlling Vimeo:", error);
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
        if (!progressBarRef.current || !playerRef.current || !duration) {
            return;
        }

        const rect = progressBarRef.current.getBoundingClientRect();

        const position =
            (event.clientX - rect.left) / rect.width;

        const newTime = Math.max(
            0,
            Math.min(1, position)
        ) * duration;

        try {
            await playerRef.current.setCurrentTime(newTime);

            setCurrentTime(newTime);
            resetHideTimer();
        } catch (error) {
            console.error("Error seeking Vimeo:", error);
        }
    };

    // --------------------------------------------------
    // MUTE
    // --------------------------------------------------

    const toggleMute = async () => {
        if (!playerRef.current) return;

        try {
            const muted = await playerRef.current.getMuted();

            await playerRef.current.setMuted(!muted);

            setIsMuted(!muted);
            resetHideTimer();
        } catch (error) {
            console.error("Error muting Vimeo:", error);
        }
    };

    // --------------------------------------------------
    // FULLSCREEN
    // --------------------------------------------------

    const toggleFullscreen = async () => {
        if (!playerRef.current) return;

        try {
            if (isFullscreen) {
                await playerRef.current.exitFullscreen();
                setIsFullscreen(false);
            } else {
                await playerRef.current.requestFullscreen();
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
                ref={videoContainerRef}
                className={`
        absolute inset-0 w-full h-full pointer-events-none
        transition-all duration-700 ease-in-out
        ${showCredits ? "blur-sm scale-[1.01]" : "blur-0 scale-100"}
    `}
            />

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
                {showControls && (
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
                        <button
                            type="button"
                            onPointerMove={handleMouseMove}
                            onClick={toggleCredits}
                            className="text-md cursor-pointer uppercase"
                        >
                            Credits
                        </button>
                        {/* PLAYER BAR */}

                        <div className="flex items-center gap-3">
                            {/* PROGRESS BAR */}

                            <div className="flex items-end justify-between uppercase">
                                <div className="text-xl">
                                    {project.titulo} - <span className="opacity-40">{project.para}</span>
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
                        className="fixed inset-0 z-20 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.4,
                            ease: "easeInOut",
                        }}
                    >
                        <motion.div
                            className="
                    absolute
                    left-1/2
                    h-screen
                    w-screen
                    text-white
                    items-center
                "
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
                            <div className="text-sm leading-relaxed uppercase">

                                {Array.isArray(project.direccion) && project.direccion.length > 0 && (
                                    <div className="flex gap-2">
                                        <div className="w-32 shrink-0opacity-50">
                                            Direcció
                                        </div>

                                        <div>
                                            {project.direccion.map((persona: string, index: number) => (
                                                <div key={index}>
                                                    {persona}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(project.produccion) && project.produccion.length > 0 && (
                                    <div className="flex gap-2 ">
                                        <div className="w-32 shrink-0 opacity-50">
                                            Producció
                                        </div>

                                        <div>
                                            {project.produccion.map((persona: string, index: number) => (
                                                <div key={index}>
                                                    {persona}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(project.productora) && project.productora.length > 0 && (
                                    <div className="flex gap-2">
                                        <div className="w-32 shrink-0 opacity-50">
                                            Productora
                                        </div>

                                        <div>
                                            {project.productora.map((empresa: string, index: number) => (
                                                <div key={index}>
                                                    {empresa}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CREDITS */}

                                {Array.isArray(project.creditos) && project.creditos.length > 0 && (
                                    <div>
                                        {project.creditos.map((credit: any, index: number) => {

                                            if (
                                                !credit ||
                                                !credit.rol ||
                                                !Array.isArray(credit.personas) ||
                                                credit.personas.length === 0
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={`${credit.rol}-${index}`}
                                                    className="flex gap-2"
                                                >
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        {credit.rol}
                                                    </div>

                                                    <div>
                                                        {credit.personas.map(
                                                            (persona: string, personIndex: number) => (
                                                                <div key={personIndex}>
                                                                    {persona}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.main>
    );
}