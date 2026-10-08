"use client";

import React, {
    Suspense,
    useEffect,
    useRef,
    useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import Player, {
    VimeoUrl,
} from "@vimeo/player";

import { db } from "@/lib/firebase";
import ProjectModal from "@/components/ProjectModal/ProjectModal";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type VimeoVideoProps = {
    video: string;
    limitedToFiveSeconds: boolean;
};

// --------------------------------------------------
// VIMEO VIDEO
// --------------------------------------------------

function VimeoVideo({
    video,
    limitedToFiveSeconds,
}: VimeoVideoProps) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const playerRef =
        useRef<Player | null>(null);

    const [shouldLoad, setShouldLoad] =
        useState(false);

    // --------------------------------------------------
    // LAZY LOAD
    // --------------------------------------------------

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (entry?.isIntersecting) {
                        setShouldLoad(true);
                        observer.disconnect();
                    }
                },
                {
                    rootMargin: "300px",
                }
            );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

    // --------------------------------------------------
    // VIMEO PLAYER
    // --------------------------------------------------

    useEffect(() => {
        if (
            !shouldLoad ||
            !video ||
            !containerRef.current
        ) {
            return;
        }

        const container = containerRef.current;

        const player = new Player(
            container,
            {
                url: video as VimeoUrl,
                controls: false,
                autoplay: true,
                muted: true,
                loop: false,
                title: false,
                byline: false,
                portrait: false,
                responsive: false,
                playsinline: true,
            }
        );

        playerRef.current = player;

        // --------------------------------------------------
        // RESIZE VIMEO
        // --------------------------------------------------

        const resizeVimeo = async () => {
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
                ] = await Promise.all([
                    player.getVideoWidth(),
                    player.getVideoHeight(),
                ]);

                if (
                    !videoWidth ||
                    !videoHeight
                ) {
                    return;
                }

                const containerWidth =
                    container.clientWidth;

                const containerHeight =
                    container.clientHeight;

                if (
                    !containerWidth ||
                    !containerHeight
                ) {
                    return;
                }

                const videoRatio =
                    videoWidth / videoHeight;

                const containerRatio =
                    containerWidth /
                    containerHeight;

                // --------------------------------------------------
                // COVER
                // --------------------------------------------------

                let width: number;
                let height: number;

                if (
                    videoRatio >
                    containerRatio
                ) {
                    height =
                        containerHeight;

                    width =
                        height *
                        videoRatio;
                } else {
                    width =
                        containerWidth;

                    height =
                        width /
                        videoRatio;
                }

                // --------------------------------------------------
                // SMALL EXTRA SCALE
                // --------------------------------------------------

                const scale = 1.03;

                width *= scale;
                height *= scale;

                iframe.style.position =
                    "absolute";

                iframe.style.left = "50%";
                iframe.style.top = "50%";

                iframe.style.width =
                    `${width}px`;

                iframe.style.height =
                    `${height}px`;

                iframe.style.transform =
                    "translate(-50%, -50%)";

                iframe.style.border = "0";

                iframe.style.maxWidth =
                    "none";

                iframe.style.maxHeight =
                    "none";
            } catch (error) {
                console.error(
                    "Error resizing Vimeo:",
                    error
                );
            }
        };

        // --------------------------------------------------
        // LIMIT VIDEO TO 5 SECONDS
        // --------------------------------------------------

        const handleTimeUpdate = (
            data: {
                seconds: number;
            }
        ) => {
            if (!limitedToFiveSeconds) {
                return;
            }

            if (data.seconds >= 4.8) {
                player
                    .setCurrentTime(0)
                    .then(() => {
                        player.play();
                    })
                    .catch(() => { });
            }
        };

        // --------------------------------------------------
        // VIDEO ENDED
        // --------------------------------------------------

        const handleEnded = () => {
            player
                .setCurrentTime(0)
                .then(() => {
                    player.play();
                })
                .catch(() => { });
        };

        // --------------------------------------------------
        // EVENTS
        // --------------------------------------------------

        player.on(
            "timeupdate",
            handleTimeUpdate
        );

        player.on(
            "ended",
            handleEnded
        );

        player.on(
            "loaded",
            resizeVimeo
        );

        player.on(
            "play",
            resizeVimeo
        );

        // --------------------------------------------------
        // READY
        // --------------------------------------------------

        player
            .ready()
            .then(async () => {
                await resizeVimeo();

                try {
                    await player.setVolume(0);
                    await player.play();
                } catch (error) {
                    console.error(
                        "Error playing Vimeo:",
                        error
                    );
                }
            })
            .catch((error) => {
                console.error(
                    "Error preparing Vimeo:",
                    error
                );
            });

        // --------------------------------------------------
        // WINDOW RESIZE
        // --------------------------------------------------

        const handleResize = () => {
            resizeVimeo();
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        // --------------------------------------------------
        // CLEANUP
        // --------------------------------------------------

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            player.off(
                "timeupdate",
                handleTimeUpdate
            );

            player.off(
                "ended",
                handleEnded
            );

            player.off(
                "loaded",
                resizeVimeo
            );

            player.off(
                "play",
                resizeVimeo
            );

            player
                .destroy()
                .catch(() => { });

            playerRef.current = null;
        };
    }, [
        shouldLoad,
        video,
        limitedToFiveSeconds,
    ]);

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div
            ref={containerRef}
            className="
                absolute
                inset-0
                w-full
                h-full
                overflow-hidden
                pointer-events-none
            "
        />
    );
}

