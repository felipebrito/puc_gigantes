// Exemplo de código para receber comandos do ESP32 no Node.js
// 1. Instalar a biblioteca: npm install serialport
// 2. Executar: node bridge.js

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// NOTA: Substitua o caminho '/dev/tty.SLAB_USBtoUART' pela porta correta do seu ESP32 no Mac (ex: /dev/cu.usbserial-1420)
// Você pode listar as portas com: npx @serialport/list
const ESP32_PORT = '/dev/tty.usbserial-2120'; 
const BAUD_RATE = 115200;

try {
  const port = new SerialPort({ path: ESP32_PORT, baudRate: BAUD_RATE });
  
  // O parser divide as mensagens usando a quebra de linha que o ESP32 envia pelo Serial.println
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.on('open', () => {
    console.log(`✅ Conectado ao ESP32 na porta ${ESP32_PORT}`);
  });

  // Evento disparado toda vez que o ESP32 manda LEFT, RIGHT ou CLICK
  parser.on('data', (data) => {
    const command = data.trim();
    console.log(`Comando recebido: ${command}`);

    if (command === 'LEFT') {
      // Ex: socket.emit('slide_prev');
      console.log('<- Passar página para a esquerda');
    } 
    else if (command === 'RIGHT') {
      // Ex: socket.emit('slide_next');
      console.log('Passar página para a direita ->');
    } 
    else if (command === 'CLICK') {
      // Ex: socket.emit('interact_click');
      console.log('🔘 Clique!');
    }
  });

  port.on('error', (err) => {
    console.error('❌ Erro na Porta Serial: ', err.message);
  });

} catch (error) {
  console.error("Erro ao abrir porta:", error);
}
