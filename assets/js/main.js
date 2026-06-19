// SportsHub — Settimana VII — Inizializzazione ed eventi

// ===== STATO =====

let squadraAttiva      = null;  // squadra selezionata correntemente
let filtroSport        = '';    // '' | 'Soccer' | 'Basketball' | 'American Football'
let risultatiCacheati  = [];    // tutti i risultati dell'ultima ricerca, non filtrati

// ===== RIFERIMENTI DOM =====

const formRicerca         = document.getElementById('search-form');
const inputRicerca        = document.getElementById('search-input');
const spinner             = document.getElementById('spinner');
const boxErrore           = document.getElementById('errore');
const grigliaSquadre      = document.getElementById('griglia-squadre');
const sezioneRisultati    = document.getElementById('risultati-section');
const sezioneDettagli     = document.getElementById('dettagli-section');
const btnIndietro         = document.getElementById('btn-indietro');
const dettagliHeader      = document.getElementById('dettagli-header');
const listaProssimi       = document.getElementById('lista-prossimi');
const listaUltimi         = document.getElementById('lista-ultimi');
const sezionePreferiti    = document.getElementById('preferiti-section');
const grigliaPreferiti    = document.getElementById('griglia-preferiti');
const risultatiHeading    = document.getElementById('risultati-heading');
const sezioneAppuntamenti = document.getElementById('appuntamenti-section');
const listaAppuntamenti   = document.getElementById('lista-appuntamenti');

// ===== APPUNTAMENTI =====

// Carica in parallelo i prossimi eventi di tutti i preferiti e li mostra ordinati per data
async function caricaAppuntamenti() {
  const lista = caricaPreferiti();
  if (lista.length === 0) {
    sezioneAppuntamenti.hidden = true;
    return;
  }

  // Promise.allSettled: non fallisce anche se una singola squadra non ha eventi
  const risultati = await Promise.allSettled(
    lista.map(p => caricaProssimiEventi(p.id))
  );

  const tuttiEventi = [];
  for (const r of risultati) {
    if (r.status === 'fulfilled') tuttiEventi.push(...r.value);
  }

  // YYYY-MM-DD → ordinamento lessicografico corretto
  tuttiEventi.sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  renderAppuntamenti(tuttiEventi);
}

// ===== NAVIGAZIONE =====

async function apriDettagli(squadra) {
  squadraAttiva = squadra;
  sezioneRisultati.hidden = true;
  sezioneDettagli.hidden  = false;

  dettagliHeader.replaceChildren();
  listaProssimi.replaceChildren();
  listaUltimi.replaceChildren();
  impostaSpinner(true);
  mostraErrore(null);

  try {
    const { prossimi, ultimi } = await caricaDettagli(squadra.id);
    renderDettagli(squadra, prossimi, ultimi);
  } catch (err) {
    mostraErrore(`Impossibile caricare i dettagli: ${err.message}`);
  } finally {
    impostaSpinner(false);
  }
}

function tornaRisultati() {
  squadraAttiva = null;
  sezioneDettagli.hidden  = true;
  sezioneRisultati.hidden = false;
  mostraErrore(null);
}

// ===== RICERCA =====

// Applica il filtro sport sui risultati già in cache senza fare una nuova chiamata API
function applicaFiltro() {
  const filtrate = filtroSport
    ? risultatiCacheati.filter(s => s.sport === filtroSport)
    : risultatiCacheati;
  renderSquadre(filtrate);
}

async function eseguiRicerca(query) {
  if (!query) return;

  risultatiHeading.hidden = false;
  sezioneDettagli.hidden  = true;
  sezioneRisultati.hidden = false;
  mostraErrore(null);
  impostaSpinner(true);

  try {
    // Recupera TUTTI i risultati senza filtro sport, poi filtra in locale
    risultatiCacheati = await cercaSquadre(query);
    applicaFiltro();
  } catch (err) {
    mostraErrore(`Errore durante la ricerca: ${err.message}`);
  } finally {
    impostaSpinner(false);
  }
}

const ricercaDebounced = debounce((query) => eseguiRicerca(query), 400);

// ===== EVENT LISTENERS =====

// Submit immediato (tasto Invio o bottone "Cerca")
formRicerca.addEventListener('submit', (e) => {
  e.preventDefault();
  eseguiRicerca(inputRicerca.value.trim());
});

// Ricerca live: si attiva 400ms dopo l'ultima battitura
inputRicerca.addEventListener('input', () => {
  const query = inputRicerca.value.trim();
  if (query) ricercaDebounced(query);
});

btnIndietro.addEventListener('click', tornaRisultati);

// Filtri sport: aggiorna filtroSport e ri-filtra i risultati già in cache (nessuna chiamata API)
document.querySelectorAll('.btn-filtro').forEach(btn => {
  btn.addEventListener('click', () => {
    filtroSport = btn.dataset.sport;
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('btn-filtro--attivo'));
    btn.classList.add('btn-filtro--attivo');
    applicaFiltro();
  });
});

// Modal: chiudi con ✕, clic sull'overlay o tasto Escape
document.getElementById('modal-chiudi').addEventListener('click', chiudiModal);
document.getElementById('modal-overlay').addEventListener('click', chiudiModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') chiudiModal();
});

// ===== INIT =====

renderPreferiti();
caricaAppuntamenti();
