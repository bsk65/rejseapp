import { describe, expect, it } from 'vitest'
import { parseGpx } from './parseGpx'

const STRAVA_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
 <metadata><time>2026-10-03T08:00:00Z</time></metadata>
 <trk>
  <name>Morgentur i Rom &amp; omegn</name>
  <type>walking</type>
  <trkseg>
   <trkpt lat="41.8902000" lon="12.4922000">
    <ele>25.0</ele>
    <time>2026-10-03T08:00:00Z</time>
   </trkpt>
   <trkpt lon="12.4930000" lat="41.8910000">
    <ele>26.0</ele>
    <time>2026-10-03T08:01:00Z</time>
   </trkpt>
   <trkpt lat="41.8920000" lon="12.4940000"><ele>27.0</ele></trkpt>
  </trkseg>
 </trk>
</gpx>`

describe('parseGpx', () => {
  it('reads track points with time, regardless of attribute order', () => {
    const result = parseGpx(STRAVA_GPX)
    expect(result.fixes).toEqual([
      { lat: 41.8902, lng: 12.4922, timestamp: '2026-10-03T08:00:00.000Z' },
      { lat: 41.891, lng: 12.493, timestamp: '2026-10-03T08:01:00.000Z' },
    ])
  })

  it('counts points without time as skipped', () => {
    expect(parseGpx(STRAVA_GPX).skipped).toBe(1)
  })

  it('reads and decodes the track name', () => {
    expect(parseGpx(STRAVA_GPX).name).toBe('Morgentur i Rom & omegn')
  })

  it('does not mistake the metadata time for a track name', () => {
    const gpx = '<gpx><trk><trkseg><trkpt lat="1" lon="2"/></trkseg></trk></gpx>'
    expect(parseGpx(gpx).name).toBeUndefined()
  })

  it('rejects files that are not GPX', () => {
    expect(() => parseGpx('{"type":"FeatureCollection"}')).toThrow('ikke en GPX-fil')
  })
})
