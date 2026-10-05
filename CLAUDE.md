# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rejseappen er en dansksproget PWA til at planlægge og dokumentere rejser: opret en rejse, planlæg den dag for dag med transportsegmenter, tag billeder undervejs, og få til sidst en animeret opsummering af hele turen på et kort.

## Arkitektur og kodestandard

Gælder hele projektet, ikke kun ved aflevering.

- **Modulær opbygning pr. feature** under `src/features/`: `trips`, `days`, `segments`, `stays`, `friends`, `photos`, `tracking`, `summary`, `auth`. Hver feature har sine egne `components/`, `hooks/`, `types.ts`, `repository.ts` og evt. `logic/`.
- **Firestore-kald isoleres i et datalag.** Kun `repository.ts`-filer i hver feature kalder Firestore direkte. UI-komponenter rører aldrig Firestore — de bruger kun hooks, som bruger repository-funktioner.
- **Fælles kode** i `src/shared/`: `ui/` (generiske komponenter), `hooks/`, `utils/`, `types/`. Noget flyttes hertil, når det bruges af mere end én feature — ikke før.
- **Filstørrelse:** ingen fil over ca. 200-300 linjer. Del op i stedet for at lade den vokse. Én komponent pr. fil, navngivet som filen.
- **Ren forretningslogik** (parsing af rejseplaner, afstandsberegning, EXIF-mapping, rute-interpolation) skrives som rene funktioner uden React, i `logic/`-mapper, og dækkes af unit-tests med Vitest (`*.test.ts` samme sted som funktionen).
- **Streng TypeScript.** Ingen `any`. Delte typer ligger ét sted (`src/shared/types/`), feature-specifikke typer i feature'ens egen `types.ts`.
- **ESLint + Prettier** er sat op fra første commit — kør `npm run lint` og `npm run format` før commit.
- **Ingen duplikeret kode** — træk fælles logik ud i `src/shared/` når den opstår anden gang.
- **Ingen inline `style="..."`** i JSX/HTML, undtagen hvor et element bevidst starter som `display:none` og JS viser det igen. Al styling er CSS Modules (`Komponent.module.css`) samme sted som komponenten.
- **Commit efter hvert færdigt trin** med beskrivende beskeder.

## Sprog (dansk/engelsk)

Hele appen findes på dansk og engelsk (sprogvælgeren "DA | EN" øverst på forsiden, rejsesiden, login og privatlivs-dialogen — det aktive sprog er fremhævet; en knap med navnet på det *andet* sprog blev misforstået som det aktuelle). **Stående regel:** al ny brugervendt tekst skal i både `da` og `en` — aldrig hardcodes i JSX/TS, heller ikke midlertidigt.

- Teksterne ligger i `src/shared/i18n/texts/<område>.ts` (`common`, `auth`, `trips`, `days`, `segments`, `stays`, `tracking`, `summary`), oprettet med `defineTexts({ da, en })` — TypeScript fejler, hvis en nøgle mangler på det ene sprog, og en test tjekker, at `{pladsholdere}` er ens. Nyt område tilføjes i `texts/index.ts`.
- I komponenter: `const { t, locale } = useT()` og `t('område.nøgle', { param })`. Komponenten gentegnes selv ved sprogskift (`useSyncExternalStore`). `t` er samme funktion pr. sprog, så den kan stå i en effekt-afhængighedsliste.
- **Datoer og tal** formateres med `locale` (`formatDayDate(dato, locale)`, `formatKm(km, locale)`, `toLocaleString(locale, …)`) — aldrig hardcodet `'da-DK'` i UI.
- **Fejl og beskeder i hooks** gemmes som tekst-nøgle (`TextKey`) eller `Message` (`{ key, params }` fra `shared/i18n/message.ts`) — ikke som færdig tekst — så de vises på det aktuelle sprog, også efter et skift. Fejl, der skal vises til brugeren, kastes som `TextError(key, params)`; `errorMessage(err, fallbackKey)` omsætter en fanget fejl til en `Message`.
- **Rene funktioner**, der danner tekst (`describeSegment`, `formatCountdown`), tager `t: Translate` som parameter; tests bruger `translatorFor('da')`.
- Sproget gemmes i localStorage `rejseappen_lang` (kun på enheden, standard dansk) og sætter `<html lang>`. Nominatim-stedsøgning bruger samme sprog (`accept-language`), så stednavne kommer på det valgte sprog.
- Cloud Function'ens egne fejlbeskeder er på dansk og vises ikke direkte — `api/flightLookup.ts` oversætter ud fra fejlkoden.
- Brugerens egne data (rejsenavne, noter, stednavne) oversættes ikke.

