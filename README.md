# SportsHub

SPA (Single Page Application) per cercare squadre sportive, visualizzare prossimi eventi e ultimi risultati, e salvare squadre preferite con aggiornamento automatico degli appuntamenti.

---

## Tecnologie

- **TypeScript 7** (ES Modules) — sorgenti in `src/`, compilazione a più file in `assets/js/`
- **Bootstrap 5.3.3** (CDN) — layout, componenti UI, spinner, alert
- **TheSportsDB API** (pubblica v1/json/3) — dati squadre ed eventi
- **localStorage** — persistenza preferiti lato client

---

## Struttura file

```
index.html            → struttura statica, sezioni nascoste con `hidden`
tsconfig.json         → config TypeScript (rootDir src → outDir assets/js)
src/                  → SORGENTI TypeScript (da modificare qui)
  api.ts              → tipi API + classi Squadra/Evento + funzioni fetch
  dom.ts              → riferimenti DOM tipizzati (condivisi fra i moduli)
  ui.ts               → helper DOM, rendering, gestione localStorage
  main.ts             → stato app, azioni, event listeners, init (entry point)
assets/
  css/style.css       → sovrascritture Bootstrap + classi custom
  js/                 → OUTPUT compilato da `tsc` (.js + .js.map), caricato dall'HTML
```

> `assets/js/script.js` è la versione monolitica pre-refactor, non caricata dall'HTML — inattiva (eliminabile).

> **Dipendenza circolare voluta:** `ui.ts` importa `apriDettagli`/`caricaAppuntamenti` da `main.ts` e `main.ts` importa da `ui.ts`. Funziona perché quelle due funzioni sono usate solo dentro i gestori di eventi (a runtime, non al caricamento del modulo). Vedi la sezione *Possibili miglioramenti*.

---

## Come avviare

1. Installa le dipendenze: `npm install`
2. Compila: `npm run build` (oppure `npm run watch` per ricompilare a ogni salvataggio)
3. Servi la cartella con un server locale — **necessario**: gli ES Modules non si caricano da `file://`.
   Es. `npx serve` oppure l'estensione *Live Server* di VS Code.

---

## Possibili miglioramenti

- **Rompere la dipendenza circolare** `ui ↔ main`: si può eliminare estraendo un piccolo bus di eventi (o passando `apriDettagli`/`caricaAppuntamenti` come callback in fase di render) al posto dell'import diretto da `main.ts`. Non fatto per mantenere il port fedele all'originale.

---

## Flusso principale

```
AVVIO
└─ renderPreferiti()      → mostra card preferiti
└─ caricaAppuntamenti()   → carica in parallelo i prossimi eventi dei preferiti

RICERCA
└─ input debounced (400ms) o submit form
└─ cercaSquadre(query)    → GET searchteams.php
└─ applicaFiltro()        → filtra client-side per sport
└─ renderSquadre()        → mostra card risultati

DETTAGLI SQUADRA
└─ click su card risultati o card preferita
└─ caricaDettagli(id)     → GET eventsnext.php + eventslast.php (Promise.all)
└─ renderDettagli()       → header squadra + due liste eventi
└─ "← Torna ai risultati" → tornaRisultati()

MODAL EVENTO
└─ click su voce evento
└─ apriModal(evento)      → overlay con: data · orario · lega · stagione · stadio · risultato
└─ chiudiModal()          → btn ✕ | clic overlay | tasto Escape

PREFERITI
└─ aggiungiPreferito()    → salva in localStorage, re-render, aggiorna appuntamenti
└─ rimuoviPreferito()     → rimuove da localStorage, re-render
└─ click su card preferita → apriDettagli() senza nuova ricerca
```

---

## Endpoint API

| Funzione | Endpoint |
|---|---|
| Ricerca squadra | `GET /searchteams.php?t={nome}` |
| Prossimi eventi | `GET /eventsnext.php?id={idSquadra}` |
| Ultimi risultati | `GET /eventslast.php?id={idSquadra}` |

> Il filtro per sport avviene **client-side**: il parametro `&s=` non è supportato dall'API pubblica.

---

## Modello dati

**`Squadra`** — `id, nome, logo, lega, paese, sport`

**`Evento`** — `id, data, ora, casa, trasferta, punteggioCasa, punteggioTrasferta, lega, stagione, stadio, sport`

Metodi:
- `dataFormattata()` → converte `YYYY-MM-DD` in `DD/MM/YYYY`
- `risultato()` → `"X - Y"` oppure `null` se non ancora disputata

---

## Stato applicazione (`main.js`)

| Variabile | Descrizione |
|---|---|
| `squadraAttiva` | squadra selezionata nella vista dettagli |
| `filtroSport` | `''` \| `'Soccer'` \| `'Basketball'` \| `'American Football'` |
| `risultatiCacheati` | array `Squadra[]` dell'ultima ricerca (non filtrati) |

---

## Persistenza

**chiave localStorage:** `sportshub_preferiti`

**struttura:** `[{ id, nome, logo, lega, paese }, ...]`

> Il campo `sport` non viene salvato — non necessario per la card preferiti.

---

## Gestione errori

- `cercaSquadre` / `caricaDettagli` — lanciano `Error`, catturato con `mostraErrore()`
- `caricaAppuntamenti` — usa `Promise.allSettled` per non bloccare in caso di singola squadra non raggiungibile
- Logo mancante/rotto — fallback a placeholder testuale 🏆

---

## Utility (`ui.js`)

| Funzione | Scopo |
|---|---|
| `make(tag, attrs, ...figli)` | crea elementi DOM senza `innerHTML` |
| `debounce(fn, ms)` | ritarda l'esecuzione per la ricerca live |
| `creaLogo(url, alt, cssClass)` | `<img>` con fallback automatico su errore |
| `aggiornaBottoniGriglia()` | sincronizza testo/stile dei pulsanti "Aggiungi" dopo ogni modifica ai preferiti |

---

## Stile

| Elemento | Valore |
|---|---|
| Colore brand | `#193366` (sovrascrive `--bs-primary` Bootstrap) |
| Sfondo pagina | Bootstrap `bg-light` (`#F8F9FA`) |
| Bottone rimuovi | sfondo `#FFE5E5`, testo `#AA0000` (`.btn-rimuovi`) |
| Bottone aggiungi | `btn-warning` Bootstrap (giallo) |
| Già preferito | `btn-secondary` Bootstrap (grigio) |
