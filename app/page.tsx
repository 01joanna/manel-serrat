"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header/Header";
import MainBar from "@/components/MainBar/MainBar";
import Footer from "@/components/Footer/Footer"
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
  const { projects, loading, error } = useProjects();

  const [activeProject, setActiveProject] = useState(0);
  const activeProjectRef = useRef(0);
  const scrollingRef = useRef(false);

  useEffect(() => {
    if (projects.length === 0) return;

    const handleWheel = (event: any) => {
      if (scrollingRef.current) return;
      if (Math.abs(event.deltaY) < 10) return;

      scrollingRef.current = true;

      let newIndex = activeProjectRef.current;

      if (event.deltaY > 0) {
        // ↓ ABAJO → siguiente
        newIndex =
          (activeProjectRef.current + 1) % projects.length;
      } else if (event.deltaY < 0) {
        // ↑ ARRIBA → anterior
        newIndex =
          (activeProjectRef.current - 1 + projects.length) %
          projects.length;
      }

      // Actualizamos las dos cosas
      activeProjectRef.current = newIndex;
      setActiveProject(newIndex);

      // Esperamos a que termine el gesto
      setTimeout(() => {
        scrollingRef.current = false;
      }, 700);
    };

    window.addEventListener("wheel", handleWheel, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [projects.length]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (projects.length === 0) {
    return null;
  }

  const project = projects[activeProject];

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* VÍDEO */}
      <AnimatePresence>
        <motion.iframe
          key={project.id}
          src={`${project.video}?autoplay=1&muted=1&loop=1&background=1`}
          className="absolute inset-0 w-full h-full border-0"
          style={{
            border: "none",
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          title={project.titulo}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
        />
      </AnimatePresence>

      {/* BARRA */}
      <MainBar
        projects={projects}
        activeProject={activeProject}
        setActiveProject={(index: any) => {
          activeProjectRef.current = index;
          setActiveProject(index);
        }}
      />

      {/* <Footer /> */}

    </main>
  );
}