## Datalag-mønster

Hver feature med Firestore-data har en `repository.ts` med rene, testbare funktioner (én pr. operation), f.eks. `createTrip(data)`, `subscribeToTrips(uid, callback)`. Hooks (`useTrips.ts`) wrapper repository-funktionerne i React state/effects. Komponenter kalder kun hooks.

**Vigtigt om Firestore security rules og subcollections:** brug IKKE `get()` på et parent-dokument i en regel, der også skal understøtte `list`/query-kald på en subcollection — det fejler i praksis, ikke kun for ufiltrerede queries (lærdom fra søsterprojektet "3D bueskydning"). Denormaliser i stedet adgangsfeltet (`memberUids`, se næste afsnit) direkte på hvert subcollection-dokument (days, segments, photos, track), og skriv reglen som et direkte match mod `resource.data.memberUids` / `request.resource.data.memberUids`.

**Vigtigt om `list`-queries generelt:** selv med et direkte `resource.data`-match (ingen `get()`) afviser Firestore hele queryet med `permission-denied`, hvis selve queryet ikke også har et `where(...)`-filter, der matcher reglen — Firestore kan ikke bevise sikkerheden for et list-kald ud fra reglen alene, den skal kunne se det i selve queryets `where`-klausuler. Enhver `subscribeToX`/`getX`-liste-funktion i et repository skal derfor altid inkludere det matchende `where`-filter (`where('memberUids', 'array-contains', uid)`), og der skal være et tilsvarende composite index i `firestore.indexes.json` for `(memberUids arrayConfig CONTAINS, <sorteringsfelt>)`.

## Deling med rejsefæller (medlemsmodel)

En rejse er ikke længere kun ejerens — flere kan rejse sammen og se/redigere det hele.

- **`memberUids: string[]`** på `trips/{tripId}` er det egentlige adgangsfelt (afløser den tidligere rene `ownerUid`-baserede regel). Alle i `memberUids` kan læse og redigere rejsens dage/segmenter fuldt ud ("indtaste osv"). `ownerUid` findes stadig, men betyder nu kun "hvem oprettede rejsen / har admin-rettigheder" (kan invitere/fjerne medlemmer, ændre `sharedCategories`, slette rejsen) — ikke længere den eneste adgangsbetingelse.
- **Denormalisering:** `memberUids` kopieres ned på hvert `days`- og `segments`-dokument (samme mønster som `ownerUid` tidligere), fordi list-queries kræver et matchende `where`-filter (se ovenfor). Når rejsens medlemslise ændres, skal `memberUids` derfor **cascade-opdateres** på alle eksisterende days/segments i samme omgang — se `updateTripMembers` i `trips/repository.ts` (henter alle dage+segmenter og batch-opdaterer). Dette er client-side (Cloud Functions bruges kun til flyopslag, se nedenfor), så det antager at en rejses samlede antal days+segments holder sig et godt stykke under Firestores batch-grænse på 500 skrivninger — realistisk for en rejseapp, men værd at huske hvis banen for hvad "en rejse" kan indeholde ændrer sig markant.
- **`ownerUid` på days/segments** er nu kun informativ ("hvem oprettede denne dag/dette segment") — sættes til den aktuelt loggede ind bruger (via `useAuthUser()` i komponenten, IKKE trippens ejer), ikke til sikkerhedsformål.
- **`sharedCategories: { photos: boolean; track: boolean }`** på trip'en styrer om ikke-ejer-medlemmer kan se billeder/sporing (kategori-niveau, gælder alle medlemmer ens — ikke pr. person). Ejeren ser altid alt. Feltet findes i datamodellen fra denne omgang, men UI til at slå det til/fra tilføjes først når hhv. billeder (trin 6) og sporing (trin 7) er bygget — for at undgå UI for funktioner der endnu ikke findes. Når disse trin bygges: samme cascade-mønster som `memberUids` — denormalisér det relevante flag ned på hvert billede/track-punkt, og opdatér alle eksisterende ved toggle.
- **Venner (`users/{uid}/friends/{friendUid}`):** man vælger hvem en rejse deles med fra sin venneliste, ikke ved at skrive en e-mail hver gang. I "Del rejse" har hver ven "Fjern" (fra vennelisten, med bekræftelse, `ShareFriendRow`); det stopper ikke eksisterende delinger. Rejsefæller, der ikke længere er på vennelisten, vises stadig i dialogen (uden "Fjern"), så delingen kan slås fra. `users/{uid}` er en offentligt læsbar (for alle loggede ind brugere) profil med `{ uid, email }`, oprettet/opdateret automatisk ved login (`useEnsureUserProfile`) — bruges til at slå en e-mail op til et uid, når man tilføjer en ven. Venskaber er ikke-gensidige (du kan tilføje nogen som ven uden deres accept) — bevidst simpelt for MVP.

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

