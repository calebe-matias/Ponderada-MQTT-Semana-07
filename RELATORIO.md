# Relatório da Ponderada Semana 07
## Introdução

Nesta atividade, utilizo o protocolo **MQTT** pra avaliar requisitos de segurança. Como MQTT é um protocolo de mensagens baseado no modelo *publish/subscribe*, muito utilizado em IoT, podem haver algumas brechas de segurança. A comunicação MQTT tem três componentes: **cliente publicador**, **cliente assinante** e **broker**. Na ponderada, usei **NodeJS** para criar clientes MQTT e simular as operações de publicação e assinatura, além de ataques que afetam confidencialidade, integridade e disponibilidade.

## Escolha do cliente MQTT

Diversos clientes MQTT estão disponíveis, incluindo aplicativos móveis (MQTT Dashboard, MQTT Dash, MQTTool) e clientes web como o HiveMQ Websocket Client. Optei por desenvolver meus próprios scripts em **NodeJS** usando a biblioteca `mqtt`. Isso permitiu compreender melhor o funcionamento do protocolo e automatizar os testes. Com o NodeJS pude criar scripts para publicar, subscrever, executar ataques de flood e tampering e analisar os resultados.

## Seleção do broker público

Pesquisei brokers públicos na lista de “10 free public/private MQTT brokers for testing & prototyping” que estava disponível no Card do Adalobe. Nessa lista são apresentados brokers como **Eclipse**, **Mosquitto**, **HiveMQ**, **Flespi**, **Dioty** e **EMQX**, com endereços e portas padrão para conexões TCP e TLS. A lista alerta que brokers públicos não devem ser utilizados em produção pois qualquer dispositivo pode se conectar, publicar e subscrever sem privacidade. Escolhi o broker **test.mosquitto.org**, que opera na porta TCP 1883 e não precisa de autenticação.

## Conexão usando identificador aleatório

Cada cliente MQTT deve fornecer um **clientId** único no momento da conexão. Segundo a documentação sobre erros de clientId duplicado, o broker utiliza o clientId para gerenciar sessões; se dois clientes se conectam com o mesmo identificador, o broker não consegue distinguir entre eles e desconecta o cliente anterior. Para evitar esse problema, em todos os meus scripts gerei um identificador aleatório utilizando `randomUUID()` da biblioteca `crypto` do NodeJS. Testei também conectar dois clientes com o mesmo clientId; observei que o broker derrubou a sessão anterior, comprovando a importância de IDs únicos.

## Definição de um tópico único

No MQTT, as mensagens são roteadas por **tópicos**, que são strings hierárquicas. Escolhi um nome de tópico exclusivo (`topico/unico/dupla`) para a dupla, a fim de evitar interferência de outros usuários do broker público. Esse tópico foi utilizado tanto pelos scripts de publicação quanto pelo de assinatura.

## Execução dos testes

### Publicação e assinatura

1. **Assinante:** em um terminal executei `node subscriber.js mqtt://test.mosquitto.org topico/unico/dupla`. O script se conectou ao broker, exibiu o `clientId` gerado e aguardou mensagens.
2. **Publicador:** em outro terminal executei `node publisher.js mqtt://test.mosquitto.org topico/unico/dupla "Olá, MQTT!"`. O script se conectou e publicou a mensagem no tópico. Instantes depois, o assinante imprimiu no console a mensagem recebida. Repeti o teste com diferentes textos e notei que a entrega ocorre rapidamente, mesmo sem autenticação.
3. **ClientId duplicado:** alterei manualmente os scripts para usar um clientId fixo e executei dois publicadores simultâneos. Ao iniciar o segundo, o primeiro foi desconectado automaticamente, confirmando a regra de unicidade de clientId.

### Ataques simulados

#### 1. Ataque à Confidencialidade (Sniffing)

De acordo com a documentação da HiveMQ, o MQTT utiliza o protocolo TCP e **não cifra as mensagens por padrão**. Isso significa que qualquer pessoa conectada à mesma rede pode capturar o tráfego (por exemplo, com Wireshark) e visualizar o conteúdo das mensagens em texto claro. Para comprovar, executei o assinante e o publicador enquanto capturava o tráfego de rede; as mensagens “Olá, MQTT!” apareciam em texto puro nos pacotes filtrados pelo porto 1883. Esse teste demonstra a falta de confidencialidade quando não se utiliza TLS (porta 8883). A solução seria habilitar criptografia TLS no broker ou cifrar o payload manualmente.

#### 2. Ataque à Integridade (Tampering)

Segundo o artigo da HiveMQ sobre integridade de dados, quando não se usa TLS é necessário verificar se o payload não foi modificado por terceiros. O MQTT permite adicionar uma **assinatura digital, MAC ou checksum** ao payload para garantir que os dados não foram adulterados. Sem essas técnicas, qualquer cliente inscrito pode publicar mensagens com conteúdo falso e enganar os assinantes. Para simular esse ataque, executei `node tamper_attack.js mqtt://test.mosquitto.org topico/unico/dupla "ALERTA FALSO: temperatura=100°C"`. O assinante recebeu a mensagem adulterada como se fosse legítima. Como não havia verificação de integridade, não foi possível detectar a fraude. Uma defesa possível é adicionar um HMAC ou assinatura digital ao payload e validar no cliente, conforme sugerido pela HiveMQ.

#### 3. Ataque à Disponibilidade (DoS – Flood)

O site DoctorDroid descreve que o **client flooding** ocorre quando um cliente envia mensagens em uma taxa maior que a capacidade do broker, levando à degradação de desempenho, perda de mensagens ou travamento do servidor. Para ilustrar, executei `node flood_publish.js mqtt://test.mosquitto.org topico/unico/dupla 50`. O script enviou 50 mensagens consecutivas com intervalos de 50 ms. Observei que algumas mensagens não chegaram ao assinante e, por vezes, a conexão foi temporariamente recusada, indicando que o broker estava sobrecarregado. O script limita o número de mensagens para evitar danos maiores. Em ambientes reais, ataques de flood podem esgotar recursos do broker e impedir que dispositivos legítimos publiquem ou recebam dados. Algumas mitigações sugeridas pela EMQX incluem aplicar políticas de **rate limit** para restringir a quantidade de conexões e publicações por cliente.

## Resultados e conclusão

Os experimentos mostraram que o MQTT é fácil de usar e funciona bem pra publicar e receber mensagens, mas possui vulnerabilidades quando usado sem medidas de segurança. Conectar a um broker público expõe as mensagens e o tema a qualquer usuário, e **a falta de criptografia (TLS) permite que dados sensíveis sejam interceptados**. Além disso, **mensagens podem ser adulteradas** se não houver verificação de integridade, e o broker pode ser **sobrecarregado por floods de mensagens**, comprometendo a disponibilidade.

Para melhorar a segurança, a literatura recomenda:

* **Utilizar TLS/SSL**: conecte‑se ao broker pela porta 8883 e habilite certificados, garantindo a confidencialidade e autenticidade das mensagens.
* **Implementar autenticação e autorização**: configure usuário e senha no broker e controle quem pode publicar ou subscrever.
* **Adicionar verificação de integridade**: assine ou gere MAC no payload para detectar alterações e assegurar a origem da mensagem.
* **Aplicar rate limiting**: restrinja o número de conexões e publicações por cliente para mitigar ataques de negação de serviço.

Realizar esses ajustes é essencial para que o MQTT seja utilizado de forma segura em aplicações de IoT e em ambientes produtivos.