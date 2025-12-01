# Relatório de Atividade – Cliente MQTT em Node.js

Este repositório contém os arquivos necessários para a atividade de redes/IoT em duplas.  
O objetivo é testar o protocolo MQTT utilizando um broker público, desenvolver scripts em **Node.js** que publiquem e se subscrevam em um tópico, e simular ataques que afetem **confidencialidade**, **integridade** e **disponibilidade**.

## Estrutura dos arquivos

| Arquivo                              | Descrição                                                                 |
|--------------------------------------|---------------------------------------------------------------------------|
| `publisher.js`                       | Script Node.js que publica uma mensagem em um tópico MQTT. Gera um `clientId` aleatório para evitar colisões de identificador. |
| `subscriber.js`                      | Script Node.js que se subscreve a um tópico MQTT e exibe mensagens recebidas. Também usa um `clientId` único. |
| `flood_publish.js`                   | Script que envia mensagens em alta frequência para simular um ataque de negação de serviço. Limita a 50 publicações por execução para evitar sobrecarregar brokers públicos. |
| `tamper_attack.js`                   | Script que publica uma mensagem falsa em um tópico legítimo, simulando um ataque de integridade (mensagem adulterada). |
| `RELATORIO.md`                       | Relatório técnico completo em primeira pessoa, descrevendo o passo a passo da atividade e discutindo os ataques. |

## Pré‑requisitos

1. **Node.js** instalado (versão ≥ 14).
2. **Biblioteca MQTT para Node**. Instale com:
   ```bash
   npm install mqtt
   ```

## Como executar os scripts

### 1. Escolha do broker público

No relatório escolhemos o broker público `test.mosquitto.org` (porta 1883). Esta escolha foi baseada na lista de brokers públicos onde são listadas várias opções, como Eclipse, Mosquitto e HiveMQ.

### 2. Defina um tópico único

Escolha um nome de tópico exclusivo para a dupla. No código usamos o padrão `topico/unico/dupla`. É importante que o tópico seja único para evitar interferência de outras pessoas no broker público.

### 3. Rodando o assinante

Para se subscrever no tópico:

```bash
node subscriber.js mqtt://test.mosquitto.org topico/unico/dupla
```

O script exibirá mensagens recebidas no console. Ele gera automaticamente um `clientId` aleatório e exibe quando se conecta.

### 4. Rodando o publicador

Em outro terminal, publique uma mensagem:

```bash
node publisher.js mqtt://test.mosquitto.org topico/unico/dupla "Olá! Esta é uma mensagem de teste."
```

O assinante deverá receber a mensagem. Repita o envio com diferentes textos. Teste também o que acontece se dois publicadores usarem o **mesmo** `clientId`: a sessão antiga é desconectada pelo broker.

### 5. Simulando ataques

1. **Ataque de Confidencialidade**: as mensagens MQTT são transmitidas sem criptografia por padrão, pois o protocolo utiliza TCP simples. Para demonstrar, basta capturar o tráfego com uma ferramenta como Wireshark enquanto publica mensagens; o conteúdo aparecerá em texto claro. No relatório explicamos este teste conceitual.
2. **Ataque de Integridade**: execute o script `tamper_attack.js` para publicar dados falsos no mesmo tópico, simulando a modificação de mensagens. Por não haver verificação de integridade nativa, qualquer cliente pode adulterar os dados.
   ```bash
   node tamper_attack.js mqtt://test.mosquitto.org topico/unico/dupla "ALERTA FALSO: sensor=9999"
   ```
   O assinante receberá a mensagem falsificada.
3. **Ataque de Disponibilidade (DoS)**: rode `flood_publish.js` para enviar mensagens repetidas muito rapidamente. Isso pode sobrecarregar o broker se a taxa for alta. O script limita o envio a 50 mensagens por execução para evitar causar danos.
   ```bash
   node flood_publish.js mqtt://test.mosquitto.org topico/unico/dupla 50
   ```
   Ajuste o intervalo conforme necessário para observar o comportamento do broker. No relatório comentamos os riscos de flood.

## Observação de segurança

Esta atividade utiliza um **broker público**, onde qualquer usuário pode publicar ou se subscrever, sem garantia de privacidade. O artigo que lista brokers públicos enfatiza que esses serviços não devem ser usados em produção, pois não há privacidade e qualquer dispositivo pode interagir. Use-os apenas para testes e exercícios.
