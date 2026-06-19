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

// Cerca squadre per nome; restituisce tutti i risultati (il filtro sport è applicato client-side in applicaFiltro)
async function cercaSquadre(query) {
  try {
    const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`;
    const risposta = await fetch(url);
    if (!risposta.ok) throw new Error(`Errore HTTP: ${risposta.status}`);
    const dati = await risposta.json();
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

// Carica solo i prossimi eventi di una squadra (usato per la sezione appuntamenti)
async function caricaProssimiEventi(idSquadra) {
  const risposta = await fetch(`${BASE_URL}/eventsnext.php?id=${idSquadra}`);
  if (!risposta.ok) throw new Error(`Errore HTTP: ${risposta.status}`);
  const dati = await risposta.json();
  return (dati.events || []).map(e => new Evento(e));
}
