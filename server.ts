import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(process.cwd(), 'engine_config.json');
const USERS_PATH = path.join(process.cwd(), 'users_config.json');
const NOTES_PATH = path.join(process.cwd(), 'notes_config.json');

// --- Collaborative Notes Setup ---
const defaultNotes = [
  {
    id: 'note_1',
    incidentId: 'INC-2024-0000',
    content: "Initiated network capture and verified payload hash with threat intelligence databases.",
    author: "supervisor",
    timestamp: "2026-05-21T10:15:00.000Z"
  },
  {
    id: 'note_2',
    incidentId: 'INC-2024-0000',
    content: "Isolated Kevin's endpoint. Waiting for memory retrieval task to complete.",
    author: "admin",
    timestamp: "2026-05-21T10:30:12.000Z"
  },
  {
    id: 'note_3',
    incidentId: 'INC-2024-0001',
    content: "Confirmed access to git repositories containing source code. Investigating potential credential leak.",
    author: "supervisor",
    timestamp: "2026-05-21T10:05:22.000Z"
  }
];

let notes = [...defaultNotes];

try {
  if (fs.existsSync(NOTES_PATH)) {
    notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf-8'));
  } else {
    fs.writeFileSync(NOTES_PATH, JSON.stringify(defaultNotes, null, 2));
  }
} catch (e) {
  console.error('Failed to load notes:', e);
}

// --- User Management Setup ---
const defaultUsers = [
  { id: '1', username: 'supervisor', role: 'supervisor', email: 'supervisor@seeor.cyber', status: 'active', password: 'password123' },
  { id: '2', username: 'admin', role: 'admin', email: 'admin@seeor.cyber', status: 'active', password: 'password123' },
  { id: '3', username: 'auditor', role: 'auditor', email: 'audit@seeor.cyber', status: 'active', password: 'password123' }
];

let users = [...defaultUsers];

try {
  if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  } else {
    fs.writeFileSync(USERS_PATH, JSON.stringify(defaultUsers, null, 2));
  }
} catch (e) {
  console.error('Failed to load users:', e);
}

// Initial defaults or load from file
const defaultEngines = [
  'victorialogs', 'filebeat', 'logstash', 'metricbeat', 'heartbeat', 
  'auditbeat', 'fleet', 'n8n', 'zircolite', 'velociraptor', 
  'spiderfoot', 'syslog_ng', 'thehive', 'cortex', 'misp', 
  'opencti', 'arkime', 'suricata', 'zeek', 'mwdb', 
  'traefik', 'codimd', 'watchtower', 'homer', 'skywalking', 
  'snort', 'nmap'
];

let engineConfig: Record<string, any> = {};
defaultEngines.forEach(id => {
  engineConfig[id] = {
    url: id === 'victorialogs' ? (process.env.VICTORIALOGS_URL || 'http://localhost:9428') : `http://localhost:${Math.floor(Math.random() * 5000) + 8000}`,
    accountId: id === 'victorialogs' ? (process.env.VICTORIALOGS_ACCOUNT_ID || '0') : 'admin',
    projectId: id === 'victorialogs' ? (process.env.VICTORIALOGS_PROJECT_ID || '0') : 'default',
    status: 'standby'
  };
});

