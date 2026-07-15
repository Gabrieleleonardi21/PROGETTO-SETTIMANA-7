// SportsHub — Settimana VII — Inizializzazione ed eventi (entry point)

import { Squadra, Evento, cercaSquadre, caricaDettagli, caricaProssimiEventi } from "./api.js";
import {
  formRicerca,
  inputRicerca,
  sezioneRisultati,
  sezioneDettagli,
  btnIndietro,
  dettagliHeader,
  listaProssimi,
  listaUltimi,
  risultatiHeading,
  sezioneAppuntamenti,
  btnModalChiudi,
  modalOverlay,
} from "./dom.js";
import {
  debounce,
  impostaSpinner,
  mostraErrore,
  caricaPreferiti,
  renderPreferiti,
  renderAppuntamenti,
  renderSquadre,
  renderDettagli,
  chiudiModal,
} from "./ui.js";

// ===== STATO =====

let squadraAttiva: Squadra | null = null; // squadra selezionata correntemente
let filtroSport = ""; // '' | 'Soccer' | 'Basketball' | 'American Football'
let risultatiCacheati: Squadra[] = []; // tutti i risultati dell'ultima ricerca, non filtrati

// ===== APPUNTAMENTI =====

// Carica in parallelo i prossimi eventi di tutti i preferiti e li mostra ordinati per data
export async function caricaAppuntamenti(): Promise<void> {
  const lista = caricaPreferiti();
  if (lista.length === 0) {
    sezioneAppuntamenti.hidden = true;
    return;
  }

  // Promise.allSettled: non fallisce anche se una singola squadra non ha eventi
  const risultati = await Promise.allSettled(
    lista.map((p) => caricaProssimiEventi(p.id)),
  );

  const tuttiEventi: Evento[] = [];
  for (const r of risultati) {
    if (r.status === "fulfilled") tuttiEventi.push(...r.value);
  }

  // YYYY-MM-DD → ordinamento lessicografico corretto
  tuttiEventi.sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  renderAppuntamenti(tuttiEventi);
}

// ===== NAVIGAZIONE =====

export async function apriDettagli(squadra: Squadra): Promise<void> {
  squadraAttiva = squadra;
  sezioneRisultati.hidden = true;
  sezioneDettagli.hidden = false;

  dettagliHeader.replaceChildren();
  listaProssimi.replaceChildren();
  listaUltimi.replaceChildren();
  mostraErrore(null);

  try {
    const { prossimi, ultimi } = await caricaDettagli(squadra.id);
    renderDettagli(squadra, prossimi, ultimi);
  } catch (err) {
    mostraErrore(`Impossibile caricare i dettagli: ${(err as Error).message}`);
  }
}

function tornaRisultati(): void {
  squadraAttiva = null;
  sezioneDettagli.hidden = true;
  sezioneRisultati.hidden = false;
  mostraErrore(null);
}

// ===== RICERCA =====

// Applica il filtro sport sui risultati già in cache senza fare una nuova chiamata API
function applicaFiltro(): void {
  let filtrate = risultatiCacheati;
  if (filtroSport) {
    filtrate = risultatiCacheati.filter((s) => s.sport === filtroSport);
  }
  renderSquadre(filtrate);
}

async function eseguiRicerca(query: string): Promise<void> {
  if (!query) return;

  risultatiHeading.hidden = false;
  sezioneDettagli.hidden = true;
  sezioneRisultati.hidden = false;
  mostraErrore(null);
  impostaSpinner(true);

  try {
    // Recupera TUTTI i risultati senza filtro sport, poi filtra in locale
    risultatiCacheati = await cercaSquadre(query);
    applicaFiltro();
  } catch (err) {
    mostraErrore(`Errore durante la ricerca: ${(err as Error).message}`);
  } finally {
    impostaSpinner(false);
  }
}

const ricercaDebounced = debounce((query: string) => {
  eseguiRicerca(query);
}, 400);

// ===== EVENT LISTENERS =====

// Submit immediato (tasto Invio o bottone "Cerca")
formRicerca.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = inputRicerca.value.trim();
  // Almeno 3 caratteri prima di interrogare l'API
  if (query.length >= 3) eseguiRicerca(query);
});

// Ricerca live: si attiva 400ms dopo l'ultima battitura, solo con ≥ 3 caratteri
inputRicerca.addEventListener("input", () => {
  const query = inputRicerca.value.trim();
  if (query.length >= 3) ricercaDebounced(query);
});

btnIndietro.addEventListener("click", tornaRisultati);

// Filtri sport: aggiorna filtroSport e ri-filtra i risultati già in cache (nessuna chiamata API)
document.querySelectorAll<HTMLElement>(".btn-filtro").forEach((btn) => {
  btn.addEventListener("click", () => {
    filtroSport = btn.dataset.sport ?? "";
    // toggle derivato dall'identità: nessuna lista di rimozioni/aggiunte separata
    document.querySelectorAll<HTMLElement>(".btn-filtro").forEach((b) => {
      b.classList.toggle("btn-primary", b === btn);
      b.classList.toggle("btn-outline-primary", b !== btn);
    });
    applicaFiltro();
  });
});

// Modal: chiudi con ✕, clic sull'overlay o tasto Escape
btnModalChiudi.addEventListener("click", chiudiModal);
modalOverlay.addEventListener("click", chiudiModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") chiudiModal();
});

// ===== INIT =====

renderPreferiti();
caricaAppuntamenti();
