# 🏔️ Cammini DB Server

Versione del progetto con backend SQLite locale.

## Database SQLite

Il server usa `data/cammini.sqlite` per impostazione predefinita. Per scegliere un altro file, imposta `DB_FILE` nel file `.env`. È richiesto Node.js 22 o successivo.

### Import iniziale da PostgreSQL

Per importare le tabelle `tracks`, `routes` e `photo_geolocations`, copia `.env.example` in `.env` e configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_DATABASE` (oppure `DATABASE_URL`), quindi esegui:

```bash
npm run db:migrate-sqlite
```

La migrazione importa i dati nel file indicato da `DB_FILE` (o nel percorso predefinito), aggiorna i record con lo stesso ID senza eliminare altri dati e verifica il numero di righe importate. Le credenziali PostgreSQL servono solo per questa operazione; l'applicazione avviata non si connette a PostgreSQL.

I file non necessari e gli archivi preesistenti sono conservati in `tmp/`: non occorre copiarla. `node_modules/` si ricrea con `npm install`; conserva invece `data/cammini.sqlite`, che contiene i dati dell'app.

### Avvio

```bash
npm install
npm start
```

**App per visualizzare tracce GPX e pianificare itinerari escursionistici**

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199432)

## ✨ Funzionalità

### 🏠 Home
- Vista mappa con tutti i tracciati e percorsi salvati
- Segnaposti interattivi per ogni elemento salvato
- Clicca su un segnaposto per aprire la traccia/percorso corrispondente
- Sidebar con lista di tutti i cammini salvati

### 📍 Carica GPX
- **Caricamento multiplo**: Carica più file GPX contemporaneamente
- Visualizza tracce sovrapposte su mappa interattiva con colori diversi
- Profilo altimetrico con sincronizzazione mappa ↔ grafico
- Salva e gestisci le tue tracce
- Lista tracce con checkbox per mostrare/nascondere ciascuna traccia
- **Filtro da URL**: Passa `?trackId=X` per mostrare una traccia specifica
- Esporta come GPX e KML (per Google My Maps)

### 🗺️ Calcola Percorso
- Pianifica itinerari multi-tappa
- Trascina i punti sulla mappa
- Calcola distanza e dislivelli
- **🔍 Ricerca luoghi (Geocoding)** - Nuovo!
  - Pulsante 🔍 accanto ad ogni waypoint
  - Cerca indirizzi, città, luoghi con Nominatim (OpenStreetMap)
  - Inserimento automatico coordinate e nome
- **5 servizi di routing disponibili:**
  - **BRouter** - Motore ottimizzato per sentieri e trekking ✅ **DEFAULT**
  - **OSRM** - Open Source Routing Machine (gratuito, nessuna API key)
  - **Valhalla** - Open source routing engine (gratuito via server demo)
  - **GraphHopper** - Fast open-source routing (richiede API key gratuita)
  - **OpenRouteService** - Routing professionale (richiede API key gratuita)
- Esporta percorsi come GPX
- **Filtro da URL**: Passa `?routeId=X` per mostrare un percorso specifico

### 📚 Itinerari Salvati - Sovrapposizione
- **Aggiungi più itinerari contemporaneamente sulla mappa**
- Ogni itinerario ha un colore distinto per facile identificazione
- **Profili altimetrici sincronizzati** per ogni itinerario sovrapposto
- **Hover sincronizzato**: passa il mouse sul profilo per vedere il punto sulla mappa
- Tabs per selezionare quale profilo visualizzare
- Pulsante "Modifica" per caricare un itinerario completo con waypoint ed elevazione

### 📷 Associazione Foto alle Tracce
- Associa una cartella locale di foto a una traccia salvata
- Percorso salvato nel database (associato una sola volta)
- Se la cartella non viene trovata, chiede di riassociarla
- Galleria foto scorrevole con anteprime
- **Scansione GPS**: estrae coordinate GPS dai metadata EXIF delle foto
- Foto con GPS visualizzate come marker sulla mappa
- Geolocalizzazione delle foto: Shift+Click per selezionare la foto quindi click sulla mappa per geolocalizzare
- Drag & drop marker della foto per spostarlo 
- Click su un marker foto → popup con anteprima della foto

### 🗺️ Ricerca POI (Luoghi lungo il percorso)
- Trova Hotel, Guest House, Ostelli, Campeggi, Ristoranti, Cafè e Rifugi
- Risultati raggruppati per categoria
- Ordinamento per distanza, nome o categoria
- Click su un luogo per vedere il segnaposto sulla mappa
- Segnaposto personalizzato con icona e nome del luogo

### 📥 Esporta
- Esporta tracce caricate come file GPX
- Esporta itinerari sovrapposti come file GPX
- Esporta itinerari calcolati come GPX (con waypoint separati)
- **Esporta KML**: per importazione in Google My Maps

### 🖥️ Modalità Fullscreen
- Premi ⛶ per massima immersività
- La mappa occupa tutto lo schermo
- In "Calcola Percorso" la modifica è disabilitata in fullscreen

## 🚀 Avvio

```bash
# Installa dipendenze
npm install

