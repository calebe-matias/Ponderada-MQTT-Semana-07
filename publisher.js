// publisher.js
// Este script Node.js utiliza a biblioteca 'mqtt' para publicar mensagens em um
// tópico MQTT. Ele gera um identificador (clientId) aleatório para o cliente
// utilizando o método randomUUID() da biblioteca 'crypto'. O objetivo é evitar
// colisões de identificador — se dois clientes usam o mesmo clientId, o broker
// interpreta como uma reconexão e desconecta o cliente antigo【603943965919805†L62-L81】.
//
// Uso:
//   node publisher.js [brokerUrl] [topic] [mensagem]
//   - brokerUrl: endereço do broker MQTT (ex.: mqtt://test.mosquitto.org)
//   - topic: nome do tópico (ex.: "meuTopicoUnico")
//   - mensagem: texto da mensagem a ser publicada
// Se os parâmetros não forem informados, valores padrão serão utilizados.

const mqtt = require('mqtt');
const { randomUUID } = require('crypto');

// Obtém os parâmetros da linha de comando ou define valores padrão
const brokerUrl = process.argv[2] || 'mqtt://test.mosquitto.org';
const topic = process.argv[3] || 'topico/unico/dupla';
const message = process.argv.slice(4).join(' ') || 'Olá, MQTT!';

// Gera um clientId único para o publicador
const clientId = `publisher_${randomUUID()}`;

// Conecta‑se ao broker usando o clientId gerado
const client = mqtt.connect(brokerUrl, {
  clientId,
  clean: true
});

client.on('connect', () => {
  console.log(`Conectado ao broker ${brokerUrl} como ${clientId}`);
  // Publica a mensagem no tópico com QoS 0 (entrega "no máximo uma vez")
  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) {
      console.error('Erro ao publicar:', err.message);
    } else {
      console.log(`Mensagem publicada no tópico '${topic}': ${message}`);
    }
    // Encerra a conexão após publicar
    client.end();
  });
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});