import {SERVER_HOST} from "../config/global_constants"

// Resolves DB image values to browser-safe src values across local/public and uploaded images.
export const resolveImageSrc = (imageValue) => {
    const normalizedImageValue = String(imageValue || "").trim()
    if (!normalizedImageValue) return ""

    if (/^(https?:)?\/\//i.test(normalizedImageValue) || normalizedImageValue.startsWith(`data:`)) {
        return normalizedImageValue
    }

    if (normalizedImageValue.startsWith(`/uploads/`)) {
        return `${SERVER_HOST}${normalizedImageValue}`
    }

    return normalizedImageValue
}
