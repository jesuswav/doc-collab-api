import { WebSocketServer } from 'ws';  // Importación correcta para ESM
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Usa WebSocketServer en lugar de WebSocket.Server
const wss = new WebSocketServer({ server });  // ¡Corrección aquí!
const documents = new Map();

wss.on('connection', (ws, req) => {
  const documentId = req.url.split('/')[1] || 'default-doc';
  ws.id = uuidv4();
  
  if (!documents.has(documentId)) {
    documents.set(documentId, {
      content: '# Documento colaborativo',
      clients: new Set()
    });
  }

  const doc = documents.get(documentId);
  doc.clients.add(ws);

  // Enviar estado inicial
  ws.send(JSON.stringify({
    type: 'init',
    content: doc.content,
    userCount: doc.clients.size
  }));

  // Notificar a otros sobre nuevo usuario
  broadcastUserCount(documentId);

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'update') {
      doc.content = data.content;
      
      // Retransmitir a todos excepto al remitente
      doc.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'update',
            content: data.content,
            senderId: ws.id
          }));
        }
      });
    }
  });

  ws.on('close', () => {
    doc.clients.delete(ws);
    broadcastUserCount(documentId);
  });
});

function broadcastUserCount(documentId) {
  const doc = documents.get(documentId);
  const count = doc.clients.size;
  
  doc.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'user-count',
      count
    }));
  });
}