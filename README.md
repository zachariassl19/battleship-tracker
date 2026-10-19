# POWER Battleship – Halden mot Ski

Dette er en **GitHub-basert** Battleship Tracker uten Supabase, Firebase eller andre databaser.

## Hvordan det fungerer

- **Tilskuere:** Alle kan åpne den offentlige GitHub Pages-nettsiden uten innlogging. Brettene oppdateres automatisk hvert 30. sekund fra `data/game.json` på GitHub. Dette er ikke øyeblikkelig sanntid: GitHub sin mellomlagring kan gi noe ekstra forsinkelse.
- **Redaktør:** Bare GitHub-brukeren `zachariassl19` kan logge inn i redigeringsmodus. Endringer sendes til GitHub Contents API og lagres som commits i `data/game.json`.
- **Halden sine skjulte skip:** Plasseres og lagres kun i **localStorage på redaktørens enhet**. De publiseres aldri i GitHub. Bruk privat sikkerhetskopi ved bytte av enhet.
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

## Bevar hemmelig plassering

Skip plasseres under **Halden → Plasser Halden-skip**. De synkroniseres **ikke** til andre enheter og er ikke tilgjengelige på nytt hvis nettleserdata slettes. Bruk **Last ned privat sikkerhetskopi** og oppbevar filen privat. Bruk **Gjenopprett privat sikkerhetskopi** på en annen enhet.

**Viktig:** Ikke legg private skipsfiler under `data/`, i repository, i Issues eller i en offentlig chat. Bare `data/game.json` er ment for offentlig visning.

## Skudd og angre

Du kan velge flere ruter og registrere alle treff eller bom i én publisering. Hver publisering gir én commit. **Angre siste publisering** reverserer forrige registrering eller senking. Tilskuere henter endringer automatisk, med mulig forsinkelse.

## Ved tekniske problemer

- **Siden mangler:** Aktiver GitHub Pages.
- **Kampdata mangler:** Kontroller at `data/game.json` finnes på `main`.
- **Redigering feiler:** Kontroller token, GitHub-brukeren, repository-tilgangen og Contents: Read and write. En utgått token må erstattes.
- **Treff vises ikke hos tilskuere med en gang:** Vent et lite minutt, og last inn siden på nytt. GitHub Raw kan være mellomlagret.
- **Våre skip er borte:** Du må bruke den samme nettleseren/enheten eller importere en privat sikkerhetskopi.

Dette prosjektet berører ikke Supabase-prosjektene EHL Tips og Mitt Storhamar.
