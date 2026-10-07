export type ProjectCredit = {
    rol: string;
    personas: string[];
};

export type Project = {
    id: string;
    titulo: string;
    anyo?: string | number;
    para?: string | string[];
    direccion?: string | string[];
    produccion?: string | string[];
    productora?: string | string[];
    categoria?: string | string[];
    video: string;
    imagenes?: string[];
    creditos?: ProjectCredit[] | Record<string, any>[];
    selected?: boolean;
    reel?: string;
}