// SportsHub — Settimana VII — Helper DOM e rendering

const STORAGE_KEY = "sportshub_preferiti";

// ===== HELPER DOM =====

// Crea un elemento con attributi e figli in una sola chiamata
function make(tag, attrs = {}, ...figli) {
  const el = document.createElement(tag);
  for (const [chiave, valore] of Object.entries(attrs)) {
    if (chiave === "className") {
      el.className = valore;
    } else if (chiave === "textContent") {
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
    return make("div", {
      className: "card-logo-placeholder",
      textContent: "🏆",
    });
  }
  const img = make("img", { className: cssClass, src: url, alt: alt });
  img.addEventListener("error", () => {
    img.replaceWith(
      make("div", { className: "card-logo-placeholder", textContent: "🏆" }),
    );
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
  // d-none usa !important, compatibile con d-block già presente sullo spinner
  spinner.classList.toggle('d-none', !visibile);
}

function mostraErrore(messaggio) {
  if (messaggio) {
    boxErrore.textContent = messaggio; // `boxErrore` definito in main.js
    boxErrore.hidden = false;
  } else {
    boxErrore.hidden = true;
    boxErrore.textContent = "";
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
  return caricaPreferiti().some((p) => p.id === id);
}

function aggiungiPreferito(squadra) {
  const lista = caricaPreferiti();
  if (lista.some((p) => p.id === squadra.id)) return;
  lista.push({
    id: squadra.id,
    nome: squadra.nome,
    logo: squadra.logo,
    lega: squadra.lega,
    paese: squadra.paese,
  });
  salvaPreferiti(lista);
  renderPreferiti();
  aggiornaBottoniGriglia();
  caricaAppuntamenti(); // definita in main.js
}

function rimuoviPreferito(id) {
  salvaPreferiti(caricaPreferiti().filter((p) => p.id !== id));
  renderPreferiti();
  aggiornaBottoniGriglia();
  caricaAppuntamenti(); // definita in main.js
}

// Aggiorna testo/stile dei pulsanti "Aggiungi" visibili nella griglia risultati
function aggiornaBottoniGriglia() {
  // Legge localStorage una sola volta per tutti i bottoni
  const preferitiSet = new Set(caricaPreferiti().map((p) => p.id));
  document.querySelectorAll("[data-preferito-id]").forEach((btn) => {
    const isPref = preferitiSet.has(btn.dataset.preferitoId);
    btn.textContent = `★ ${isPref ? "Preferita" : "Aggiungi ai preferiti"}`;
    btn.classList.toggle("btn-warning", !isPref);
    btn.classList.toggle("btn-secondary", isPref);
  });
}

// ===== RENDER PREFERITI =====

function renderPreferiti() {
  const lista = caricaPreferiti();
  sezionePreferiti.hidden = lista.length === 0; // `sezionePreferiti` definito in main.js
  grigliaPreferiti.replaceChildren(); // `grigliaPreferiti` definito in main.js

  if (lista.length === 0) return;

  for (const p of lista) {
    const col = make("div", {});
    const card = make("div", {
      className: "card h-100 text-center p-3 card-hover border-0 shadow-sm",
    });

    card.append(creaLogo(p.logo, p.nome, "card-logo"));
    card.append(
      make("p", {
        className: "fw-bold text-primary mb-1",
        textContent: p.nome,
      }),
      make("p", {
        className: "text-muted small mb-2",
        textContent: `${p.lega} · ${p.paese}`,
      }),
    );

    const btnRimuovi = make("button", {
      className: "btn btn-sm w-100 mt-2 btn-rimuovi",
      textContent: "🗑 Rimuovi",
    });
    // stopPropagation evita di aprire i dettagli quando si clicca "Rimuovi"
    btnRimuovi.addEventListener("click", (e) => {
      e.stopPropagation();
      rimuoviPreferito(p.id);
    });
    card.append(btnRimuovi);

    // Clic sulla card apre i dettagli direttamente senza ricercare di nuovo
    card.addEventListener("click", () => {
      const squadra = new Squadra({
        idTeam: p.id,
        strTeam: p.nome,
        strBadge: p.logo,
        strLeague: p.lega,
        strCountry: p.paese,
      });
      apriDettagli(squadra); // definita in main.js
    });

    col.append(card);
    grigliaPreferiti.append(col);
  }
}

// ===== RENDER APPUNTAMENTI =====

function renderAppuntamenti(eventi) {
  sezioneAppuntamenti.hidden = eventi.length === 0; // `sezioneAppuntamenti` definito in main.js
  listaAppuntamenti.replaceChildren(); // `listaAppuntamenti` definito in main.js

  for (const ev of eventi) {
    const li = make("li", {
      className: "card p-2 appuntamento-item border-0 shadow-sm",
    });
    li.append(
      make("div", {
        className: "text-muted small mb-1",
        textContent: ev.dataFormattata(),
      }),
      make("div", {
        className: "fw-semibold small",
        textContent: `${ev.casa} vs ${ev.trasferta}`,
      }),
      make("div", {
        className: "text-muted small mt-1",
        textContent: ev.lega || "",
      }),
    );
    li.addEventListener("click", () => apriModal(ev));
    listaAppuntamenti.append(li);
  }
}

// ===== RENDER SQUADRE =====

function renderSquadre(squadre) {
  grigliaSquadre.replaceChildren(); // `grigliaSquadre` definito in main.js

  if (squadre.length === 0) {
    // p diretto nel grid: grid-column: 1/-1 via CSS lo fa occupare tutta la larghezza
    grigliaSquadre.append(
      make("p", {
        className: "text-center text-muted py-5",
        textContent: "Nessuna squadra trovata.",
      }),
    );
    return;
  }

  // Una lettura di localStorage per l'intero render della griglia
  const preferitiSet = new Set(caricaPreferiti().map((p) => p.id));

  for (const squadra of squadre) {
    const col = make("div", {});
    const card = make("div", {
      className: "card h-100 text-center p-3 card-hover border-0 shadow-sm",
    });

    card.append(creaLogo(squadra.logo, squadra.nome, "card-logo"));
    card.append(
      make("p", {
        className: "fw-bold text-primary mb-1",
        textContent: squadra.nome,
      }),
      make("p", {
        className: "text-muted small mb-2",
        textContent: `${squadra.lega} · ${squadra.paese}`,
      }),
    );

    const isPref = preferitiSet.has(squadra.id);
    const btnAggiungi = make("button", {
      className: isPref
        ? "btn btn-secondary btn-sm w-100 mt-2"
        : "btn btn-warning btn-sm w-100 mt-2",
      textContent: `★ ${isPref ? "Preferita" : "Aggiungi ai preferiti"}`,
      "data-preferito-id": squadra.id,
    });
    btnAggiungi.addEventListener("click", (e) => {
      e.stopPropagation();
      // ePreferito rilegge localStorage: lo stato potrebbe essere cambiato dopo il render
      if (ePreferito(squadra.id)) {
        rimuoviPreferito(squadra.id);
      } else {
        aggiungiPreferito(squadra);
      }
    });
    card.append(btnAggiungi);

    card.addEventListener("click", () => apriDettagli(squadra)); // definita in main.js

    col.append(card);
    grigliaSquadre.append(col);
  }
}

// ===== RENDER VOCE EVENTO (lista dettagli) =====

function creaVoceEvento(evento) {
  const li = make("li", {
    className: "card p-2 evento-item border-0 shadow-sm",
  });
  li.append(
    make("div", {
      className: "text-muted small mb-1",
      textContent: evento.dataFormattata(),
    }),
  );

  // Riga squadre: nome a sinistra, punteggio a destra in verde
  const rigaSquadre = make("div", {
    className: "d-flex justify-content-between align-items-center gap-2",
  });
  rigaSquadre.append(
    make("span", {
      className: "fw-semibold",
      textContent: `${evento.casa} vs ${evento.trasferta}`,
    }),
  );

  const punteggio = evento.risultato();
  if (punteggio) {
    rigaSquadre.append(
      make("span", {
        className: "badge bg-success fw-semibold small flex-shrink-0",
        textContent: punteggio,
      }),
    );
  }

  li.append(rigaSquadre);
  li.addEventListener("click", () => apriModal(evento));
  return li;
}

// ===== RENDER DETTAGLI SQUADRA =====

// Riempie una lista eventi; se vuota mostra il messaggio di fallback
function riempiLista(lista, eventi, testoVuoto) {
  if (eventi.length === 0) {
    lista.append(make("li", { className: "text-muted fst-italic small", textContent: testoVuoto }));
  } else {
    for (const evento of eventi) lista.append(creaVoceEvento(evento));
  }
}

function renderDettagli(squadra, prossimi, ultimi) {
  // `dettagliHeader`, `listaProssimi`, `listaUltimi` definiti in main.js (già svuotati da apriDettagli)
  dettagliHeader.append(creaLogo(squadra.logo, squadra.nome, "dettagli-logo"));

  const info = make("div", {});
  info.append(
    make("h2", {
      className: "h5 fw-bold text-primary mb-1",
      textContent: squadra.nome,
    }),
    make("p", {
      className: "text-muted small mb-0",
      textContent: `${squadra.lega} · ${squadra.paese}`,
    }),
  );
  dettagliHeader.append(info);

  riempiLista(listaProssimi, prossimi, "Nessun evento in programma.");
  riempiLista(listaUltimi, ultimi, "Nessun risultato disponibile.");
}

// ===== MODAL EVENTO =====

function apriModal(evento) {
  // modalTitolo, modalCorpo, modalEvento definiti in main.js
  modalTitolo.textContent = `${evento.casa} vs ${evento.trasferta}`;

  modalCorpo.replaceChildren();

  const righe = [
    ["Data", evento.dataFormattata()],
    ["Orario", evento.ora || "—"],
    ["Lega", evento.lega || "—"],
    ["Stagione", evento.stagione || "—"],
    ["Stadio", evento.stadio || "—"],
    ["Risultato", evento.risultato() || "Non ancora disputata"],
  ];

  // border-bottom su tutte le righe: CSS rimuove quello dell'ultima via :last-child
  for (const [etichetta, valore] of righe) {
    const riga = make("div", {
      className: "d-flex justify-content-between align-items-baseline gap-3 py-2 small border-bottom modal-riga",
    });
    riga.append(
      make("span", {
        className: "fw-semibold text-muted flex-shrink-0",
        textContent: etichetta,
      }),
      make("span", { className: "text-end", textContent: valore }),
    );
    modalCorpo.append(riga);
  }

  modalEvento.hidden = false;
}

function chiudiModal() {
  modalEvento.hidden = true;
}
