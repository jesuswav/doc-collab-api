import { WebSocketServer } from 'ws';  // Importación correcta para ESM
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const documents = new Map();

let document = {
    content: '',
    propetaryId: '',
    users: []
}

wss.on('connection', (ws, req) => {
  const documentId = req.url;
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
    console.log(data)

    document.propetaryId = '16162'

    if (!document.users.includes(data.userId)) {
        document.content = data.content
        document.users.push(data.userId)
    }
    console.log(document)
    
    if (data.type === 'update') {
      doc.content = data.content;
      
      // Retransmitir a todos excepto al remitente
      document.users.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'update',
              content: document.content,
              senderId: document.pro
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