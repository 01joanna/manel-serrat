export type ProjectCredit = {
    rol: string;
    personas: string[];
};

export type Project = {
    id: string;
    titulo: string;
    anyo: number;
    para: string;
    direccion: string[];
    produccion: string[];
    productora: string[];
    categoria: string[];
    video: string;
    imagenes: string[];
    creditos: ProjectCredit[];
};