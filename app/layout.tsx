import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";

const overusedGrotesk = localFont({
    variable: "--font-overused-grotesk",
    src: [
        {
            path: "../public/fonts/OverusedGroteskRoman-Light.woff2",
            weight: "300",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Book.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Roman.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Medium.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Semibold.woff2",
            weight: "600",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Bold.woff2",
            weight: "700",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-ExtraBold.woff2",
            weight: "800",
            style: "normal",
        },
        {
            path: "../public/fonts/OverusedGroteskRoman-Black.woff2",
            weight: "900",
            style: "normal",
        },
    ],
});

export const metadata: Metadata = {
    title: "MANEL SERRAT",
    description: "",
};

export default function RootLayout({
    children,
}: LayoutProps<"/">) {
    return (
        <html lang="en" className="h-full antialiased">
            <body
                className={`${overusedGrotesk.variable} min-h-full flex flex-col`}
            >
                <Suspense fallback={null}>
                    <Header />
                </Suspense>

                {children}
            </body>
        </html>
    );
}