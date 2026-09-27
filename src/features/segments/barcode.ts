/**
 * Aflæser en stregkode (boardingkort: PDF417, Aztec eller QR) fra et billede
 * — et foto af et papir-boardingkort eller et skærmbillede af et
 * mobil-boardingkort. Browser-IO, derfor ikke i logic/.
 *
 * Bruger browserens indbyggede BarcodeDetector, hvor den findes (Chrome på
 * Android), og ellers ZXing, som først hentes, når der er brug for det.
 */

type DetectedBarcode = { rawValue: string }
type BarcodeDetectorLike = { detect: (source: ImageBitmap) => Promise<DetectedBarcode[]> }
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike

const FORMATS = ['pdf417', 'aztec', 'qr_code', 'data_matrix']

async function detectNatively(file: File): Promise<string | undefined> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector
  if (!Detector) return undefined
  try {
    const bitmap = await createImageBitmap(file)
    const results = await new Detector({ formats: FORMATS }).detect(bitmap)
    bitmap.close()
    return results[0]?.rawValue
  } catch {
    // F.eks. et format browseren ikke understøtter — prøv ZXing i stedet.
    return undefined
  }
}

async function detectWithZxing(file: File): Promise<string | undefined> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ])
  const hints = new Map<(typeof DecodeHintType)[keyof typeof DecodeHintType], unknown>([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [
        BarcodeFormat.PDF_417,
        BarcodeFormat.AZTEC,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
      ],
    ],
    [DecodeHintType.TRY_HARDER, true],
  ])
  const url = URL.createObjectURL(file)
  try {
    const result = await new BrowserMultiFormatReader(hints).decodeFromImageUrl(url)
    return result.getText()
  } catch {
    return undefined
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function readBarcodeFromImage(file: File): Promise<string> {
  const text = (await detectNatively(file)) ?? (await detectWithZxing(file))
  if (!text) {
    throw new Error(
      'Kunne ikke finde en stregkode i billedet. Prøv et skarpere billede, hvor hele stregkoden er med.',
    )
  }
  return text
}
