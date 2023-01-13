import { Image, createCanvas, loadImage } from "canvas"
import CacheManager from "cache/node-cache"

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
): Promise<Image> {
  const base64Str = await CacheManager.get({
    pool: "imagepool",
    key: `img-${imageUrl.trim()}`,
    call: async () => {
      const img = await loadImage(imageUrl)
      const imgCanvas = createCanvas(w, h)
      const imgCtx = imgCanvas.getContext("2d")
      imgCtx.drawImage(img, 0, 0, w, h)
      return imgCanvas.toDataURL("image/png")
    },
    ttl: ttl ?? 86400,
  })
  return await loadImage(base64Str)
}
