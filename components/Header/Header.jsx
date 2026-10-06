"use client";

import Image from "next/image";

import {
    useRouter,
    usePathname,
    useSearchParams,
} from "next/navigation";

import {
    useEffect,
    useState,
} from "react";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [visible, setVisible] = useState(true);
    const [selected, setSelected] = useState("home");

    const isHome = pathname === "/";

    const isProjectPage =
        pathname.startsWith("/work/") &&
        pathname !== "/work";

    const isWorkPage =
        pathname === "/work";

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

    useEffect(() => {
        if (!isProjectPage) {
            setVisible(true);
            return;
        }

        let timeout;

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

    const navigate = (url) => {
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

    const handleChange = (event) => {
        const value =
            event.target.value;

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

    const handleLogoClick = () => {
        navigate("/");
    };

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
            <div className="relative w-full flex items-center h-18">

                <button
                    type="button"
                    onClick={handleLogoClick}
                    aria-label="Ir al inicio"
                    className="
                        absolute
                        left-10
                        flex
                        items-center
                        cursor-pointer
                        p-0
                        border-0
                        bg-transparent
                    "
                >
                    <Image
                        src="/manel.png"
                        alt="Manel Serrat Segovia"
                        width={120}
                        height={40}
                        className={`
                            w-auto
                            h-18
                            object-contain
                            ${
                                isWorkPage
                                    ? "brightness-0"
                                    : "brightness-0 invert"
                            }
                        `}
                        priority
                    />
                </button>

                <div
                    className="
                        absolute
                        left-1/2
                        -translate-x-1/2
                        rounded-sm
                        p-3
                        bg-gray-300/50
                        backdrop-blur-md
                        shadow-[inset_0_0_20px_rgba(255,255,255,0.35)]
                    "
                >
                    <select
                        value={selected}
                        onChange={handleChange}
                        className={`
                            uppercase
                            text-xs
                            px-1
                            py-1
                            w-90
                            outline-none
                            cursor-pointer
                            ${
                                isHome
                                    ? "text-white bg-transparent"
                                    : "text-black bg-transparent"
                            }
                        `}
                    >
                        <option value="home">
                            INICI
                        </option>

                        <option value="publicitat">
                            Publicitat
                        </option>

                        <option value="videoclip">
                            Videoclips
                        </option>

                        <option value="ficcio">
                            Ficció
                        </option>

                        <option value="about">
                            Informació
                        </option>
                    </select>
                </div>
            </div>
        </header>
    );
}