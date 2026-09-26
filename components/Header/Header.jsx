"use client";

import { kMaxLength } from "buffer";
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

    const isHome = pathname === "/";

    const isProjectPage =
        pathname.startsWith("/work/") && pathname !== "/work";

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
                window.removeEventListener("pointermove", resetTimer);
                clearTimeout(timeout);
            };
        }, [isProjectPage]);

    const currentValue = () => {
        if (pathname === "/") return "home";

        if (pathname === "/work") {
            const category = searchParams.get("category");

            if (category === "comercial") return "comercial";
            if (category === "videoclip") return "videoclip";
            if (category === "ficcion") return "ficcion";

            return "work";
        }

        if (pathname === "/about") return "about";

        return "home";
    };

    const navigate = (url) => {
        if (!document.startViewTransition) {
            router.push(url);
            return;
        }

        document.startViewTransition(() => {
            router.push(url);
        });
    };

    const handleChange = (event) => {
        const value = event.target.value;

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
                ${isProjectPage && !visible
                    ? "opacity-0 -translate-y-4 pointer-events-none"
                    : "opacity-100 translate-y-0 "
                }
                ${isHome
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }
            `}
        >
            <div
                className={`
                    text-sm
                    ${isHome ? "text-black" : "text-white"}
                `}
            >
                MANEL SERRAT SEGOVIA és un director basat a Barcelona / co-fundador de <a href="https://www.lupuntvuit.com/" className="underline">L'UPUNTVUIT</a>
            </div>

            <select
                value={currentValue()}
                onChange={handleChange}
                className={`
                    uppercase
                    text-xs
                    px-1
                    py-1
                    outline-none
                    cursor-pointer
                    border
                    ${isHome
                        ? "text-black bg-white border-black"
                        : "text-white bg-black border-white"
                    }
                `}
            >
                <option value="home">INICI</option>
                <option value="work">PROJECTES</option>
                <option value="comercial">PROJECTES - Comercials</option>
                <option value="videoclip">PROJECTES -  Videoclips</option>
                <option value="ficcion">PROJECTES - Ficció</option>
                <option value="about">Informació</option>
            </select>
        </header>
    );
}