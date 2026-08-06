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

// ============================================================
// FLAKINESS INJECTION LAYER v2
// MSc Dissertation - AI-Assisted Flaky Test Detection
// Probabilities tuned for ~30-40% failure rate
// ============================================================
const FLAKY_CONFIG = {
  enabled: true,
  slowProbability: 0.30,   // 30% chance of slow GET response
  errorProbability: 0.20,  // 20% chance of 500 on POST
  slowDelayMs: { min: 2000, max: 4500 }  // Below Cypress 8s timeout but enough to cause issues
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldBeFlaky(prob) {
  return FLAKY_CONFIG.enabled && Math.random() < prob;
}

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

function seedIfEmpty() {
  const db = readDB();
  if (db.events.length === 0) {
    db.events = [
    {
        "id": "seed-1",
        "title": "Annual Tech Conference",
        "description": "Sample description for research study item 1.",
        "category": "Conference",
        "createdAt": "2024-01-01T10:00:00.000Z"
    },
    {
        "id": "seed-2",
        "title": "JavaScript Workshop",
        "description": "Sample description for research study item 2.",
        "category": "Workshop",
        "createdAt": "2024-02-02T10:00:00.000Z"
    },
    {
        "id": "seed-3",
        "title": "Team Building Day",
        "description": "Sample description for research study item 3.",
        "category": "Social",
        "createdAt": "2024-03-03T10:00:00.000Z"
    },
    {
        "id": "seed-4",
        "title": "Product Launch Party",
        "description": "Sample description for research study item 4.",
        "category": "Sports",
        "createdAt": "2024-04-04T10:00:00.000Z"
    },
    {
        "id": "seed-5",
        "title": "Coding Bootcamp",
        "description": "Sample description for research study item 5.",
        "category": "Conference",
        "createdAt": "2024-05-05T10:00:00.000Z"
    },
    {
        "id": "seed-6",
        "title": "Design Sprint",
        "description": "Sample description for research study item 6.",
        "category": "Workshop",
        "createdAt": "2024-06-06T10:00:00.000Z"
    },
    {
        "id": "seed-7",
        "title": "Hackathon 2024",
        "description": "Sample description for research study item 7.",
        "category": "Social",
        "createdAt": "2024-07-07T10:00:00.000Z"
    },
    {
        "id": "seed-8",
        "title": "Networking Evening",
        "description": "Sample description for research study item 8.",
        "category": "Sports",
        "createdAt": "2024-08-08T10:00:00.000Z"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all - 30% chance of slow response
app.get('/api/events', (req, res) => {
  const handler = () => {
    const db = readDB();
    let items = db.events;
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      items = items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.name && i.name.toLowerCase().includes(q)));
    }
    if (req.query.category) items = items.filter(i => i.category === req.query.category);
    res.json(items);
  };
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability)) {
    const delay = randomDelay(FLAKY_CONFIG.slowDelayMs.min, FLAKY_CONFIG.slowDelayMs.max);
    console.log(`[FLAKY] Slow GET /api/events +${delay}ms`);
    setTimeout(handler, delay);
  } else { handler(); }
});

// GET one
app.get('/api/events/:id', (req, res) => {
  const db = readDB();
  const item = db.events.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST - 20% chance of 500 error
app.post('/api/events', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.errorProbability)) {
    console.log(`[FLAKY] 500 error on POST /api/events`);
    return res.status(500).json({ error: 'Flaky server error - injected for research' });
  }
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

app.post('/api/reset', (req, res) => {
  writeDB({ events: [] });
  seedIfEmpty();
  res.json({ message: 'Reset complete' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Event Planner', flakyEnabled: FLAKY_CONFIG.enabled }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Event Planner running on http://localhost:3009 [FLAKY v2]'));
