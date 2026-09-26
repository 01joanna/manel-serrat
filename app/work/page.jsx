
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import Player from "@vimeo/player";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "@/lib/firebase";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id;

    const videoContainerRef = useRef(null);
    const playerRef = useRef(null);
    const hideControlsTimeout = useRef(null);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // --------------------------------------------------
    // FETCH PROJECT
    // --------------------------------------------------

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const projectRef = doc(db, "proyectos", id);
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
        if (!project?.video || !videoContainerRef.current) return;

        const player = new Player(videoContainerRef.current, {
            url: project.video,

            // Vimeo UI
            controls: false,

            // Autoplay
            autoplay: false,

            // No Vimeo branding / UI
            title: false,
            byline: false,
            portrait: false,

            // Background-style video
            background: false,

            // Responsive
            responsive: true,
        });

        playerRef.current = player;

        player.on("play", () => {
            setIsPlaying(true);
        });

        player.on("pause", () => {
            setIsPlaying(false);
        });

        player.on("ended", () => {
            setIsPlaying(false);
        });

        return () => {
            player.destroy();
            playerRef.current = null;
        };
    }, [project]);

    // --------------------------------------------------
    // PLAY / PAUSE
    // --------------------------------------------------

    const togglePlay = async () => {
        if (!playerRef.current) return;

        try {
            const playing = await playerRef.current.getPaused();

            if (playing) {
                await playerRef.current.play();
            } else {
                await playerRef.current.pause();
            }

            showControlsTemporarily();
        } catch (error) {
            console.error("Error controlling video:", error);
        }
    };

    // --------------------------------------------------
    // CONTROLS VISIBILITY
    // --------------------------------------------------

    const showControlsTemporarily = () => {
        setShowControls(true);

        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }

        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 2500);
    };

    const handleMouseMove = () => {
        showControlsTemporarily();
    };

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
    // PROJECT NOT FOUND
    // --------------------------------------------------

    if (!project) {
        return (
            <main className="w-full h-screen flex items-center justify-center bg-black text-white">
                <p>Project not found</p>
            </main>
        );
    }

    // --------------------------------------------------
    // VIEWER
    // --------------------------------------------------

    return (
        <motion.main
            className="fixed inset-0 z-50 bg-black text-white overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onMouseMove={handleMouseMove}
        >
            {/* VIDEO */}

            <div
                ref={videoContainerRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* DARK OVERLAY */}

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="absolute inset-0 bg-black/10" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 z-20"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/*

                        Aquí más adelante podemos integrar
                        tu Header real.

                        */}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CLOSE */}

            <AnimatePresence>
                {showControls && (
                    <motion.button
                        type="button"
                        onClick={() => router.push("/work")}
                        className="absolute top-6 right-6 z-30 w-10 h-10 flex items-center justify-center cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        aria-label="Close project"
                    >
                        <span className="relative block w-6 h-6">
                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white rotate-45" />
                            <span className="absolute top-1/2 left-0 w-full h-[1px] bg-white -rotate-45" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* PLAY / PAUSE */}

            <AnimatePresence>
                {showControls && (
                    <motion.button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 z-20 m-auto w-20 h-20 flex items-center justify-center cursor-pointer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        aria-label={isPlaying ? "Pause video" : "Play video"}
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
        </motion.main>
    );
}