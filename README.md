# SportsHub

SPA (Single Page Application) per cercare squadre sportive, visualizzare prossimi eventi e ultimi risultati, e salvare squadre preferite con aggiornamento automatico degli appuntamenti.

---

## Tecnologie

- **Bootstrap 5.3.3** (CDN) — layout, componenti UI, spinner, alert
- **TheSportsDB API** (pubblica v1/json/3) — dati squadre ed eventi
- **localStorage** — persistenza preferiti lato client

---

## Struttura file

```
index.html          → struttura statica, sezioni nascoste con `hidden`
assets/
  css/style.css     → sovrascritture Bootstrap + classi custom
  js/
    api.js          → classi Squadra/Evento + funzioni fetch
    ui.js           → helper DOM, rendering, gestione localStorage
    main.js         → stato app, event listeners, init
```

> `assets/js/script.js` è la versione monolitica precedente, non caricata dall'HTML — inattiva.

---

## Come avviare

Basta aprire `index.html` nel browser. Non richiede build né server locale.

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
