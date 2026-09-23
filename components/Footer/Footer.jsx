"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaVimeoV, FaInstagram } from "react-icons/fa";

export default function Footer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <footer className="fixed bottom-0 left-0 z-50 w-full text-white uppercase">

            <div className="flex w-full items-end justify-evenly">

                {/* CONTACT */}
                <motion.div
                    animate={{
                        height: isOpen ? 130 : 40,
                    }}
                    transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                    }}
                    className="relative w-1/2 overflow-hidden"
                >

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute bottom-0 left-0 flex h-10 w-full items-center justify-center text-xs transition-opacity hover:opacity-50"
                    >
                        Contact
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.25,
                                }}
                                className="absolute bottom-12 left-0 flex w-full flex-col items-center gap-3 text-xs"
                            >
                                <a
                                    href="mailto:EMAIL@EJEMPLO.COM"
                                    className="transition-opacity hover:opacity-50"
                                >
                                    Email
                                </a>

                                <div className="flex items-center gap-4">

                                    <a
                                        href="https://vimeo.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Vimeo"
                                        className="transition-opacity hover:opacity-50"
                                    >
                                        <FaVimeoV />
                                    </a>

                                    <a
                                        href="https://www.instagram.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                        className="transition-opacity hover:opacity-50"
                                    >
                                        <FaInstagram />
                                    </a>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.div>

                {/* COPYRIGHT */}
                <div className="flex h-10 w-1/2 items-center justify-center text-xs">
                    © Manel Serrat 2026
                </div>

            </div>

        </footer>
    );

}