// --------------------------------------------------
// WORK CONTENT
// --------------------------------------------------

function WorkContent() {
    const searchParams =
        useSearchParams();

    const category =
        searchParams.get("category");

    const [projects, setProjects] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [selectedProject, setSelectedProject] =
        useState<any | null>(null);

    const scrollRef =
        useRef<HTMLDivElement | null>(
            null
        );

    // --------------------------------------------------
    // FETCH PROJECTS
    // --------------------------------------------------

    useEffect(() => {
        const fetchProjects =
            async () => {
                try {
                    const snapshot =
                        await getDocs(
                            collection(
                                db,
                                "proyectos"
                            )
                        );

                    const projectsData =
                        snapshot.docs.map(
                            (doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            })
                        );

                    setProjects(
                        projectsData
                    );
                } catch (error) {
                    console.error(
                        "Error loading projects:",
                        error
                    );
                } finally {
                    setLoading(false);
                }
            };

        fetchProjects();
    }, []);

    // --------------------------------------------------
    // FILTER PROJECTS
    // --------------------------------------------------

    const filteredProjects =
        projects
            .filter((project) => {
                if (!category) {
                    return true;
                }

                if (!project.categoria) {
                    return false;
                }

                const categories =
                    Array.isArray(
                        project.categoria
                    )
                        ? project.categoria
                        : [project.categoria];

                return categories.some(
                    (item: string) =>
                        String(item)
                            .toLowerCase()
                            .trim() ===
                        category
                            .toLowerCase()
                            .trim()
                );
            })
            .sort((a, b): number => {
                // --------------------------------------------------
                // SOLO ORDEN ESPECIAL PARA VIDEOCLIP
                // --------------------------------------------------

                if (
                    category?.toLowerCase() !==
                    "videoclip"
                ) {
                    return 0;
                }

                const videoclipOrder:
                    Record<string, number> = {
                    "4": 0,
                    "9": 1,
                    "7": 2,
                    "11": 3,
                    "5": 4,
                };

                const orderA =
                    videoclipOrder[
                    String(a.id)
                    ];

                const orderB =
                    videoclipOrder[
                    String(b.id)
                    ];

                if (
                    orderA !== undefined &&
                    orderB !== undefined
                ) {
                    return orderA - orderB;
                }

                if (
                    orderA !== undefined
                ) {
                    return -1;
                }

                if (
                    orderB !== undefined
                ) {
                    return 1;
                }

                return 0;
            });

    // --------------------------------------------------
    // HORIZONTAL SCROLL WITH MOUSE / TRACKPAD
    // --------------------------------------------------

// --------------------------------------------------
// HORIZONTAL SCROLL WITH MOUSE / TRACKPAD
// --------------------------------------------------