# Avvia l'app (server + frontend)
npm start

# Oppure solo frontend in development
npm run dev
```

- `npm run dev` - Avvia Vite dev server

- `npm run build` - Build per produzione

- `npm run preview` - Preview build

- `npm run server` - Avvia il server backend

- `npm run start` - Avvia server e dev contemporaneamente


L'app sarà disponibile su:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001

## 🧭 Navigazione

- `/` - Home (mappa con tutti i tracciati salvati)
- `/gpx` - Carica GPX (visualizza e gestisci tracce)
- `/gpx?trackId=123` - Carica GPX con filtro traccia specifica
- `/route` - Calcola Percorso (pianifica itinerari)
- `/route?routeId=123` - Calcola Percorso con filtro percorso specifico

## 🛠️ Tecnologie

- **React 18** - UI framework
- **React Router** - Navigazione con parametri URL
- **Leaflet** - Mappe OpenStreetMap
- **React-Leaflet** - Wrapper React per Leaflet
- **D3.js** - Grafico altimetrico
- **Nominatim API** - Geocoding (ricerca luoghi)
- **OSRM API** - Routing
- **Valhalla API** - Routing alternativo
- **GraphHopper API** - Routing ad alte prestazioni
- **OpenTopoData API** - Elevazione
- **Overpass API** - Punti di interesse (POI)
- **SQLite (`node:sqlite`)** - Database locale del backend

## 🆕 Ultime Novità (v1.1.0)

### 🔍 Geocoding - Ricerca Luoghi
- Pulsante 🔍 accanto ad ogni waypoint in "Calcola Percorso"
- Popup di ricerca con Nominatim (OpenStreetMap)
- Risultati in italiano con città e paese
- Click su risultato → coordinate e nome inseriti automaticamente

### 🔗 Filtro da URL
- Da Home, clicca su una traccia/percorso → si apre la pagina con filtro
- `?trackId=123` in Carica GPX mostra solo quella traccia
- `?routeId=123` in Calcola Percorso mostra solo quel percorso
- Badge "Filtro attivo" con pulsante per rimuovere il filtro

### 📷 Galleria Foto Migliorata
- Scansione automatica coordinate GPS da EXIF
- Marker sulla mappa per ogni foto geolocalizzata
- Popup con anteprima al click del marker

## 📱 Responsive

L'app è ottimizzata per:
- Desktop 💻
- Tablet 📱
- Mobile 📱

## 📄 Utility
1. `GET http://localhost:3001/api/databases` - per listare il database SQLite attivo
2. `GET http://localhost:3001/api/health` - per verificare il server e il file database
3. Per cambiare file SQLite, imposta `DB_FILE` e riavvia il server.

## 📄 Licenza

MIT License

---

Sviluppato con ❤️ per gli amanti del trekking e dei cammini