# RWT 3F oefenen

Gratis oefenplatform voor de **Rekentoets Wiskunde (RWT) op 3F-niveau** voor de pabo.
Draait helemaal in de browser (HTML + vanilla JavaScript + Tailwind CSS) en staat op GitHub Pages:

**https://joshuafranze.github.io/RWT-oefenen/**

## Wat zit erin

- **400 oefenvragen**: 4 domeinen (Getallen, Verhoudingen, Meten & Meetkunde, Verbanden) × 50 kale sommen + 50 contextvragen.
- **10 oefentoetsen** van 55 vragen: 17 zonder rekenmachine, daarna 38 met rekenmachine (zit in de app).
- **Indicatie van de schaalscore** met de 3F-grens op 575, plus advies per domein.
- **Bij elke vraag een uitwerking** en bij fouten een tweede kans.
- **AI Coach** (Claude, via je eigen Anthropic API-key): legt bij een fout antwoord uit waar het misging, zonder het antwoord voor te zeggen. Je kunt ook vervolgvragen stellen.
- **Voortgang synchroniseren** tussen apparaten via een geheime GitHub Gist.
- Rustige vormgeving, geen tijdsdruk en een "rustmoment" (ademhalingsoefening) voor als het even te veel wordt.

## Instellen (eenmalig, via het tandwieltje rechtsboven)

1. **Sync**: maak een *classic* token aan op <https://github.com/settings/tokens/new?scopes=gist> met alleen de scope `gist`. Plak het in de app. Doe op je andere apparaat hetzelfde; de app vindt de Gist dan vanzelf.
2. **AI Coach**: maak een API-key aan op <https://console.anthropic.com/settings/keys> en plak die in de app. Standaard wordt Claude Haiku 5.5 gebruikt (snel en goedkoop).

Het token en de API-key worden alleen in de browser op dat apparaat bewaard (`localStorage`). Ze komen niet in de code, niet in de Gist en niet op GitHub. De app laadt geen externe scripts.

## Hoe de vragen gemaakt worden

De vragen komen uit generatoren (`js/generators/`) met een vaste seed. Daardoor zijn ze elke keer hetzelfde en allemaal uniek, en de antwoorden worden uitgerekend in plaats van ingetypt. Vóór elke deploy controleert `tests/check-bank.mjs` onder andere:

- de aantallen (400 oefenvragen, 10 × 55 toetsvragen, 17/38 verdeling);
- dat elke vraag uniek is;
- dat het juiste antwoord, getypt zoals een student dat doet, ook goed gerekend wordt (en antwoord + 1 niet);
- het afronden (decimalen, centen, hele getallen);
- dat er geen rekenmachinevragen in deel 1 zitten;
- dat een deel van de kale sommen opnieuw wordt uitgerekend vanuit de vraagtekst zelf.

## Normering

De echte Cito-omrekentabel verschilt per toetsversie en is niet openbaar. `js/normering.js` gebruikt daarom een benadering: ongeveer 33 van de 55 goed ≈ 575 (3F). Heb je een officiële omrekentabel? Pas dan de ankerpunten in dat bestand aan.

## Lokaal draaien en testen

```bash
npm start                 # python3 -m http.server 8765 -> http://localhost:8765
npm test                  # controleer de vragenbank
npm run test:e2e          # browsertest met Playwright (server moet draaien)
npm run build:css         # Tailwind CSS opnieuw bouwen na nieuwe classes
```

Elke push naar `main` draait de checks, bouwt de CSS en zet de site live via GitHub Actions (`.github/workflows/deploy.yml`).
Zet in de repo één keer **Settings → Pages → Source: GitHub Actions** aan.