React + TypeScript + Vite. Firebase (Auth, Firestore, Storage, Cloud Functions). MapLibre GL JS til kort (globe-projektion). `exifr` til EXIF-læsning. `@zxing/browser` til stregkoder (lazy-loadet). `react-router-dom` til routing. Ingen Google Maps-afhængighed — stedsøgning sker via Nominatim (OpenStreetMap).

## Flyopslag og boardingkort

- **Cloud Function `lookupFlight`** (`functions/`, region `europe-west1`, Node 22): flynummer + dato → lufthavne (med koordinater), lokale tider, terminal, via AeroDataBox på RapidAPI. Nøglen er en Firebase-secret (`AERODATABOX_API_KEY`) — aldrig i appen eller git. Kun loggede-ind brugere kan kalde den. Ren mapping i `functions/src/flightInfo.ts` (testes af root-vitest). `FlightInfo`-typen er spejlet i `src/features/segments/api/flightLookup.ts` — hold dem ens.
- Deploy: `firebase deploy --only functions` (predeploy bygger `functions/lib`). Secret sættes én gang med `firebase functions:secrets:set AERODATABOX_API_KEY`.
- **"Hent flyoplysninger"** i fly-segmentets formular udfylder felterne (gemmes først ved Gem).
- **"Scan boardingkort"** (Billetter & tider): foto/skærmbillede → stregkode (`barcode.ts`: browserens BarcodeDetector, ellers ZXing) → `parseBoardingPass` (IATA BCBP, faste feltpositioner; året mangler i stregkoden og vælges tættest på rejsen) → `planBoardingPass` finder dag og evt. eksisterende fly med samme nummer (opdateres i stedet for dublet) → flyopslag for resten. Fejler opslaget, gemmes boardingkortets egne data alligevel.
- **Selve boardingkortet gemmes** som billede i Storage (`trips/{tripId}/{uid}/boardingkort-{uuid}`, samme regel som billeder) og kobles til flyet i `boardingPasses` — én pr. passager (`withBoardingPass`: rejsefællers bevares, samme passager scannet igen erstattes og den gamle fil slettes). "Vis boardingkort" står under flyet i Billetter & tider og i flyets formular (hvor det også kan fjernes). `BoardingPassViewer` viser det i fuld skærm på hvidt og holder skærmen tændt (`shared/hooks/useWakeLock`). **En web-app kan ikke styre skærmens lysstyrke** (intet web-API til det) — brugeren må selv skrue op; det står i visningen.

## Privatlivspolitik

