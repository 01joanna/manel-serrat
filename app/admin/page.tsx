
"use client";

import React, { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Project, ProjectCredit } from "@/types/Project";

// --------------------------------------------------
// TIPOS
// --------------------------------------------------

type CategoryKey = "ficcio" | "publicitat" | "videoclip";
type SectionKey = "projects" | "about" | "home";

type AdminProject = Project & {
    orden?: number;
    homeOrder?: number;
    published?: boolean;
};

type AboutLink = {
    label: string;
    url: string;
};

type ProjectForm = {
    titulo: string;
    anyo: string;
    para: string;
    direccion: string;
    produccion: string;
    productora: string;
    video: string;
    reel: string;
    imagenes: string[];
    categoria: string[];
    creditos: ProjectCredit[];
    selected: boolean;
};

const CATEGORY_OPTIONS: {
    value: CategoryKey;
    label: string;
}[] = [
        { value: "ficcio", label: "Ficció" },
        { value: "publicitat", label: "Publicitat" },
        { value: "videoclip", label: "Videoclip" },
    ];

const EMPTY_FORM: ProjectForm = {
    titulo: "",
    anyo: "",
    para: "",
    direccion: "",
    produccion: "",
    productora: "",
    video: "",
    reel: "",
    imagenes: [""],
    categoria: ["ficcio"],
    creditos: [],
    selected: false,
};

const DEFAULT_ABOUT_DESCRIPTION =
    "Del 96 i de Banyoles. Director i realitzador. Actualment treballo com a director i realitzador mentre segueixo explorant com expressar-me en els meus projectes personals.";

const DEFAULT_ABOUT_LINKS: AboutLink[] = [
    { label: "Vimeo", url: "https://vimeo.com/manelserrat" },
    { label: "Instagram", url: "https://www.instagram.com/manelserrat/" },
    { label: "Email", url: "mailto:manelserratsegovia@gmail.com" },
    { label: "L'upuntvuit", url: "https://www.lupuntvuit.com/" },
];

// --------------------------------------------------
// FUNCIONS AUXILIARS
// --------------------------------------------------

function toArray(value?: string | string[]): string[] {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
}

function toText(value?: string | string[]): string {
    return toArray(value).join("\n");
}

function normalizeCategory(value: string): string {
    const normalized = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (
        ["ficcio", "ficcion", "fiction"].includes(normalized)
    ) {
        return "ficcio";
    }

    if (
        ["publicitat", "publicidad", "advertising"].includes(
            normalized
        )
    ) {
        return "publicitat";
    }

    if (
        ["videoclip", "music video", "musicvideo"].includes(
            normalized
        )
    ) {
        return "videoclip";
    }

    return normalized;
}

function getCategoryLabel(category: string): string {
    const normalized = normalizeCategory(category);

    return (
        CATEGORY_OPTIONS.find(
            (item) => item.value === normalized
        )?.label ?? category
    );
}

