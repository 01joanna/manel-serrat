"use client";

import {
    useRouter,
    usePathname,
    useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";

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

    /*
     * VALOR ACTUAL DEL SELECT
     */
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
            const category = searchParams.get("category");

            if (category === "comercial") {
                setSelected("comercial");
                return;
            }

            if (category === "videoclip") {
                setSelected("videoclip");
                return;
            }

            if (category === "ficcion") {
                setSelected("ficcion");
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

    /*
     * OCULTAR HEADER EN PROYECTOS
     */
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

        window.addEventListener("pointermove", resetTimer, {
            passive: true,
        });

        return () => {
            window.removeEventListener(
                "pointermove",
                resetTimer
            );

            clearTimeout(timeout);
        };
    }, [isProjectPage]);

    /*
     * NAVEGACIÓN
     */
    const navigate = (url) => {
        if (!document.startViewTransition) {
            router.push(url);
            return;
        }

        document.startViewTransition(() => {
            router.push(url);
        });
    };

    /*
     * CAMBIO DEL SELECT
     */
    const handleChange = (event) => {
        const value = event.target.value;

        setSelected(value);

        switch (value) {
            case "home":
                navigate("/");
                break;

            case "work":
                navigate("/work");
                break;

            case "comercial":
                navigate("/work?category=comercial");
                break;

            case "videoclip":
                navigate("/work?category=videoclip");
                break;

            case "ficcion":
                navigate("/work?category=ficcion");
                break;

            case "about":
                navigate("/about");
                break;

            default:
                break;
        }
    };

    return (
        <header
            className={`
                fixed
                top-10
                left-1/2
                -translate-x-1/2
                w-90
                h-auto
                flex
                flex-col
                gap-1
                rounded-sm
                p-3
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

                ${
                    isHome
                        ? "bg-white text-black"
                        : "bg-black text-white"
                }
            `}
        >
            {/* DESCRIPCIÓN */}

            <div
                className={`
                    text-sm
                    ${isHome ? "text-black" : "text-white"}
                `}
            >
                MANEL SERRAT SEGOVIA és un director basat a
                Barcelona / co-fundador de{" "}
                <a
                    href="https://www.lupuntvuit.com/"
                    className="underline"
                >
                    L&apos;UPUNTVUIT
                </a>
            </div>

            {/* NAVEGACIÓN */}

            <select
                value={selected}
                onChange={handleChange}
                className={`
                    uppercase
                    text-xs
                    px-1
                    py-1
                    outline-none
                    cursor-pointer
                    border

                    ${
                        isHome
                            ? "text-black bg-white border-black"
                            : "text-white bg-black border-white"
                    }
                `}
            >
                <option value="home">
                    INICI
                </option>

                <option value="work">
                    PROJECTES
                </option>

                <option value="comercial">
                    PROJECTES - Comercials
                </option>

                <option value="videoclip">
                    PROJECTES - Videoclips
                </option>

                <option value="ficcion">
                    PROJECTES - Ficció
                </option>

                <option value="about">
                    Informació
                </option>
            </select>
        </header>
    );
}