
"use client";

import { useEffect, useState } from "react";

type ViewportInfo = {
    innerWidth: number;
    clientWidth: number;
    scrollWidth: number;
    visualWidth: number | null;
    visualLeft: number | null;
    screenWidth: number;
};

export default function GetViewport() {
    const [info, setInfo] = useState<ViewportInfo | null>(null);

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

            setInfo({
                innerWidth: window.innerWidth,
                clientWidth: root.clientWidth,
                scrollWidth: root.scrollWidth,
                visualWidth:
                    window.visualViewport?.width ?? null,
                visualLeft:
                    window.visualViewport?.offsetLeft ?? null,
                screenWidth: window.screen.width,
            });
        };

        updateViewport();

        window.addEventListener("resize", updateViewport);
        window.addEventListener("orientationchange", updateViewport);
        window.visualViewport?.addEventListener(
            "resize",
            updateViewport
        );
        window.visualViewport?.addEventListener(
            "scroll",
            updateViewport
        );

        return () => {
            window.removeEventListener("resize", updateViewport);
            window.removeEventListener(
                "orientationchange",
                updateViewport
            );
            window.visualViewport?.removeEventListener(
                "resize",
                updateViewport
            );
            window.visualViewport?.removeEventListener(
                "scroll",
                updateViewport
            );
        };
    }, []);

    if (!info) return null;

    return (
        <pre
            style={{
                position: "fixed",
                top: 8,
                left: 8,
                zIndex: 2147483647,
                background: "#ff00ff",
                color: "#000",
                padding: 10,
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                pointerEvents: "none",
            }}
        >
            {`innerWidth: ${info.innerWidth}
clientWidth: ${info.clientWidth}
scrollWidth: ${info.scrollWidth}
visualViewport.width: ${info.visualWidth}
visualViewport.offsetLeft: ${info.visualLeft}
screen.width: ${info.screenWidth}`}
        </pre>
    );
}
