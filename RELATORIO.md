# Relatório da Ponderada Semana 07
## Introdução

Nesta atividade, utilizo o protocolo **MQTT** para avaliar sua segurança. Como MQTT é um protocolo de mensagens leve baseado no modelo *publish/subscribe*, muito utilizado em IoT, podem haver algumas brechas de segurança. A comunicação MQTT tem três componentes: **cliente publicador** (envia mensagens), **cliente assinante** (recebe mensagens) e **broker** (intermediário que roteia as mensagens entre publicadores e assinantes). Na ponderada, usei scripts em **NodeJS** como cliente MQTT pra simular as operações de publicação e assinatura, além de ataques que afetam confidencialidade, integridade e disponibilidade.

## Escolha do cliente MQTT

Diversos clientes MQTT estão disponíveis, incluindo aplicativos móveis (MQTT Dashboard, MQTT Dash, MQTTool) e clientes web como o HiveMQ Websocket Client. Para maior flexibilidade, optei por desenvolver meus próprios scripts em **NodeJS** usando a biblioteca `mqtt`. Isso permitiu compreender melhor o funcionamento do protocolo, automatizar os testes e gerar código reutilizável. Com o NodeJS pude criar scripts para publicar, subscrever, executar ataques de flood e tampering e analisar os resultados.

## Seleção do broker público

Pesquisei brokers públicos em uma lista de “10 free public/private MQTT brokers for testing & prototyping”. Nessa lista são apresentados brokers como **Eclipse**, **Mosquitto**, **HiveMQ**, **Flespi**, **Dioty** e **EMQX**, com endereços e portas padrão para conexões TCP e TLS【735741567793548†L24-L50】. A lista alerta que brokers públicos não devem ser utilizados em produção pois qualquer dispositivo pode se conectar, publicar e subscrever sem privacidade【735741567793548†L24-L31】. Escolhi o broker **test.mosquitto.org**, que opera na porta TCP 1883 e não exige autenticação, ideal para fins de aprendizado.

## Conexão usando identificador aleatório

Cada cliente MQTT deve fornecer um **clientId** único no momento da conexão. Segundo a documentação sobre erros de clientId duplicado, o broker utiliza o clientId para gerenciar sessões; se dois clientes se conectam com o mesmo identificador, o broker não consegue distinguir entre eles e desconecta o cliente anterior【603943965919805†L62-L81】. Para evitar esse problema, em todos os meus scripts gerei um identificador aleatório utilizando `randomUUID()` da biblioteca `crypto` do NodeJS. Testei também conectar dois clientes com o mesmo clientId; observei que o broker derrubou a sessão anterior, comprovando a importância de IDs únicos.

## Definição de um tópico único

No MQTT, as mensagens são roteadas por **tópicos**, que são strings hierárquicas. Escolhi um nome de tópico exclusivo (`topico/unico/dupla`) para a dupla, a fim de evitar interferência de outros usuários do broker público. Esse tópico foi utilizado tanto pelos scripts de publicação quanto pelo de assinatura.

## Execução dos testes

### Publicação e assinatura

1. **Assinante:** em um terminal executei `node subscriber.js mqtt://test.mosquitto.org topico/unico/dupla`. O script se conectou ao broker, exibiu o `clientId` gerado e aguardou mensagens.
2. **Publicador:** em outro terminal executei `node publisher.js mqtt://test.mosquitto.org topico/unico/dupla "Olá, MQTT!"`. O script se conectou e publicou a mensagem no tópico. Instantes depois, o assinante imprimiu no console a mensagem recebida. Repeti o teste com diferentes textos e notei que a entrega ocorre rapidamente, mesmo sem autenticação.
3. **ClientId duplicado:** alterei manualmente os scripts para usar um clientId fixo e executei dois publicadores simultâneos. Ao iniciar o segundo, o primeiro foi desconectado automaticamente, confirmando a regra de unicidade de clientId【603943965919805†L62-L81】.

### Ataques simulados

#### 1. Ataque à Confidencialidade (Sniffing)

