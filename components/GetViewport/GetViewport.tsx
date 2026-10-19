
"use client";

import { useEffect } from "react";

export default function GetViewport() {
    useEffect(() => {
        const root = document.documentElement;

        const updateViewport = () => {
            root.style.setProperty(
                "--app-viewport-width",
                `${window.innerWidth}px`
            );

            root.style.setProperty(
                "--app-viewport-height",
                `${window.innerHeight}px`
            );
        };

        updateViewport();

        window.addEventListener("resize", updateViewport);
        window.addEventListener("orientationchange", updateViewport);

        return () => {
            window.removeEventListener("resize", updateViewport);
            window.removeEventListener("orientationchange", updateViewport);
        };
    }, []);

    return null;
}