// Alias for SIEM legacy support
engineConfig.siem = engineConfig.victorialogs;

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    engineConfig = { ...engineConfig, ...saved };
  }
} catch (e) {
  console.error('Failed to load engine config:', e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth APIs
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/users', (req, res) => {
    // Return users without passwords
    res.json(users.map(({ password, ...u }) => u));
  });

  app.post('/api/users', (req, res) => {
    const newUser = req.body;
    if (!newUser.username) return res.status(400).json({ error: 'Username required' });
    
    newUser.id = Date.now().toString();
    users.push(newUser);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ success: true, user: newUser });
  });

  app.delete('/api/users/:id', (req, res) => {
    users = users.filter(u => u.id !== req.params.id);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ success: true });
  });

  app.patch('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      // Merge updates, ensure password isn't leaked if not provided
      users[index] = { ...users[index], ...updates };
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      const { password, ...userWithoutPassword } = users[index];
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Config API
  app.get('/api/config/engines', (req, res) => {
    res.json(engineConfig);
  });

  app.post('/api/config/engines', (req, res) => {
    const { engine, config } = req.body;
    if (engine && engineConfig[engine]) {
      engineConfig[engine] = { ...engineConfig[engine], ...config };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(engineConfig, null, 2));
      res.json({ success: true, config: engineConfig[engine] });
    } else {
      res.status(400).json({ error: 'Invalid engine name' });
    }
  });

  // VictoriaLogs Integration API (SIEM Core)
  app.get('/api/logs', async (req, res) => {
    try {
      const { url: vlogsUrl, accountId, projectId } = engineConfig.siem;
      
      const query = req.query.query as string || '*';
      const limit = req.query.limit || '50';

      console.log(`[SIEM] Querying VictoriaLogs: ${query} (Limit: ${limit})`);

      const response = await axios.get(`${vlogsUrl}/select/logsql/query`, {
        params: {
          query: `${query} | limit ${limit}`,
        },
        headers: {
          'AccountID': accountId,
          'ProjectID': projectId
        },
        // VictoriaLogs might return streamed NDJSON
        responseType: 'text'
      });

      // Transform NDJSON text to array of objects if necessary
      if (typeof response.data === 'string') {
        const lines = response.data.trim().split('\n');
        try {
          const jsonLogs = lines.map(line => JSON.parse(line));
          res.json(jsonLogs);
        } catch (e) {
          // If it happens to be plain JSON or something else
          res.send(response.data);
        }
      } else {
        res.json(response.data);
      }
    } catch (error: any) {
      console.error('VictoriaLogs Query Error:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch logs from VictoriaLogs',
        details: error.message 
      });
    }
  });

  // REST API fallback/direct routes for Collaborative Notes
  app.get('/api/notes/:incidentId', (req, res) => {
    const { incidentId } = req.params;
    const incidentNotes = notes.filter(n => n.incidentId === incidentId);
    res.json(incidentNotes);
  });

  app.post('/api/notes', (req, res) => {
    const { incidentId, content, author } = req.body;
    if (!incidentId || !content) {
      return res.status(400).json({ error: 'incidentId and content are required' });
    }

    const newNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      incidentId,
      content,
      author: author || 'supervisor',
      timestamp: new Date().toISOString()
    };

    notes.push(newNote);
    fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));

    // Broadcast to WebSocket clients if room active
    const roomClients = rooms.get(incidentId);
    if (roomClients) {
      const payload = JSON.stringify({ type: 'new_note', note: newNote });
      for (const client of roomClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }

    res.json({ success: true, note: newNote });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'SEEOR CYBER NG-SIEM' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEEOR CYBER NG-SIEM Platform Running on http://localhost:${PORT}`);
  });

  // Attach Real-Time WebSocket Server for Multi-User collaboration
  const wss = new WebSocketServer({ server });
  const rooms = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let currentRoom: string | null = null;

    ws.on('message', (messageBuffer) => {
      try {
        const data = JSON.parse(messageBuffer.toString());
        
        if (data.type === 'join') {
          const { incidentId } = data;
          currentRoom = incidentId;
          
          if (!rooms.has(incidentId)) {
            rooms.set(incidentId, new Set());
          }
          rooms.get(incidentId)!.add(ws);
          
          // Initial Sync: Send current notes for this room
          const incidentNotes = notes.filter(n => n.incidentId === incidentId);
          ws.send(JSON.stringify({ type: 'sync_notes', notes: incidentNotes }));
        } 
        
        else if (data.type === 'add_note') {
          const { incidentId, content, author } = data;
          if (!incidentId || !content) return;
          
          const newNote = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            incidentId,
            content,
            author: author || 'supervisor',
            timestamp: new Date().toISOString()
          };
          
          notes.push(newNote);
          fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
          
          // Broadcast to everyone in the room
          const roomClients = rooms.get(incidentId);
          if (roomClients) {
            const payload = JSON.stringify({ type: 'new_note', note: newNote });
            for (const client of roomClients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            }
          }
        }
      } catch (e) {
        console.error('WS Error processing message:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom)!.delete(ws);
        if (rooms.get(currentRoom)!.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    });
  });
}

startServer();
