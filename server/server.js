// Patch for Node 25 (util.TextEncoder were removed, though global TextEncoder exists)
const util = require('util');
if (!util.TextEncoder) util.TextEncoder = global.TextEncoder;
if (!util.TextDecoder) util.TextDecoder = global.TextDecoder;

const express = require('express');
const https = require('https');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { removeBackground } = require('@imgly/background-removal-node');
const { createCanvas, loadImage, Canvas, Image, ImageData } = require('canvas');

// Load Face-API with aggressive shims for Node 25
let faceapi;
try {
  const util = require('util');
  // Monkey-patch the util module itself to ensure the library finds these
  util.TextEncoder = global.TextEncoder;
  util.TextDecoder = global.TextDecoder;
  if (!util.types) util.types = {};
  util.types.isFloat32Array = util.types.isFloat32Array || ((obj) => obj instanceof Float32Array);
  util.types.isInt32Array = util.types.isInt32Array || ((obj) => obj instanceof Int32Array);
  util.types.isUint8Array = util.types.isUint8Array || ((obj) => obj instanceof Uint8Array);
  util.types.isUint8ClampedArray = util.types.isUint8ClampedArray || ((obj) => obj instanceof Uint8ClampedArray);

  // Shims required for the browser-bundle to execute in Node
  global.window = global;
  global.navigator = { userAgent: 'node' };
  global.__dirname = __dirname;
  global.__filename = __filename;
  global.document = global.document || { 
    createElement: (tag) => {
      if (tag === 'canvas') return new Canvas(1, 1);
      return { addEventListener: () => {}, removeEventListener: () => {} };
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.addEventListener = () => {};
  global.removeEventListener = () => {};
  
  // Canvas shims for event listeners
  if (Canvas.prototype && !Canvas.prototype.addEventListener) {
    Canvas.prototype.addEventListener = () => {};
    Canvas.prototype.removeEventListener = () => {};
  }

  global.HTMLCanvasElement = Canvas;
  global.HTMLImageElement = Image;
  global.Canvas = Canvas;
  global.Image = Image;
  global.ImageData = ImageData;
  
  // Polyfill fetch to read from local disk (required when browser-bundle thinks it is in a real browser)
  global.fetch = async (url) => {
    try {
      // Convert URL to absolute local path if it is not a full URL
      const filePath = url.includes('://') ? url : path.resolve(__dirname, url);
      const data = fs.readFileSync(filePath);
      return {
        ok: true,
        json: async () => JSON.parse(data.toString()),
        arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      };
    } catch (e) {
      console.error(`[FaceAPI] Mock fetch failed for ${url}:`, e.message);
      return { ok: false, status: 404 };
    }
  };
  
  const faceapiPath = path.join(__dirname, 'node_modules/@vladmandic/face-api/dist/face-api.js');
  if (fs.existsSync(faceapiPath)) {
    const faceapiCode = fs.readFileSync(faceapiPath, 'utf8');
    // Function constructor is safer for loading minified bundles
    // We pass util, require, __dirname, and __filename to the scope
    const loader = new Function('util', 'require', '__dirname', '__filename', faceapiCode + '\nreturn faceapi;');
    faceapi = loader(util, require, __dirname, __filename);
    console.log('[FaceAPI] Browser bundle loaded and shimmed successfully');
    
    // Force CPU backend for maximum stability in Node 25
    if (faceapi.tf) {
      faceapi.tf.setBackend('cpu');
      console.log('[FaceAPI] TensorFlow backend forced to CPU');
    }
  } else {
    console.error('[FaceAPI] dist/face-api.js not found!');
  }
} catch (e) {
  console.error('[FaceAPI] Failed to load library:', e);
}

if (!faceapi) {
  console.error('[FaceAPI] CRITICAL: faceapi object not found. Node 25 compatibility failed.');
} else {
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
}

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Carregar modelos de Inteligência Artificial para Landmarks
async function loadFaceModels() {
  const weightsPath = path.join(__dirname, 'weights');
  try {
    // Tenta usar o loader de Node se estiver disponível
    if (faceapi.nets.tinyFaceDetector.loadFromDisk) {
      await faceapi.nets.tinyFaceDetector.loadFromDisk(weightsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath);
    } else {
      // Fallback para o loader de browser (usa o fetch polyfill que criamos acima)
      // O path 'weights' será resolvido pelo nosso fetch para path.resolve(__dirname, 'weights/...')
      await faceapi.nets.tinyFaceDetector.loadFromUri('weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('weights');
    }
    console.log('[FaceAPI] Modelos carregados com sucesso');
  } catch (e) {
    console.error('[FaceAPI] Erro ao carregar modelos:', e);
  }
}
loadFaceModels();

const ESP32_PORT = '/dev/tty.usbserial-2120';
const BAUD_RATE = 115200;

const app = express();

// SSL Configuration
const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

// Use HTTPS for internal APK
const server = https.createServer(options, app);

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

// Trim transparent edges, add padding and white background
async function trimTransparentRows(buffer) {
  const img = await loadImage(buffer);
  const { width, height } = img;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  const alpha = (x, y) => data[(y * width + x) * 4 + 3];
  const isRowEmpty = (y) => { for (let x = 0; x < width; x++)  if (alpha(x, y) > 10) return false; return true; };
  const isColEmpty = (x) => { for (let y = 0; y < height; y++) if (alpha(x, y) > 10) return false; return true; };

  let top = 0;    while (top < height    && isRowEmpty(top))    top++;
  let bottom = height - 1; while (bottom > top   && isRowEmpty(bottom)) bottom--;
  let left = 0;   while (left < width    && isColEmpty(left))   left++;
  let right = width - 1;  while (right > left    && isColEmpty(right))  right--;

  if (top >= bottom || left >= right) return buffer;

  const faceW = right - left + 1;
  const faceH = bottom - top + 1;
  const pad = Math.round(Math.max(faceW, faceH) * 0.08); // 8% de margem

  const outW = faceW + pad * 2;
  const outH = faceH + pad * 2;
  const out = createCanvas(outW, outH);
  const octx = out.getContext('2d');
  octx.clearRect(0, 0, outW, outH);
  octx.drawImage(canvas, left, top, faceW, faceH, pad, pad, faceW, faceH);
  return out.toBuffer('image/png');
}

// API Routes
app.get('/', (req, res) => {
  res.send('Prehistoric Projection Server Running');
});

// Crop Tester: lista imagens visitor-* disponíveis
app.get('/crop-images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json([]);
    const imgs = files.filter(f => f.startsWith('visitor-') && /\.(jpg|jpeg|png)$/i.test(f)).sort().reverse();
    res.json(imgs);
  });
});

