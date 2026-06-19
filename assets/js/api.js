// SportsHub — Settimana VII — API e classi dati

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// ===== CLASSI =====

class Squadra {
  constructor(dati) {
    this.id    = dati.idTeam;
    this.nome  = dati.strTeam;
    this.logo  = dati.strBadge;
    this.lega  = dati.strLeague;
    this.paese = dati.strCountry;
    this.sport = dati.strSport; // es. 'Soccer', 'Basketball', 'American Football'
  }
}

class Evento {
  constructor(dati) {
    this.id                 = dati.idEvent;
    this.data               = dati.dateEvent;
    this.ora                = dati.strTime;
    this.casa               = dati.strHomeTeam;
    this.trasferta          = dati.strAwayTeam;
    this.punteggioCasa      = dati.intHomeScore;
    this.punteggioTrasferta = dati.intAwayScore;
    this.lega               = dati.strLeague;
    this.stagione           = dati.strSeason;
    this.stadio             = dati.strVenue;
    this.sport              = dati.strSport;
  }

  // Converte YYYY-MM-DD in DD/MM/YYYY
  dataFormattata() {
    if (!this.data) return '—';
    const [anno, mese, giorno] = this.data.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  // Restituisce il punteggio formattato, o null se non ancora giocato
  risultato() {
    if (this.punteggioCasa === null || this.punteggioCasa === undefined || this.punteggioCasa === '') return null;
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}

// ===== API =====

// Helper privato: fetch + controllo HTTP + parsing JSON in un colpo solo
async function fetchJSON(url) {
  const risposta = await fetch(url);
  if (!risposta.ok) throw new Error(`Errore HTTP: ${risposta.status}`);
  return risposta.json();
}

// Cerca squadre per nome; restituisce tutti i risultati (il filtro sport è applicato client-side in applicaFiltro)
async function cercaSquadre(query) {
  try {
    const dati = await fetchJSON(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`);
    return (dati.teams || []).map(t => new Squadra(t));
  } catch (err) {
    throw new Error(`Ricerca fallita: ${err.message}`);
  }
}

// Carica in parallelo i prossimi eventi e gli ultimi risultati di una squadra
async function caricaDettagli(idSquadra) {
  try {
    const [datiProssimi, datiUltimi] = await Promise.all([
      fetchJSON(`${BASE_URL}/eventsnext.php?id=${idSquadra}`),
      fetchJSON(`${BASE_URL}/eventslast.php?id=${idSquadra}`)
    ]);
    return {
      prossimi: (datiProssimi.events  || []).map(e => new Evento(e)),
      ultimi:   (datiUltimi.results   || []).map(e => new Evento(e))
    };
  } catch (err) {
    throw new Error(`Caricamento dettagli fallito: ${err.message}`);
  }
}

// Carica solo i prossimi eventi di una squadra (usato per la sezione appuntamenti)
async function caricaProssimiEventi(idSquadra) {
  const dati = await fetchJSON(`${BASE_URL}/eventsnext.php?id=${idSquadra}`);
  return (dati.events || []).map(e => new Evento(e));
}
