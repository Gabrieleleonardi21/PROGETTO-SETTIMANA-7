// SportsHub — Settimana VII — API e classi dati

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

// ===== TIPI DELLA RISPOSTA API (dati grezzi da TheSportsDB) =====

// Squadra così come arriva dall'endpoint searchteams.php
export interface SquadraAPI {
  idTeam: string;
  strTeam: string;
  strBadge: string | null; // il logo può mancare
  strLeague: string;
  strCountry: string;
  strSport: string;
}

// Evento così come arriva dagli endpoint eventsnext.php / eventslast.php
export interface EventoAPI {
  idEvent: string;
  dateEvent: string | null;
  strTime: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null; // l'API restituisce i punteggi come stringhe
  intAwayScore: string | null;
  strLeague: string | null;
  strSeason: string | null;
  strVenue: string | null;
  strSport: string | null;
}

// Involucri di risposta dei tre endpoint
interface RispostaSquadre {
  teams: SquadraAPI[] | null;
}
interface RispostaEventiNext {
  events: EventoAPI[] | null;
}
interface RispostaEventiLast {
  results: EventoAPI[] | null;
}

// Dettagli completi di una squadra: prossimi eventi + ultimi risultati
export interface Dettagli {
  prossimi: Evento[];
  ultimi: Evento[];
}

// ===== CLASSI =====

export class Squadra {
  id: string;
  nome: string;
  logo: string | null;
  lega: string;
  paese: string;
  sport: string; // es. 'Soccer', 'Basketball', 'American Football'

  constructor(dati: SquadraAPI) {
    this.id = dati.idTeam;
    this.nome = dati.strTeam;
    this.logo = dati.strBadge;
    this.lega = dati.strLeague;
    this.paese = dati.strCountry;
    this.sport = dati.strSport;
  }
}

export class Evento {
  id: string;
  data: string | null;
  ora: string | null;
  casa: string;
  trasferta: string;
  punteggioCasa: string | null;
  punteggioTrasferta: string | null;
  lega: string | null;
  stagione: string | null;
  stadio: string | null;
  sport: string | null;

  constructor(dati: EventoAPI) {
    this.id = dati.idEvent;
    this.data = dati.dateEvent;
    this.ora = dati.strTime;
    this.casa = dati.strHomeTeam;
    this.trasferta = dati.strAwayTeam;
    this.punteggioCasa = dati.intHomeScore;
    this.punteggioTrasferta = dati.intAwayScore;
    this.lega = dati.strLeague;
    this.stagione = dati.strSeason;
    this.stadio = dati.strVenue;
    this.sport = dati.strSport;
  }

  // Converte YYYY-MM-DD in DD/MM/YYYY
  dataFormattata(): string {
    if (!this.data) return "—";
    const [anno, mese, giorno] = this.data.split("-");
    return `${giorno}/${mese}/${anno}`;
  }

  // Restituisce il punteggio formattato, o null se non ancora giocato
  risultato(): string | null {
    if (
      this.punteggioCasa === null ||
      this.punteggioCasa === undefined ||
      this.punteggioCasa === ""
    ) {
      return null;
    }
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}

// ===== API =====

// Helper privato: fetch + controllo HTTP + parsing JSON in un colpo solo.
// Il generico <T> tipizza la forma attesa della risposta.
async function fetchJSON<T>(url: string): Promise<T> {
  const risposta = await fetch(url);
  if (!risposta.ok) throw new Error(`Errore HTTP: ${risposta.status}`);
  return risposta.json() as Promise<T>;
}

// Cerca squadre per nome; restituisce tutti i risultati (il filtro sport è applicato client-side in applicaFiltro)
export async function cercaSquadre(query: string): Promise<Squadra[]> {
  try {
    const dati = await fetchJSON<RispostaSquadre>(
      `${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`,
    );
    return (dati.teams || []).map((t) => new Squadra(t));
  } catch (err) {
    throw new Error(`Ricerca fallita: ${(err as Error).message}`);
  }
}

// Carica in parallelo i prossimi eventi e gli ultimi risultati di una squadra
export async function caricaDettagli(idSquadra: string): Promise<Dettagli> {
  try {
    const [datiProssimi, datiUltimi] = await Promise.all([
      fetchJSON<RispostaEventiNext>(`${BASE_URL}/eventsnext.php?id=${idSquadra}`),
      fetchJSON<RispostaEventiLast>(`${BASE_URL}/eventslast.php?id=${idSquadra}`),
    ]);
    return {
      prossimi: (datiProssimi.events || []).map((e) => new Evento(e)),
      ultimi: (datiUltimi.results || []).map((e) => new Evento(e)),
    };
  } catch (err) {
    throw new Error(`Caricamento dettagli fallito: ${(err as Error).message}`);
  }
}

// Carica solo i prossimi eventi di una squadra (usato per la sezione appuntamenti)
export async function caricaProssimiEventi(idSquadra: string): Promise<Evento[]> {
  const dati = await fetchJSON<RispostaEventiNext>(
    `${BASE_URL}/eventsnext.php?id=${idSquadra}`,
  );
  return (dati.events || []).map((e) => new Evento(e));
}
