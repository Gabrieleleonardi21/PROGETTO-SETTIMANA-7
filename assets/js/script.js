// SportsHub — Week Project Settimana VII

const BASE_URL   = 'https://www.thesportsdb.com/api/v1/json/3';
const STORAGE_KEY = 'sportshub_preferiti';

// ===== HELPER DOM =====

// Crea un elemento con attributi e figli in una sola chiamata
function make(tag, attrs = {}, ...figli) {
  const el = document.createElement(tag);
  for (const [chiave, valore] of Object.entries(attrs)) {
    if (chiave === 'className') {
      el.className = valore;
    } else if (chiave === 'textContent') {
      el.textContent = valore;
    } else {
      el.setAttribute(chiave, valore);
    }
  }
  el.append(...figli);
  return el;
}

// Crea un <img> con il logo dall'API; se l'URL manca o l'immagine non carica
// sostituisce automaticamente con il div placeholder
function creaLogo(url, alt, cssClass) {
  if (!url) {
    return make('div', { className: 'card-logo-placeholder', textContent: '🏆' });
  }

  const img = make('img', { className: cssClass, src: url, alt: alt });

  // onerror: l'URL esiste ma il file non si carica (404, CORS, ecc.)
  img.addEventListener('error', () => {
    const placeholder = make('div', { className: 'card-logo-placeholder', textContent: '🏆' });
    img.replaceWith(placeholder);
  });

  return img;
}

// ===== CLASSI =====

class Squadra {
  constructor(dati) {
    this.id    = dati.idTeam;
    this.nome  = dati.strTeam;
    this.logo  = dati.strBadge;
    this.lega  = dati.strLeague;
    this.paese = dati.strCountry;
  }
}

class Evento {
  constructor(dati) {
    this.id                 = dati.idEvent;
    this.data               = dati.dateEvent;
    this.casa               = dati.strHomeTeam;
    this.trasferta          = dati.strAwayTeam;
    this.punteggioCasa      = dati.intHomeScore;
    this.punteggioTrasferta = dati.intAwayScore;
  }

