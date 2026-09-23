"use client";

import {
    useRouter,
    usePathname,
    useSearchParams,
} from "next/navigation";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isHome = pathname === "/";

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
                MANEL SERRAT SEGOVIA is a director from Barcelona, Spain and
                co-founder of L&apos;UPUNTVUIT
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
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="comercial">
                    Work - Commercials
                </option>
                <option value="videoclip">
                    Work - Music Videos
                </option>
                <option value="ficcion">
                    Work - Fiction
                </option>
                <option value="about">About</option>
            </select>
        </header>
    );
}