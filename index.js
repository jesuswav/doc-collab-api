const express = require("express");
const http = require("http");
const webSocket = require("ws");

const app = express();

const server = http.createServer(app);

const wss = new webSocket.WebSocketServer({ server });

const clients = {};

const documents = [];

// Listen WS connections
// Inicia la conexión de los clientes con e, WS
wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  // cuando in cliente envia un mensaje a otros clientes
  ws.on("message", (message) => {
    // llegada y conversión del mensaje de texto a json
    const parsedMessage = JSON.parse(message);
    console.log('mensage: ', JSON.parse(message));

    // creación del objeto que va a corresponder a cada documento
    // para mantener la lógica de conexión de los clientes separada por cada uno de los documentos
    documents.push({
        id: parsedMessage.documentId,
        content: parsedMessage.message,
        clients: {},
        clientIds: []
    });

    // se obtiene el documento correspondiente al documento con el que
    // se esta trabajando para el mensaje
    const document = documents.find(doc => doc.id === parsedMessage.documentId)

    // se guarda el ws del cliente que se conecta dentro del objeto de clientes
    // esto respetando el docuemento al que pertenece.
    document.clients[parsedMessage.id] = ws;
    // aregar el id al arreglo de clientIds
    document.clientIds.push(parsedMessage.id)

    // se verifica si el destinatario existe dentro de la lista de clientes
    if (parsedMessage.to1 && document.clients[parsedMessage.to1]) {
      console.log(document.clientIds)
      console.log(parsedMessage)

      // recorrer los ids de los clientes, para identificar su ws correspondiente
      document.clientIds.forEach((item) => {
        console.log(item)
        const targetWs = document.clients[item];

        // definición de los demás elementos del mensaje
        const documentId = parsedMessage.documentId;
        const msgToSend = parsedMessage.message;

        if (item !== parsedMessage.id) {
          targetWs.send(
            JSON.stringify({
              id: parsedMessage.id,
              message: msgToSend,
              documentId,
            })
          )
        } else {
            console.log('Este es el emisor: ', item)
        }
      })

      /* 
      const targetWs = [
        document.clients[parsedMessage.to1],
        document.clients[parsedMessage.to2],
      ];
      const documentId = parsedMessage.documentId;
      const msgToSend = parsedMessage.message;

      targetWs.forEach((socket) =>
        socket.send(
          JSON.stringify({
            id: parsedMessage.id,
            message: msgToSend,
            documentId,
          })
        )
      ); */

      /* console.log("Mensage enviado: ", parsedMessage);
      targetWs[1].send(
        JSON.stringify({
          id: parsedMessage.id,
          message: msgToSend,
          startHour: startHour,
          startMinute: startMinute,
          finishHour: finishHour,
          finishMinute: finishMinute,
          documentId: documentId,
        })
      ); */
    }
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
    for (const [id, client] of Object.entries(clients)) {
      if (client === ws) {
        delete clients[id];
        console.log(`Cliente con Id ${id} desconectado`);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("Servidor WebSocket corriendo");
});

const IP = "localhost";
const PORT = 3001;
server.listen(PORT, IP, () => {
  console.log(`Servidor corriendo http://${IP}:${PORT}`);
});
