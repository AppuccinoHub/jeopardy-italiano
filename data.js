/* Il Tabellone — contenuti per Italiano IV Honors & AP
   Tutte le risposte sono state verificate (coniugazioni e fatti). */

const CATEGORIES = [
  {
    name: "Verbi",
    clues: [
      {
        value: 100,
        clue: "Coniuga al passato prossimo: Giulia / uscire.",
        answer: "è uscita",
        note: "Uscire vuole l’ausiliare essere; il participio si accorda al femminile singolare. Non accettare «ha uscito»."
      },
      {
        value: 200,
        clue: "Completa con l’imperfetto:\n«Ogni estate, noi ____ (andare) al mare in Campania.»",
        answer: "andavamo",
        note: "Azione abituale nel passato: si usa l’imperfetto, non il passato prossimo."
      },
      {
        value: 300,
        clue: "Coniuga al futuro semplice: tu / bere.",
        answer: "berrai",
        note: "Futuro irregolare di bere: berrò, berrai, berrà, berremo, berrete, berranno."
      },
      {
        value: 400,
        clue: "Completa col congiuntivo presente:\n«Spero che voi vi ____ (divertire) alla festa.»",
        answer: "divertiate",
        note: "Verbo riflessivo divertirsi. Congiuntivo presente: che io mi diverta, tu ti diverta, lui si diverta, noi ci divertiamo, voi vi divertiate, loro si divertano."
      },
      {
        value: 500,
        clue: "Completa il periodo ipotetico dell’irrealtà al passato:\n«Se loro ____ (partire) prima, ____ (arrivare) in orario.»",
        answer: "fossero partiti/e, sarebbero arrivati/e",
        note: "Congiuntivo trapassato + condizionale passato. Partire e arrivare vogliono essere; il participio si accorda con il soggetto (partiti/partite, arrivati/arrivate)."
      }
    ]
  },
  {
    name: "Cultura",
    clues: [
      {
        value: 100,
        clue: "Quale città toscana è considerata la culla del Rinascimento italiano?",
        answer: "Firenze",
        note: null
      },
      {
        value: 200,
        clue: "Chi ha scolpito il David conservato alla Galleria dell’Accademia di Firenze?",
        answer: "Michelangelo (Buonarroti)",
        note: "L’originale è all’Accademia; in Piazza della Signoria si trova una copia."
      },
      {
        value: 300,
        clue: "Come si chiama la tradizione napoletana di pagare un caffè in anticipo per uno sconosciuto?",
        answer: "il caffè sospeso",
        note: "Si accetta anche «caffè pagato»."
      },
      {
        value: 400,
        clue: "Quale autrice, nota con un nome d’arte, ha scritto la saga de L’amica geniale, ambientata a Napoli?",
        answer: "Elena Ferrante",
        note: "Elena Ferrante è un nome d’arte."
      },
      {
        value: 500,
        clue: "Quale movimento d’avanguardia, lanciato da Filippo Tommaso Marinetti nel 1909, esaltava la velocità, le macchine e il dinamismo?",
        answer: "il Futurismo",
        note: "Il Manifesto del Futurismo fu pubblicato su «Le Figaro» il 20 febbraio 1909."
      }
    ]
  },
  {
    name: "La città",
    clues: [
      {
        value: 100,
        clue: "Dove si comprano il pane e le pagnotte appena sfornati?",
        answer: "in panetteria / al forno",
        note: "Si accettano «la panetteria», «il forno», «dal fornaio»."
      },
      {
        value: 200,
        clue: "Quale mezzo pubblico su rotaie, spesso in superficie, è tipico di città come Milano, Roma e Torino?",
        answer: "il tram",
        note: "Non è la metropolitana, che circola soprattutto sottoterra."
      },
      {
        value: 300,
        clue: "Come si chiama l’incrocio circolare in cui il traffico gira intorno a uno spartitraffico?",
        answer: "la rotatoria",
        note: "Si accetta anche «la rotonda»."
      },
      {
        value: 400,
        clue: "Nelle città italiane, che cosa indica la sigla ZTL, spesso in vigore nel centro storico?",
        answer: "la Zona a Traffico Limitato",
        note: "È un’area in cui la circolazione dei veicoli privati è riservata o limitata. Si accetta la sigla spiegata per esteso."
      },
      {
        value: 500,
        clue: "Come si chiama la strada a scorrimento veloce che circonda una città, evitando il centro?",
        answer: "la tangenziale",
        note: "Non è l’autostrada (che collega città diverse) né il raccordo anulare, nome usato soprattutto per l’anello di Roma."
      }
    ]
  },
  {
    name: "La casa",
    clues: [
      {
        value: 100,
        clue: "In quale stanza si cucinano e si preparano i pasti?",
        answer: "la cucina",
        note: null
      },
      {
        value: 200,
        clue: "Come si chiama il mobile, di solito in camera da letto, in cui si appendono i vestiti?",
        answer: "l’armadio",
        note: "Non è il comò (cassetti) né la cassettiera."
      },
      {
        value: 300,
        clue: "Come si chiama la faccenda domestica in cui si puliscono i pavimenti con l’aspirapolvere?",
        answer: "passare l’aspirapolvere",
        note: "Si accetta anche «dare l’aspirapolvere»."
      },
      {
        value: 400,
        clue: "Come si chiama lo spazio sotto il tetto, usato spesso come ripostiglio?",
        answer: "la soffitta",
        note: "Si accetta anche «il sottotetto». Non confondere con «la cantina», che è sotto il piano terra."
      },
      {
        value: 500,
        clue: "Come si chiamano le chiusure avvolgibili, in plastica o alluminio, che si alzano e si abbassano alle finestre?",
        answer: "le tapparelle",
        note: "Non sono le persiane (ante a lamelle, spesso in legno) né gli scuri."
      }
    ]
  },
  {
    name: "Geografia",
    clues: [
      {
        value: 100,
        clue: "Qual è il capoluogo della Regione Campania?",
        answer: "Napoli",
        note: null
      },
      {
        value: 200,
        clue: "Quale fiume, il più lungo d’Italia, attraversa Torino, Piacenza e Ferrara prima di sfociare nell’Adriatico?",
        answer: "il Po",
        note: null
      },
      {
        value: 300,
        clue: "Come si chiama la catena montuosa che percorre la penisola italiana da nord a sud, formando «lo stivale»?",
        answer: "gli Appennini (l’Appennino)",
        note: "Si accettano «gli Appennini» e «l’Appennino». Non sono le Alpi, che stanno a nord."
      },
      {
        value: 400,
        clue: "Quale mare bagna la costa occidentale italiana e isole come Ischia e Capri?",
        answer: "il Mar Tirreno",
        note: "Si accetta «il Tirreno». L’Adriatico bagna la costa orientale; lo Ionio sta a sud-est."
      },
      {
        value: 500,
        clue: "Quale comune dei Campi Flegrei, sulla costa a nord-ovest di Napoli, comprende l’antica Baia e il Castello Aragonese di Baia?",
        answer: "Bacoli",
        note: "Non confondere con il Castello Aragonese d’Ischia, che si trova sull’isola di Ischia."
      }
    ]
  },
  {
    name: "Feste",
    clues: [
      {
        value: 100,
        clue: "In quale data cade Ferragosto, festa in cui molti italiani vanno al mare o in montagna?",
        answer: "il 15 agosto",
        note: "Coincide con la festa dell’Assunzione di Maria."
      },
      {
        value: 200,
        clue: "Chi porta i doni ai bambini la notte tra il 5 e il 6 gennaio, per l’Epifania?",
        answer: "la Befana",
        note: "L’Epifania si celebra il 6 gennaio."
      },
      {
        value: 300,
        clue: "Quale dolce pasquale, simile al panettone ma a forma d’uccello, è tipico della tavola di Pasqua?",
        answer: "la colomba (pasquale)",
        note: "Si accetta «la colomba» o «la colomba pasquale»."
      },
      {
        value: 400,
        clue: "Che cosa si celebra in Italia il 25 aprile?",
        answer: "la Festa della Liberazione",
        note: "Anniversario della liberazione dal nazifascismo nel 1945. Si accetta anche «la Liberazione»."
      },
      {
        value: 500,
        clue: "Il 19 settembre a Napoli si onora il santo patrono. Quale «miracolo» si attende, legato all’ampolla conservata in cattedrale?",
        answer: "la liquefazione del sangue di San Gennaro",
        note: "Si accettano «il miracolo di San Gennaro» e «la festa di San Gennaro». La festa principale è il 19 settembre."
      }
    ]
  }
];

const FINAL = {
  category: "Storia italiana",
  clue: "Il 2 giugno 1946 gli italiani furono chiamati alle urne per un referendum istituzionale. Quale forma di Stato prevalse, e quale festa nazionale ricorda ancora oggi quella data?",
  answer: "la Repubblica; la Festa della Repubblica",
  note: "Il referendum del 2–3 giugno 1946 scelse la Repubblica al posto della monarchia. Il 2 giugno è festa nazionale."
};
