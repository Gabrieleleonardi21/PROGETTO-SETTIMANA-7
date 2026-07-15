// SportsHub — Settimana VII — Riferimenti DOM tipizzati
//

// Con i moduli lo scope globale non è più condiviso, quindi li centralizziamo
// qui e ogni modulo importa solo ciò che gli serve.

// Helper: recupera un elemento per id e ne restringe il tipo; lancia se assente
// così un id sbagliato emerge subito invece di propagarsi come `null`.
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const nodo = document.getElementById(id);
  if (!nodo) throw new Error(`Elemento #${id} non trovato nel DOM`);
  return nodo as T;
}

// Ricerca
export const formRicerca = el<HTMLFormElement>("search-form");
export const inputRicerca = el<HTMLInputElement>("search-input");

// Stato / feedback
export const spinner = el("spinner");
export const boxErrore = el("errore");

// Risultati ricerca
export const grigliaSquadre = el("griglia-squadre");
export const sezioneRisultati = el("risultati-section");
export const risultatiHeading = el("risultati-heading");

// Dettagli squadra
export const sezioneDettagli = el("dettagli-section");
export const btnIndietro = el<HTMLButtonElement>("btn-indietro");
export const dettagliHeader = el("dettagli-header");
export const listaProssimi = el("lista-prossimi");
export const listaUltimi = el("lista-ultimi");

// Preferiti
export const sezionePreferiti = el("preferiti-section");
export const grigliaPreferiti = el("griglia-preferiti");

// Appuntamenti
export const sezioneAppuntamenti = el("appuntamenti-section");
export const listaAppuntamenti = el("lista-appuntamenti");

// Modal evento
export const modalEvento = el("modal-evento");
export const modalTitolo = el("modal-titolo");
export const modalCorpo = el("modal-corpo");
export const btnModalChiudi = el<HTMLButtonElement>("modal-chiudi");
export const modalOverlay = el("modal-overlay");