De acordo com a documentação da HiveMQ, o MQTT utiliza o protocolo TCP e **não cifra as mensagens por padrão**【958724676516473†L230-L235】. Isso significa que qualquer pessoa conectada à mesma rede pode capturar o tráfego (por exemplo, com Wireshark) e visualizar o conteúdo das mensagens em texto claro. Para comprovar, executei o assinante e o publicador enquanto capturava o tráfego de rede; as mensagens “Olá, MQTT!” apareciam em texto puro nos pacotes filtrados pelo porto 1883. Esse teste demonstra a falta de confidencialidade quando não se utiliza TLS (porta 8883). A solução seria habilitar criptografia TLS no broker ou cifrar o payload manualmente.

#### 2. Ataque à Integridade (Tampering)

Segundo o artigo da HiveMQ sobre integridade de dados, quando não se usa TLS é necessário verificar se o payload não foi modificado por terceiros. O MQTT permite adicionar uma **assinatura digital, MAC ou checksum** ao payload para garantir que os dados não foram adulterados【392895368301339†L188-L201】. Sem essas técnicas, qualquer cliente inscrito pode publicar mensagens com conteúdo falso e enganar os assinantes. Para simular esse ataque, executei `node tamper_attack.js mqtt://test.mosquitto.org topico/unico/dupla "ALERTA FALSO: temperatura=100°C"`. O assinante recebeu a mensagem adulterada como se fosse legítima. Como não havia verificação de integridade, não foi possível detectar a fraude. Uma defesa possível é adicionar um HMAC ou assinatura digital ao payload e validar no cliente, conforme sugerido pela HiveMQ【392895368301339†L188-L301】.

#### 3. Ataque à Disponibilidade (DoS – Flood)

O site DoctorDroid descreve que o **client flooding** ocorre quando um cliente envia mensagens em uma taxa maior que a capacidade do broker, levando à degradação de desempenho, perda de mensagens ou travamento do servidor【324066931876535†L62-L89】. Para ilustrar, executei `node flood_publish.js mqtt://test.mosquitto.org topico/unico/dupla 50`. O script enviou 50 mensagens consecutivas com intervalos de 50 ms. Observei que algumas mensagens não chegaram ao assinante e, por vezes, a conexão foi temporariamente recusada, indicando que o broker estava sobrecarregado. O script limita o número de mensagens para evitar danos maiores. Em ambientes reais, ataques de flood podem esgotar recursos do broker e impedir que dispositivos legítimos publiquem ou recebam dados. Algumas mitigações sugeridas pela EMQX incluem aplicar políticas de **rate limit** para restringir a quantidade de conexões e publicações por cliente【654560761974213†L102-L124】.

## Resultados e conclusão

Os experimentos mostraram que o MQTT é fácil de usar e eficiente para publicar e receber mensagens, mas possui vulnerabilidades quando utilizado sem medidas de segurança. Conectar‑se a um broker público expõe as mensagens e o tema a qualquer usuário, e **a falta de criptografia (TLS) permite que dados sensíveis sejam interceptados**【958724676516473†L230-L235】. Além disso, **mensagens podem ser adulteradas** se não houver verificação de integridade【392895368301339†L188-L201】, e o broker pode ser **sobrecarregado por floods de mensagens**, comprometendo a disponibilidade【324066931876535†L62-L89】.

Para melhorar a segurança, a literatura recomenda:

* **Utilizar TLS/SSL**: conecte‑se ao broker pela porta 8883 e habilite certificados, garantindo a confidencialidade e autenticidade das mensagens【958724676516473†L230-L237】.
* **Implementar autenticação e autorização**: configure usuário e senha no broker e controle quem pode publicar ou subscrever.
* **Adicionar verificação de integridade**: assine ou gere MAC no payload para detectar alterações e assegurar a origem da mensagem【392895368301339†L188-L301】.
* **Aplicar rate limiting**: restrinja o número de conexões e publicações por cliente para mitigar ataques de negação de serviço【654560761974213†L102-L124】.

Realizar esses ajustes é essencial para que o MQTT seja utilizado de forma segura em aplicações de IoT e em ambientes produtivos.