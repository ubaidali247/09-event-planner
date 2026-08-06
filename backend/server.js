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
// FLAKINESS INJECTION LAYER
// Controls which endpoints behave unreliably and how often
// Used for: MSc Dissertation - AI-Assisted Flaky Test Detection
// ============================================================
const FLAKY_CONFIG = {
  enabled: true,
  slowEndpoints: ['/api/events', '/api/events/:id'],  // GET endpoints that randomly slow down
  errorEndpoints: ['/api/events'],                       // POST endpoint that randomly errors
  slowProbability: 0.35,    // 35% chance of slow response
  errorProbability: 0.25,   // 25% chance of server error on POST
  slowDelayMs: {
    min: 3000,
    max: 8000
  }
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldBeFlaky(probability) {
  return FLAKY_CONFIG.enabled && Math.random() < probability;
}

// Flakiness middleware for GET /api/events
function flakyGetMiddleware(req, res, next) {
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability)) {
    const delay = randomDelay(FLAKY_CONFIG.slowDelayMs.min, FLAKY_CONFIG.slowDelayMs.max);
    console.log(`[FLAKY] Injecting ${delay}ms delay on GET /api/events`);
    setTimeout(next, delay);
  } else {
    next();
  }
}

// ============================================================

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

// GET all - with flakiness injection
app.get('/api/events', flakyGetMiddleware, (req, res) => {
  const db = readDB();
  let items = db.events;
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.name && i.name.toLowerCase().includes(q)));
  }
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  res.json(items);
});

// GET one - with flakiness injection
app.get('/api/events/:id', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability * 0.5)) {
    const delay = randomDelay(2000, 5000);
    console.log(`[FLAKY] Injecting ${delay}ms delay on GET /api/events/${req.params.id}`);
    setTimeout(() => {
      const db = readDB();
      const item = db.events.find(i => i.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    }, delay);
  } else {
    const db = readDB();
    const item = db.events.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  }
});

// POST create - with flakiness injection (random 500 errors)
app.post('/api/events', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.errorProbability)) {
    console.log(`[FLAKY] Injecting 500 error on POST /api/events`);
    return res.status(500).json({ error: 'Internal server error - flaky injection' });
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

// Reset endpoint for testing
app.post('/api/reset', (req, res) => {
  const initial = { events: [] };
  writeDB(initial);
  seedIfEmpty();
  res.json({ message: 'Database reset' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Event Planner', flakyEnabled: FLAKY_CONFIG.enabled }));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Event Planner server running on http://localhost:3009 [FLAKY MODE: ' + FLAKY_CONFIG.enabled + ']'));
