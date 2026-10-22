
"use client";

import { useState } from "react";

import MainBar from "@/components/MainBar/MainBar";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types/Project";

type HomeProject = Project & {
    homeOrder?: number;
    reel?: string;
};

function getVimeoId(url: string): string | null {
    const match = url.match(
        /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
    );

    return match?.[1] ?? null;
}

function HomeVideo({
    video,
    title,
}: {
    video: string;
    title: string;
}) {
    const videoId = getVimeoId(video);

    if (!videoId) return null;

    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
            <iframe
                key={videoId}
                src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&controls=0`}
                title={title || "Vídeo del proyecto"}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-full min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 border-0 md:h-full md:w-[177.78vh] md:min-h-0 md:min-w-full"
            />
        </div>
    );
}

export default function Home() {
    const { projects, loading, error } = useProjects() as {
        projects: Project[] | undefined;
        loading: boolean;
        error?: Error | null;
    };

    const selectedProjects = ((projects as HomeProject[] | undefined) ?? [])
        .filter((project) => project.selected)
        .sort((a, b) => {
            const isEsport = (project: HomeProject) => {
                const title = project.titulo?.toLowerCase() ?? "";

                const para = Array.isArray(project.para)
                    ? project.para.join(" ").toLowerCase()
                    : String(project.para ?? "").toLowerCase();

                const categories = Array.isArray(project.categoria)
                    ? project.categoria.join(" ").toLowerCase()
                    : String(project.categoria ?? "").toLowerCase();

                return (
                    title.includes("esport") ||
                    para.includes("esport") ||
                    categories.includes("esport")
                );
            };

            const aIsEsport = isEsport(a);
            const bIsEsport = isEsport(b);

            if (aIsEsport && !bIsEsport) return -1;
            if (!aIsEsport && bIsEsport) return 1;

            return (a.homeOrder ?? 9999) - (b.homeOrder ?? 9999);
        });

    const [activeProject, setActiveProject] = useState(0);

    if (loading) {
        return <main className="fixed inset-0 bg-black" />;
    }

    if (error || selectedProjects.length === 0) {
        return (
            <main className="fixed inset-0 flex items-center justify-center bg-black px-6 text-center text-white">
                {error
                    ? "No se han podido cargar los proyectos."
                    : "No hay proyectos seleccionados."}
            </main>
        );
    }

    const safeIndex = Math.min(
        activeProject,
        selectedProjects.length - 1
    );

    const project = selectedProjects[safeIndex];
    const homeVideo = project.reel || project.video;

    return (
        <main className="fixed inset-0 h-[100vh] h-[100dvh] w-full overflow-hidden bg-black">
            {/* Vídeo a pantalla completa */}
            <div className="absolute inset-0">
                {homeVideo && (
                    <HomeVideo
                        video={homeVideo}
                        title={project.titulo}
                    />
                )}
            </div>

            {/* MainBar por encima del vídeo */}
            <div className="absolute inset-0 z-50">
                <MainBar
                    projects={selectedProjects}
                    activeProject={safeIndex}
                    setActiveProject={(index: number) => {
                        setActiveProject(
                            Math.max(
                                0,
                                Math.min(index, selectedProjects.length - 1)
                            )
                        );
                    }}
                />
            </div>
        </main>
    );
}
