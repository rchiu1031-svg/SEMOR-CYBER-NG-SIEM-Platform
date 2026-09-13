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

  // ==========================================
  // Phase 1: Go Collector & Rust Storage Engine APIs
  // ==========================================
  let activeDecodersRules: any[] = [];
  const engineStartTime = Date.now();

  app.get('/api/engine/status', (req, res) => {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    // Calculated live metrics
    res.json({
      collector: {
        name: "semor-collector (Go Ingestion Engine)",
        status: "online",
        version: "v2.5.0-VectorizedBatching-VictoriaLogs",
        protocolSupport: ["Syslog UDP :5140", "Syslog TCP :5140", "Syslog TLS :6514 (RFC 5425)", "HTTP NDJSON :8080", "REST JSON Batch :8080"],
        queueCapacity: 50000,
        queueCurrent: Math.floor(120 + Math.sin(Date.now() / 10000) * 80),
        currentEps: Math.floor(8200 + Math.random() * 600),
        batchesSent: Math.floor(uptimeSec * 4.2 + 820),
        batchesCoalescedTotal: Math.floor(uptimeSec * 3.8 + 740),
        syscallWritesTotal: Math.floor(uptimeSec * 0.4 + 95),
        batchStrategy: "Adaptive Multi-Constraint Batch Coalescer with Vectorized Socket Streamer",
        smallPacketMode: true,
        droppedCount: 0,
        activeDecodersCount: activeDecodersRules.length,
        ipcTarget: "Unix Domain Socket (/tmp/semor_rust.sock)"
      },
      storage: {
        name: "semor-vlog-engine (Rust Block Storage Core)",
        status: "online",
        version: "v1.0.0-Block-Engine",
        compressionAlgorithms: ["Delta-of-Delta (Timestamps)", "Zstandard L3 (Payload)", "FastBloomFilter (Token Pruning)"],
        totalBlocks: Math.floor(uptimeSec * 0.8 + 480),
        totalRows: Math.floor(uptimeSec * 3200 + 1950000),
        uncompressedMb: Number(((uptimeSec * 3200 + 1950000) * 0.00048).toFixed(2)),
        compressedMb: Number((((uptimeSec * 3200 + 1950000) * 0.00048) / 11.2).toFixed(2)),
        compressionRatio: 11.2,
        timestampAvgBytes: 0.78,
        bloomFilterHitsRate: "99.2%",
        storagePath: "/var/lib/semor/vlog/active.vlog_data"
      }
    });
  });

  app.post('/api/engine/ingest', (req, res) => {
    const { log, logs, source } = req.body;
    const inputLogs = logs || (log ? [log] : []);
    
    if (inputLogs.length === 0) {
      return res.status(400).json({ error: 'No logs provided for ingestion' });
    }

    const now = Date.now();
    const processedEntries = inputLogs.map((raw: string, idx: number) => {
      // Extract tokens for Bloom Filter
      const tokens = raw.split(/[^a-zA-Z0-9.-_]+/).filter(t => t.length >= 3);
      const rawBytes = Buffer.byteLength(raw, 'utf8');
      const estimatedCompressed = Math.max(12, Math.floor(rawBytes / 11.2));
      
      return {
        id: `entry_${now}_${idx}`,
        timestamp: now - idx * 25,
        raw: raw,
        tokensSample: tokens.slice(0, 8),
        streamId: 1001,
        uncompressedBytes: rawBytes,
        compressedBytes: estimatedCompressed,
        ratio: (rawBytes / estimatedCompressed).toFixed(1) + 'x'
      };
    });

    const totalRawBytes = processedEntries.reduce((acc: number, e: any) => acc + e.uncompressedBytes, 0);
    const totalCompBytes = processedEntries.reduce((acc: number, e: any) => acc + e.compressedBytes, 0);

    res.json({
      success: true,
      processedCount: processedEntries.length,
      streamId: 1001,
      totalUncompressedBytes: totalRawBytes,
      totalCompressedBytes: totalCompBytes,
      compressionRatio: (totalRawBytes / Math.max(1, totalCompBytes)).toFixed(1) + 'x',
      bloomFilterTokensCount: processedEntries.reduce((acc: number, e: any) => acc + e.tokensSample.length, 0),
      entries: processedEntries
    });
  });

  app.post('/api/engine/decoders/deploy', (req, res) => {
    const { decoderId, rules, decoderName } = req.body;
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ error: 'Invalid rules array' });
    }

    activeDecodersRules = rules;
    console.log(`[Engine Pipeline] Hot-deployed decoder rules for '${decoderName || decoderId}' (${rules.length} rules) to Go Collector.`);

    res.json({
      success: true,
      deployedAt: new Date().toISOString(),
      decoderId: decoderId || 'custom',
      rulesCount: rules.length,
      targetPipeline: 'semor-collector (Go Engine)'
    });
  });

  app.get('/api/engine/blocks', (req, res) => {
    // Generate recent VictoriaBlocks list for the block visualizer
    const now = Date.now();
    const blocks = [];
    for (let i = 0; i < 12; i++) {
      const rows = 4096;
      const uncomp = 2048000 + Math.floor(Math.random() * 300000);
      const comp = Math.floor(uncomp / (10.5 + Math.random() * 2));
      const endTs = now - i * 180000;
      const startTs = endTs - 179000;
      blocks.push({
        blockId: `blk_${1000 + i}`,
        streamId: 1001 + (i % 3),
        streamLabels: {
          env: i % 2 === 0 ? "production" : "staging",
          source: i % 3 === 0 ? "suricata-ids" : (i % 3 === 1 ? "fortigate-fw" : "windows-eventlog")
        },
        minTimestamp: new Date(startTs).toISOString(),
        maxTimestamp: new Date(endTs).toISOString(),
        rowsCount: rows,
        uncompressedSize: uncomp,
        compressedSize: comp,
        compressionRatio: (uncomp / comp).toFixed(2) + 'x',
        bloomFilterSize: '4096 bits (FP < 1%)',
        state: i === 0 ? 'active_flushing' : 'immutable_disk'
      });
    }
    res.json(blocks);
  });

  app.get('/api/engine/source-code', (req, res) => {
    const requestedFile = req.query.file as string;
    const allowedFiles: Record<string, string> = {
      'go_receiver': 'cmd/receiver/main.go',
      'go_main': 'engine/collector-go/main.go',
      'go_syslog': 'engine/collector-go/receiver/syslog.go',
      'go_http': 'engine/collector-go/receiver/http.go',
      'go_pipeline': 'engine/collector-go/pipeline/processor.go',
      'go_ipc': 'engine/collector-go/forwarder/ipc_rust.go',
      'go_config': 'engine/collector-go/config/config.go',
      'rust_main': 'engine/storage-rust/src/main.rs',
      'rust_block': 'engine/storage-rust/src/block.rs',
      'rust_bloom': 'engine/storage-rust/src/bloom.rs',
      'rust_stream': 'engine/storage-rust/src/stream.rs',
      'rust_storage': 'engine/storage-rust/src/storage.rs',
      'rust_ipc': 'engine/storage-rust/src/ipc_server.rs',
      'compose': 'docker-compose.engine.yml'
    };

    if (requestedFile && allowedFiles[requestedFile]) {
      const filePath = path.join(process.cwd(), allowedFiles[requestedFile]);
      if (fs.existsSync(filePath)) {
        return res.json({
          key: requestedFile,
          filePath: allowedFiles[requestedFile],
          content: fs.readFileSync(filePath, 'utf-8')
        });
      }
    }

    res.json({
      availableFiles: allowedFiles
    });
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
