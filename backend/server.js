const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3009;
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { events: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Seed data if empty
function seedIfEmpty() {
  const db = readDB();
  if (db.events.length === 0) {
    db.events = [
    {
        "id": "seed-1",
        "title": "Annual Tech Conference",
        "description": "Sample description for Annual Tech Conference. This is test data for the flaky test detection research study.",
        "category": "Conference",
        "createdAt": "2026-07-21T00:21:18.640Z",
        "status": "upcoming"
    },
    {
        "id": "seed-2",
        "title": "JavaScript Workshop",
        "description": "Sample description for JavaScript Workshop. This is test data for the flaky test detection research study.",
        "category": "Workshop",
        "createdAt": "2026-07-20T00:21:18.640Z",
        "status": "ongoing"
    },
    {
        "id": "seed-3",
        "title": "Team Building Day",
        "description": "Sample description for Team Building Day. This is test data for the flaky test detection research study.",
        "category": "Social",
        "createdAt": "2026-07-19T00:21:18.640Z",
        "status": "completed"
    },
    {
        "id": "seed-4",
        "title": "Product Launch Party",
        "description": "Sample description for Product Launch Party. This is test data for the flaky test detection research study.",
        "category": "Sports",
        "createdAt": "2026-07-18T00:21:18.640Z",
        "status": "cancelled"
    },
    {
        "id": "seed-5",
        "title": "Coding Bootcamp",
        "description": "Sample description for Coding Bootcamp. This is test data for the flaky test detection research study.",
        "category": "Concert",
        "createdAt": "2026-07-17T00:21:18.640Z",
        "status": "upcoming"
    },
    {
        "id": "seed-6",
        "title": "Design Sprint",
        "description": "Sample description for Design Sprint. This is test data for the flaky test detection research study.",
        "category": "Conference",
        "createdAt": "2026-07-16T00:21:18.640Z",
        "status": "ongoing"
    },
    {
        "id": "seed-7",
        "title": "Hackathon 2024",
        "description": "Sample description for Hackathon 2024. This is test data for the flaky test detection research study.",
        "category": "Workshop",
        "createdAt": "2026-07-15T00:21:18.640Z",
        "status": "completed"
    },
    {
        "id": "seed-8",
        "title": "Networking Evening",
        "description": "Sample description for Networking Evening. This is test data for the flaky test detection research study.",
        "category": "Social",
        "createdAt": "2026-07-14T00:21:18.640Z",
        "status": "cancelled"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all
app.get('/api/events', (req, res) => {
  const db = readDB();
  let items = db.events;
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter(i => i.title && i.title.toLowerCase().includes(q) || (i.name && i.name.toLowerCase().includes(q)));
  }
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  res.json(items);
});

// GET one
app.get('/api/events/:id', (req, res) => {
  const db = readDB();
  const item = db.events.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST create
app.post('/api/events', (req, res) => {
  const db = readDB();
  const item = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.events.push(item);
  writeDB(db);
  res.status(201).json(item);
});

// PUT update
app.put('/api/events/:id', (req, res) => {
  const db = readDB();
  const idx = db.events.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.events[idx] = { ...db.events[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.events[idx]);
});

// DELETE
app.delete('/api/events/:id', (req, res) => {
  const db = readDB();
  const idx = db.events.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.events.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Deleted successfully' });
});

// Reset endpoint for testing
app.post('/api/reset', (req, res) => {
  const initial = { events: [] };
  writeDB(initial);
  seedIfEmpty();
  res.json({ message: 'Database reset' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Event Planner' }));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Event Planner server running on http://localhost:3009'));
