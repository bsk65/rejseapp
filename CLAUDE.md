# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rejseappen er en dansksproget PWA til at planlægge og dokumentere rejser: opret en rejse, planlæg den dag for dag med transportsegmenter, tag billeder undervejs, og få til sidst en animeret opsummering af hele turen på et kort.

## Arkitektur og kodestandard

Gælder hele projektet, ikke kun ved aflevering.

- **Modulær opbygning pr. feature** under `src/features/`: `trips`, `days`, `segments`, `friends`, `photos`, `tracking`, `summary`, `auth`. Hver feature har sine egne `components/`, `hooks/`, `types.ts`, `repository.ts` og evt. `logic/`.
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

**Vigtigt om Firestore security rules og subcollections:** brug IKKE `get()` på et parent-dokument i en regel, der også skal understøtte `list`/query-kald på en subcollection — det fejler i praksis, ikke kun for ufiltrerede queries (lærdom fra søsterprojektet "3D bueskydning"). Denormaliser i stedet adgangsfeltet (`memberUids`, se næste afsnit) direkte på hvert subcollection-dokument (days, segments, photos, track), og skriv reglen som et direkte match mod `resource.data.memberUids` / `request.resource.data.memberUids`.

**Vigtigt om `list`-queries generelt:** selv med et direkte `resource.data`-match (ingen `get()`) afviser Firestore hele queryet med `permission-denied`, hvis selve queryet ikke også har et `where(...)`-filter, der matcher reglen — Firestore kan ikke bevise sikkerheden for et list-kald ud fra reglen alene, den skal kunne se det i selve queryets `where`-klausuler. Enhver `subscribeToX`/`getX`-liste-funktion i et repository skal derfor altid inkludere det matchende `where`-filter (`where('memberUids', 'array-contains', uid)`), og der skal være et tilsvarende composite index i `firestore.indexes.json` for `(memberUids arrayConfig CONTAINS, <sorteringsfelt>)`.

## Deling med rejsefæller (medlemsmodel)

En rejse er ikke længere kun ejerens — flere kan rejse sammen og se/redigere det hele.

- **`memberUids: string[]`** på `trips/{tripId}` er det egentlige adgangsfelt (afløser den tidligere rene `ownerUid`-baserede regel). Alle i `memberUids` kan læse og redigere rejsens dage/segmenter fuldt ud ("indtaste osv"). `ownerUid` findes stadig, men betyder nu kun "hvem oprettede rejsen / har admin-rettigheder" (kan invitere/fjerne medlemmer, ændre `sharedCategories`, slette rejsen) — ikke længere den eneste adgangsbetingelse.
- **Denormalisering:** `memberUids` kopieres ned på hvert `days`- og `segments`-dokument (samme mønster som `ownerUid` tidligere), fordi list-queries kræver et matchende `where`-filter (se ovenfor). Når rejsens medlemslise ændres, skal `memberUids` derfor **cascade-opdateres** på alle eksisterende days/segments i samme omgang — se `updateTripMembers` i `trips/repository.ts` (henter alle dage+segmenter og batch-opdaterer). Dette er client-side (ingen Cloud Functions i dette projekt), så det antager at en rejses samlede antal days+segments holder sig et godt stykke under Firestores batch-grænse på 500 skrivninger — realistisk for en rejseapp, men værd at huske hvis banen for hvad "en rejse" kan indeholde ændrer sig markant.
- **`ownerUid` på days/segments** er nu kun informativ ("hvem oprettede denne dag/dette segment") — sættes til den aktuelt loggede ind bruger (via `useAuthUser()` i komponenten, IKKE trippens ejer), ikke til sikkerhedsformål.
- **`sharedCategories: { photos: boolean; track: boolean }`** på trip'en styrer om ikke-ejer-medlemmer kan se billeder/sporing (kategori-niveau, gælder alle medlemmer ens — ikke pr. person). Ejeren ser altid alt. Feltet findes i datamodellen fra denne omgang, men UI til at slå det til/fra tilføjes først når hhv. billeder (trin 6) og sporing (trin 7) er bygget — for at undgå UI for funktioner der endnu ikke findes. Når disse trin bygges: samme cascade-mønster som `memberUids` — denormalisér det relevante flag ned på hvert billede/track-punkt, og opdatér alle eksisterende ved toggle.
- **Venner (`users/{uid}/friends/{friendUid}`):** man vælger hvem en rejse deles med fra sin venneliste, ikke ved at skrive en e-mail hver gang. `users/{uid}` er en offentligt læsbar (for alle loggede ind brugere) profil med `{ uid, email }`, oprettet/opdateret automatisk ved login (`useEnsureUserProfile`) — bruges til at slå en e-mail op til et uid, når man tilføjer en ven. Venskaber er ikke-gensidige (du kan tilføje nogen som ven uden deres accept) — bevidst simpelt for MVP.

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
users/{uid}
  uid, email

