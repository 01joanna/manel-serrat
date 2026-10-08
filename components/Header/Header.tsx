
"use client";

import Image from "next/image";

import {
    useRouter,
    usePathname,
    useSearchParams,
} from "next/navigation";

import {
    useEffect,
    useRef,
    useState,
} from "react";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [visible, setVisible] =
        useState(true);

    const [selected, setSelected] =
        useState("home");

    const [menuOpen, setMenuOpen] =
        useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const isHome =
        pathname === "/";

    const isProjectPage =
        pathname.startsWith("/work/") &&
        pathname !== "/work";

    const isWorkPage =
        pathname === "/work";

    const isAboutPage =
        pathname.startsWith("/about");

    // --------------------------------------------------
    // SELECTED MENU
    // --------------------------------------------------

    useEffect(() => {
        if (pathname === "/") {
            setSelected("home");
            return;
        }

        if (pathname.startsWith("/work/")) {
            setSelected("work");
            return;
        }

        if (pathname === "/work") {
            const category =
                searchParams.get("category");

            if (category === "publicitat") {
                setSelected("publicitat");
                return;
            }

            if (category === "videoclip") {
                setSelected("videoclip");
                return;
            }

            if (category === "ficcio") {
                setSelected("ficcio");
                return;
            }

            setSelected("work");
            return;
        }

        if (pathname === "/about") {
            setSelected("about");
            return;
        }

        setSelected("home");
    }, [pathname, searchParams]);

    // --------------------------------------------------
    // PROJECT PAGE HEADER VISIBILITY
    // --------------------------------------------------

    useEffect(() => {
        if (!isProjectPage) {
            setVisible(true);
            return;
        }

        let timeout: ReturnType<
            typeof setTimeout
        >;

        const resetTimer = () => {
            setVisible(true);

            clearTimeout(timeout);

            timeout = setTimeout(() => {
                setVisible(false);
            }, 2300);
        };

        resetTimer();

        window.addEventListener(
            "pointermove",
            resetTimer,
            {
                passive: true,
            }
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                resetTimer
            );

            clearTimeout(timeout);
        };
    }, [isProjectPage]);

    // --------------------------------------------------
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // --------------------------------------------------

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent | TouchEvent
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        document.addEventListener(
            "touchstart",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

            document.removeEventListener(
                "touchstart",
                handleClickOutside
            );
        };
    }, []);

    // --------------------------------------------------
    // CLOSE MENU WITH ESCAPE
    // --------------------------------------------------

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, []);

    // --------------------------------------------------
    // NAVIGATION
    // --------------------------------------------------

    const navigate = (url: string) => {
        const goingToWork =
            url.startsWith("/work");

        const comingFromWork =
            pathname === "/work" ||
            pathname.startsWith("/work/");

        const shouldAnimate =
            goingToWork &&
            comingFromWork;

        if (
            shouldAnimate &&
            typeof document !== "undefined" &&
            document.startViewTransition
        ) {
            document.startViewTransition(() => {
                router.push(url);
            });

            return;
        }

        router.push(url);
    };

    // --------------------------------------------------
    // MENU CHANGE
    // --------------------------------------------------

    const handleChange = (
        value: string
    ) => {
        setSelected(value);
        setMenuOpen(false);

        switch (value) {
            case "home":
                navigate("/");
                break;

            case "publicitat":
                navigate(
                    "/work?category=publicitat"
                );
                break;

            case "videoclip":
                navigate(
                    "/work?category=videoclip"
                );
                break;

            case "ficcio":
                navigate(
                    "/work?category=ficcio"
                );
                break;

            case "about":
                navigate("/about");
                break;

            default:
                break;
        }
    };

    // --------------------------------------------------
    // LOGO
    // --------------------------------------------------

    const handleLogoClick = () => {
        navigate("/");
    };

    // --------------------------------------------------
    // MENU LABEL
    // --------------------------------------------------

    const menuLabels: Record<string, string> = {
        home: "INICI",
        publicitat: "Publicitat",
        videoclip: "Videoclips",
        ficcio: "Ficció",
        about: "Informació",
    };

    const currentLabel =
        menuLabels[selected] ?? "INICI";

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <header
            className={`
                fixed
                top-10
                left-0
                w-screen
                z-[100]
                font-overused
                transition-all
                duration-500
                ease-in-out
                ${
                    isProjectPage && !visible
                        ? "opacity-0 -translate-y-4 pointer-events-none"
                        : "opacity-100 translate-y-0"
                }
            `}
        >
            <div
                className="
                    w-full
                    px-4
                    md:px-10
                    flex
                    flex-row
                    items-center
                    justify-between
                "
            >
                {/* --------------------------------------------------
                    LOGO
                -------------------------------------------------- */}

                <button
                    type="button"
                    onClick={handleLogoClick}
                    aria-label="Ir al inicio"
                    className="
                        flex
                        items-center
                        cursor-pointer
                        p-0
                        border-0
                        bg-transparent
                        shrink-0
                    "
                >
                    <Image
                        src="/manel.png"
                        alt="Manel Serrat Segovia"
                        width={120}
                        height={40}
                        className={`
                            w-auto
                            h-10
                            md:h-18
                            object-contain
                            ${
                                isWorkPage ||
                                isAboutPage
                                    ? "brightness-0"
                                    : "brightness-0 invert"
                            }
                        `}
                        priority
                    />
                </button>

                {/* --------------------------------------------------
                    MENU
                -------------------------------------------------- */}

                <div
                    ref={menuRef}
                    className={`
                        relative
                        rounded-sm
                        p-0.5
                        border
                        md:absolute
                        md:left-1/2
                        md:-translate-x-1/2
                        ${
                            isHome
                                ? "border-white"
                                : "border-black"
                        }
                    `}
                >
                    {/* --------------------------------------------------
                        SELECTED OPTION / TRIGGER
                    -------------------------------------------------- */}

                    <button
                        type="button"
                        onClick={() =>
                            setMenuOpen(
                                (previous) =>
                                    !previous
                            )
                        }
                        aria-haspopup="listbox"
                        aria-expanded={menuOpen}
                        className={`
                            uppercase
                            text-xs
                            pl-3
                            px-1
                            py-1
                            w-44
                            md:w-90
                            outline-none
                            cursor-pointer
                            text-left
                            bg-transparent
                            border-0
                            flex
                            items-center
                            justify-between
                            ${
                                isHome
                                    ? "text-white"
                                    : "text-black"
                            }
                        `}
                    >
                        <span>
                            {currentLabel}
                        </span>

                        {/* Flecha */}

                        <span
                            className={`
                                ml-2
                                transition-transform
                                duration-200
                                ${
                                    menuOpen
                                        ? "rotate-180"
                                        : "rotate-0"
                                }
                            `}
                        >
                            ↓
                        </span>
                    </button>

                    {/* --------------------------------------------------
                        CUSTOM DROPDOWN
                    -------------------------------------------------- */}

                    {menuOpen && (
                        <div
                            role="listbox"
                            aria-label="Navegación"
                            className={`
                                absolute
                                left-3
                                right-3
                                top-full
                                mt-1
                                z-[200]
                                rounded-sm
                                overflow-hidden
                                backdrop-blur-md
                                border
                                ${
                                    isHome
                                        ? "bg-black/40 border-white/20"
                                        : "bg-white/70 border-black/10"
                                }
                            `}
                        >
                            {Object.entries(
                                menuLabels
                            ).map(
                                ([
                                    value,
                                    label,
                                ]) => {
                                    const isSelected =
                                        selected ===
                                        value;

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            role="option"
                                            aria-selected={
                                                isSelected
                                            }
                                            onClick={() =>
                                                handleChange(
                                                    value
                                                )
                                            }
                                            className={`
                                                w-full
                                                block
                                                uppercase
                                                text-xs
                                                px-2
                                                py-2
                                                text-left
                                                cursor-pointer
                                                transition-colors
                                                duration-150
                                                ${
                                                    isHome
                                                        ? "text-white hover:bg-white/15"
                                                        : "text-black hover:bg-black/10"
                                                }
                                                ${
                                                    isSelected
                                                        ? isHome
                                                            ? "bg-white/10"
                                                            : "bg-black/5"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {label}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

