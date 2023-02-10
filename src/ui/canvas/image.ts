import CacheManager from "cache/node-cache"
import { Image, createCanvas, loadImage } from "canvas"
import { logger } from "logger"

export function loadImages(urls: string[]) {
  return urls.reduce(async (acc: { [key: string]: any }, cur) => {
    return {
      ...acc,
      ...(!acc[cur] ? { [cur]: await loadImage(cur) } : {}),
    }
  }, {})
}

export async function loadAndCacheImage(
  imageUrl: string,
  w: number,
  h: number,
  ttl?: number
): Promise<Image | null> {
  if (!imageUrl) return null
  const base64Str = await CacheManager.get({
    pool: "imagepool",
    key: `img-${imageUrl.trim()}`,
    call: async () => {
      try {
        const img = await loadImage(imageUrl, { format: "webp" })
        const imgCanvas = createCanvas(w, h)
        const imgCtx = imgCanvas.getContext("2d")
        imgCtx.drawImage(img, 0, 0, w, h)
        return imgCanvas.toDataURL("image/png")
      } catch (e) {
        logger.error(`[loadAndCacheImage] failed: ${e}`)
      }
    },
    ttl: ttl ?? 86400,
  })
  return base64Str ? await loadImage(base64Str) : null
}
