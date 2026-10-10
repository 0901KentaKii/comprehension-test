import { design02 } from "./Design02";
import { design03 } from "./Design03";
import type { DesignKit } from "./types";

export const designs: DesignKit[] = [design02, design03];

export const findDesign = (id: number) => designs.find((d) => d.id === id);
