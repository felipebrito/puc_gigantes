# Controle do Encoder para ESP32

Esta é a pasta independente contendo os códigos de automação do ESP32 para o leitor do encoder rotativo.

## 📌 Ligações de Hardware no ESP32

As conexões com o Encoder (modelo KY-040 ou similar) são feitas seguindo a recomendação de suporte a interrupções nos pinos CLK e DT.

| Pino do Encoder | Pino no ESP32 | Função               | Tipo               |
| --------------- | ------------- | -------------------- | ------------------ |
| **CLK**         | **D5 (14)**   | Clock / Passo A      | Hardware Interrupt |
| **DT**          | **D6 (12)**   | Data / Passo B       | Hardware Interrupt |
| **SW**          | **D7 (13)**   | Switch / Botão click | Input c/ Pullup    |
| **+**           | **3V3**       | VCC / Alimentação    | -                  |
| **GND**         | **GND**       | Referência           | -                  |

## 🛠️ Códigos

1. **`encoder_control.ino`**: Este é o código principal em C++ para gravar no seu ESP32 utilizando a Arduino IDE.
   - Ele utiliza a função `attachInterrupt()` no pino D5 para ler a rotação do encoder no momento exato em que ele gira, garantindo zero perda de passos ou travamentos.
   - O pino D7 sofre polling comum no `loop()` com um sistema anti-bounce em milissegundos.
   - Os comandos enviados pela Serial são `LEFT`, `RIGHT`, e `CLICK` (Baud rate: **115200**).

2. **`bridge.js`**: Um script exemplo em Node.js (opcional) que lê os comandos que chegam na porta serial do computador caso você precise conectar esses comandos à sua aplicação web/server.

## 🚀 Como integrar à aplicação ("iremos conectar à aplicação")

Para conectar isso à aplicação Node.js (como o seu `server` ou `booth`):

1. O ESP32 pode ser conectado via **Cabo USB** ao computador onde o servidor roda. Você usaria a biblioteca `serialport` no Node.js (veja o `bridge.js`) para capturar os "LEFT", "RIGHT", "CLICK" e emitir via WebSockets (Socket.IO) para a página web controlar as telas.
2. Como alternativa (se quiser sem fio Wi-Fi/Bluetooth), o próprio ESP32 poderia se conectar ao Wi-Fi local e agir como um cliente WebSocket para o seu `Server`, ou conectar no ESP32 via Bluetooth Serial. Acima deixei o método Serial (cabo) pois é instantâneo e mais fácil de debugar a princípio.
