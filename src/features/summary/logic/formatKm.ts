/** "0,8 km", "12 km", "1.234 km" — én decimal kun under 10 km. */
export function formatKm(km: number): string {
  const digits = km < 10 ? 1 : 0
  return `${km.toLocaleString('da-DK', { minimumFractionDigits: digits, maximumFractionDigits: digits })} km`
}
