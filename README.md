# POWER Battleship – Halden mot Ski

Dette er en **GitHub-basert** Battleship Tracker uten Supabase, Firebase eller andre databaser.

## Hvordan det fungerer

- **Tilskuere:** Alle kan åpne den offentlige GitHub Pages-nettsiden uten innlogging. Brettene oppdateres automatisk hvert 30. sekund fra `data/game.json` på GitHub. Dette er ikke øyeblikkelig sanntid: GitHub sin mellomlagring kan gi noe ekstra forsinkelse.
- **Redaktør:** Bare GitHub-brukeren `zachariassl19` kan logge inn i redigeringsmodus. Endringer sendes til GitHub Contents API og lagres som commits i `data/game.json`.
- **Halden sine skjulte skip:** Krypteres lokalt med **AES-256-GCM** og PBKDF2-SHA256 (600 000 runder) før de synkroniseres som kryptert fil på GitHub. Selve koordinatene publiseres aldri i klartekst. PC og mobil kan åpne dem med det **samme hemmelige passordet**.
- **Ski-brettet:** Haldens skudd mot Ski. **Halden-brettet:** Skis skudd mot Halden.
- **Flåte:** 9 skip, totalt 29 ruter, A–L og 1–10. Senkede skip registreres separat fra senkede ruter, slik at opptellingen blir riktig.
- Gammelt Battleship ligger fortsatt i Git-historikken. Gamle skudd importeres ikke i den nye konkurransen.

## Publisering med GitHub Pages

1. Gå til repository **Settings → Pages**.
2. Velg **Deploy from a branch → main → / (root)**, og lagre.
3. Den offentlige adressen vil normalt være `https://zachariassl19.github.io/battleship-tracker/`. Kontroller at GitHub Pages viser at siden er publisert før lenken deles.

Hvis Pages allerede er satt opp, skal det være nok å slå sammen endringene til `main`.

## Bare eieren kan redigere

1. Gå til `https://github.com/settings/personal-access-tokens/new`.
2. Opprett en **fine-grained token** knyttet til din egen GitHub-bruker.
3. Velg **Only select repositories** og kun **battleship-tracker**.
4. Gi **Repository permissions → Contents → Read and write**. Velg kort utløpstid.
5. Åpne nettsiden → **Rediger** → lim inn nøkkelen der. Del **aldri** nøkkelen med ChatGPT eller andre.
6. På **din private PC eller mobil** kan du krysse av **Husk meg og skipskart-passordet på denne enheten**. Innloggingen gjenopprettes automatisk når nettsiden åpnes igjen. Velg dette bare på enhetene du selv kontrollerer.
7. **Logg ut** sletter lagrede innloggingsopplysninger på akkurat denne enheten. En utgått GitHub-token må erstattes.

GitHub tar seg av den reelle tilgangskontrollen ved hver publisering. Å kjenne nettsidens adresse gir ikke rett til å redigere.

## PC og mobil: hemmelig skipskart på begge enheter

1. Åpne Battleship på PC, klikk **Rediger** og lim inn en begrenset GitHub-token som tilhører `zachariassl19` og kan oppdatere repository-innhold.
2. Når **Hemmelig skipskart** dukker opp første gang, lag **ditt eget passord på minst 12 tegn**, eller klikk **Generer automatisk** hvis du vil. Bruk en sterk og unik passfrase, helst 16 tegn eller mer. Lagre den i en passordbehandler. Trykk **Lås opp / start synkronisering**.
3. Plasser Halden-skip under **Halden → Plasser Halden-skip**. Hver endring blir kryptert lokalt og lagret i `data/halden-ships.enc.json` på GitHub.
4. Åpne Battleship på mobilen, logg inn med GitHub-token og bruk **det samme hemmelige skipskart-passordet**. Kartet dekrypteres på mobilen og kan redigeres der også.
5. Hvis begge enheter står åpne, henter appen nye plasseringer automatisk omtrent hvert 30. sekund. Hvis en annen enhet endret kartet i mellomtiden blir en foreldet redigering avvist i stedet for å overskrive.

