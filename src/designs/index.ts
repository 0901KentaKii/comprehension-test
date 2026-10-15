import { design02 } from "./Design02";
import type { DesignKit } from "./types";

export const designs: DesignKit[] = [design02];

export const findDesign = (id: number) => designs.find((d) => d.id === id);
