
"use client";

import React, {
    Suspense,
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import Player, {
    VimeoUrl,
} from "@vimeo/player";

import { db } from "@/lib/firebase";

type VimeoVideoProps = {
    video: string;
    limitedToFiveSeconds: boolean;
};

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

    useEffect(() => {
        const container =
            containerRef.current;

        if (!container) {
            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    const entry =
                        entries[0];

                    if (
                        entry?.isIntersecting
                    ) {
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

    useEffect(() => {
        if (
            !shouldLoad ||
            !video ||
            !containerRef.current
        ) {
            return;
        }

        const container =
            containerRef.current;

        const player =
            new Player(
                container,
                {
                    url:
                        video as VimeoUrl,
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

        playerRef.current =
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
                        await Promise.all([
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
                        videoWidth /
                        videoHeight;

                    const containerRatio =
                        containerWidth /
                        containerHeight;

                    /*
                     * Primero hacemos que el vídeo
                     * cubra completamente el contenedor
                     * manteniendo su proporción.
                     */
                    let width;
                    let height;

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

                    /*
                     * Pequeño extra para evitar que Vimeo
                     * deje bandas negras de unos píxeles.
                     *
                     * No cambia la proporción del vídeo.
                     * Solo lo hace ligeramente más grande.
                     */
                    const scale =
                        1.03;

                    width *= scale;
                    height *= scale;

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
                        "Error resizing Vimeo:",
                        error
                    );
                }
            };

        const handleTimeUpdate =
            (data: {
                seconds: number;
            }) => {
                if (
                    !limitedToFiveSeconds
                ) {
                    return;
                }

                if (
                    data.seconds >=
                    4.8
                ) {
                    player
                        .setCurrentTime(0)
                        .then(() => {
                            player.play();
                        })
                        .catch(() => {});
                }
            };

        const handleEnded =
            () => {
                player
                    .setCurrentTime(0)
                    .then(() => {
                        player.play();
                    })
                    .catch(() => {});
            };

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

        player
            .ready()
            .then(async () => {
                await resizeVimeo();

                try {
                    await player.setVolume(
                        0
                    );

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

        const handleResize =
            () => {
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
                .catch(() => {});

            playerRef.current =
                null;
        };
    }, [
        shouldLoad,
        video,
        limitedToFiveSeconds,
    ]);

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

function WorkContent() {
    const searchParams =
        useSearchParams();

    const category =
        searchParams.get(
            "category"
        );

    const [projects, setProjects] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    const scrollRef =
        useRef<HTMLDivElement | null>(
            null
        );

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

    const filteredProjects =
        projects.filter(
            (project) => {
                if (!category) {
                    return true;
                }

                if (
                    !project.categoria
                ) {
                    return false;
                }

                const categories =
                    Array.isArray(
                        project.categoria
                    )
                        ? project.categoria
                        : [
                              project.categoria,
                          ];

                return categories.some(
                    (item: string) =>
                        String(item)
                            .toLowerCase()
                            .trim() ===
                        category
                            .toLowerCase()
                            .trim()
                );
            }
        );

    useEffect(() => {
        const container =
            scrollRef.current;

        if (!container) {
            return;
        }

        const handleWheel = (
            event: WheelEvent
        ) => {
            if (
                window.innerWidth < 768
            ) {
                return;
            }

            event.preventDefault();

            container.scrollBy({
                left: event.deltaY,
                behavior: "auto",
            });
        };

        container.addEventListener(
            "wheel",
            handleWheel,
            {
                passive: false,
            }
        );

        return () => {
            container.removeEventListener(
                "wheel",
                handleWheel
            );
        };
    }, []);

    if (loading) {
        return null;
    }

    return (
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
                                <Link
                                    key={
                                        project.id
                                    }
                                    href={`/work/${project.id}`}
                                    className="
                                        group
                                        flex-shrink-0
                                        w-full
                                        md:w-[calc(50vw-27px)]
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
                                </Link>
                            );
                        }
                    )}
                </div>
            </div>
        </main>
    );
}

export default function WorkPage() {
    return (
        <Suspense
            fallback={null}
        >
            <WorkContent />
        </Suspense>
    );
}
