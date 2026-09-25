# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rejseappen er en dansksproget PWA til at planlægge og dokumentere rejser: opret en rejse, planlæg den dag for dag med transportsegmenter, tag billeder undervejs, og få til sidst en animeret opsummering af hele turen på et kort.

## Arkitektur og kodestandard

Gælder hele projektet, ikke kun ved aflevering.

- **Modulær opbygning pr. feature** under `src/features/`: `trips`, `days`, `segments`, `photos`, `tracking`, `summary`, `auth`. Hver feature har sine egne `components/`, `hooks/`, `types.ts`, `repository.ts` og evt. `logic/`.
- **Firestore-kald isoleres i et datalag.** Kun `repository.ts`-filer i hver feature kalder Firestore direkte. UI-komponenter rører aldrig Firestore — de bruger kun hooks, som bruger repository-funktioner.
- **Fælles kode** i `src/shared/`: `ui/` (generiske komponenter), `hooks/`, `utils/`, `types/`. Noget flyttes hertil, når det bruges af mere end én feature — ikke før.
- **Filstørrelse:** ingen fil over ca. 200-300 linjer. Del op i stedet for at lade den vokse. Én komponent pr. fil, navngivet som filen.
- **Ren forretningslogik** (parsing af rejseplaner, afstandsberegning, EXIF-mapping, rute-interpolation) skrives som rene funktioner uden React, i `logic/`-mapper, og dækkes af unit-tests med Vitest (`*.test.ts` samme sted som funktionen).
- **Streng TypeScript.** Ingen `any`. Delte typer ligger ét sted (`src/shared/types/`), feature-specifikke typer i feature'ens egen `types.ts`.
- **ESLint + Prettier** er sat op fra første commit — kør `npm run lint` og `npm run format` før commit.
- **Ingen duplikeret kode** — træk fælles logik ud i `src/shared/` når den opstår anden gang.
- **Ingen inline `style="..."`** i JSX/HTML, undtagen hvor et element bevidst starter som `display:none` og JS viser det igen. Al styling er CSS Modules (`Komponent.module.css`) samme sted som komponenten.
- **Commit efter hvert færdigt trin** med beskrivende beskeder.

## Datalag-mønster

Hver feature med Firestore-data har en `repository.ts` med rene, testbare funktioner (én pr. operation), f.eks. `createTrip(data)`, `subscribeToTrips(uid, callback)`. Hooks (`useTrips.ts`) wrapper repository-funktionerne i React state/effects. Komponenter kalder kun hooks.

**Vigtigt om Firestore security rules og subcollections:** brug IKKE `get()` på et parent-dokument i en regel, der også skal understøtte `list`/query-kald på en subcollection — det fejler i praksis, ikke kun for ufiltrerede queries (lærdom fra søsterprojektet "3D bueskydning"). Denormaliser i stedet `ownerUid` direkte på hvert subcollection-dokument (days, segments, photos, track), og skriv reglen som et direkte match mod `resource.data.ownerUid` / `request.resource.data.ownerUid`.

## Kommandoer

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run preview    # Preview af production build
npm run test        # Vitest (rene funktioner i logic/)
npm run lint        # ESLint
npm run format      # Prettier --write
```

## Stack

React + TypeScript + Vite. Firebase (Auth, Firestore, Storage). MapLibre GL JS til kort (globe-projektion). `exifr` til EXIF-læsning. `react-router-dom` til routing. Ingen Google Maps-afhængighed — stedsøgning sker via Nominatim (OpenStreetMap).

## Firebase-projekt

- Projekt: `rejseappen-b2f3f` (Firebase Console)
- Firestore-region: `eur3` (multi-region Europa) — kan ikke ændres efter oprettelse
- Auth-metode: e-mail/adgangskode
- Firebase-config ligger i `.env` (aldrig committet) — se `.env.example` for de nødvendige variabelnavne. `src/firebase/config.ts` læser dem via `import.meta.env`.

## Datamodel (Firestore)

```
trips/{tripId}
  title, startDate, days (antal), destinations: Place[],
  ownerUid, status (planlagt|i gang|afsluttet), createdAt

trips/{tripId}/days/{dayId}
  dayNumber, date, fromPlace?: Place, toPlace?: Place, note?, ownerUid

trips/{tripId}/days/{dayId}/segments/{segId}
  mode (fly|tog|bil|bus|færge|gang), status (planlagt|bekræftet),
  carrier?, number?, departurePlace?, departureTime?,
  arrivalPlace?, arrivalTime?, bookingRef?, freeText?, ownerUid

trips/{tripId}/photos/{photoId}
  storagePath, takenAt?, location?: LatLng, dayId?, ownerUid

trips/{tripId}/track/{pointId}
  lat, lng, timestamp, source (gps|foto|manuel), ownerUid
```

`Place = { name, lat, lng, placeId }`. Alle bruger-indtastede tidspunkter gemmes som ISO-strenge (ikke Firestore `Timestamp`), så parsing/EXIF/afstandslogik kan testes som rene funktioner. Kun `createdAt` er en Firestore `Timestamp`. `ownerUid` er denormaliseret på alle subcollection-dokumenter — se afsnittet om security rules ovenfor.

Kun ejeren (`ownerUid === auth.uid`) kan læse/skrive sine trips og alt indhold under dem. Samme regel gælder Storage (`courses/{uid}/...`-mønster, se `storage.rules`).

## Byggetrin (status)

1. Projekt + Firebase + auth + opret/vis rejse
2. Kort og destinationer
3. Dage og segmenter
4. Detaljer + paste-parsing af rejseplaner
5. Billeder + EXIF
6. Sporing (geolocation + manuelt check-in)
7. Opsummering/afspilning

Appen skal være kørende og brugbar efter hvert trin.
