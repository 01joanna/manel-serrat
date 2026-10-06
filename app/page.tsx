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

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

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
        /**
         * https://youtu.be/VIDEO_ID
         */
        if (
            url.includes("youtu.be/")
        ) {
            return url
                .split("youtu.be/")[1]
                ?.split("?")[0]
                ?.split("&")[0];
        }

        /**
         * https://www.youtube.com/embed/VIDEO_ID
         */
        if (
            url.includes("/embed/")
        ) {
            return url
                .split("/embed/")[1]
                ?.split("?")[0]
                ?.split("&")[0];
        }

        /**
         * https://www.youtube.com/watch?v=VIDEO_ID
         */
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

/**
 * ============================================================
 * HOME VIDEO
 * ============================================================
 *
 * Cada proyecto tiene su propio componente.
 *
 * Esto es importante porque AnimatePresence está usando
 * mode="wait": el vídeo anterior se desmonta antes de que
 * entre el siguiente.
 */

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

    /**
     * ========================================================
     * YOUTUBE
     * ========================================================
     */

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

    /**
     * ========================================================
     * VIMEO
     * ========================================================
     */

    useEffect(() => {
        if (
            !video ||
            !videoContainerRef.current
        ) {
            return;
        }

        const container =
            videoContainerRef.current;

        /**
         * Crear Vimeo Player directamente
         * con la URL.
         */
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

        /**
         * ====================================================
         * RESIZE VIMEO
         * ====================================================
         */

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

                    /**
                     * COVER
                     */
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

                    /**
                     * Pequeño zoom para evitar
                     * cualquier borde.
                     */
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

        /**
         * Vimeo ha terminado de cargar.
         */
        player.on(
            "loaded",
            resizeVimeo
        );

        /**
         * También lo intentamos cuando
         * el player está preparado.
         */
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

        /**
         * Resize de la ventana.
         */
        const handleResize = () => {
            resizeVimeo();
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        /**
         * ====================================================
         * CLEANUP
         * ====================================================
         */

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

    /**
     * ========================================================
     * VIMEO CONTAINER
     * ========================================================
     */

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

/**
 * ============================================================
 * HOME
 * ============================================================
 */

export default function Home() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    /**
     * ========================================================
     * ESTADO
     * ========================================================
     */

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

    /**
     * Evita que el proyecto inicial
     * se vuelva a establecer cada vez
     * que cambie algo en projects.
     */
    const homeInitializedRef =
        useRef<boolean>(false);

    /**
     * ========================================================
     * PROYECTO INICIAL
     * ========================================================
     *
     * Queremos empezar específicamente
     * con el proyecto cuyo Firestore ID
     * sea "4".
     *
     * No usamos un índice fijo porque
     * el orden de Firestore puede cambiar.
     */

    useEffect(() => {
        if (
            !projects ||
            projects.length === 0
        ) {
            return;
        }

        /**
         * Si ya hemos establecido el
         * proyecto inicial, no lo
         * volvemos a modificar.
         */
        if (
            homeInitializedRef.current
        ) {
            return;
        }

        const esportIndex =
            projects.findIndex(
                (project) =>
                    String(
                        project.id
                    ) === "4"
            );

        /**
         * Si existe el proyecto 4,
         * empezamos ahí.
         *
         * Si por alguna razón no existe,
         * empezamos en el primero.
         */
        const initialIndex =
            esportIndex !== -1
                ? esportIndex
                : 0;

        activeProjectRef.current =
            initialIndex;

        setActiveProject(
            initialIndex
        );

        homeInitializedRef.current =
            true;
    }, [projects]);

    /**
     * ========================================================
     * PROYECTO ACTIVO
     * ========================================================
     */

    const project =
        projects?.[
            activeProject
        ];

    /**
     * ========================================================
     * CAMBIAR DE PROYECTO
     * ========================================================
     */

    const changeProject =
        useCallback(
            (
                direction:
                    | "next"
                    | "previous"
            ) => {
                if (
                    !projects ||
                    projects.length === 0
                ) {
                    return;
                }

                /**
                 * Evitar múltiples cambios
                 * mientras la animación está
                 * ocurriendo.
                 */
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

                /**
                 * SIGUIENTE
                 */
                if (
                    direction ===
                    "next"
                ) {
                    newIndex =
                        (currentIndex +
                            1) %
                        projects.length;
                }

                /**
                 * ANTERIOR
                 */
                else {
                    newIndex =
                        (currentIndex -
                            1 +
                            projects.length) %
                        projects.length;
                }

                activeProjectRef.current =
                    newIndex;

                setActiveProject(
                    newIndex
                );

                /**
                 * Bloqueamos el scroll
                 * durante la transición.
                 */
                setTimeout(() => {
                    scrollingRef.current =
                        false;
                }, 1300);
            },
            [projects]
        );

    /**
     * ========================================================
     * AUTOPLAY MOBILE
     * ========================================================
     *
     * Cada 13 segundos.
     */

    useEffect(() => {
        if (
            !projects ||
            projects.length <= 1
        ) {
            return;
        }

        /**
         * Solo móvil.
         */
        if (
            window.innerWidth >= 768
        ) {
            return;
        }

        if (
            activeProject === undefined
        ) {
            return;
        }

        const startAutoplay =
            () => {
                /**
                 * Limpiar timeout anterior
                 * si existe.
                 */
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
                            projects.length;

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
        projects,
        activeProject,
    ]);

    /**
     * ========================================================
     * RUEDA DE RATÓN
     * ========================================================
     *
     * Desktop.
     *
     * La rueda funciona en toda la pantalla,
     * incluido el MainBar.
     */

    useEffect(() => {
        if (
            !projects ||
            projects.length === 0
        ) {
            return;
        }

        const handleWheel = (
            event: WheelEvent
        ) => {
            /**
             * Ignorar movimientos demasiado
             * pequeños.
             */
            if (
                Math.abs(
                    event.deltaY
                ) < 5
            ) {
                return;
            }

            /**
             * Si ya estamos cambiando
             * de proyecto, ignorar.
             */
            if (
                scrollingRef.current
            ) {
                return;
            }

            /**
             * Solo desktop.
             */
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
        projects,
        changeProject,
    ]);

    /**
     * ========================================================
     * SWIPE MOBILE
     * ========================================================
     */

    useEffect(() => {
        if (
            !projects ||
            projects.length === 0
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
            /**
             * No tenemos punto inicial.
             */
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

            /**
             * Ignorar movimientos pequeños.
             */
            if (
                Math.abs(
                    difference
                ) < 50
            ) {
                return;
            }

            /**
             * Solo móvil.
             */
            if (
                window.innerWidth >=
                768
            ) {
                return;
            }

            /**
             * Swipe hacia arriba
             * = siguiente.
             */
            if (
                difference > 0
            ) {
                changeProject(
                    "next"
                );
            }

            /**
             * Swipe hacia abajo
             * = anterior.
             */
            else {
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
        projects,
        changeProject,
    ]);

    /**
     * ========================================================
     * LOADING
     * ========================================================
     */

    if (loading) {
        return null;
    }

    /**
     * ========================================================
     * ERROR
     * ========================================================
     */

    if (error) {
        return (
            <div>
                Error:{" "}
                {error.message}
            </div>
        );
    }

    /**
     * ========================================================
     * SIN PROYECTOS
     * ========================================================
     */

    if (
        !projects ||
        projects.length === 0 ||
        !project
    ) {
        return null;
    }

    /**
     * ========================================================
     * RENDER
     * ========================================================
     */

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
                projects={projects}
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