// Crop Tester: processa landmarks + removeBackground e retorna URL
app.post('/crop-test', express.json(), async (req, res) => {
  try {
    const { file, topPad = 0.5, jawPad = 0.0, earPad = 0.15, neckPad = 0.7, blur = 12 } = req.body;
    const inputPath = path.join(uploadDir, file);
    if (!fs.existsSync(inputPath)) return res.status(404).send('Arquivo não encontrado');

    console.log(`[CropTest] Iniciando processamento de alta precisão para ${file}...`);
    const img = await loadImage(inputPath);
    
    // 1. Detectar Landmarks (fazemos isso primeiro para validar a imagem)
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const detections = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    
    if (!detections) {
      throw new Error("Nenhum rosto detectado pela IA na imagem");
    }

    const jawline = detections.landmarks.getJawOutline();
    const box = detections.detection.box;

    // 2. Detecção Facial (Usar imagem original para manter coordenadas)

    // 3. Estratégia "Neck Eraser" (Keep Head)
    const maskCanvas = createCanvas(img.width, img.height);
    const mctx = maskCanvas.getContext('2d');
    
    const offsetJaw = box.height * (jawPad || 0);
    const offsetEarEar = box.width * (earPad || 0.1);
    const offsetNeckNeck = box.width * (neckPad || 0);

    const getPt = (i) => {
        const distFromCenter = Math.abs(i - 8) / 8;
        const oEar = box.width * (earPad || 0.15);
        const oTaper = neckPad || 0.7;
        
        // V-Taper Intuitivo: estreita o pescoço conforme se afasta do queixo
        const currentSidePad = oEar * (1 - (oTaper * 1.5 * (1 - Math.pow(distFromCenter, 0.5))));
        let hShift = (i < 8) ? -currentSidePad : (i > 8 ? currentSidePad : 0);
        
        let sShaveY = 0;
        if (oTaper > 0.1 && (i < 6 || i > 10)) {
            // Limpeza vertical do trapézio
            sShaveY = -box.height * (oTaper * 0.45 * (1 - distFromCenter));
        }

        return { x: jawline[i].x + hShift, y: jawline[i].y + (box.height * (jawPad || 0)) + sShaveY };
    };

    mctx.fillStyle = 'white';
    mctx.beginPath();
    const startPt = getPt(0);
    mctx.moveTo(startPt.x, startPt.y);
    // RESTAURAR SUAVIZAÇÃO: Curvas quadráticas para contorno facial natural
    for (let i = 0; i < jawline.length - 1; i++) {
        const pt = getPt(i);
        const next = getPt(i + 1);
        mctx.quadraticCurveTo(pt.x, pt.y, (pt.x + next.x)/2, (pt.y + next.y)/2);
    }
    const endPt = getPt(16);
    mctx.lineTo(endPt.x, endPt.y);
    mctx.lineTo(img.width, endPt.y);
    mctx.lineTo(img.width, 0);
    mctx.lineTo(0, 0);
    mctx.lineTo(0, startPt.y);
    mctx.closePath();
    
    mctx.filter = `blur(${req.body.blur || 12}px)`;
    mctx.fill();

    // 3. Aplicar MÁSCARA no ORIGINAL para remover ombros PRIMEIRO (Garante alinhamento)
    const croppedCanvas = createCanvas(img.width, img.height);
    const cctx = croppedCanvas.getContext('2d');
    cctx.drawImage(img, 0, 0);
    cctx.globalCompositeOperation = 'destination-in';
    cctx.drawImage(maskCanvas, 0, 0);

    // 4. Salvar temporário para garantir estabilidade no removeBackground
    // JPEG é mais universalmente decodificado do que PNGs gerados pelo canvas em WASM
    const tempTestPath = path.join(uploadDir, `test-temp.jpg`);
    fs.writeFileSync(tempTestPath, croppedCanvas.toBuffer('image/jpeg', { quality: 0.95 }));

    // 5. Remover Fundo com estabilidade via PATH
    const finalBlob = await removeBackground(tempTestPath, { output: { format: 'image/png', type: 'foreground' } });
    let resultBuffer = Buffer.from(await finalBlob.arrayBuffer());
    resultBuffer = await trimTransparentRows(resultBuffer);
    
    // Limpar temporário
    if (fs.existsSync(tempTestPath)) fs.unlinkSync(tempTestPath);

    const outName = 'test-result.png';
    fs.writeFileSync(path.join(uploadDir, outName), resultBuffer);
    
    res.json({ 
      url: `/uploads/${outName}`,
      landmarks: {
        all: detections.landmarks.positions,
        jawline: jawline,
        box: box
      }
    });
  } catch(e) {
    console.error('[CropTest]', e);
    res.status(500).send(e.message);
  }
});

