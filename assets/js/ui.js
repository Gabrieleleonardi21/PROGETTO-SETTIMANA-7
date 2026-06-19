// SportsHub — Settimana VII — Helper DOM e rendering

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

// Crea un <img> con il logo; se mancante o rotto mostra un placeholder
function creaLogo(url, alt, cssClass) {
  if (!url) {
    return make('div', { className: 'card-logo-placeholder', textContent: '🏆' });
  }
  const img = make('img', { className: cssClass, src: url, alt: alt });
  img.addEventListener('error', () => {
    img.replaceWith(make('div', { className: 'card-logo-placeholder', textContent: '🏆' }));
  });
  return img;
}

// ===== DEBOUNCE =====

// Restituisce una versione della funzione attivata solo dopo `ms` ms di inattività
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ===== SPINNER / ERRORE =====

function impostaSpinner(visibile) {
  spinner.hidden = !visibile; // `spinner` definito in main.js
}

function mostraErrore(messaggio) {
  if (messaggio) {
    boxErrore.textContent = messaggio; // `boxErrore` definito in main.js
    boxErrore.hidden = false;
  } else {
    boxErrore.hidden = true;
    boxErrore.textContent = '';
  }
}

// ===== PREFERITI (localStorage) =====

function caricaPreferiti() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function salvaPreferiti(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function ePreferito(id) {
  return caricaPreferiti().some(p => p.id === id);
}

function aggiungiPreferito(squadra) {
  const lista = caricaPreferiti();
  if (lista.some(p => p.id === squadra.id)) return;
  lista.push({ id: squadra.id, nome: squadra.nome, logo: squadra.logo, lega: squadra.lega, paese: squadra.paese });
  salvaPreferiti(lista);
  renderPreferiti();
  aggiornaBottoniGriglia();
  caricaAppuntamenti(); // definita in main.js
}

function rimuoviPreferito(id) {
  salvaPreferiti(caricaPreferiti().filter(p => p.id !== id));
  renderPreferiti();
  aggiornaBottoniGriglia();
  caricaAppuntamenti(); // definita in main.js
}

// Aggiorna testo/stile dei pulsanti "Aggiungi" visibili nella griglia risultati
function aggiornaBottoniGriglia() {
  document.querySelectorAll('[data-preferito-id]').forEach(btn => {
    const id     = btn.dataset.preferitoId;
    const isPref = ePreferito(id);
    btn.textContent = isPref ? '★ Preferita' : '★ Aggiungi ai preferiti';
    btn.classList.toggle('btn-aggiungi--attivo', isPref);
  });
}

// ===== RENDER PREFERITI =====

function renderPreferiti() {
  const lista = caricaPreferiti();
  sezionePreferiti.hidden = lista.length === 0; // `sezionePreferiti` definito in main.js
  grigliaPreferiti.replaceChildren();            // `grigliaPreferiti` definito in main.js

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
      apriDettagli(squadra); // definita in main.js
    });

    grigliaPreferiti.append(card);
  }
}

// ===== RENDER APPUNTAMENTI =====

function renderAppuntamenti(eventi) {
  sezioneAppuntamenti.hidden = eventi.length === 0; // `sezioneAppuntamenti` definito in main.js
  listaAppuntamenti.replaceChildren();               // `listaAppuntamenti` definito in main.js

  for (const ev of eventi) {
    const li = make('li', { className: 'appuntamento-item' });
    li.append(
      make('div', { className: 'evento-data',    textContent: ev.dataFormattata() }),
      make('div', { className: 'evento-partita', textContent: `${ev.casa} vs ${ev.trasferta}` }),
      make('div', { className: 'evento-lega',    textContent: ev.lega || '' })
    );
    li.addEventListener('click', () => apriModal(ev));
    listaAppuntamenti.append(li);
  }
}

// ===== RENDER SQUADRE =====

function renderSquadre(squadre) {
  grigliaSquadre.replaceChildren(); // `grigliaSquadre` definito in main.js

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

    card.addEventListener('click', () => apriDettagli(squadra)); // definita in main.js

    grigliaSquadre.append(card);
  }
}

// ===== RENDER VOCE EVENTO (lista dettagli) =====

function creaVoceEvento(evento) {
  const li = make('li', { className: 'evento-item' });
  li.append(
    make('div', { className: 'evento-data',    textContent: evento.dataFormattata() }),
    make('div', { className: 'evento-partita', textContent: `${evento.casa} vs ${evento.trasferta}` })
  );
  const punteggio = evento.risultato();
  if (punteggio) {
    li.append(make('span', { className: 'evento-punteggio', textContent: punteggio }));
  }
  li.addEventListener('click', () => apriModal(evento));
  return li;
}

// ===== RENDER DETTAGLI SQUADRA =====

function renderDettagli(squadra, prossimi, ultimi) {
  // `dettagliHeader`, `listaProssimi`, `listaUltimi` definiti in main.js (già svuotati da apriDettagli)
  dettagliHeader.append(creaLogo(squadra.logo, squadra.nome, 'dettagli-logo'));

  const info = make('div', { className: 'dettagli-info' });
  info.append(
    make('h2', { textContent: squadra.nome }),
    make('p',  { textContent: `${squadra.lega} · ${squadra.paese}` })
  );
  dettagliHeader.append(info);

  if (prossimi.length === 0) {
    listaProssimi.append(
      make('li', { className: 'msg-nessun-evento', textContent: 'Nessun evento in programma.' })
    );
  } else {
    for (const evento of prossimi) listaProssimi.append(creaVoceEvento(evento));
  }

  if (ultimi.length === 0) {
    listaUltimi.append(
      make('li', { className: 'msg-nessun-evento', textContent: 'Nessun risultato disponibile.' })
    );
  } else {
    for (const evento of ultimi) listaUltimi.append(creaVoceEvento(evento));
  }
}

// ===== MODAL EVENTO =====

function apriModal(evento) {
  document.getElementById('modal-titolo').textContent = `${evento.casa} vs ${evento.trasferta}`;

  const corpo = document.getElementById('modal-corpo');
  corpo.replaceChildren();

  const righe = [
    ['Data',      evento.dataFormattata()],
    ['Orario',    evento.ora      || '—'],
    ['Lega',      evento.lega     || '—'],
    ['Stagione',  evento.stagione || '—'],
    ['Stadio',    evento.stadio   || '—'],
    ['Risultato', evento.risultato() || 'Non ancora disputata'],
  ];

  for (const [etichetta, valore] of righe) {
    const riga = make('div', { className: 'modal-riga' });
    riga.append(
      make('span', { className: 'modal-etichetta', textContent: etichetta }),
      make('span', { className: 'modal-valore',    textContent: valore })
    );
    corpo.append(riga);
  }

  document.getElementById('modal-evento').hidden = false;
}

function chiudiModal() {
  document.getElementById('modal-evento').hidden = true;
}
