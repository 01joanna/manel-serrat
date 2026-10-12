
import {
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// --------------------------------------------------
// TIPOS DE CONFIGURACIÓN
// --------------------------------------------------

export type AboutSettings = {
    descripcion: string;
    vimeo: string;
    instagram: string;
    upuntvuit: string;
    web: string;
    email: string;
};

export type IdentitySettings = {
    logo: string;
    favicon: string;
};

export type SeoSettings = {
    titulo: string;
    descripcion: string;
    imagenSocial: string;
};

// --------------------------------------------------
// VALORES INICIALES
// --------------------------------------------------

export const DEFAULT_ABOUT: AboutSettings = {
    descripcion: "",
    vimeo: "",
    instagram: "",
    upuntvuit: "",
    web: "",
    email: "",
};

export const DEFAULT_IDENTITY: IdentitySettings = {
    logo: "/manel.png",
    favicon: "/favicon.ico",
};

export const DEFAULT_SEO: SeoSettings = {
    titulo: "Manel Serrat Segovia",
    descripcion: "",
    imagenSocial: "",
};

// --------------------------------------------------
// DOCUMENTOS DE FIRESTORE
// --------------------------------------------------

export type SettingsSection =
    | "about"
    | "identidad"
    | "seo";

// --------------------------------------------------
// LEER CONFIGURACIÓN
// --------------------------------------------------

export async function getSiteSettings<T>(
    section: SettingsSection
): Promise<T | null> {
    const settingsRef = doc(
        db,
        "configuracion",
        section
    );

    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as T;
}

// --------------------------------------------------
// GUARDAR CONFIGURACIÓN
// --------------------------------------------------

export async function saveSiteSettings<T extends object>(
    section: SettingsSection,
    settings: T
): Promise<void> {
    const settingsRef = doc(
        db,
        "configuracion",
        section
    );

    await setDoc(
        settingsRef,
        settings,
        { merge: true }
    );
}