users/{uid}/friends/{friendUid}
  uid, email

trips/{tripId}
  title, startDate, days (antal), destinations: Place[],
  ownerUid, memberUids: string[],
  sharedCategories: { photos: boolean, track: boolean },
  status (planlagt|i gang|afsluttet), createdAt

trips/{tripId}/days/{dayId}
  dayNumber, date, fromPlace?: Place, toPlace?: Place, note?,
  ownerUid (kun informativ — se ovenfor), memberUids: string[]

trips/{tripId}/days/{dayId}/segments/{segId}
  mode (fly|tog|bil|bus|færge|gang), status (planlagt|bekræftet),
  carrier?, number?, departurePlace?, departureTime?, terminal?,
  arrivalPlace?, arrivalTime?, seat?, bookingRef?, freeText?,
  ownerUid (kun informativ), memberUids: string[]

trips/{tripId}/photos/{photoId}
  storagePath, takenAt?, location?: LatLng, dayId?, ownerUid (= uploader),
  photoViewerUids: string[] (se "Deling af billeder" nedenfor), uploadedAt

trips/{tripId}/track/{pointId}
  lat, lng, timestamp, source (gps|foto|manuel), label?, ownerUid (= den der blev sporet),
  trackViewerUids: string[] (samme model som photoViewerUids, styret af sharedCategories.track)
