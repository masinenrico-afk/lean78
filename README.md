# LeanME

LeanME è una Progressive Web App per iPhone, offline-first, pensata come un compagno di allenamento calmo e intelligente. Decide il prossimo allenamento, riduce il carico mentale, ricorda lo storico, guida la progressione e mantiene un tono positivo.

## Filosofia

- Niente streak, sensi di colpa o pressione.
- Niente nutrizione, obiettivi di peso corporeo o loop ossessivi.
- L'app decide; l'utente si allena.
- Gerarchia della progressione: tecnica, ROM, tempo, controllo isometrico, target reps, poi carico.

## Struttura prodotto

- Home: prossimo allenamento, missione, focus settimanale, recupero, avvio rapido, promemoria backup
- Allenamento: rotazione A/B/C, check recupero, durata 30/45/60/90, range reps per esercizio, alternative manuali ricordate nel template, feedback tecnica, RPE/RIR, timer recupero
- Storico: timeline cronologica permanente
- Progressi: dashboard lifetime, record personali, andamento esercizi
- Coach: riepilogo umano, suggerimenti di progressione, stati BUILDING/CONSOLIDATING/READY/NEW LOAD, obiettivi settimanali
- Impostazioni: Autopilot, esportazione/importazione backup

## Architettura

- `lib/workouts.ts`: template, metadati esercizi, rotazione, filtro express
- `lib/analyticsEngine.ts`: volume, PR, dashboard lifetime, timeline esercizi
- `lib/progressionEngine.ts`: decisioni di progressione technique-first
- `lib/recoveryEngine.ts`: punteggio recupero e guida al mantenimento carico
- `lib/coachEngine.ts`: warmup, obiettivi settimanali, riepiloghi, vittorie
- `lib/backupEngine.ts`: formato backup JSON leggibile e validazione
- `lib/storage.ts`: persistenza IndexedDB e import/export sicuro

## PWA

- Manifest valido
- Modalità standalone su iPhone
- Apple touch icon
- Service worker
- App shell offline
- Dati locali in IndexedDB
- Accento visivo: azzurro elettrico `#00D9FF`

## Durata e progressione

- 60 minuti mantiene il programma completo; 45 minuti conserva le famiglie muscolari presenti nel template e porta le serie a due quando possibile.
- 30 minuti privilegia i movimenti principali; 90 minuti lascia spazio a volume accessorio e lavoro tecnico senza imporli.
- Il carico viene suggerito solo dopo due prestazioni stabili allo stesso peso, con tecnica adeguata, RPE non alto, RIR sufficiente e recupero valido.
- Dopo almeno 10 giorni di pausa, il primo allenamento parte intorno al 90% del precedente e non propone record.

## Backup

Esporta un JSON leggibile chiamato:

```text
LeanME_Backup_YYYY-MM-DD.json
```

Include allenamenti, template, RPE/RIR, stati progressione, storico, PR, impostazioni, note, preferenze, dati coach, recupero, versione app, versione schema e data backup.

## Avvio locale

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Installazione su iPhone

Pubblica l'app su HTTPS, aprila in Safari, poi Condividi -> Aggiungi alla schermata Home.

I dati restano sul dispositivo finché non esporti un backup.
