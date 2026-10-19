
"use client";

import React, { useEffect, useRef, useState } from "react";
import Player, { VimeoUrl } from "@vimeo/player";
import YouTube from "react-youtube";
import { AnimatePresence, motion } from "framer-motion";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { createPortal } from "react-dom";
import type { Project } from "@/types/Project";

interface ProjectPlayerProps {
    project: Project;
    onClose: () => void;
}

export default function ProjectPlayer({
    project,
    onClose,
}: ProjectPlayerProps) {
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
    const vimeoPlayerRef = useRef<Player | null>(null);
    const youtubePlayerRef = useRef<any>(null);
    const hideControlsTimeout =
        useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);

    const [showCredits, setShowCredits] = useState(false);
    const [showImages, setShowImages] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHoveringProgress, setIsHoveringProgress] = useState(false);
    const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
    const [videoSize, setVideoSize] = useState({
        width: 0,
        height: 0,
    });

    // DETECTAR YOUTUBE

    const isYouTube = (url?: string) => {
        if (!url) return false;

        try {
            const hostname = new URL(url).hostname.toLowerCase();

            return (
                hostname === "youtube.com" ||
                hostname.endsWith(".youtube.com") ||
                hostname === "youtu.be" ||
                hostname.endsWith(".youtu.be")
            );
        } catch {
            return false;
        }
    };

    // OBTENER ID DE YOUTUBE

    const getYouTubeId = (url: string) => {
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();

            if (
                hostname === "youtu.be" ||
                hostname.endsWith(".youtu.be")
            ) {
                return (
                    parsedUrl.pathname.split("/").filter(Boolean)[0] || null
                );
            }

            if (
                parsedUrl.pathname.startsWith("/embed/") ||
                parsedUrl.pathname.startsWith("/shorts/") ||
                parsedUrl.pathname.startsWith("/live/")
            ) {
                return parsedUrl.pathname.split("/")[2] || null;
            }

            return parsedUrl.searchParams.get("v");
        } catch {
            return null;
        }
    };

    // DETECTAR VIMEO

    const isVimeo = (url?: string) => {
        if (!url) return false;

        try {
            const hostname = new URL(url).hostname.toLowerCase();

            return (
                hostname === "vimeo.com" ||
                hostname.endsWith(".vimeo.com")
            );
        } catch {
            return false;
        }
    };

    const videoUrl = project.video || project.reel || "";

    // CALCULAR TAMAÑO MANTENIENDO LA PROPORCIÓN DEL VÍDEO

    const calculateVideoSize = (ratio: number) => {
        if (
            typeof window === "undefined" ||
            !Number.isFinite(ratio) ||
            ratio <= 0
        ) {
            return;
        }

        const maxWidth = window.innerWidth * 0.94;
        const maxHeight = window.innerHeight * 0.94;

        let width = maxWidth;
        let height = width / ratio;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * ratio;
        }

        setVideoSize({ width, height });
    };

    // ACTUALIZAR TAMAÑO CUANDO CAMBIA LA PROPORCIÓN O LA VENTANA

    useEffect(() => {
        calculateVideoSize(videoAspectRatio);

        const handleResize = () => {
            calculateVideoSize(videoAspectRatio);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [videoAspectRatio]);

    // RESETEAR EL ESTADO AL CAMBIAR DE VÍDEO

    useEffect(() => {
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsMuted(false);
        setShowControls(true);
        setShowCredits(false);
        setShowImages(false);
        setSelectedImage(null);

        // YouTube normalmente utiliza una proporción de reproductor 16:9.
        // Vimeo actualizará la proporción cuando estén disponibles
        // las dimensiones reales del vídeo.
        setVideoAspectRatio(16 / 9);

        youtubePlayerRef.current = null;
    }, [videoUrl]);

    // VIMEO PLAYER

    useEffect(() => {
        if (!videoUrl || isYouTube(videoUrl) || !isVimeo(videoUrl)) {
            return;
        }

        const container = videoContainerRef.current;

        if (!container) return;

        let isMounted = true;

        container.innerHTML = "";

        const player = new Player(container, {
            url: videoUrl as VimeoUrl,
            controls: false,
            autoplay: false,
            title: false,
            byline: false,
            portrait: false,
            responsive: false,
        });

        vimeoPlayerRef.current = player;

        // OBTENER DURACIÓN Y SONIDO

        const setupPlayer = async () => {
            try {
                const videoDuration = await player.getDuration();

                if (!isMounted) return;

                setDuration(videoDuration);

                const muted = await player.getMuted();

                if (!isMounted) return;

                setIsMuted(muted);
            } catch (error) {
                if (isMounted) {
                    console.error("Error getting Vimeo data:", error);
                }
            }
        };

        // AJUSTAR EL CONTENEDOR A LAS DIMENSIONES REALES DE VIMEO

        const resizeVimeo = async () => {
            try {
                if (!isMounted) return;

                const [videoWidth, videoHeight] = await Promise.all([
                    player.getVideoWidth(),
                    player.getVideoHeight(),
                ]);

                console.log("Dimensiones reales de Vimeo:", {
                    videoWidth,
                    videoHeight,
                    ratio: videoWidth / videoHeight,
                });
                
                console.log("Tamaño del contenedor:", {
                    width: container.clientWidth,
                    height: container.clientHeight,
                    ratio: container.clientWidth / container.clientHeight,
                });

                if (
                    !isMounted ||
                    !videoWidth ||
                    !videoHeight ||
                    videoWidth <= 0 ||
                    videoHeight <= 0
                ) {
                    return;
                }

                const ratio = videoWidth / videoHeight;

                setVideoAspectRatio(ratio);
                calculateVideoSize(ratio);

                const iframe = container.querySelector(
                    "iframe"
                ) as HTMLIFrameElement | null;

                if (!iframe) return;

                Object.assign(iframe.style, {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    border: "0",
                    maxWidth: "none",
                    maxHeight: "none",
                    display: "block",
                });
            } catch (error) {
                if (isMounted) {
                    console.error("Error resizing Vimeo:", error);
                }
            }
        };

        // EVENTOS DE VIMEO

        const handleLoaded = () => {
            if (isMounted) {
                void resizeVimeo();
            }
        };

        const handlePlay = () => {
            if (isMounted) {
                setIsPlaying(true);
            }
        };

        const handlePause = () => {
            if (isMounted) {
                setIsPlaying(false);
            }
        };

        const handleEnded = () => {
            if (!isMounted) return;

            setIsPlaying(false);
            setCurrentTime(0);
        };

        player.on("loaded", handleLoaded);
        player.on("play", handlePlay);
        player.on("pause", handlePause);
        player.on("ended", handleEnded);

        player.ready()
            .then(async () => {
                if (!isMounted) return;

                await setupPlayer();

                if (!isMounted) return;

                await resizeVimeo();

                if (!isMounted) return;

                try {
                    await player.pause();

                    if (isMounted) {
                        setIsPlaying(false);
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error("Error pausing Vimeo:", error);
                    }
                }
            })
            .catch((error) => {
                if (isMounted) {
                    console.error("Error preparing Vimeo:", error);
                }
            });

        return () => {
            isMounted = false;

            player.off("loaded", handleLoaded);
            player.off("play", handlePlay);
            player.off("pause", handlePause);
            player.off("ended", handleEnded);

            if (vimeoPlayerRef.current === player) {
                vimeoPlayerRef.current = null;
            }

            player.destroy().catch(() => {});
        };
    }, [videoUrl]);

    // YOUTUBE READY

    const handleYouTubeReady = (event: any) => {
        youtubePlayerRef.current = event.target;

        const player = event.target;

        setDuration(player.getDuration());
        setIsMuted(player.isMuted());

        try {
            player.pauseVideo();
            setIsPlaying(false);
        } catch {}
    };

    // YOUTUBE STATE

    const handleYouTubeStateChange = (event: any) => {
        if (event.data === 1) {
            setIsPlaying(true);
        }

        if (event.data === 2) {
            setIsPlaying(false);
        }

        if (event.data === 0) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    // ACTUALIZAR EL TIEMPO DEL VÍDEO

    useEffect(() => {
        if (!isPlaying || !videoUrl) return;

        const interval = setInterval(async () => {
            try {
                if (isYouTube(videoUrl)) {
                    const player = youtubePlayerRef.current;

                    if (player) {
                        setCurrentTime(player.getCurrentTime());
                    }
                } else if (isVimeo(videoUrl)) {
                    const player = vimeoPlayerRef.current;

                    if (player) {
                        const time = await player.getCurrentTime();
                        setCurrentTime(time);
                    }
                }
            } catch {}
        }, 250);

        return () => {
            clearInterval(interval);
        };
    }, [isPlaying, videoUrl]);

    // CONTROLES VISIBLES

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

    // DETECTAR PANTALLA COMPLETA

    useEffect(() => {
        const container = fullscreenContainerRef.current;

        if (!container) return;

        const handleFullscreenChange = () => {
            const fullscreen = document.fullscreenElement === container;

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

    // PLAY / PAUSE

    const togglePlay = async () => {
        if (!videoUrl) return;

        try {
            if (isYouTube(videoUrl)) {
                const player = youtubePlayerRef.current;

                if (!player) return;

                if (player.getPlayerState() === 1) {
                    player.pauseVideo();
                    setIsPlaying(false);
                } else {
                    player.playVideo();
                    setIsPlaying(true);
                }

                resetHideTimer();
                return;
            }

            if (!isVimeo(videoUrl)) return;

            const player = vimeoPlayerRef.current;

            if (!player) return;

            const paused = await player.getPaused();

            if (paused) {
                await player.play();
                setIsPlaying(true);
            } else {
                await player.pause();
                setIsPlaying(false);
            }

            resetHideTimer();
        } catch (error) {
            console.error("Error controlling video:", error);
        }
    };

    // BARRA DE PROGRESO

    const handleProgressClick = async (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        if (!videoUrl || !progressBarRef.current || !duration) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const position = (event.clientX - rect.left) / rect.width;
        const newTime = Math.max(0, Math.min(1, position)) * duration;

        try {
            if (isYouTube(videoUrl)) {
                const player = youtubePlayerRef.current;

                if (!player) return;

                player.seekTo(newTime, true);
            } else if (isVimeo(videoUrl)) {
                const player = vimeoPlayerRef.current;

                if (!player) return;

                await player.setCurrentTime(newTime);
            } else {
                return;
            }

            setCurrentTime(newTime);
            resetHideTimer();
        } catch (error) {
            console.error("Error seeking video:", error);
        }
    };

    // SILENCIO

    const toggleMute = async () => {
        if (!videoUrl) return;

        try {
            if (isYouTube(videoUrl)) {
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

            if (!isVimeo(videoUrl)) return;

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

    // PANTALLA COMPLETA

    const toggleFullscreen = async () => {
        try {
            const container = fullscreenContainerRef.current;

            if (!container) return;

            if (document.fullscreenElement) {
                await document.exitFullscreen();

                setIsFullscreen(false);
                resetHideTimer();

                return;
            }

            await container.requestFullscreen();

            setIsFullscreen(true);
            resetHideTimer();
        } catch (error) {
            console.error("Error with fullscreen:", error);
        }
    };

    // FORMATO DEL TIEMPO

    const formatTime = (seconds: number) => {
        if (!seconds || Number.isNaN(seconds)) return "00:00";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const progressPercentage =
        duration > 0 ? (currentTime / duration) * 100 : 0;

    // LIMPIAR TEMPORIZADOR

    useEffect(() => {
        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, []);

    // CRÉDITOS: COMPATIBILIDAD CON ESTRUCTURAS ANTIGUAS Y NUEVAS

    const creditItems: { rol: string; personas: string[] }[] = [];

    if (Array.isArray(project.creditos)) {
        project.creditos.forEach((credit: any) => {
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

    // CERRAR IMAGEN SELECCIONADA

    const closeSelectedImage = () => {
        setSelectedImage(null);
        resetHideTimer();
    };

    // COMPROBAR SI UN CAMPO TIENE VALORES

    const hasValues = (value: unknown) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return value !== null && value !== undefined && value !== "";
    };

    // MOSTRAR VALORES

    const renderValues = (value: string | string[] | undefined) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return null;
        }

        if (Array.isArray(value)) {
            return value.join(", ");
        }

        return value;
    };

    return (
        <>
            {/* CONTENEDOR DEL VÍDEO */}

            <div
                ref={fullscreenContainerRef}
                className="
                    fullscreen-container
                    pointer-events-auto
                    relative
                    shrink-0
                    bg-black
                "
                style={{
                    width: videoSize.width || undefined,
                    height: videoSize.height || undefined,
                }}
            >
                {/* VENTANA DEL VÍDEO */}

                <motion.div
                    className="
                        relative
                        overflow-hidden
                        bg-black
                        w-full
                        h-full
                    "
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onPointerMove={handleMouseMove}
                >
                    {/* VÍDEO */}

                    <div
                        className={`
                            absolute inset-0
                            transition-all duration-700 ease-in-out
                            ${
                                showCredits || showImages || selectedImage
                                    ? "blur-sm scale-[1.01]"
                                    : "blur-0 scale-100"
                            }
                        `}
                    >
                        {isYouTube(videoUrl) ? (
                            <div className="absolute inset-0 w-full h-full overflow-hidden">
                                <YouTube
                                    key={videoUrl}
                                    videoId={getYouTubeId(videoUrl) || ""}
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
                                    iframeClassName="
                                        youtube-player
                                        absolute inset-0 w-full h-full
                                    "
                                />
                            </div>
                        ) : isVimeo(videoUrl) ? (
                            <div
                                ref={videoContainerRef}
                                className="
                                    vimeo-container
                                    absolute inset-0
                                    w-full h-full
                                    overflow-hidden
                                "
                            />
                        ) : (
                            <div className="absolute inset-0 bg-black" />
                        )}
                    </div>

                    {/* CAPA DE INTERACCIÓN */}

                    <div
                        className={`
                            absolute inset-0 z-10
                            ${
                                showCredits || showImages || selectedImage
                                    ? "pointer-events-none"
                                    : "cursor-pointer"
                            }
                        `}
                        onPointerMove={handleMouseMove}
                        onMouseMove={handleMouseMove}
                        onClick={(event) => {
                            event.stopPropagation();
                            void togglePlay();
                        }}
                    />

                    {/* PLAY / PAUSE */}

                    <AnimatePresence>
                        {showControls && videoUrl && (
                            <motion.button
                                type="button"
                                onClick={() => void togglePlay()}
                                className="
                                    absolute inset-0 z-30 m-auto
                                    w-20 h-20
                                    flex items-center justify-center
                                    cursor-pointer
                                "
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.12 }}
                                aria-label={
                                    isPlaying ? "Pause video" : "Play video"
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

                    {/* CONTROLES INFERIORES */}

                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                className="absolute left-6 right-6 bottom-6 z-40"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                transition={{ duration: 0.35 }}
                            >
                                {/* BOTONES DE CRÉDITOS E IMÁGENES */}

                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setShowCredits((previous) => !previous);
                                            setShowImages(false);
                                            resetHideTimer();
                                        }}
                                        className="
                                            text-2xl font-thin hover:font-normal
                                            cursor-pointer uppercase
                                        "
                                    >
                                        Credits
                                    </button>

                                    {project.imagenes &&
                                        project.imagenes.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setShowImages((previous) => !previous);
                                                    setShowCredits(false);
                                                    resetHideTimer();
                                                }}
                                                className="
                                                    text-2xl font-thin hover:font-normal
                                                    cursor-pointer uppercase
                                                "
                                            >
                                                Imatges
                                            </button>
                                        )}
                                </div>

                                {/* BARRA DEL REPRODUCTOR */}

                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            hidden md:block text-xl uppercase
                                            whitespace-nowrap shrink-0
                                        "
                                    >
                                        {project.titulo}
                                        {" - "}
                                        <span className="opacity-40">
                                            {Array.isArray(project.para)
                                                ? project.para.join(", ")
                                                : project.para}
                                        </span>
                                    </div>

                                    {/* PROGRESO */}

                                    <div
                                        ref={progressBarRef}
                                        className="
                                            relative flex-1 h-[12px]
                                            flex items-center
                                            cursor-pointer min-w-0
                                        "
                                        onMouseEnter={() =>
                                            setIsHoveringProgress(true)
                                        }
                                        onMouseLeave={() =>
                                            setIsHoveringProgress(false)
                                        }
                                        onClick={(event) =>
                                            void handleProgressClick(event)
                                        }
                                    >
                                        <div className="absolute left-0 right-0 h-[2px] bg-white/35" />

                                        <div
                                            className="absolute left-0 h-[2px] bg-white/70"
                                            style={{
                                                width: `${progressPercentage}%`,
                                            }}
                                        />

                                        <AnimatePresence>
                                            {isHoveringProgress && (
                                                <motion.div
                                                    className="
                                                        absolute w-[8px] h-[8px]
                                                        rounded-full bg-white
                                                    "
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

                                    {/* TIEMPO */}

                                    <div className="text-md whitespace-nowrap tabular-nums shrink-0">
                                        {formatTime(currentTime)}
                                        {" / "}
                                        {formatTime(duration)}
                                    </div>

                                    {/* SONIDO */}

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void toggleMute();
                                        }}
                                        className="
                                            w-5 h-5
                                            flex items-center justify-center
                                            cursor-pointer shrink-0
                                        "
                                        aria-label={
                                            isMuted ? "Unmute video" : "Mute video"
                                        }
                                    >
                                        {isMuted ? (
                                            <FaVolumeMute size={20} />
                                        ) : (
                                            <FaVolumeUp size={20} />
                                        )}
                                    </button>

                                    {/* PANTALLA COMPLETA */}

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void toggleFullscreen();
                                        }}
                                        className="
                                            w-5 h-5
                                            flex items-center justify-center
                                            cursor-pointer shrink-0
                                        "
                                        aria-label={
                                            isFullscreen
                                                ? "Exit fullscreen"
                                                : "Fullscreen"
                                        }
                                    >
                                        <span className="text-2xl">⛶</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CRÉDITOS */}

                    <AnimatePresence>
                        {showCredits && (
                            <motion.div
                                className="
                                    absolute inset-0 z-20
                                    overflow-auto bg-black/10
                                "
                                onClick={() => setShowCredits(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="
                                        absolute left-1/2 top-1/2
                                        -translate-x-1/2 -translate-y-1/2
                                        w-[90%] max-h-[75%]
                                        overflow-y-auto text-white
                                    "
                                    onClick={() => setShowCredits(false)}
                                    initial={{ opacity: 0, x: "-70%" }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: "-70%" }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    {/* TÍTULO */}

                                    <div className="mb-8">
                                        <div className="text-2xl uppercase">
                                            {project.titulo}
                                        </div>

                                        <div className="text-sm opacity-50">
                                            {project.anyo}
                                        </div>
                                    </div>

                                    {/* INFORMACIÓN Y CRÉDITOS */}

                                    <div className="text-sm uppercase leading-[1.4]">
                                        <div
                                            className="
                                                grid grid-cols-1 md:grid-cols-2
                                                gap-x-4 gap-y-1
                                            "
                                        >
                                            {hasValues(project.direccion) && (
                                                <div className="flex gap-2 min-w-0">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Direcció
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        {renderValues(project.direccion)}
                                                    </div>
                                                </div>
                                            )}

                                            {hasValues(project.produccion) && (
                                                <div className="flex gap-2 min-w-0">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Producció
                                                    </div>

                                                    <div className="min-w-0">
                                                        {renderValues(project.produccion)}
                                                    </div>
                                                </div>
                                            )}

                                            {hasValues(project.productora) && (
                                                <div className="flex gap-2 min-w-0">
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        Productora
                                                    </div>

                                                    <div className="min-w-0">
                                                        {renderValues(project.productora)}
                                                    </div>
                                                </div>
                                            )}

                                            {creditItems.map((credit, index) => (
                                                <div
                                                    key={`${credit.rol}-${index}`}
                                                    className="flex gap-2 min-w-0"
                                                >
                                                    <div className="w-32 shrink-0 opacity-50">
                                                        {credit.rol}
                                                    </div>

                                                    <div className="min-w-0">
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
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* GALERÍA DE IMÁGENES */}

                    <AnimatePresence>
                        {showImages && (
                            <motion.div
                                className="
                                    absolute inset-0 z-20 overflow-hidden
                                "
                                onClick={() => setShowImages(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="absolute inset-0" />

                                <motion.div
                                    data-project-images-scroll="true"
                                    className="
                                        absolute right-0 top-1/2
                                        -translate-y-1/2
                                        w-[33%] max-h-[80%]
                                        overflow-y-auto overflow-x-hidden
                                        overscroll-y-contain touch-pan-y
                                        pr-6 flex flex-col gap-0.5
                                        z-10 scrollbar-hide
                                    "
                                    onClick={(event) => event.stopPropagation()}
                                    onWheel={(event) => event.stopPropagation()}
                                    initial={{ opacity: 0, x: "70%" }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: "70%" }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    {project.imagenes?.map((imagen, index) => (
                                        <img
                                            key={index}
                                            src={imagen}
                                            alt={`${project.titulo} ${index + 1}`}
                                            onClick={() =>
                                                setSelectedImage(imagen)
                                            }
                                            className="
                                                block w-full h-auto shrink-0
                                                object-contain
                                                opacity-70 hover:opacity-100
                                                transition-opacity duration-300
                                                cursor-pointer rounded-sm
                                            "
                                        />
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* CERRAR PROYECTO */}

                <AnimatePresence>
                    <motion.button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onClose();
                        }}
                        className="
                            absolute -top-1 -right-12 z-[100]
                            w-10 h-10
                            flex items-center justify-center
                            cursor-pointer
                        "
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                        aria-label="Close project"
                    >
                        <span className="relative block w-6 h-6">
                            <span
                                className="
                                    absolute top-1/2 left-0
                                    w-full h-[1.5px]
                                    bg-white rotate-45
                                "
                            />

                            <span
                                className="
                                    absolute top-1/2 left-0
                                    w-full h-[1.5px]
                                    bg-white -rotate-45
                                "
                            />
                        </span>
                    </motion.button>
                </AnimatePresence>
            </div>

            {/* IMAGEN SELECCIONADA A PANTALLA COMPLETA */}

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                className="
                                    fixed inset-0 z-[200]
                                    flex items-center justify-center
                                    bg-black/80
                                "
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onClick={closeSelectedImage}
                            >
                                <motion.img
                                    src={selectedImage}
                                    alt={project.titulo}
                                    className="
                                        max-w-[85vw] max-h-[85vh]
                                        w-auto h-auto
                                        object-contain rounded-sm
                                    "
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.4,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={closeSelectedImage}
                                    className="
                                        absolute top-6 right-6
                                        md:-top-1 md:-right-12
                                        z-[100] w-10 h-10
                                        flex items-center justify-center
                                        cursor-pointer
                                    "
                                    aria-label="Close image"
                                >
                                    <span className="relative block w-6 h-6">
                                        <span
                                            className="
                                                absolute top-1/2 left-0
                                                w-full h-[1px]
                                                bg-white rotate-45
                                            "
                                        />

                                        <span
                                            className="
                                                absolute top-1/2 left-0
                                                w-full h-[1px]
                                                bg-white -rotate-45
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
