"use client";

import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { collection, getDocs } from "firebase/firestore";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import { db } from "@/lib/firebase";

export default function WorkPage() {
    const searchParams = useSearchParams();

    const category = searchParams.get("category");

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const scrollRef = useRef(null);

    // --------------------------------
    // FIREBASE
    // --------------------------------

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(
                    collection(db, "proyectos")
                );

                const projectsData = snapshot.docs.map(
                    (doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })
                );

                setProjects(projectsData);
            } catch (error) {
                console.error(
                    "Error loading projects:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // --------------------------------
    // FILTER
    // --------------------------------

    const filteredProjects =
        projects.filter((project) => {
            if (!category) return true;

            if (!project.categoria) return false;

            const categories = Array.isArray(
                project.categoria
            )
                ? project.categoria
                : [project.categoria];

            return categories.some(
                (item) =>
                    String(item)
                        .toLowerCase()
                        .trim() ===
                    category
                        .toLowerCase()
                        .trim()
            );
        });

    // --------------------------------
    // HORIZONTAL SCROLL
    // --------------------------------

    useEffect(() => {
        const container =
            scrollRef.current;

        if (!container) return;

        const handleWheel = (event) => {
            event.preventDefault();

            container.scrollBy({
                left: event.deltaY,
                behavior: "auto",
            });
        };

        container.addEventListener(
            "wheel",
            handleWheel,
            {
                passive: false,
            }
        );

        return () => {
            container.removeEventListener(
                "wheel",
                handleWheel
            );
        };
    }, []);

    if (loading) {
        return null;
    }

    return (
        <main
            className="
        w-full
        h-screen
        overflow-hidden
        pt-40
        font-overused
        bg-white
        text-black
      "
        >
            <div
                ref={scrollRef}
                className="
          w-full
          h-full
          overflow-x-auto
          overflow-y-hidden
          px-4
          md:px-6
          pb-10
          no-scrollbar
        "
            >
                <AnimatePresence
                    mode="wait"
                >
                    <motion.div
                        key={category || "all"}
                        className="
              flex
              gap-2
              w-max
            "
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeInOut",
                        }}
                    >
                        {filteredProjects.map(
                            (project) => {
                                const image =
                                    project.imagen ||
                                    project.image ||
                                    project.imagenes?.[0] ||
                                    project.images?.[0];

                                return (
                                    <Link
                                        key={project.id}
                                        href={`/work/${project.id}`}
                                        className="
                      group
                      flex-shrink-0
                      w-[calc(50vw-27px)]
                    "
                                    >
                                        <div
                                            className="
                        w-full
                        aspect-[4/3]
                        overflow-hidden
                        bg-gray-100
                      "
                                        >
                                            {image && (
                                                <img
                                                    src={image}
                                                    alt={
                                                        project.titulo ||
                                                        "Project"
                                                    }
                                                    className="
                            w-full
                            h-full
                            object-cover
                            transition-transform
                            duration-500
                            ease-out
                            group-hover:scale-[1.02]
                            rounded-sm
                          "
                                                />
                                            )}
                                        </div>

                                        <div
                                            className="
                        mt-2
                        flex
                        justify-between
                        items-start
                        gap-4
                      "
                                        >
                                            <div>
                                                <h2
                                                    className="
                            text-lg
                            font-bold
                            leading-tight
                          "
                                                >
                                                    {project.para}
                                                </h2>

                                                <p
                                                    className="
                            text-sm
                            uppercase
                            leading-tight
                            opacity-50
                          "
                                                >
                                                    {project.titulo}
                                                </p>
                                            </div>

                                            <p
                                                className="
                          text-sm
                          leading-tight
                          shrink-0
                        "
                                            >
                                                {project.anyo}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            }
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}