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
6. Når du er ferdig, trykk **Logg ut**. Nøkkelen lagres bare midlertidig i minnet i fanen. Ved ny åpning må den skrives inn på nytt.

GitHub tar seg av den reelle tilgangskontrollen ved hver publisering. Å kjenne nettsidens adresse gir ikke rett til å redigere.

## PC og mobil: hemmelig skipskart på begge enheter

1. Åpne Battleship på PC, klikk **Rediger** og lim inn en begrenset GitHub-token som tilhører `zachariassl19` og kan oppdatere repository-innhold.
2. Når **Hemmelig skipskart** dukker opp for første gang, klikk **Generer sikkert passord**. Lagre passordet i en passordbehandler og trykk **Lås opp / start synkronisering**.
3. Plasser Halden-skip under **Halden → Plasser Halden-skip**. Hver endring blir kryptert lokalt og lagret i `data/halden-ships.enc.json` på GitHub.
4. Åpne Battleship på mobilen, logg inn med GitHub-token og bruk **det samme hemmelige skipskart-passordet**. Kartet dekrypteres på mobilen og kan redigeres der også.
5. Hvis begge enheter står åpne, henter appen nye plasseringer automatisk omtrent hvert 30. sekund. Hvis en annen enhet endret kartet i mellomtiden blir en foreldet redigering avvist i stedet for å overskrive.

**Sikkerhet:** Skipskartpassordet sendes ikke til GitHub og lagres ikke permanent i nettleseren. Kryptert data ligger i et **offentlig** repository, så bruk appens tilfeldig genererte passord for å motstå passordgjetting. GitHub-token lagres bare i minnet til den åpne fanen. Du må logge inn og låse opp igjen ved ny fane/nytt besøk.

Ved første oppsett flyttes eventuelle eksisterende skip fra den gamle nettleserlagringen over i kryptert form og gammel lokal lagring fjernes når opplastingen lykkes. Valgfri privat JSON-sikkerhetskopi er **ukryptert** og må oppbevares sikkert, aldri i et offentlig repository, i Issues eller i åpne chatter. Hvis du mister skipskartpassordet kan ikke den krypterte filen gjenopprettes uten en privat ukryptert sikkerhetskopi.

`data/game.json` er fortsatt offentlig kampdata, mens `data/halden-ships.enc.json` kun inneholder kryptert skipskart.

## Skudd og angre

Du kan velge flere ruter og registrere alle treff eller bom i én publisering. Hver publisering gir én commit. **Angre siste publisering** reverserer forrige registrering eller senking. Tilskuere henter endringer automatisk, med mulig forsinkelse.

## Ved tekniske problemer

- **Siden mangler:** Aktiver GitHub Pages.
- **Kampdata mangler:** Kontroller at `data/game.json` finnes på `main`.
- **Redigering feiler:** Kontroller token, GitHub-brukeren, repository-tilgangen og Contents: Read and write. En utgått token må erstattes.
- **Treff vises ikke hos tilskuere med en gang:** Vent et lite minutt, og last inn siden på nytt. GitHub Raw kan være mellomlagret.
- **Våre skip er borte:** Logg inn og lås opp med samme skipskartpassord på begge enheter. Hvis passordet er glemt kan kryptert data ikke dekrypteres; bruk din private sikkerhetskopi.

Dette prosjektet berører ikke Supabase-prosjektene EHL Tips og Mitt Storhamar.