**Sikkerhet:** Skipskartpassordet sendes ikke til GitHub. Kryptert skipskartdata ligger i et **offentlig** repository, så unngå passord som kan gjettes selv om de har minst 12 tegn. Når **Husk meg** er av, beholdes GitHub-token og skipskartpassord bare i fanens minne. Når **Husk meg** er på, lagres begge lokalt på valgt enhet i en kryptert IndexedDB-post med en ikke-eksporterbar lokal AES-nøkkel. Siden nøkkelen ligger i den samme nettleseren, hindrer dette **ikke** ondsinnet kode på nettsiden eller noen med tilgang til en opplåst enhet fra å bruke opplysningene. Bruk bare en privat og skjermlåst enhet, og velg en smalt avgrenset GitHub-token med kort utløpstid. Enhetslagring erstatter ikke GitHub sin tilgangskontroll.

Ved første oppsett flyttes eventuelle eksisterende skip fra den gamle nettleserlagringen over i kryptert form og gammel lokal lagring fjernes når opplastingen lykkes. Valgfri privat JSON-sikkerhetskopi er **ukryptert** og må oppbevares sikkert, aldri i et offentlig repository, i Issues eller i åpne chatter. Hvis du mister skipskartpassordet kan ikke den krypterte filen gjenopprettes uten en privat ukryptert sikkerhetskopi.

`data/game.json` er fortsatt offentlig kampdata, mens `data/halden-ships.enc.json` kun inneholder kryptert skipskart.

## Glemt skipskart-passord

Hemmelig skipskart er kryptert og kan **ikke** dekrypteres uten det originale passordet. Det er likevel mulig å fortsette kampen uten å nullstille noe: trykk **Avbryt** i passorddialogen for å få tilgang til den offentlige skuddoversikten. Du kan fortsatt registrere treff og bom når GitHub-innloggingen er godkjent.

Hvis passordet er tapt:

1. Kontroller først om du har en annen PC/mobil med allerede opplåst skipskart eller en privat JSON-sikkerhetskopi. Da kan du bevare plasseringene.
2. I passorddialogen velger du **Glemt passord? Lag nytt skipskart**.
3. Les advarselen. Velg et **nytt passord med minst 12 tegn** og gjenta det.
4. Skriv **NULLSTILL** og bekreft. Kun den krypterte filen for Haldens hemmelige skip erstattes med et **tomt skipskart**. **Kampdata, treff og bom i `data/game.json` endres ikke.**
5. Bruk det nye passordet på PC og mobil. Velg **Husk meg** bare på private enheter.

Et tidligere kryptert skipskart ligger i GitHub-kommithistorikken. Det kan ikke låses opp uten det gamle passordet selv om du velger et nytt. Reset-funksjonen bruker filens siste SHA for å avvise en tilbakestilt fil hvis en annen enhet oppdaterte den i mellomtiden. Reset krever en gyldig GitHub-nøkkel med skriverettigheter.

## Skudd og angre

Du kan velge flere ruter og registrere alle treff eller bom i én publisering. Hver publisering gir én commit. **Angre siste publisering** reverserer forrige registrering eller senking. Tilskuere henter endringer automatisk, med mulig forsinkelse.

## Ved tekniske problemer

- **Siden mangler:** Aktiver GitHub Pages.
- **Kampdata mangler:** Kontroller at `data/game.json` finnes på `main`.
- **Redigering feiler:** Kontroller token, GitHub-brukeren, repository-tilgangen og Contents: Read and write. En utgått token må erstattes. Automatisk innlogging fungerer bare hvis du tidligere valgte **Husk meg** på denne enheten, og nettleseren ikke har slettet nettstedsdata.
- **Treff vises ikke hos tilskuere med en gang:** Vent et lite minutt, og last inn siden på nytt. GitHub Raw kan være mellomlagret.
- **Våre skip er borte:** Logg inn og lås opp med samme skipskartpassord på begge enheter. Hvis passordet er glemt kan kryptert data ikke dekrypteres; bruk din private sikkerhetskopi.

Dette prosjektet berører ikke Supabase-prosjektene EHL Tips og Mitt Storhamar.
