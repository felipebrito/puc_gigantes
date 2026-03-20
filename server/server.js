const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { removeBackground } = require('@imgly/background-removal-node');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const ESP32_PORT = '/dev/tty.usbserial-2120';
const BAUD_RATE = 115200;

const app = express();

// No HTTPS needed for internal APK 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for local LAN access
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve uploaded images
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp + random + ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'visitor-' + uniqueSuffix + path.extname(file.originalname));
  }
})

const upload = multer({ storage: storage });

// API Routes
app.get('/', (req, res) => {
  res.send('Prehistoric Projection Server Running');
});

// List all Visitors API
app.get('/visitors', (req, res) => {
  console.log(`[API] Requested visitors list from: ${req.headers.origin || req.ip}`);
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to scan directory' });
    }

    const fileUrls = files
      .filter(file => file.startsWith('nobg-') && /\.(jpg|jpeg|png)$/i.test(file)) // Only processed images
      .map(file => `http://${req.headers.host}/uploads/${file}`);

    res.json(fileUrls);
  });
});

// Upload Endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const rawFileName = req.file.filename;
  const rawPath = req.file.path;
  console.log(`[New Visitor] Raw Uploaded: ${rawFileName}`);

  // 1. Libera o tablet o mais rápido possível para a próxima foto
  res.json({ success: true, status: 'processing' });

  // 2. Processa assincronamente a IA de Recorte usando a CPU bruta do MacOS (Node)
  try {
    console.log(`[Processing] Removendo fundo verde via IA do NodeJS para: ${rawFileName}`);
    let blob = await removeBackground(rawPath);
    let buffer = Buffer.from(await blob.arrayBuffer());

    const procFileName = `nobg-${rawFileName}`;
    const procPath = path.join(uploadDir, procFileName);
    fs.writeFileSync(procPath, buffer);
    console.log(`[Processing] ✂️  Recorte mágico finalizado: ${procFileName}`);

    // Broadcast para a Cenografia Virtual (Projection/Unity)
    io.emit('new_visitor', {
      id: Date.now(),
      imageUrl: `http://${req.headers.host}/uploads/${procFileName}` 
    });

  } catch (error) {
    console.error(`[Processing] Falha no servidor do Recorte IA para ${rawFileName}, caindo para foto cru.`, error);
    // Fallback: Transmite a imagem com fundo bruto em caso de erro pesado no tensor 
    io.emit('new_visitor', {
      id: Date.now(),
      imageUrl: `http://${req.headers.host}/uploads/${rawFileName}`
    });
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Configurar o SerialPort (Encoder)
try {
  const port = new SerialPort({ path: ESP32_PORT, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.on('open', () => {
    console.log(`[Hardware] ✅ Conectado ao ESP8266 Encoder na porta ${ESP32_PORT}`);
  });

  parser.on('data', (data) => {
    const command = data.trim();
    if (['LEFT', 'RIGHT', 'CLICK'].includes(command)) {
      console.log(`[Encoder] Comando recebido: ${command}`);
      io.emit('encoder_action', command); // Avisa todos os Front-ends
    }
  });

  port.on('error', (err) => {
    console.error('[Hardware] ❌ Erro na Porta Serial: ', err.message);
  });
} catch (error) {
  console.error("Erro ao tentar abrir porta Serial:", error);
}

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  // console.log(`listening on *:${PORT}`);
  require('./print-ip');
});