```

`Place = { name, lat, lng, placeId }`. Alle bruger-indtastede tidspunkter gemmes som ISO-strenge (ikke Firestore `Timestamp`), så parsing/EXIF/afstandslogik kan testes som rene funktioner. Kun `createdAt` er en Firestore `Timestamp`. `memberUids` er denormaliseret på alle subcollection-dokumenter — se afsnittet om deling ovenfor.

Kun medlemmer (`auth.uid in memberUids`) kan læse/skrive en rejse og alt indhold under den. Kun ejeren kan ændre `memberUids`/`sharedCategories` eller slette rejsen (håndhævet via `diff().affectedKeys()` i reglen, ikke separate rules pr. felt).

### Deling af billeder (photoViewerUids) og Storage-begrænsning

Billeder har deres eget adgangsfelt, `photoViewerUids`, i stedet for det almindelige `memberUids` — beregnet ud fra trippens `sharedCategories.photos`: hvis sat, er det alle `memberUids`; ellers kun `[ownerUid, uploaderUid]` (ejeren og den der uploadede kan altid se deres eget). Se `computeViewerUids` i `src/shared/utils` (deles med sporing). Når `sharedCategories` **eller medlemslisten** ændres, cascade-opdateres `photoViewerUids`/`trackViewerUids` på alle eksisterende billeder og sporingspunkter (`cascadePhotoSharing` / `cascadeTrackSharing`, kaldt fra `useUpdateSharedCategories` i trips-featuren, som del-dialogen altid kalder ved gem). Cascade-queryet filtrerer på `array-contains tripOwnerUid` (ejeren er altid med), da et ufiltreret list-query afvises. Reglerne lader trippens ejer opdatere _kun_ adgangsfeltet på andres dokumenter (`onlyChanges([...])` + `get()` på trippen — tilladt her, fordi det er en enkelt-dokument-skrivning, ikke en list-query).

**Storage håndhæver IKKE dette samme medlemskabstjek.** Det blev forsøgt med et tværgående `firestore.get(/databases/(default)/documents/trips/$(tripId))`-opslag i `storage.rules`, men det fejlede i praksis med `storage/unauthorized` i dette miljø (Firestore ligger i `eur3`, Storage i `eur4` — muligvis relateret, ikke undersøgt til bunds; kan også kræve en Cloud Function eller anden opsætning). Efter aftale med brugeren er Storage-reglen i stedet forenklet til "man skal være logget ind, og kun skrive i sin egen uid-mappe" — den reelle adgangskontrol ligger i Firestores `photoViewerUids`, og et `storagePath` er ikke gættbart uden først at have fået det legitimt derfra. Hvis dette skal strammes op senere, er næste skridt formentlig en Cloud Function der validerer uploads, ikke endnu et forsøg på samme rules-tilgang.

### Sporing (trin 7)

`features/tracking`: løbende GPS-sporing (`watchPosition` i `useGpsTracking`) + manuelt check-in (aktuel position eller søgt sted). Ikke hver GPS-måling gemmes — `shouldRecordPoint` gemmer ved ≥100 m bevægelse eller ≥15 min stilstand og kasserer målinger med usikkerhed >50 m. Efter start gemmes intet før GPS'en er "varmet op" (`isGpsStable`: mindst 20 s, og 3 målinger i træk uden urealistiske spring >70 m/s) — telefoner giver ofte en grov mast-baseret første position, der kan ligge mange km forkert (set i praksis: ~25 km i Frøbjerg). `maximumAge: 0`, så en gammel cachet position aldrig bruges. "Check ind her" afviser positioner med usikkerhed >100 m. Sporingen kører kun mens appen er åben i forgrunden (browsere giver ikke PWA'er baggrunds-GPS); Wake Lock holder skærmen tændt imens. Kortet tegner én grøn linje pr. person (`groupTrackLines`) og check-ins som grønne nåle. `source: 'foto'` er reserveret til opsummeringen (trin 8) og skrives ikke endnu.

**GPX-import** (`GpxImport` i sporings-boksen): spor fra ur/Strava importeres som GPX-fil — praktisk, fordi telefonens egen sporing kræver tændt skærm. `parseGpx` (regex, ikke DOMParser, så den kan unit-testes) → sortér → `thinTrack` (~ét punkt pr. 50 m, maks. 1000 punkter) → gemmes med `source: 'import'`, fælles `importId` og sporets navn som `label`. `isRouteSource()` afgør hvilke kilder der tegnes som linje; `groupTrackLines` laver én linje pr. person _og_ pr. import. Et importeret spor slettes samlet ud fra de allerede indlæste punkt-id'er (ingen ekstra query/index). Import skrives i batches af 20, fordi track-skrivereglen bruger `get()` og Firestore kun tillader 20 `get()`-kald pr. batch.

**Vigtigt om MapLibres web worker:** MapLibre 6 finder som standard sin worker som `./maplibre-gl-worker.mjs` ved siden af sin egen fil. I produktions-buildet findes den fil ikke (Firebase svarer med index.html), så workeren fejler — og uden worker tegnes **ingen GeoJSON-lag** (spor, prikker, rute-linje), mens raster-fliser og DOM-markører (check-in-nåle, destinationer) virker fint. Det gav i lang tid indtryk af, at GPS-punkter "ikke blev vist". Løst i `shared/map/configureMapLibre.ts` med `setWorkerUrl()` + Vites `?worker&url` (og `worker.format: 'es'` i vite.config.ts). Importér den fil i alt, der opretter et MapLibre-kort. Symptom hvis det brydes igen: "Worker failed to load" i konsollen.

### Rejsesidens faner, dag-farver og billetoversigt

- Rejsesiden har tre faner (`?fane=` i URL'en): **Dage**, **Billetter & tider**, **Kort & spor**. Alle faner forbliver monteret og skjules kun med `hidden` — ellers ville en igangværende GPS-sporing stoppe ved faneskift. `TripMap` bruger en ResizeObserver til at tilpasse sig (og udføre en ventende zoom), når dens fane vises igen.
- **Dag-farver:** paletten ligger som `--day-color-0..7` i `index.css`. Sæt `data-day-color={dayColorIndex(dayNumber)}` på et element for at få `--day-color` (ingen inline style). Kortmarkører kan ikke bruge CSS-variabler, så de bruger `resolveDayColor()`.
- **Billetter & tider** (`segments/components/TicketsView`): samler fly/tog/bus/færge fra alle dage i tidsorden (`buildTickets`), med filter pr. transportform og fremhævet næste afgang med nedtælling. `departureTime` kan være fuld dato+tid, kun dato, kun klokkeslæt eller mangle — `buildTickets` normaliserer. Tidspunkter tolkes i telefonens lokale tidszone.

## Byggetrin (status)

1. Projekt + Firebase + auth + opret/vis rejse
2. Kort og destinationer
3. Dage og segmenter
4. Detaljer + paste-parsing af rejseplaner
5. Deling med rejsefæller (venneliste, medlemskab af rejser)
6. Billeder + EXIF
7. Sporing (geolocation + manuelt check-in)
8. Opsummering/afspilning

Appen skal være kørende og brugbar efter hvert trin.