function parseLines(value: string): string[] {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

function createForm(project?: AdminProject): ProjectForm {
    if (!project) {
        return {
            ...EMPTY_FORM,
            imagenes: [""],
            categoria: ["ficcio"],
            creditos: [],
        };
    }

    const imagenes = Array.isArray(project.imagenes)
        ? [...project.imagenes]
        : [];

    const creditos: ProjectCredit[] = Array.isArray(
        project.creditos
    )
        ? project.creditos.map((credit) => ({
            rol:
                typeof credit?.rol === "string"
                    ? credit.rol
                    : "",
            personas: Array.isArray(credit?.personas)
                ? credit.personas.map(String)
                : [],
        }))
        : [];

    return {
        titulo: project.titulo ?? "",
        anyo:
            project.anyo != null
                ? String(project.anyo)
                : "",
        para: toText(project.para),
        direccion: toText(project.direccion),
        produccion: toText(project.produccion),
        productora: toText(project.productora),
        video: project.video ?? "",
        reel: project.reel ?? "",
        imagenes: imagenes.length ? imagenes : [""],
        categoria: toArray(project.categoria),
        creditos,
        selected: Boolean(project.selected),
    };
}

// --------------------------------------------------
// COMPONENTE
// --------------------------------------------------

export default function AdminPage() {
    // PROJECTES
    const [projects, setProjects] = useState<AdminProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [activeCategory, setActiveCategory] =
        useState<CategoryKey>("ficcio");

    const [editingProject, setEditingProject] =
        useState<AdminProject | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<ProjectForm>(
        createForm()
    );

    // NAVEGACIÓ
    const [activeSection, setActiveSection] =
        useState<SectionKey>("projects");

    // MISSATGES
    const [message, setMessage] = useState("");

    // ABOUT
    const [aboutDescription, setAboutDescription] =
        useState(DEFAULT_ABOUT_DESCRIPTION);

    const [aboutLinks, setAboutLinks] =
        useState<AboutLink[]>(DEFAULT_ABOUT_LINKS);

    const [aboutLoading, setAboutLoading] = useState(false);
    const [aboutSaving, setAboutSaving] = useState(false);

    // INICI
    const [homeVideoUrl, setHomeVideoUrl] = useState("");
    const [settingsLoading, setSettingsLoading] =
        useState(false);

    const [settingsSaving, setSettingsSaving] =
        useState(false);

    // --------------------------------------------------
    // CARREGAR PROJECTES
    // --------------------------------------------------

    async function loadProjects() {
        setLoading(true);

        try {
            const snapshot = await getDocs(
                collection(db, "proyectos")
            );

            const data = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            })) as AdminProject[];

            data.sort(
                (a, b) =>
                    Number(a.orden ?? 9999) -
                    Number(b.orden ?? 9999)
            );

            setProjects(data);
        } catch (error) {
            console.error(
                "Error carregant projectes:",
                error
            );

            setMessage("No s'han pogut carregar els projectes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadProjects();
    }, []);

    // --------------------------------------------------
    // ABOUT: CARREGAR
    // --------------------------------------------------

    async function loadAbout() {
        setAboutLoading(true);

        try {
            const snapshot = await getDoc(
                doc(db, "configuracion", "about")
            );

            if (!snapshot.exists()) {
                setAboutDescription(
                    DEFAULT_ABOUT_DESCRIPTION
                );

                setAboutLinks(DEFAULT_ABOUT_LINKS);
                return;
            }

            const data = snapshot.data();

            setAboutDescription(
                typeof data.description === "string"
                    ? data.description
                    : DEFAULT_ABOUT_DESCRIPTION
            );

            setAboutLinks(
                Array.isArray(data.links)
                    ? data.links.map((item: unknown) => {
                        const link =
                            item as Partial<AboutLink>;

                        return {
                            label: String(link.label ?? ""),
                            url: String(link.url ?? ""),
                        };
                    })
                    : DEFAULT_ABOUT_LINKS
            );
        } catch (error) {
            console.error(
                "Error carregant l'About:",
                error
            );

            setMessage("No s'ha pogut carregar l'About.");
        } finally {
            setAboutLoading(false);
        }
    }

    // --------------------------------------------------
    // ABOUT: DESAR
    // --------------------------------------------------

    async function handleSaveAbout(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setAboutSaving(true);
        setMessage("");

        try {
            const links = aboutLinks
                .map((link) => ({
                    label: link.label.trim(),
                    url: link.url.trim(),
                }))
                .filter((link) => link.label && link.url);

            await setDoc(
                doc(db, "configuracion", "about"),
                {
                    description: aboutDescription.trim(),
                    links,
                },
                { merge: true }
            );

            setAboutLinks(links);
            setMessage("About desat correctament.");
        } catch (error) {
            console.error("Error desant l'About:", error);
            setMessage("No s'ha pogut desar l'About.");
        } finally {
            setAboutSaving(false);
        }
    }

    function addAboutLink() {
        setAboutLinks((previous) => [
            ...previous,
            { label: "", url: "" },
        ]);
    }

    function updateAboutLink(
        index: number,
        field: keyof AboutLink,
        value: string
    ) {
        setAboutLinks((previous) =>
            previous.map((link, i) =>
                i === index
                    ? { ...link, [field]: value }
                    : link
            )
        );
    }

    function removeAboutLink(index: number) {
        setAboutLinks((previous) =>
            previous.filter((_, i) => i !== index)
        );
    }

    // --------------------------------------------------
    // INICI: CARREGAR
    // --------------------------------------------------

    async function loadSettings() {
        setSettingsLoading(true);

        try {
            const snapshot = await getDoc(
                doc(db, "configuracion", "web")
            );

            setHomeVideoUrl(
                snapshot.exists() &&
                    typeof snapshot.data().homeVideo ===
                    "string"
                    ? snapshot.data().homeVideo
                    : ""
            );
        } catch (error) {
            console.error(
                "Error carregant els ajustos:",
                error
            );

            setMessage("No s'han pogut carregar els ajustos.");
        } finally {
            setSettingsLoading(false);
        }
    }

    // --------------------------------------------------
    // INICI: DESAR
    // --------------------------------------------------

    async function handleSaveSettings(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSettingsSaving(true);
        setMessage("");

        try {
            const url = homeVideoUrl.trim();

            if (url) {
                let parsedUrl: URL;

                try {
                    parsedUrl = new URL(url);
                } catch {
                    setMessage(
                        "Introdueix una URL vàlida de Vimeo."
                    );
                    return;
                }

                const hostname =
                    parsedUrl.hostname.toLowerCase();

                const isVimeo =
                    hostname === "vimeo.com" ||
                    hostname.endsWith(".vimeo.com");

                if (
                    parsedUrl.protocol !== "https:" ||
                    !isVimeo
                ) {
                    setMessage(
                        "Introdueix una URL vàlida de Vimeo."
                    );
                    return;
                }
            }

            await setDoc(
                doc(db, "configuracion", "web"),
                { homeVideo: url },
                { merge: true }
            );

            setMessage("Ajustos desats correctament.");
        } catch (error) {
            console.error(
                "Error desant els ajustos:",
                error
            );

            setMessage("No s'han pogut desar els ajustos.");
        } finally {
            setSettingsSaving(false);
        }
    }

    // --------------------------------------------------
    // CARREGAR L'APARTAT SELECCIONAT
    // --------------------------------------------------

    useEffect(() => {
        if (activeSection === "about") {
            void loadAbout();
        }

        if (activeSection === "home") {
            void loadSettings();
        }
    }, [activeSection]);

    // --------------------------------------------------
    // FORMULARI DE PROJECTES
    // --------------------------------------------------

    function openNewProject() {
        setEditingProject(null);
        setForm(createForm());
        setIsCreating(true);
        setMessage("");
    }

    function openEditProject(project: AdminProject) {
        setEditingProject(project);
        setForm(createForm(project));
        setIsCreating(true);
        setMessage("");
    }

    function closeEditor() {
        setIsCreating(false);
        setEditingProject(null);
        setForm(createForm());
        setMessage("");
    }

    function updateField<K extends keyof ProjectForm>(
        field: K,
        value: ProjectForm[K]
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    // --------------------------------------------------
    // CATEGORIES
    // --------------------------------------------------

    function toggleCategory(category: string) {
        setForm((previous) => {
            const exists = previous.categoria.some(
                (item) =>
                    normalizeCategory(item) ===
                    normalizeCategory(category)
            );

            return {
                ...previous,
                categoria: exists
                    ? previous.categoria.filter(
                        (item) =>
                            normalizeCategory(item) !==
                            normalizeCategory(category)
                    )
                    : [...previous.categoria, category],
            };
        });
    }

    // --------------------------------------------------
    // IMATGES
    // --------------------------------------------------

    function updateImage(index: number, value: string) {
        setForm((previous) => {
            const imagenes = [...previous.imagenes];
            imagenes[index] = value;

            return { ...previous, imagenes };
        });
    }

    function addImage() {
        setForm((previous) => ({
            ...previous,
            imagenes: [...previous.imagenes, ""],
        }));
    }

    function removeImage(index: number) {
        setForm((previous) => {
            const imagenes = previous.imagenes.filter(
                (_, i) => i !== index
            );

            return {
                ...previous,
                imagenes: imagenes.length ? imagenes : [""],
            };
        });
    }

    function moveImage(index: number, direction: -1 | 1) {
        setForm((previous) => {
            const imagenes = [...previous.imagenes];
            const target = index + direction;

            if (target < 0 || target >= imagenes.length) {
                return previous;
            }

            [imagenes[index], imagenes[target]] = [
                imagenes[target],
                imagenes[index],
            ];

            return { ...previous, imagenes };
        });
    }

    // --------------------------------------------------
    // CRÈDITS
    // --------------------------------------------------

    function addCredit() {
        setForm((previous) => ({
            ...previous,
            creditos: [
                ...previous.creditos,
                { rol: "", personas: [""] },
            ],
        }));
    }

    function updateCredit(
        index: number,
        changes: Partial<ProjectCredit>
    ) {
        setForm((previous) => ({
            ...previous,
            creditos: previous.creditos.map((credit, i) =>
                i === index
                    ? { ...credit, ...changes }
                    : credit
            ),
        }));
    }

    function removeCredit(index: number) {
        setForm((previous) => ({
            ...previous,
            creditos: previous.creditos.filter(
                (_, i) => i !== index
            ),
        }));
    }

    function moveCredit(index: number, direction: -1 | 1) {
        setForm((previous) => {
            const creditos = [...previous.creditos];
            const target = index + direction;

            if (target < 0 || target >= creditos.length) {
                return previous;
            }

            [creditos[index], creditos[target]] = [
                creditos[target],
                creditos[index],
            ];

            return { ...previous, creditos };
        });
    }

    function addPerson(creditIndex: number) {
        const credit = form.creditos[creditIndex];

        updateCredit(creditIndex, {
            personas: [...credit.personas, ""],
        });
    }

    function updatePerson(
        creditIndex: number,
        personIndex: number,
        value: string
    ) {
        const credit = form.creditos[creditIndex];
        const personas = [...credit.personas];

        personas[personIndex] = value;

        updateCredit(creditIndex, { personas });
    }

    function removePerson(
        creditIndex: number,
        personIndex: number
    ) {
        const credit = form.creditos[creditIndex];

        updateCredit(creditIndex, {
            personas: credit.personas.filter(
                (_, i) => i !== personIndex
            ),
        });
    }

    // --------------------------------------------------
    // DESAR PROJECTE
    // --------------------------------------------------

    async function handleSave(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!form.titulo.trim()) {
            setMessage("El títol és obligatori.");
            return;
        }

        setSaving(true);
        setMessage("");

        const data = {
            titulo: form.titulo.trim(),
            anyo: form.anyo.trim(),
            para: parseLines(form.para),
            direccion: parseLines(form.direccion),
            produccion: parseLines(form.produccion),
            productora: parseLines(form.productora),
            video: form.video.trim(),
            reel: form.reel.trim(),
            imagenes: form.imagenes
                .map((image) => image.trim())
                .filter(Boolean),
            categoria: form.categoria,
            creditos: form.creditos
                .map((credit) => ({
                    rol: credit.rol.trim(),
                    personas: credit.personas
                        .map((person) => person.trim())
                        .filter(Boolean),
                }))
                .filter(
                    (credit) =>
                        credit.rol ||
                        credit.personas.length > 0
                ),
            selected: form.selected,
        };

        try {
            if (editingProject) {
                await updateDoc(
                    doc(
                        db,
                        "proyectos",
                        editingProject.id
                    ),
                    data
                );
            } else {
                await addDoc(collection(db, "proyectos"), {
                    ...data,
                    orden: projects.length,
                    published: false,
                });
            }

            await loadProjects();

            setIsCreating(false);
            setEditingProject(null);
            setForm(createForm());
            setMessage("Projecte desat correctament.");
        } catch (error) {
            console.error(
                "Error desant el projecte:",
                error
            );

            setMessage(
                "No s'ha pogut desar el projecte. Revisa Firebase."
            );
        } finally {
            setSaving(false);
        }
    }

    // --------------------------------------------------
    // ELIMINAR PROJECTE
    // --------------------------------------------------

    async function handleDelete(project: AdminProject) {
        const confirmed = window.confirm(
            `Vols eliminar definitivament "${project.titulo}"?`
        );

        if (!confirmed) return;

        try {
            await deleteDoc(
                doc(db, "proyectos", project.id)
            );

            setProjects((previous) =>
                previous.filter(
                    (item) => item.id !== project.id
                )
            );

            setMessage("Projecte eliminat.");
        } catch (error) {
            console.error(
                "Error eliminant el projecte:",
                error
            );

            setMessage("No s'ha pogut eliminar el projecte.");
        }
    }

    const visibleProjects = projects.filter((project) =>
        toArray(project.categoria).some(
            (category) =>
                normalizeCategory(category) === activeCategory
        )
    );

    // --------------------------------------------------
    // ESTILS
    // --------------------------------------------------

    const inputClass =
        "w-full bg-transparent border border-white/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white";

    const labelClass =
        "mb-2 block text-xs uppercase tracking-wider text-white/60";

    const buttonClass =
        "border border-white/30 px-3 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-white hover:text-black disabled:opacity-40";






    const toggleHomeProject = async (project: AdminProject) => {
        const isSelected = project.selected === true;

        // Si ya está seleccionado, lo quitamos de la Home.
        if (isSelected) {
            await updateDoc(doc(db, "proyectos", project.id), {
                selected: false,
            });

            setProjects((prev) =>
                prev.map((item) =>
                    item.id === project.id
                        ? { ...item, selected: false }
                        : item
                )
            );

            return;
        }

        // Si no está seleccionado, lo añadimos sin límite.
        const selectedProjects = projects
            .filter((item) => item.selected === true)
            .sort(
                (a, b) =>
                    Number(a.homeOrder ?? 9999) -
                    Number(b.homeOrder ?? 9999)
            );

        const nextOrder = selectedProjects.length;

        await updateDoc(doc(db, "proyectos", project.id), {
            selected: true,
            homeOrder: nextOrder,
        });

        setProjects((prev) =>
            prev.map((item) =>
                item.id === project.id
                    ? {
                        ...item,
                        selected: true,
                        homeOrder: nextOrder,
                    }
                    : item
            )
        );
    };

    async function moveHomeProject(
        project: AdminProject,
        direction: -1 | 1
    ) {
        const selectedProjects = projects
            .filter((item) => item.selected)
            .sort(
                (a, b) =>
                    Number(a.homeOrder ?? 9999) -
                    Number(b.homeOrder ?? 9999)
            );

        const currentIndex = selectedProjects.findIndex(
            (item) => item.id === project.id
        );

        const targetIndex = currentIndex + direction;

        if (
            currentIndex === -1 ||
            targetIndex < 0 ||
            targetIndex >= selectedProjects.length
        ) {
            return;
        }

        const reorderedProjects = [...selectedProjects];

        [
            reorderedProjects[currentIndex],
            reorderedProjects[targetIndex],
        ] = [
                reorderedProjects[targetIndex],
                reorderedProjects[currentIndex],
            ];

        setMessage("");

        try {
            await Promise.all(
                reorderedProjects.map((item, index) =>
                    updateDoc(
                        doc(db, "proyectos", item.id),
                        { homeOrder: index }
                    )
                )
            );

            setProjects((previous) =>
                previous.map((item) => {
                    const index = reorderedProjects.findIndex(
                        (ordered) => ordered.id === item.id
                    );

                    return index !== -1
                        ? {
                            ...item,
                            homeOrder: index,
                        }
                        : item;
                })
            );

            setMessage("Ordre de la Home actualitzat.");
        } catch (error) {
            console.error(
                "Error reordenant els projectes:",
                error
            );

            setMessage("No s'ha pogut canviar l'ordre.");

            await loadProjects();
        }
    }




    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <main className="min-h-screen bg-black px-5 py-6 font-overused text-white md:px-10 md:py-8">
            {/* CAPÇALERA */}

            <header className="mb-10">
                <p className="text-xs uppercase tracking-widest text-white/50">
                    MANEL SERRAT SEGOVIA
                </p>

                <h1 className="mt-2 text-2xl">
                    Administració
                </h1>

                <nav className="mt-8 flex flex-wrap gap-6 border-b border-white/20">
                    {(
                        [
                            {
                                id: "projects",
                                label: "Projectes",
                            },
                            {
                                id: "about",
                                label: "About",
                            },
                            {
                                id: "home",
                                label: "Inici",
                            },
                        ] as {
                            id: SectionKey;
                            label: string;
                        }[]
                    ).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setMessage("");
                                setActiveSection(item.id);
                            }}
                            className={`pb-3 text-sm transition-colors ${activeSection === item.id
                                ? "border-b border-white text-white"
                                : "text-white/45 hover:text-white"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* MISSATGES */}

            {message && (
                <div
                    role="status"
                    className="mb-6 flex items-center justify-between gap-4 text-sm text-white/70"
                >
                    <p>{message}</p>

                    <button
                        type="button"
                        onClick={() => setMessage("")}
                        className="text-white/50 hover:text-white"
                        aria-label="Tancar missatge"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ==================================================
                PROJECTES
            ================================================== */}

            {activeSection === "projects" && (
                <section>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg uppercase">
                            Projectes
                        </h2>

                        <button
                            type="button"
                            onClick={openNewProject}
                            className={buttonClass}
                        >
                            + Nou
                        </button>
                    </div>

                    <nav className="mb-8 flex flex-wrap gap-5 border-b border-white/20">
                        {CATEGORY_OPTIONS.map((category) => (
                            <button
                                type="button"
                                key={category.value}
                                onClick={() =>
                                    setActiveCategory(
                                        category.value
                                    )
                                }
                                className={`pb-3 text-sm transition-colors ${activeCategory ===
                                    category.value
                                    ? "border-b border-white text-white"
                                    : "text-white/45 hover:text-white"
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </nav>

                    {loading ? (
                        <p className="text-sm text-white/50">
                            Carregant projectes…
                        </p>
                    ) : visibleProjects.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="mb-4 text-sm text-white/50">
                                No hi ha projectes en aquesta
                                categoria.
                            </p>

                            <button
                                type="button"
                                onClick={openNewProject}
                                className={buttonClass}
                            >
                                Crea el primer projecte
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {visibleProjects.map((project) => (
                                <article key={project.id}>
                                    <div className="relative mb-3 aspect-video overflow-hidden bg-white/5">
                                        {project.imagenes?.[0] ? (
                                            <img
                                                src={
                                                    project.imagenes[0]
                                                }
                                                alt={project.titulo}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-white/40">
                                                Sense imatge
                                            </div>
                                        )}

                                        {project.selected && (
                                            <span className="absolute left-2 top-2 bg-black px-2 py-1 text-[10px] uppercase tracking-wider">
                                                Pàgina d&apos;inici
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm">
                                                {project.titulo ||
                                                    "Sense títol"}
                                            </h3>

                                            <p className="mt-1 text-xs text-white/50">
                                                {project.anyo ||
                                                    "Sense any"}
                                            </p>

                                            <p className="mt-2 text-xs text-white/40">
                                                {toArray(
                                                    project.categoria
                                                )
                                                    .map(
                                                        getCategoryLabel
                                                    )
                                                    .join(" · ")}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 gap-3 text-xs">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditProject(
                                                        project
                                                    )
                                                }
                                                className="text-white/70 hover:text-white"
                                            >
                                                Edita
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleDelete(
                                                        project
                                                    )
                                                }
                                                className="text-white/40 hover:text-red-400"
                                            >
                                                Elimina
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ==================================================
                ABOUT
            ================================================== */}

            {activeSection === "about" && (
                <section className="max-w-3xl">
                    <div className="mb-8">
                        <h2 className="text-lg uppercase">
                            Editar About
                        </h2>

                        <p className="mt-2 text-sm text-white/45">
                            Modifica la descripció i els enllaços
                            de la pàgina About.
                        </p>
                    </div>

                    {aboutLoading ? (
                        <p className="text-sm text-white/50">
                            Carregant About…
                        </p>
                    ) : (
                        <form onSubmit={handleSaveAbout}>
                            <div className="mb-10">
                                <label className={labelClass}>
                                    Descripció
                                </label>

                                <textarea
                                    className={`${inputClass} min-h-40 resize-y`}
                                    value={aboutDescription}
                                    onChange={(event) =>
                                        setAboutDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Escriu la descripció..."
                                    rows={6}
                                />
                            </div>

                            <div className="mb-10">
                                <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/20 pb-3">
                                    <h3 className="text-sm uppercase tracking-wider">
                                        Enllaços
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addAboutLink}
                                        className={buttonClass}
                                    >
                                        + Afegir enllaç
                                    </button>
                                </div>

                                {aboutLinks.length === 0 ? (
                                    <p className="text-sm text-white/40">
                                        Encara no hi ha enllaços.
                                    </p>
                                ) : (
                                    <div className="space-y-5">
                                        {aboutLinks.map(
                                            (link, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-1 gap-3 border-b border-white/10 pb-5 sm:grid-cols-[1fr_2fr_auto]"
                                                >
                                                    <div>
                                                        <label
                                                            className={
                                                                labelClass
                                                            }
                                                        >
                                                            Nom
                                                        </label>

                                                        <input
                                                            className={
                                                                inputClass
                                                            }
                                                            value={
                                                                link.label
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateAboutLink(
                                                                    index,
                                                                    "label",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Instagram"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            className={
                                                                labelClass
                                                            }
                                                        >
                                                            URL
                                                        </label>

                                                        <input
                                                            className={
                                                                inputClass
                                                            }
                                                            type="text"
                                                            value={
                                                                link.url
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateAboutLink(
                                                                    index,
                                                                    "url",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="https://..."
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeAboutLink(
                                                                index
                                                            )
                                                        }
                                                        className="self-end py-2 text-sm text-white/45 hover:text-red-400"
                                                    >
                                                        Elimina
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                <p className="mt-4 text-xs text-white/40">
                                    Per al correu electrònic, utilitza
                                    mailto:correu@exemple.com.
                                </p>
                            </div>

                            <div className="flex justify-end border-t border-white/20 pt-5">
                                <button
                                    type="submit"
                                    disabled={aboutSaving}
                                    className="border border-white bg-white px-8 py-3 text-sm text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                                >
                                    {aboutSaving
                                        ? "Desant..."
                                        : "Desa About"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {/* ==================================================
                INICI
            ================================================== */}


            {activeSection === "home" && (
                <section>
                    <div className="mb-8">
                        <h2 className="text-lg uppercase">
                            Projectes de l'inici
                        </h2>


                        <p className="mt-2 text-sm text-white/45">
                            Selecciona tots els projectes que vulguis destacar
                            a la Home. Cada projecte utilitzarà el seu propi
                            vídeo.
                        </p>

                        <p className="mt-4 text-sm">
                            Seleccionats:{" "}
                            <span className="text-white">
                                {projects.filter((project) => Boolean(project.selected)).length}
                            </span>
                        </p>

                    </div>

                    {loading ? (
                        <p className="text-sm text-white/50">
                            Carregant projectes…
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {projects.map((project) => {
                                const selected = Boolean(project.selected);

                                return (
                                    <article key={project.id}>
                                        <div className="relative mb-3 aspect-video overflow-hidden bg-white/5">
                                            {project.imagenes?.[0] ? (
                                                <img
                                                    src={project.imagenes[0]}
                                                    alt={project.titulo}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-white/40">
                                                    Sense imatge
                                                </div>
                                            )}

                                            {selected && (
                                                <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] uppercase tracking-wider text-black">
                                                    Seleccionat
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm">
                                                    {project.titulo || "Sense títol"}
                                                </h3>

                                                <p className="mt-1 text-xs text-white/50">
                                                    {project.anyo || "Sense any"}
                                                </p>

                                                <p className="mt-2 text-xs text-white/40">
                                                    {project.video
                                                        ? "Vídeo disponible"
                                                        : "Sense URL de vídeo"}
                                                </p>

                                                {selected && (
                                                    <p className="mt-2 text-xs uppercase tracking-wider text-white">
                                                        Posició a la Home:{" "}
                                                        {projects
                                                            .filter((item) => item.selected)
                                                            .sort(
                                                                (a, b) =>
                                                                    Number(a.homeOrder ?? 9999) -
                                                                    Number(b.homeOrder ?? 9999)
                                                            )
                                                            .findIndex((item) => item.id === project.id) + 1}
                                                    </p>
                                                )}
                                            </div>


                                            <div className="flex shrink-0 flex-col items-end gap-2">
                                                {selected && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void moveHomeProject(project, -1)
                                                            }
                                                            disabled={
                                                                projects
                                                                    .filter((item) => item.selected)
                                                                    .sort(
                                                                        (a, b) =>
                                                                            Number(a.homeOrder ?? 9999) -
                                                                            Number(b.homeOrder ?? 9999)
                                                                    )[0]?.id === project.id
                                                            }
                                                            className="border border-white/30 px-3 py-2 text-sm hover:bg-white hover:text-black disabled:opacity-25"
                                                            aria-label="Moure amunt"
                                                            title="Moure amunt"
                                                        >
                                                            ↑
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void moveHomeProject(project, 1)
                                                            }
                                                            disabled={
                                                                projects
                                                                    .filter((item) => item.selected)
                                                                    .sort(
                                                                        (a, b) =>
                                                                            Number(a.homeOrder ?? 9999) -
                                                                            Number(b.homeOrder ?? 9999)
                                                                    )
                                                                    .at(-1)?.id === project.id
                                                            }
                                                            className="border border-white/30 px-3 py-2 text-sm hover:bg-white hover:text-black disabled:opacity-25"
                                                            aria-label="Moure avall"
                                                            title="Moure avall"
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => void toggleHomeProject(project)}
                                                    disabled={
                                                        !selected && !project.video && !project.reel
                                                    }
                                                    className={`border px-3 py-2 text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${selected
                                                        ? "border-white bg-white text-black"
                                                        : "border-white/30 text-white hover:bg-white hover:text-black"
                                                        }`}
                                                >
                                                    {selected ? "Treure" : "Afegir"}
                                                </button>
                                            </div>

                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}


            {/* ==================================================
                EDITOR DE PROJECTE
            ================================================== */}

            {isCreating && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 px-4 py-6 md:px-10 md:py-10">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                                    {editingProject
                                        ? "Editar projecte"
                                        : "Nou projecte"}
                                </p>

                                <h2 className="text-2xl">
                                    {form.titulo || "Sense títol"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditor}
                                aria-label="Tancar"
                                className="group flex h-12 w-12 shrink-0 items-center justify-center"
                            >
                                <span className="flex h-10 w-10 items-center justify-center text-4xl leading-none text-white/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    ×
                                </span>
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            {/* INFORMACIÓ GENERAL */}

                            <section className="mb-10">
                                <h3 className="mb-5 border-b border-white/20 pb-3 text-sm uppercase tracking-wider">
                                    Informació del projecte
                                </h3>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>
                                            Títol *
                                        </label>

                                        <input
                                            className={inputClass}
                                            value={form.titulo}
                                            onChange={(event) =>
                                                updateField(
                                                    "titulo",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Títol del projecte"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Any
                                        </label>

                                        <input
                                            className={inputClass}
                                            value={form.anyo}
                                            onChange={(event) =>
                                                updateField(
                                                    "anyo",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="2026"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            URL del vídeo
                                        </label>

                                        <input
                                            className={inputClass}
                                            type="url"
                                            value={form.video}
                                            onChange={(event) =>
                                                updateField(
                                                    "video",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="https://vimeo.com/..."
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={labelClass}>
                                            Reel
                                        </label>

                                        <input
                                            className={inputClass}
                                            value={form.reel}
                                            onChange={(event) =>
                                                updateField(
                                                    "reel",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="URL o valor del reel"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* CATEGORIES */}

                            <section className="mb-10">
                                <h3 className="mb-5 border-b border-white/20 pb-3 text-sm uppercase tracking-wider">
                                    Categoria
                                </h3>

                                <div className="flex flex-wrap gap-3">
                                    {CATEGORY_OPTIONS.map(
                                        (category) => {
                                            const checked =
                                                form.categoria.some(
                                                    (item) =>
                                                        normalizeCategory(
                                                            item
                                                        ) ===
                                                        category.value
                                                );

                                            return (
                                                <label
                                                    key={
                                                        category.value
                                                    }
                                                    className={`cursor-pointer border px-4 py-2 text-sm transition-colors ${checked
                                                        ? "border-white bg-white text-black"
                                                        : "border-white/25 text-white/60 hover:border-white"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleCategory(
                                                                category.value
                                                            )
                                                        }
                                                    />

                                                    {category.label}
                                                </label>
                                            );
                                        }
                                    )}
                                </div>

                                <p className="mt-3 text-xs text-white/40">
                                    Pots seleccionar més d'una
                                    categoria.
                                </p>
                            </section>

                            {/* PERSONES I EMPRESES */}

                            <section className="mb-10">
                                <h3 className="mb-5 border-b border-white/20 pb-3 text-sm uppercase tracking-wider">
                                    Persones i empreses
                                </h3>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {(
                                        [
                                            ["para", "Per a"],
                                            [
                                                "direccion",
                                                "Direcció",
                                            ],
                                            [
                                                "produccion",
                                                "Producció",
                                            ],
                                            [
                                                "productora",
                                                "Productora",
                                            ],
                                        ] as const
                                    ).map(([field, label]) => (
                                        <div key={field}>
                                            <label
                                                className={labelClass}
                                            >
                                                {label}
                                            </label>

                                            <textarea
                                                className={inputClass}
                                                rows={3}
                                                value={form[field]}
                                                onChange={(event) =>
                                                    updateField(
                                                        field,
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Una entrada per línia"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-3 text-xs text-white/40">
                                    Si hi ha diversos noms, escriu
                                    cadascun en una línia diferent.
                                </p>
                            </section>

                            {/* IMATGES */}

                            <section className="mb-10">
                                <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/20 pb-3">
                                    <h3 className="text-sm uppercase tracking-wider">
                                        Imatges
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addImage}
                                        className={buttonClass}
                                    >
                                        + Afegir imatge
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {form.imagenes.map(
                                        (image, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="flex w-16 shrink-0 flex-col gap-1">
                                                    <div className="flex aspect-video items-center justify-center overflow-hidden bg-white/5">
                                                        {image ? (
                                                            <img
                                                                src={image}
                                                                alt={`Imatge ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-white/30">
                                                                {index +
                                                                    1}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                0
                                                            }
                                                            onClick={() =>
                                                                moveImage(
                                                                    index,
                                                                    -1
                                                                )
                                                            }
                                                            className="text-xs text-white/60 disabled:opacity-20"
                                                            aria-label="Moure imatge amunt"
                                                        >
                                                            ↑
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                form
                                                                    .imagenes
                                                                    .length -
                                                                1
                                                            }
                                                            onClick={() =>
                                                                moveImage(
                                                                    index,
                                                                    1
                                                                )
                                                            }
                                                            className="text-xs text-white/60 disabled:opacity-20"
                                                            aria-label="Moure imatge avall"
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <label
                                                        className={
                                                            labelClass
                                                        }
                                                    >
                                                        Imatge{" "}
                                                        {index + 1} · URL
                                                    </label>

                                                    <input
                                                        className={
                                                            inputClass
                                                        }
                                                        type="url"
                                                        value={image}
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateImage(
                                                                index,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="https://..."
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(
                                                            index
                                                        )
                                                    }
                                                    className="mt-7 px-2 text-lg text-white/40 hover:text-red-400"
                                                    aria-label="Eliminar imatge"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>

                                <p className="mt-4 text-xs text-white/40">
                                    La primera imatge serà la portada
                                    del projecte. Enganxa URLs
                                    públiques.
                                </p>
                            </section>

                            {/* CRÈDITS */}

                            <section className="mb-10">
                                <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/20 pb-3">
                                    <h3 className="text-sm uppercase tracking-wider">
                                        Crèdits
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addCredit}
                                        className={buttonClass}
                                    >
                                        + Afegir crèdit
                                    </button>
                                </div>

                                {form.creditos.length === 0 ? (
                                    <p className="text-sm text-white/40">
                                        Encara no hi ha crèdits.
                                    </p>
                                ) : (
                                    <div className="space-y-6">
                                        {form.creditos.map(
                                            (
                                                credit,
                                                creditIndex
                                            ) => (
                                                <div
                                                    key={creditIndex}
                                                    className="border border-white/20 p-4 md:p-5"
                                                >
                                                    <div className="mb-5 flex items-center justify-between gap-3">
                                                        <p className="text-xs uppercase tracking-wider text-white/50">
                                                            Crèdit{" "}
                                                            {creditIndex +
                                                                1}
                                                        </p>

                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    creditIndex ===
                                                                    0
                                                                }
                                                                onClick={() =>
                                                                    moveCredit(
                                                                        creditIndex,
                                                                        -1
                                                                    )
                                                                }
                                                                className="text-sm text-white/60 disabled:opacity-20"
                                                                aria-label="Moure crèdit amunt"
                                                            >
                                                                ↑
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    creditIndex ===
                                                                    form
                                                                        .creditos
                                                                        .length -
                                                                    1
                                                                }
                                                                onClick={() =>
                                                                    moveCredit(
                                                                        creditIndex,
                                                                        1
                                                                    )
                                                                }
                                                                className="text-sm text-white/60 disabled:opacity-20"
                                                                aria-label="Moure crèdit avall"
                                                            >
                                                                ↓
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeCredit(
                                                                        creditIndex
                                                                    )
                                                                }
                                                                className="text-sm text-white/40 hover:text-red-400"
                                                            >
                                                                Elimina
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mb-5">
                                                        <label
                                                            className={
                                                                labelClass
                                                            }
                                                        >
                                                            Rol
                                                        </label>

                                                        <input
                                                            className={
                                                                inputClass
                                                            }
                                                            value={
                                                                credit.rol
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateCredit(
                                                                    creditIndex,
                                                                    {
                                                                        rol: event
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                            placeholder="Direcció, fotografia, muntatge..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="mb-3 flex items-center justify-between gap-3">
                                                            <label className="text-xs uppercase tracking-wider text-white/60">
                                                                Persones
                                                            </label>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addPerson(
                                                                        creditIndex
                                                                    )
                                                                }
                                                                className="text-xs text-white/60 hover:text-white"
                                                            >
                                                                + Persona
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {credit.personas.map(
                                                                (
                                                                    person,
                                                                    personIndex
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            personIndex
                                                                        }
                                                                        className="flex gap-2"
                                                                    >
                                                                        <input
                                                                            className={
                                                                                inputClass
                                                                            }
                                                                            value={
                                                                                person
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                updatePerson(
                                                                                    creditIndex,
                                                                                    personIndex,
                                                                                    event
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            placeholder={`Persona ${personIndex + 1}`}
                                                                        />

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removePerson(
                                                                                    creditIndex,
                                                                                    personIndex
                                                                                )
                                                                            }
                                                                            className="px-2 text-white/40 hover:text-red-400"
                                                                            aria-label="Eliminar persona"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* INICI DEL PROJECTE */}

                            <section className="mb-10">
                                <h3 className="mb-5 border-b border-white/20 pb-3 text-sm uppercase tracking-wider">
                                    Pàgina d&apos;inici
                                </h3>

                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.selected}
                                        onChange={(event) =>
                                            updateField(
                                                "selected",
                                                event.target.checked
                                            )
                                        }
                                        className="mt-1 accent-white"
                                    />

                                    <span>
                                        <span className="block text-sm">
                                            Mostrar a la Home
                                        </span>

                                        <span className="mt-1 block text-xs text-white/40">
                                            Activa aquesta opció perquè
                                            el projecte aparegui a
                                            l&apos;inici.
                                        </span>
                                    </span>
                                </label>
                            </section>

                            {/* ACCIONS */}

                            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 bg-black py-5">
                                <button
                                    type="button"
                                    onClick={closeEditor}
                                    disabled={saving}
                                    className="text-sm text-white/60 hover:text-white disabled:opacity-40"
                                >
                                    Cancel·la
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="border border-white bg-white px-8 py-3 text-sm text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                                >
                                    {saving ? "Desant..." : "Desa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
