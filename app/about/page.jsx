"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="w-screen h-screen bg-white text-black flex items-center justify-center font-overused">
            <motion.div
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                }}
                className="px-4 md:px-6  md:w-2/3 flex gap-10"
            >
                <div className="text-sm text-start">
                    Manel Serrat Segovia Lorem ipsum dolor sit amet,
                    consectetur adipiscing elit. Duis eu porttitor erat. Sed
                    vitae ex a elit dictum tempor. Morbi leo lectus, tempor
                    hendrerit sapien sit amet, sollicitudin dapibus purus.
                    Aliquam sagittis, tortor non rhoncus ultricies, magna urna
                    ullamcorper dui, eget convallis felis mauris quis metus.
                </div>
                <div className="text-xs">
                    <p>Vimeo <a href="https://vimeo.com/manelserrat" className="underline">manelserrat</a></p>
                    <p>Instagram <a href="https://www.instagram.com/manelserrat/" className="underline">manelserrat</a></p>
                    <a href="mailto:manelserratsegovia@gmail.com" className="underline">manelserratsegovia@gmail.com</a><br/>
                    <a href="https://www.lupuntvuit.com/" className="underline">L'upuntvuit</a>
                </div>
            </motion.div>
        </main>
    );
}