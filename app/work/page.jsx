"use client";

import React, {
    Suspense,
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

function WorkContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(
                    collection(db, "proyectos")
                );

                const projectsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setProjects(projectsData);
            } catch (error) {
                console.error("Error loading projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter((project) => {
        if (!category) return true;

        if (!project.categoria) return false;

        const categories = Array.isArray(project.categoria)
            ? project.categoria
            : [project.categoria];

        return categories.some(
            (item) =>
                String(item).toLowerCase().trim() ===
                category.toLowerCase().trim()
        );
    });

    useEffect(() => {
        const container = scrollRef.current;

        if (!container) return;

        const handleWheel = (event) => {
            if (window.innerWidth < 768) return;

            event.preventDefault();

            container.scrollBy({
                left: event.deltaY,
                behavior: "auto",
            });
        };

        container.addEventListener("wheel", handleWheel, {
            passive: false,
        });

        return () => {
            container.removeEventListener("wheel", handleWheel);
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
            md:pt-40
            pt-30
            font-overused
        "
        >
            <div
                ref={scrollRef}
                className="
                w-full
                h-full

                overflow-y-auto
                md:overflow-x-auto
                md:overflow-y-hidden

                px-6
                pb-10

                no-scrollbar
            "
            >
                <div
                    className="
                    flex
                    flex-col
                    gap-4

                    md:flex-row
                    md:gap-2

                    w-full
                    md:w-max
                "
                >
                    {filteredProjects.map((project) => {
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

                                w-full

                                md:w-[calc(50vw-27px)]
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
                                            {project.titulo}
                                        </h2>

                                        <p
                                            className="
                                            text-sm
                                            uppercase
                                            leading-tight
                                            opacity-50
                                        "
                                        >
                                            {Array.isArray(project.para)
                                                ? project.para.join(", ")
                                                : project.para}
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
                    })}
                </div>
            </div>
        </main>
    );

}

export default function WorkPage() {
    return (<Suspense fallback={null}> <WorkContent /> </Suspense>
    );
}