// List all Visitors API
app.get('/visitors', (req, res) => {
  console.log(`[API] Requested visitors list from: ${req.headers.origin || req.ip}`);
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to scan directory' });
    }

    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const fileUrls = files
      .filter(file => file.startsWith('nobg-') && /\.(png)$/i.test(file)) // Apenas PNGs processados (sem fundo)
      .map(file => `${baseUrl}/uploads/${file}`);

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
    const topPad = 0.5, jawPad = 0.05, earPad = 0.1, neckPad = 0.0;
    console.log(`[Processing] Iniciando Recorte IA de Alta Precisão para: ${rawFileName}`);

    const rawImg = await loadImage(rawPath);
    
    // 1. Detectar Landmarks
    const canvas = createCanvas(rawImg.width, rawImg.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(rawImg, 0, 0);
    const detections = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    
    let buffer;
    if (detections) {
      console.log(`[Processing] Rosto detectado. Aplicando estratégia "Shoulder Killer" 2026.`);
      const jawline = detections.landmarks.getJawOutline();
      const box = detections.detection.box;

      // Parâmetros salvos como padrão Biométrico Pro (Zero Neck/Shoulder)
      // Parâmetros verificados pelo usuário como ideais
      const topPad = 0.5, jawPad = 0.0, earPad = 0.15, neckPad = 0.7, blur = 12;

      // 2. Criar a Máscara "Shoulder Killer" (COORDENADAS ORIGINAIS)
      const maskCanvas = createCanvas(rawImg.width, rawImg.height);
      const mctx = maskCanvas.getContext('2d');
      
      const getPt = (i) => {
          const distFromCenter = Math.abs(i - 8) / 8;
          const oEar = box.width * earPad;
          const oTaper = neckPad;
          const currentSidePad = oEar * (1 - (oTaper * 1.5 * (1 - Math.pow(distFromCenter, 0.5))));
          let hShift = (i < 8) ? -currentSidePad : (i > 8 ? currentSidePad : 0);
          let sShaveY = 0;
          if (oTaper > 0.1 && (i < 6 || i > 10)) {
              sShaveY = -box.height * (oTaper * 0.45 * (1 - distFromCenter));
          }
          return { x: jawline[i].x + hShift, y: jawline[i].y + (box.height * jawPad) + sShaveY };
      };

      mctx.fillStyle = 'white';
      mctx.beginPath();
      const startPt = getPt(0);
      mctx.moveTo(startPt.x, startPt.y);
      for (let i = 0; i < jawline.length - 1; i++) {
          const pt = getPt(i);
          const next = getPt(i + 1);
          mctx.quadraticCurveTo(pt.x, pt.y, (pt.x + next.x)/2, (pt.y + next.y)/2);
      }
      const endPt = getPt(16);
      mctx.lineTo(endPt.x, endPt.y);
      mctx.lineTo(rawImg.width, endPt.y);
      mctx.lineTo(rawImg.width, 0);
      mctx.lineTo(0, 0);
      mctx.lineTo(0, startPt.y);
      mctx.closePath();
      
      mctx.filter = `blur(${blur}px)`;
      mctx.fill();

      // 3. Aplicar MÁSCARA no ORIGINAL para remover ombros PRIMEIRO
      const croppedCanvas = createCanvas(rawImg.width, rawImg.height);
      const cctx = croppedCanvas.getContext('2d');
      cctx.drawImage(rawImg, 0, 0);
      cctx.globalCompositeOperation = 'destination-in';
      cctx.drawImage(maskCanvas, 0, 0);

      // 4. Salvar temporário como JPEG para máxima compatibilidade com WASM/imgly
      const tempPath = path.join(uploadDir, `temp-${rawFileName.replace(/\.[^.]+$/, '.jpg')}`);
      fs.writeFileSync(tempPath, croppedCanvas.toBuffer('image/jpeg', { quality: 0.95 }));

      // 5. Remover Fundo com estabilidade via PATH
      let noBgBlob;
      try {
        noBgBlob = await removeBackground(tempPath, { output: { format: 'image/png', type: 'foreground' } });
      } catch (e) {
        console.error(`[BackgroundRemoval] Falha no WASM com arquivo temporário. Tentando fallback...`, e);
        // Fallback: Tenta com a imagem original se o crop falhou no decoder
        noBgBlob = await removeBackground(rawPath, { output: { format: 'image/png', type: 'foreground' } });
      }
      
      buffer = Buffer.from(await noBgBlob.arrayBuffer());
      buffer = await trimTransparentRows(buffer);

      // Limpar temporário
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } else {
      console.warn(`[Processing] Nenhum rosto detectado em ${rawFileName}. Usando remoção de fundo padrão.`);
      const blob = await removeBackground(rawPath, { output: { format: 'image/png', type: 'foreground' } });
      buffer = Buffer.from(await blob.arrayBuffer());
      buffer = await trimTransparentRows(buffer);
    }

    const procFileName = `nobg-${rawFileName.replace(/\.[^.]+$/, '.png')}`;
    const procPath = path.join(uploadDir, procFileName);
    fs.writeFileSync(procPath, buffer);
    console.log(`[Processing] ✂️  Recorte mágico finalizado: ${procFileName}`);

    // Broadcast para a Cenografia Virtual (Projection/Unity)
    io.emit('new_visitor', {
      id: Date.now(),
      imageUrl: `https://${req.headers.host}/uploads/${procFileName}` 
    });

  } catch (error) {
    console.error(`[Processing] Falha no servidor do Recorte IA para ${rawFileName}, caindo para foto cru.`, error);
    // Fallback: Transmite a imagem com fundo bruto em caso de erro pesado no tensor 
    io.emit('new_visitor', {
      id: Date.now(),
      imageUrl: `https://${req.headers.host}/uploads/${rawFileName}`
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

/* 
// Configurar o SerialPort (Encoder) - Desativado por não haver Hardware conectado
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
*/

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  // console.log(`listening on *:${PORT}`);
  require('./print-ip');
});