- Politikken er en statisk side, `public/privatliv.html`, med en engelsk oversættelse i `public/privacy.html` (begge læsbare uden login; service workeren må ikke erstatte dem med appen — se `navigateFallbackDenylist` i vite.config.ts). Den engelske siger, at den danske gælder ved uoverensstemmelse. Appen linker til den på det valgte sprog (`usePrivacyUrl`).
- Accept gemmes på brugerens profil `users/{uid}` som `privacyAcceptedVersion` + `privacyAcceptedAt` (`features/auth/repository.ts`). Ved oprettelse kræves et hak; eksisterende brugere uden gældende accept får `PrivacyGate` i stedet for appen (i `RequireAuth`), som kun kan accepteres eller logges ud af. En læsefejl låser ikke brugeren ude.
- **Ændres politikken væsentligt:** opdatér teksten og "Sidst opdateret" i privatliv.html OG privacy.html OG `PRIVACY_VERSION` i `features/auth/privacyVersion.ts` — så bliver alle bedt om at acceptere igen. Samme model som i søsterprojektet "3D bueskydning".
- Tilføjes nye slags persondata eller nye eksterne tjenester (som AeroDataBox, Nominatim), skal politikken opdateres tilsvarende.

## Firebase-projekt

- Projekt: `rejseappen-b2f3f` (Firebase Console)
- Firestore-region: `eur3` (multi-region Europa) — kan ikke ændres efter oprettelse
- Auth-metode: e-mail/adgangskode
- Firebase-config ligger i `.env` (aldrig committet) — se `.env.example` for de nødvendige variabelnavne. `src/firebase/config.ts` læser dem via `import.meta.env`.

## Datamodel (Firestore)

