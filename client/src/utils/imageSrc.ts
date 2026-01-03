// client/src/utils/imageSrc.ts

import type { StaticImageData } from "next/image";


export type ImgLike = string | StaticImageData | null | undefined;

export function toImgSrc(src: ImgLike): string {
    if (!src) return "";
    return typeof src === "string" ? src : src.src;
}