useEffect(() => {
    const handleWheel = (event: WheelEvent) => {

        // --------------------------------------------------
        // MOBILE:
        // dejamos el scroll vertical completamente natural
        // --------------------------------------------------

        if (window.innerWidth < 768) {
            return;
        }

        const container = scrollRef.current;

        if (!container) {
            return;
        }

        // --------------------------------------------------
        // Si no hay movimiento, no hacemos nada
        // --------------------------------------------------

        if (
            event.deltaX === 0 &&
            event.deltaY === 0
        ) {
            return;
        }

        // --------------------------------------------------
        // TRACKPAD / MOUSE
        // --------------------------------------------------

        const delta =
            Math.abs(event.deltaX) >
            Math.abs(event.deltaY)
                ? event.deltaX
                : event.deltaY;

        // --------------------------------------------------
        // LÍMITES DEL SCROLL
        // --------------------------------------------------

        const maxScroll =
            container.scrollWidth -
            container.clientWidth;

        const currentScroll =
            container.scrollLeft;

        const nextScroll =
            currentScroll + delta;

        const canScrollLeft =
            delta < 0 &&
            currentScroll > 0;

        const canScrollRight =
            delta > 0 &&
            currentScroll < maxScroll;

        // --------------------------------------------------
        // SOLO INTERCEPTAMOS EL WHEEL
        // SI HAY SCROLL HORIZONTAL POSIBLE
        // --------------------------------------------------

        if (
            canScrollLeft ||
            canScrollRight
        ) {
            event.preventDefault();

            container.scrollLeft =
                Math.max(
                    0,
                    Math.min(
                        maxScroll,
                        nextScroll
                    )
                );
        }
    };

    // --------------------------------------------------
    // ESCUCHAMOS TODA LA PÁGINA
    // --------------------------------------------------

    window.addEventListener(
        "wheel",
        handleWheel,
        {
            passive: false,
        }
    );

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
        window.removeEventListener(
            "wheel",
            handleWheel
        );
    };

}, [loading]);

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {
        return null;
    }

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <>
            <main
                className="
                    w-full
                    h-screen
                    overflow-hidden
                    md:pt-40
                    pt-30
                    font-overused
                "
            >
                <div
                    ref={scrollRef}
                    className="
                        w-full
                        h-full
                        overflow-y-auto
                        md:overflow-x-auto
                        md:overflow-y-hidden
                        px-6
                        pb-10
                        no-scrollbar
                        md:touch-pan-x
                    "
                >
                    <div
                        className="
                            flex
                            flex-col
                            gap-4
                            md:flex-row
                            md:gap-2
                            w-full
                            md:w-max
                        "
                    >
                        {filteredProjects.map(
                            (project) => {
                                const video =
                                    project.reel ||
                                    project.video;

                                const hasReel =
                                    Boolean(
                                        project.reel
                                    );

                                return (
                                    <button
                                        key={
                                            project.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            setSelectedProject(
                                                project
                                            )
                                        }
                                        className="
                                            group
                                            flex-shrink-0
                                            w-full
                                            md:w-[calc(50vw-27px)]
                                            text-left
                                            cursor-pointer
                                        "
                                    >
                                        <div
                                            className="
                                                relative
                                                w-full
                                                aspect-[4/3]
                                                overflow-hidden
                                                bg-gray-100
                                            "
                                        >
                                            {video && (
                                                <VimeoVideo
                                                    video={
                                                        video
                                                    }
                                                    limitedToFiveSeconds={
                                                        !hasReel
                                                    }
                                                />
                                            )}
                                        </div>

                                        <div
                                            className="
                                                mt-2
                                                flex
                                                justify-between
                                                items-start
                                                gap-4
                                            "
                                        >
                                            <div>
                                                <h2
                                                    className="
                                                        text-lg
                                                        font-bold
                                                        leading-tight
                                                    "
                                                >
                                                    {
                                                        project.titulo
                                                    }
                                                </h2>

                                                <p
                                                    className="
                                                        text-sm
                                                        uppercase
                                                        leading-tight
                                                        opacity-50
                                                    "
                                                >
                                                    {Array.isArray(
                                                        project.para
                                                    )
                                                        ? project.para.join(
                                                            ", "
                                                        )
                                                        : project.para}
                                                </p>
                                            </div>

                                            <p
                                                className="
                                                    text-sm
                                                    leading-tight
                                                    shrink-0
                                                "
                                            >
                                                {
                                                    project.anyo
                                                }
                                            </p>
                                        </div>
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>
            </main>

            {/* --------------------------------------------------
                PROJECT MODAL
            -------------------------------------------------- */}

            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() =>
                        setSelectedProject(null)
                    }
                />
            )}
        </>
    );
}

// --------------------------------------------------
// PAGE
// --------------------------------------------------

export default function WorkPage() {
    return (
        <Suspense fallback={null}>
            <WorkContent />
        </Suspense>
    );
}