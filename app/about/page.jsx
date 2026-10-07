"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="w-screen h-screen bg-white text-black flex items-center justify-center font-overused md:px-0 px-7">
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
                className="px-4 md:px-6  md:w-2/3 flex md:flex-row flex-col gap-10"
            >
                <div className="md:text-md text-md md:text-start text-justify">
                Del 96 i de Banyoles. Director i realitzador. Actualment treballo com a director i realitzador mentre segueixo explorant com expressar-me en els meus projectes personals.
                </div>
                <div className="md:text-xs text-lg">
                    <p>Vimeo <a href="https://vimeo.com/manelserrat" className="underline">manelserrat</a></p>
                    <p>Instagram <a href="https://www.instagram.com/manelserrat/" className="underline">manelserrat</a></p>
                    <a href="mailto:manelserratsegovia@gmail.com" className="underline">manelserratsegovia@gmail.com</a><br/>
                    <a href="https://www.lupuntvuit.com/" className="underline">L'upuntvuit</a>
                </div>
            </motion.div>
        </main>
    );
}