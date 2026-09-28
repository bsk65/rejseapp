/**
 * Aflæser en stregkode (boardingkort: PDF417, Aztec eller QR) fra et billede
 * — et foto af et papir-boardingkort eller et skærmbillede af et
 * mobil-boardingkort. Browser-IO, derfor ikke i logic/.
 *
 * Bruger browserens indbyggede BarcodeDetector, hvor den findes (Chrome på
 * Android), og ellers ZXing (@zxing/library), som først hentes, når der er
 * brug for det. ZXing fodres direkte med lysstyrke-værdier fra et canvas —
 * @zxing/browser's egen billed-aflæsning fandt i praksis ikke PDF417-koder,
 * som samme bibliotek aflæste fint på denne måde.
 */

type DetectedBarcode = { rawValue: string }
type BarcodeDetectorLike = { detect: (source: ImageBitmap) => Promise<DetectedBarcode[]> }
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike

const NATIVE_FORMATS = ['pdf417', 'aztec', 'qr_code', 'data_matrix']
/** Store telefonfotos skaleres ned — ZXing bliver meget langsom på 12+ megapixel. */
const MAX_SIDE = 2000

async function detectNatively(bitmap: ImageBitmap): Promise<string | undefined> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector
  if (!Detector) return undefined
  try {
    const results = await new Detector({ formats: NATIVE_FORMATS }).detect(bitmap)
    return results[0]?.rawValue
  } catch {
    // F.eks. et format browseren ikke understøtter — prøv ZXing i stedet.
    return undefined
  }
}

/** Tegner billedet (evt. drejet 90°) på hvid baggrund og returnerer lysstyrken pr. pixel. */
function toLuminance(bitmap: ImageBitmap, rotate: boolean) {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const width = rotate ? h : w
  const height = rotate ? w : h

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return undefined
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  if (rotate) {
    ctx.translate(width, 0)
    ctx.rotate(Math.PI / 2)
  }
  ctx.drawImage(bitmap, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, width, height)
  const luminance = new Uint8ClampedArray(width * height)
  for (let i = 0; i < luminance.length; i++) {
    luminance[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000
  }
  return { luminance, width, height }
}

async function detectWithZxing(bitmap: ImageBitmap): Promise<string | undefined> {
  const zxing = await import('@zxing/library')
  const reader = new zxing.MultiFormatReader()
  reader.setHints(
    new Map<(typeof zxing.DecodeHintType)[keyof typeof zxing.DecodeHintType], unknown>([
      [
        zxing.DecodeHintType.POSSIBLE_FORMATS,
        [
          zxing.BarcodeFormat.PDF_417,
          zxing.BarcodeFormat.AZTEC,
          zxing.BarcodeFormat.QR_CODE,
          zxing.BarcodeFormat.DATA_MATRIX,
        ],
      ],
      [zxing.DecodeHintType.TRY_HARDER, true],
    ]),
  )

  for (const rotate of [false, true]) {
    const image = toLuminance(bitmap, rotate)
    if (!image) return undefined
    const source = new zxing.RGBLuminanceSource(image.luminance, image.width, image.height)
    try {
      return reader.decode(new zxing.BinaryBitmap(new zxing.HybridBinarizer(source))).getText()
    } catch {
      // Ikke fundet i denne retning — prøv den næste.
    }
  }
  return undefined
}

export async function readBarcodeFromImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const text = (await detectNatively(bitmap)) ?? (await detectWithZxing(bitmap))
    if (!text) {
      throw new Error(
        'Kunne ikke finde en stregkode i billedet. Prøv et skarpere billede, hvor hele stregkoden er med.',
      )
    }
    return text
  } finally {
    bitmap.close()
  }
}