  // Converte YYYY-MM-DD in DD/MM/YYYY
  dataFormattata() {
    if (!this.data) return '—';
    const [anno, mese, giorno] = this.data.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  // Restituisce il punteggio formattato, o '—' se non ancora giocato
  risultato() {
    if (this.punteggioCasa === null || this.punteggioCasa === '') return null;
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}

// ===== API =====

// Cerca squadre per nome; restituisce array di Squadra (vuoto se nessun risultato)
async function cercaSquadre(query) {
  try {
    const risposta = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`);
    if (!risposta.ok) throw new Error(`Errore HTTP: ${risposta.status}`);
    const dati = await risposta.json();
    // L'API restituisce teams: null quando non trova nulla
    if (!dati.teams) return [];
    return dati.teams.map(t => new Squadra(t));
  } catch (err) {
    throw new Error(`Ricerca fallita: ${err.message}`);
  }
}

// Carica in parallelo i prossimi eventi e gli ultimi risultati di una squadra
async function caricaDettagli(idSquadra) {
  try {
    const [rispostaProssimi, rispostaUltimi] = await Promise.all([
      fetch(`${BASE_URL}/eventsnext.php?id=${idSquadra}`),
      fetch(`${BASE_URL}/eventslast.php?id=${idSquadra}`)
    ]);

    if (!rispostaProssimi.ok || !rispostaUltimi.ok) {
      throw new Error('Errore nel caricamento degli eventi');
    }

    const [datiProssimi, datiUltimi] = await Promise.all([
      rispostaProssimi.json(),
      rispostaUltimi.json()
    ]);

    const prossimi = (datiProssimi.events  || []).map(e => new Evento(e));
    const ultimi   = (datiUltimi.results   || []).map(e => new Evento(e));
    return { prossimi, ultimi };
  } catch (err) {
    throw new Error(`Caricamento dettagli fallito: ${err.message}`);
  }
}

// ===== STATO =====

let squadraAttiva = null; // Squadra selezionata correntemente

// ===== RIFERIMENTI DOM =====

const formRicerca       = document.getElementById('search-form');
const inputRicerca      = document.getElementById('search-input');
const spinner           = document.getElementById('spinner');
const boxErrore         = document.getElementById('errore');
const grigliaSquadre    = document.getElementById('griglia-squadre');
const sezioneRisultati  = document.getElementById('risultati-section');
const sezioneDettagli   = document.getElementById('dettagli-section');
const btnIndietro       = document.getElementById('btn-indietro');
const dettagliHeader    = document.getElementById('dettagli-header');
const listaProssimi     = document.getElementById('lista-prossimi');
const listaUltimi       = document.getElementById('lista-ultimi');
const sezionePreferiti  = document.getElementById('preferiti-section');
const grigliaPreferiti  = document.getElementById('griglia-preferiti');
const risultatiHeading  = document.getElementById('risultati-heading');

// ===== PREFERITI =====

// Legge l'array preferiti dal localStorage
function caricaPreferiti() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// Persiste l'array preferiti nel localStorage
function salvaPreferiti(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// Controlla se una squadra è già nei preferiti
function ePreferito(id) {
  return caricaPreferiti().some(p => p.id === id);
}

// Aggiunge una squadra ai preferiti (ignora i duplicati)
function aggiungiPreferito(squadra) {
  const lista = caricaPreferiti();
  if (lista.some(p => p.id === squadra.id)) return;
  lista.push({ id: squadra.id, nome: squadra.nome, logo: squadra.logo, lega: squadra.lega, paese: squadra.paese });
  salvaPreferiti(lista);
  renderPreferiti();
  aggiornaBottoniGriglia();
}

// Rimuove una squadra dai preferiti tramite id
function rimuoviPreferito(id) {
  salvaPreferiti(caricaPreferiti().filter(p => p.id !== id));
  renderPreferiti();
  aggiornaBottoniGriglia();
}

// Aggiorna il testo/stile dei pulsanti "Aggiungi" visibili nella griglia risultati
// (necessario quando si rimuove dai preferiti partendo dalla sezione "Le tue squadre")
function aggiornaBottoniGriglia() {
  document.querySelectorAll('[data-preferito-id]').forEach(btn => {
    const id    = btn.dataset.preferitoId;
    const isPref = ePreferito(id);
    btn.textContent = isPref ? '★ Preferita' : '★ Aggiungi ai preferiti';
    btn.classList.toggle('btn-aggiungi--attivo', isPref);
  });
}

// Rende le card della sezione "Le tue squadre"
function renderPreferiti() {
  const lista = caricaPreferiti();
  sezionePreferiti.hidden = lista.length === 0;
  grigliaPreferiti.replaceChildren();

  for (const p of lista) {
    const card = make('div', { className: 'card-preferito' });
    card.append(creaLogo(p.logo, p.nome, 'card-logo'));
    card.append(
      make('p', { className: 'card-nome', textContent: p.nome }),
      make('p', { className: 'card-meta', textContent: `${p.lega} · ${p.paese}` })
    );

    const btnRimuovi = make('button', { className: 'btn-rimuovi', textContent: '🗑 Rimuovi' });
    // stopPropagation evita di aprire i dettagli quando si clicca "Rimuovi"
    btnRimuovi.addEventListener('click', (e) => {
      e.stopPropagation();
      rimuoviPreferito(p.id);
    });
    card.append(btnRimuovi);

    // Clic sulla card apre i dettagli direttamente senza ricercare di nuovo
    card.addEventListener('click', () => {
      const squadra = new Squadra({
        idTeam: p.id, strTeam: p.nome, strBadge: p.logo, strLeague: p.lega, strCountry: p.paese
      });
      apriDettagli(squadra);
    });

    grigliaPreferiti.append(card);
  }
}

// ===== DEBOUNCE =====

// Restituisce una versione della funzione che si attiva solo dopo `ms` ms di inattività
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ===== RENDER =====

// Mostra o nasconde lo spinner
function impostaSpinner(visibile) {
  spinner.hidden = !visibile;
}

// Mostra un messaggio di errore; passare null per nasconderlo
function mostraErrore(messaggio) {
  if (messaggio) {
    boxErrore.textContent = messaggio;
    boxErrore.hidden = false;
  } else {
    boxErrore.hidden = true;
    boxErrore.textContent = '';
  }
}

// Costruisce le card delle squadre e le inserisce nella griglia
function renderSquadre(squadre) {
  grigliaSquadre.replaceChildren();

  if (squadre.length === 0) {
    grigliaSquadre.append(
      make('p', { className: 'msg-vuoto', textContent: 'Nessuna squadra trovata.' })
    );
    return;
  }

  for (const squadra of squadre) {
    const card = make('div', { className: 'card-squadra' });

    card.append(creaLogo(squadra.logo, squadra.nome, 'card-logo'));

    card.append(
      make('p', { className: 'card-nome', textContent: squadra.nome }),
      make('p', { className: 'card-meta', textContent: `${squadra.lega} · ${squadra.paese}` })
    );

    // Pulsante preferiti: aggiorna testo e stile in base allo stato corrente
    const isPref = ePreferito(squadra.id);
    const btnAggiungi = make('button', {
      className: isPref ? 'btn-aggiungi btn-aggiungi--attivo' : 'btn-aggiungi',
      textContent: isPref ? '★ Preferita' : '★ Aggiungi ai preferiti',
      'data-preferito-id': squadra.id
    });
    btnAggiungi.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ePreferito(squadra.id)) {
        rimuoviPreferito(squadra.id);
      } else {
        aggiungiPreferito(squadra);
      }
    });
    card.append(btnAggiungi);

    // Al click sulla card (non sul pulsante) si caricano i dettagli
    card.addEventListener('click', () => apriDettagli(squadra));

    grigliaSquadre.append(card);
  }
}

// Costruisce un elemento <li> per un singolo evento
function creaVoceEvento(evento) {
  const li = make('li', { className: 'evento-item' });

  li.append(
    make('div', { className: 'evento-data', textContent: evento.dataFormattata() }),
    make('div', { className: 'evento-partita', textContent: `${evento.casa} vs ${evento.trasferta}` })
  );

  const punteggio = evento.risultato();
  if (punteggio) {
    li.append(make('span', { className: 'evento-punteggio', textContent: punteggio }));
  }

  return li;
}

// Popola l'header e le liste della sezione dettagli
function renderDettagli(squadra, prossimi, ultimi) {
  // Header con logo e info squadra
  dettagliHeader.replaceChildren();

  dettagliHeader.append(creaLogo(squadra.logo, squadra.nome, 'dettagli-logo'));

  const info = make('div', { className: 'dettagli-info' });
  info.append(
    make('h2', { textContent: squadra.nome }),
    make('p', { textContent: `${squadra.lega} · ${squadra.paese}` })
  );
  dettagliHeader.append(info);

  // Lista prossimi eventi
  listaProssimi.replaceChildren();
  if (prossimi.length === 0) {
    listaProssimi.append(
      make('li', { className: 'msg-nessun-evento', textContent: 'Nessun evento in programma.' })
    );
  } else {
    for (const evento of prossimi) {
      listaProssimi.append(creaVoceEvento(evento));
    }
  }

  // Lista ultimi risultati
  listaUltimi.replaceChildren();
  if (ultimi.length === 0) {
    listaUltimi.append(
      make('li', { className: 'msg-nessun-evento', textContent: 'Nessun risultato disponibile.' })
    );
  } else {
    for (const evento of ultimi) {
      listaUltimi.append(creaVoceEvento(evento));
    }
  }
}

// ===== NAVIGAZIONE =====

// Passa dalla sezione risultati a quella dettagli
async function apriDettagli(squadra) {
  squadraAttiva = squadra;
  sezioneRisultati.hidden = true;
  sezioneDettagli.hidden = false;

  // Pulisce e mostra spinner mentre carica
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

// Torna alla sezione risultati
function tornaRisultati() {
  squadraAttiva = null;
  sezioneDettagli.hidden = true;
  sezioneRisultati.hidden = false;
  mostraErrore(null);
}

// ===== EVENTI =====

// Logica di ricerca estratta per essere richiamata sia da submit che da debounce
async function eseguiRicerca(query) {
  if (!query) return;

  // Mostra l'intestazione "Squadre trovate" al primo utilizzo e la mantiene visibile
  risultatiHeading.hidden = false;

  sezioneDettagli.hidden = true;
  sezioneRisultati.hidden = false;

  grigliaSquadre.replaceChildren();
  mostraErrore(null);
  impostaSpinner(true);

  try {
    const squadre = await cercaSquadre(query);
    renderSquadre(squadre);
  } catch (err) {
    mostraErrore(`Errore durante la ricerca: ${err.message}`);
  } finally {
    impostaSpinner(false);
  }
}

// Versione debounced per la ricerca live mentre si digita (W7 D3)
const ricercaDebounced = debounce((query) => eseguiRicerca(query), 400);

// Submit immediato (tasto Invio o bottone "Cerca")
formRicerca.addEventListener('submit', (e) => {
  e.preventDefault();
  eseguiRicerca(inputRicerca.value.trim());
});

// Ricerca live: parte 400ms dopo l'ultima battitura
inputRicerca.addEventListener('input', () => {
  const query = inputRicerca.value.trim();
  if (query) ricercaDebounced(query);
});

btnIndietro.addEventListener('click', tornaRisultati);

// Inizializza la sezione preferiti al caricamento della pagina
renderPreferiti();