```
users/{uid}
  uid, email, displayName? (selvvalgt navn, vises for rejsefæller)

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
  boardingPasses?: { storagePath, passengerName, ownerUid }[],
  travelerUids?: string[] (hvem der rejser med; mangler = ownerUid),
  ownerUid (kun informativ), memberUids: string[]

trips/{tripId}/stays/{stayId}
  name, place?: Place, checkInDate, checkInTime? (HH:mm), checkOutDate, checkOutTime?,
  bookingRef?, accessCode?, wifi?, hostPhone?, note?,
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

`features/tracking`: løbende GPS-sporing (`watchPosition` i `useGpsTracking`) + manuelt check-in (aktuel position eller søgt sted). Ikke hver GPS-måling gemmes — `shouldRecordPoint` gemmer ved ≥100 m bevægelse eller ≥15 min stilstand og kasserer målinger med usikkerhed >50 m. Efter start gemmes intet før GPS'en er "varmet op" (`isGpsStable`: mindst 20 s, og 3 målinger i træk uden urealistiske spring >70 m/s) — telefoner giver ofte en grov mast-baseret første position, der kan ligge mange km forkert (set i praksis: ~25 km i Frøbjerg). `maximumAge: 0`, så en gammel cachet position aldrig bruges. "Check ind her" afviser positioner med usikkerhed >100 m. Sporingen kører kun mens appen er åben i forgrunden (browsere giver ikke PWA'er baggrunds-GPS); Wake Lock holder skærmen tændt imens. Kortet tegner én grøn linje pr. person (`groupTrackLines`) og check-ins som grønne nåle. `source: 'foto'` bruges ikke — opsummeringen læser billeder direkte fra `photos`.

**GPX-import** (`GpxImport` i sporings-boksen): spor fra ur/Strava importeres som GPX-fil — praktisk, fordi telefonens egen sporing kræver tændt skærm. `parseGpx` (regex, ikke DOMParser, så den kan unit-testes) → sortér → `thinTrack` (~ét punkt pr. 50 m, maks. 1000 punkter) → gemmes med `source: 'import'`, fælles `importId` og sporets navn som `label`. `isRouteSource()` afgør hvilke kilder der tegnes som linje; `groupTrackLines` laver én linje pr. person _og_ pr. import. Et importeret spor slettes samlet ud fra de allerede indlæste punkt-id'er (ingen ekstra query/index). Import skrives i batches af 20, fordi track-skrivereglen bruger `get()` og Firestore kun tillader 20 `get()`-kald pr. batch.

**Vigtigt om MapLibres web worker:** MapLibre 6 finder som standard sin worker som `./maplibre-gl-worker.mjs` ved siden af sin egen fil. I produktions-buildet findes den fil ikke (Firebase svarer med index.html), så workeren fejler — og uden worker tegnes **ingen GeoJSON-lag** (spor, prikker, rute-linje), mens raster-fliser og DOM-markører (check-in-nåle, destinationer) virker fint. Det gav i lang tid indtryk af, at GPS-punkter "ikke blev vist". Løst i `shared/map/configureMapLibre.ts` med `setWorkerUrl()` + Vites `?worker&url` (og `worker.format: 'es'` i vite.config.ts). Importér den fil i alt, der opretter et MapLibre-kort. Symptom hvis det brydes igen: "Worker failed to load" i konsollen.

**Opdatering af appen (service worker):** registreres i `shared/pwa/registerServiceWorker.ts` via `virtual:pwa-register` (`injectRegister: false` i vite.config.ts). **Kræver `skipWaiting: true` + `clientsClaim: true` i workbox-config** — vite-plugin-pwa 1.3 sætter dem ikke selv, og uden dem venter en ny service worker, til alle faner er lukket (et almindeligt genindlæs er ikke nok). I `autoUpdate`-tilstand genindlæser siden sig selv én gang, når en ny version er aktiv, og der tjekkes for ny version ved opstart og når appen bliver synlig igen (ikke med fast interval, så man ikke mister noget, man er ved at skrive). Tidligere blev standard-`registerSW.js` brugt, som ikke genindlæste — åbne faner kørte så den gamle version og fejlede på lazy-loadede filer, der var slettet. `staleChunk.ts` + `RouteErrorPage` er sikkerhedsnettet, hvis det alligevel sker.

### Rejsesidens faner, dag-farver og billetoversigt

- Rejsesiden har fire faner (`?fane=` i URL'en): **Dage**, **Billetter & tider**, **Kort & spor**, **Afspil** (`?fane=opsummering`). De tre første forbliver monteret og skjules kun med `hidden` — ellers ville en igangværende GPS-sporing stoppe ved faneskift. Afspil monteres kun, mens den er åben (intet at bevare, og animationen skal ikke køre i baggrunden). `TripMap` bruger en ResizeObserver til at tilpasse sig (og udføre en ventende zoom), når dens fane vises igen.
- **Dage foldes sammen:** hver dag er foldet sammen til et resumé (`DaySummary`: rute, transport med afgangstid, nattens overnatning, antal billeder) og foldes ud ved tryk. Ved åbning er kun dagen med dags dato foldet ud (`useExpandedDays`); en dag vist fra kortet foldes også ud. `DayRow` henter selv dagens segmenter og giver dem til både resuméet og `DaySegments`.
- **Forlæng rejsen** (`ExtendTripForm` nederst på Dage-fanen, alle medlemmer): tilføj dage før start og/eller efter slut. `planTripExtension` (ren, testet) giver ny `startDate`/`days`, nye dage og nye dagnumre til eksisterende dage — dagnummer regnes altid ud fra datoen, så dag 1 er den nye første dag. `extendTrip` i `trips/repository.ts` skriver det hele i én batch. Billeder/segmenter peger på `dayId`/dato, så de flytter ikke. Ingen regelændring var nødvendig (medlemmer må allerede ændre `startDate`/`days` og oprette dage).
- **Slet dag** (`DeleteDayButton` i en udfoldet dag): kun rejsens første og sidste dag, og kun vist for ejeren (reglerne håndhæver det ikke — medlemmer må i forvejen slette dage/segmenter). En dag midt i rejsen kan ikke slettes, fordi dagene er en ubrudt datorække (hul i datoerne eller forskudte datoer på transport ville være værre end en tom dag). `planDayRemoval` (ren, testet) + `removeTripDay` sletter dagen og dens segmenter, retter `startDate`/`days` og omnummererer i én batch; egne boardingkort-filer slettes bagefter. Billeder beholder deres `dayId` — `TripDetailPage` viser billeder, hvis dag ikke findes længere, under "Billeder uden dag".
- **Flere ture pr. dag:** en dag kan have mange transport-segmenter, hver med eget Fra/Til (dagens egne Fra/Til er dagens start og slut). `buildLegs` (segments/logic/legs.ts, ren, testet) gør segmenter med både Fra og Til til "ture", sorteret efter afgangstid, hvis alle dagens ture har en, ellers oprettelsesrækkefølgen. "Kort & spor" tegner dem som lilla linjer (`legLines` i `TripMap`), og i "Afspil" bruger `buildJourney` `dayRoute` (dagens Fra → turene → dagens Til) for dage uden spor/billeder. `useTripSegments` memoiserer `entries` — ellers ville afspilningen regnes forfra ved hver gentegning.
- **Dag-farver:** paletten ligger som `--day-color-0..7` i `index.css`. Sæt `data-day-color={dayColorIndex(dayNumber)}` på et element for at få `--day-color` (ingen inline style). Kortmarkører kan ikke bruge CSS-variabler, så de bruger `resolveDayColor()`.
- **Billetter & tider** (`segments/components/TicketsView`): samler fly/tog/bus/færge fra alle dage i tidsorden (`buildTickets`), med filter pr. transportform og fremhævet næste afgang med nedtælling. `departureTime` kan være fuld dato+tid, kun dato, kun klokkeslæt eller mangle — `buildTickets` normaliserer. Tidspunkter tolkes i telefonens lokale tidszone.

### Opsummering/afspilning (trin 8)

`features/summary`, fanen **Afspil**: nøgletal (dage, km, billeder, check-ins) og en animeret afspilning af rejsen på globus-kortet.

- `buildJourney` samler alt til én tidsordnet række stop: GPS/GPX-punkter, check-ins og billeder med position (tid fra EXIF, ellers middag på billedets dag). Dage uden nogen af delene bidrager med deres planlagte Fra/Til (kl. 9 og 18), så en rejse, der kun er planlagt, også kan afspilles. Rutepunkter tages fra kun én person pr. dag (`pickOneTrackerPerDay`: den med flest punkter), ellers hopper afspilningen mellem to rejsefællers telefoner. Hvad man ser, følger delingsreglerne automatisk, da data kommer fra de samme forespørgsler (`photoViewerUids`/`trackViewerUids`).
- `buildTimeline` lægger stoppene ud som bevægelse + pauser (billede 2,5 s, check-in 1,5 s, planlagt sted 1 s). Et stræks tid vokser med `log(1+km)`, og den samlede bevægelsestid skaleres ind i 15-90 s, så både en weekendtur og en jordomrejse kan ses på rimelig tid. `stateAt` giver position/km/pause til et tidspunkt (rent, testet).
- Lange stræk (fly) tegnes og køres som storcirkel-buer (`greatCircle.ts`), og længdegrader "foldes ud" over datolinjen. Kameraet følger positionen og glider mod en zoom, der passer til strækkets længde (`zoomForLegKm`). Før start og efter slut vises hele rejsen.
- Billeder vises som et kort over kortet under pausen; det næste billede hentes skjult i forvejen. `usePhotoUrl` (photos-featuren) deles med `PhotoThumbnail`.

### Overnatninger (`features/stays`)

En overnatning (hotel, Airbnb …) ligger på rejsen — ikke på en dag — fordi den strækker sig over flere nætter: `trips/{tripId}/stays`, med `memberUids` denormaliseret og cascade-opdateret i `updateTripMembers` som dage/segmenter. Alle medlemmer må læse/rette (samme regel som `days`).

- **Dage:** hver dag har "Tilføj overnatning" (indtjek = dagen, udtjek = næste dag), og `stayEventsForDate` viser dagens udtjek / nat / indtjek. Ved oprettelse tilbydes adressen som dagens "Til".
- **Billetter & tider:** `stayMoments` giver ind- og udtjekning som tidspunkter; `buildTicketTimeline` fletter dem med afgangene (samme sortering), og "Næste" kan derfor også være en indtjekning. Eget filter "Overnatning".
- **Kort:** lilla seng-mærke (`shared/map/stayMarker.ts`) på "Kort & spor" (tryk → indtjekningsdagen) og i "Afspil".
- **Indsæt bekræftelse** (`StayConfirmationPaste` → `parseStayConfirmation`): finder felterne ud fra deres overskrifter på dansk/engelsk (værdien på samme linje eller de næste), `parseLooseDate` forstår "29. sep.", "Sep 29, 2026", "29.09.2026" m.m. og gætter manglende år ud fra dagens dato. Udtjek tager det sidste klokkeslæt i et tidsrum. Adressen slås op med Nominatim (første resultat). Ren heuristik — nye mailformater tilføjes som testcase i `parseStayConfirmation.test.ts`.
- Opdateringer sletter tømte felter med `deleteField()` (i modsætning til segmenter, hvor et tømt felt blot ikke sendes med).
- `place.area` (by, land) kommer fra stedsøgningen og vises via `placeLabel()` — så to steder med samme navn kan skelnes.

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

## Navne og "hvem er med" på delte rejser

- **Navn:** hver bruger kan sætte sit navn på forsiden (`ProfileNameEditor`, gemmes som `displayName` på `users/{uid}`). Uden navn vises første del af e-mailen (`displayNameOf`). Navnene vises også i "Del rejse"-vennelisten.
- **`PeopleProvider`** (friends-featuren) omkranser rejsesiden og henter medlemmernes profiler én gang (`subscribeToProfiles`, `in`-forespørgsler á 30). Komponenter bruger `usePeople()` → `{ selfUid, memberUids, shared, nameOf }`.
- **Transport har `travelerUids`** — hvem der rejser med. Ældre segmenter uden feltet hører til den, der oprettede dem (`travelersOf`), så ingen migrering var nødvendig. Formularen har "Hvem er med?" (`TravelersPicker`, mindst én skal være valgt), og kortene under Dage og i "Billetter & tider" viser navnene (`TravelersTag`: "Dig", "Dig, Lars" eller "Alle") — alt dette kun på delte rejser.
- **"Billetter & tider"** har på delte rejser filteret "Kun mine" / "Alles", og **"Næste" tæller kun ned til ens egne afgange** (og overnatninger), ikke en rejsefælles.
- **Scan boardingkort** sætter passageren på flyet: navnet i stregkoden ("KLAUSEN/BJARNE MR") sammenholdes med rejsefællernes navne (`matchPassenger`, æ/ø/å = AE/OE/AA); passer ingen entydigt, er det den, der scanner. Scannes et fly, som en anden allerede har lagt ind, tilføjes man som rejsende på det.
- Ingen regelændringer: alle medlemmer må i forvejen rette segmenter, og man må skrive sin egen `users/{uid}`.

## Arkiv og sletning af rejser

- **Arkiv:** forsiden har fanerne **Rejser** (i gang/kommende, nærmeste først) og **Arkiv** (overståede, seneste først). En rejse arkiveres automatisk dagen efter sidste rejsedag (`splitTripsByArchive` i `trips/logic/tripArchive.ts`, ud fra `startDate` + `days`) — intet gemmes, og `status`-feltet bruges ikke til det.
- **Slet rejse** (kun ejeren, nederst på fanen Dage, med bekræftelse): `useDeleteTrip` sletter billeder (`deleteTripPhotos`) og spor (`deleteTripTrack`) i batches af 20 (slette-reglen bruger `get()` for andres dokumenter), derefter dage/segmenter/overnatninger og **til sidst** selve rejse-dokumentet, så en afbrudt sletning kan gentages. Storage-filer (billeder, boardingkort) slettes kun for ejerens egne — rejsefællers filer efterlades, da Storage-reglen kun lader uploaderen slette (se ovenfor om Storage).

## Offline (uden forbindelse)

Appen skal kunne åbnes og vise rejsen uden net (på rejsen er det ofte dér, man står):
- **App-filer:** precaches af service workeren (vite-plugin-pwa).
- **Data:** Firestore kører med `persistentLocalCache` (IndexedDB) i `src/firebase/config.ts` — alt, man har set online, kan vises offline. Kun rejser åbnet online efter denne ændring er gemt.
- **Privatlivs-accept** huskes også i localStorage (`usePrivacyConsent`) — ellers venter `RequireAuth` for evigt på serveren offline (tom skærm).
- **Boardingkort/billetter:** `OfflinePasses` på rejsesiden gemmer kopier i Cache Storage (`shared/api/offlineFiles.ts`, nøgle = storagePath); `useStorageUrl` bruger kopien først. Billeder i galleriet og kortfliser er IKKE offline.
- Skrivninger offline sendes, når nettet er tilbage, men formularer der `await`er en skrivning bliver hængende "gemmer…" indtil da.
