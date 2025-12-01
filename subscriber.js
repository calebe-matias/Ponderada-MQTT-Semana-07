// subscriber.js
// Este script Node.js usa a biblioteca 'mqtt' para se subscrever a um tópico
// MQTT. Ele também gera um clientId aleatório com randomUUID() para evitar
// desconexões inesperadas quando vários clientes utilizam o mesmo ID【603943965919805†L62-L81】.
// Ao receber mensagens, o script exibe no console.
//
// Uso:
//   node subscriber.js [brokerUrl] [topic]
//   - brokerUrl: endereço do broker MQTT (padrão: mqtt://test.mosquitto.org)
//   - topic: tópico para subscrever (padrão: "topico/unico/dupla")

const mqtt = require('mqtt');
const { randomUUID } = require('crypto');

const brokerUrl = process.argv[2] || 'mqtt://test.mosquitto.org';
const topic = process.argv[3] || 'topico/unico/dupla';

// Gera clientId único para o assinante
const clientId = `subscriber_${randomUUID()}`;

const client = mqtt.connect(brokerUrl, {
  clientId,
  clean: true
});

client.on('connect', () => {
  console.log(`Subscrevendo no tópico '${topic}' com clientId ${clientId}`);
  client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error('Erro ao se subscrever:', err.message);
    } else {
      console.log('Inscrição realizada com sucesso. Aguardando mensagens...');
    }
  });
});

client.on('message', (receivedTopic, payload) => {
  const texto = payload.toString();
  console.log(`[${new Date().toISOString()}] Mensagem recebida em '${receivedTopic}': ${texto}`);
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});