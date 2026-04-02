// Patch for Node 25 (util.TextEncoder were removed, though global TextEncoder exists)
const util = require('util');
if (!util.TextEncoder) util.TextEncoder = global.TextEncoder;
if (!util.TextDecoder) util.TextDecoder = global.TextDecoder;

const express = require('express');
const https = require('https');
const http = require('http');
const os = require('os');
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
      // Se for uma URL real (http/https), ignorar o mock ou passar adiante
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return { ok: true, status: 200, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
      }
      
      const filePath = path.resolve(__dirname, url);
      if (!fs.existsSync(filePath)) {
        console.warn(`[FaceAPI] Missing local weight file for ${url}`);
        return { ok: false, status: 404 };
      }
      
      const data = fs.readFileSync(filePath);
      return {
        ok: true,
        json: async () => JSON.parse(data.toString()),
        arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      };
    } catch (e) {
      console.error(`[FaceAPI] Mock fetch error for ${url}:`, e.message);
      return { ok: false, status: 500 };
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
const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

const io = new Server(httpsServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Anexar IO ao servidor HTTP também para garantir atualizações na Unity
io.attach(httpServer);

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

// Trim e escala para 400x400.
// box = detecção faceapi — limita a varredura à região do rosto para ignorar
// pixels artefato da remoção de fundo (alpha > 50 mas longe do rosto).
async function trimTransparentRows(buffer, box) {
  const img = await loadImage(buffer);
  const { width, height } = img;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  // Região de busca: expansão generosa do box da detecção.
  // Qualquer pixel fora desta janela é artefato e deve ser ignorado.
  const srTop    = Math.max(0,          Math.round(box.y - box.height * 0.7));
  const srBottom = Math.min(height - 1, Math.round(box.y + box.height * 1.1));
  const srLeft   = Math.max(0,          Math.round(box.x - box.width  * 0.35));
  const srRight  = Math.min(width - 1,  Math.round(box.x + box.width  * 1.35));

  const alpha = (x, y) => data[(y * width + x) * 4 + 3];
  const isRowEmpty = (y) => { for (let x = srLeft; x <= srRight; x++)  if (alpha(x, y) > 50) return false; return true; };
  const isColEmpty = (x) => { for (let y = srTop;  y <= srBottom; y++) if (alpha(x, y) > 50) return false; return true; };

  let top    = srTop;    while (top < srBottom  && isRowEmpty(top))    top++;
  let bottom = srBottom; while (bottom > top    && isRowEmpty(bottom)) bottom--;
  let left   = srLeft;   while (left < srRight  && isColEmpty(left))   left++;
  let right  = srRight;  while (right > left    && isColEmpty(right))  right--;

  if (top >= bottom || left >= right) return buffer;

  const faceW = right - left + 1;
  const faceH = bottom - top + 1;

  const out = createCanvas(400, 400);
  const octx = out.getContext('2d');
  octx.clearRect(0, 0, 400, 400);

  const scale = (400 / Math.max(faceW, faceH)) * 0.95;
  const destW = faceW * scale;
  const destH = faceH * scale;
  const destX = (400 - destW) / 2;
  const destY = 400 - destH;

  octx.drawImage(canvas, left, top, faceW, faceH, destX, destY, destW, destH);

  return out.toBuffer('image/png');
}

// ─── Rotas de Páginas (URLs limpas) ───────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');

app.get('/',            (req, res) => res.sendFile(path.join(publicDir, 'dashboard.html')));
app.get('/dashboard',   (req, res) => res.sendFile(path.join(publicDir, 'dashboard.html')));
app.get('/admin',       (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/crop-tester', (req, res) => res.sendFile(path.join(publicDir, 'crop-tester.html')));

// Status de saúde do sistema (usado pelo dashboard)
app.get('/api/status', async (req, res) => {
  const checkApp = async (url) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return true;
    } catch { return false; }
  };

  const [booth, projection] = await Promise.all([
    checkApp('http://localhost:5300'),
    checkApp('http://localhost:5200'),
  ]);

  const imageCount = await new Promise(resolve => {
    fs.readdir(uploadDir, (err, files) => {
      if (err) return resolve(0);
      resolve(files.filter(f => f.startsWith('nobg-') && f.endsWith('.png')).length);
    });
  });

  const totalSize = await new Promise(resolve => {
    fs.readdir(uploadDir, (err, files) => {
      if (err) return resolve(0);
      const size = files
        .filter(f => f.startsWith('nobg-') && f.endsWith('.png'))
        .reduce((sum, f) => {
          try { return sum + fs.statSync(path.join(uploadDir, f)).size; } catch { return sum; }
        }, 0);
      resolve(size);
    });
  });

  res.json({
    server: true,
    booth,
    projection,
    uptime: process.uptime(),
    imageCount,
    totalSize,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    ip: localIP
  });
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
    const { file, topPad = 0.5, jawPad = 0.0, earPad = 0.18, neckPad = 0.65, blur = 20 } = req.body;
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

    // 4. Obter Máscara de Fundo (AI) - Full Size
    console.log(`[CropTest] Gerando máscara de fundo AI...`);
    const noBgBlob = await removeBackground(inputPath, { output: { format: 'image/png', type: 'mask' } });
    const aiMaskImg = await loadImage(Buffer.from(await noBgBlob.arrayBuffer()));

    // 5. Build Final Result (Composição Tripla)
    const finalCanvas = createCanvas(img.width, img.height);
    const fctx = finalCanvas.getContext('2d');
    fctx.drawImage(img, 0, 0);
    fctx.globalCompositeOperation = 'destination-in';
    fctx.drawImage(aiMaskImg, 0, 0); // Crop AI
    fctx.drawImage(maskCanvas, 0, 0); // Crop Landmarks
    
    const resultBuffer = await trimTransparentRows(finalCanvas.toBuffer('image/png'));

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

// Admin: lista imagens com metadados
app.get('/admin-images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Falha ao escanear diretório' });

    const images = files
      .filter(f => f.startsWith('nobg-') && /\.png$/i.test(f))
      .map(f => {
        const filePath = path.join(uploadDir, f);
        try {
          const stat = fs.statSync(filePath);
          return { name: f, url: `/uploads/${f}`, size: stat.size, createdAt: stat.mtime };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(images);
  });
});

// Admin: deletar imagem
app.delete('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Previne path traversal
  if (!filename.startsWith('nobg-') || !/\.png$/i.test(filename)) {
    return res.status(403).json({ error: 'Somente imagens processadas podem ser deletadas' });
  }
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado' });

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Falha ao deletar arquivo' });
    console.log(`[Admin] 🗑️  Deletado: ${filename}`);
    res.json({ success: true });
  });
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
    const rawImg = await loadImage(rawPath);
    console.log(`[Processing] Iniciando Recorte IA de Alta Precisão para: ${rawFileName}`);

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

      // Parâmetros do "Shoulder Killer" (Conforme 17:52)
      const topPad = 0.5, jawPad = 0.0, earPad = 0.18, neckPad = 0.7, blur = 15;

      // 2. Obter Máscara Facial (Landmarks)
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
      const startPt = getPt(0); mctx.moveTo(startPt.x, startPt.y);
      for (let i = 0; i < jawline.length - 1; i++) {
          const pt = getPt(i); const next = getPt(i + 1);
          mctx.quadraticCurveTo(pt.x, pt.y, (pt.x + next.x)/2, (pt.y + next.y)/2);
      }
      const endPt = getPt(16);
      mctx.lineTo(endPt.x, endPt.y); mctx.lineTo(rawImg.width, endPt.y);
      mctx.lineTo(rawImg.width, 0); mctx.lineTo(0, 0); mctx.lineTo(0, startPt.y);
      mctx.closePath();
      mctx.filter = `blur(${blur}px)`;
      mctx.fill();

      // JAW KILLER: apaga tudo abaixo do jawline seguindo a curva real do rosto.
      // Usa destination-out com blur suave para não criar borda dura.
      // Margem de 8% de box.height abaixo dos pontos para preservar o queixo.
      const jawMargin = box.height * 0.08;
      mctx.filter = 'blur(6px)';
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = 'black';
      mctx.beginPath();
      mctx.moveTo(0, rawImg.height);
      mctx.lineTo(0, jawline[0].y + jawMargin);
      for (let i = 0; i < jawline.length; i++) {
          mctx.lineTo(jawline[i].x, jawline[i].y + jawMargin);
      }
      mctx.lineTo(rawImg.width, jawline[16].y + jawMargin);
      mctx.lineTo(rawImg.width, rawImg.height);
      mctx.closePath();
      mctx.fill();
      mctx.filter = 'none';
      mctx.globalCompositeOperation = 'source-over';

      // 3. Obter Máscara de Fundo (AI)
      const noBgBlob = await removeBackground(rawPath, { output: { format: 'image/png', type: 'mask' } });
      const aiMaskImg = await loadImage(Buffer.from(await noBgBlob.arrayBuffer()));

      // 4. Combinar e Aplicar
      const finalCanvas = createCanvas(rawImg.width, rawImg.height);
      const fctx = finalCanvas.getContext('2d');
      fctx.drawImage(rawImg, 0, 0);
      fctx.globalCompositeOperation = 'destination-in';
      fctx.drawImage(aiMaskImg, 0, 0);
      fctx.drawImage(maskCanvas, 0, 0);
      
      buffer = await trimTransparentRows(finalCanvas.toBuffer('image/png'), box);
    } else {
      console.warn(`[Processing] Nenhum rosto detectado.`);
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      return; 
    }

    const procFileName = `nobg-${rawFileName.replace(/\.[^.]+$/, '.png')}`;
    const procPath = path.join(uploadDir, procFileName);
    fs.writeFileSync(procPath, buffer);
    console.log(`[Processing] ✂️  Recorte mágico finalizado: ${procFileName}`);

    // Broadcast
    io.emit('new_visitor', {
      id: Date.now(),
      imageUrl: `http://${req.headers.host.split(':')[0]}:3001/uploads/${procFileName}` 
    });

    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

  } catch (error) {
    console.error(`[Processing] Falha no servidor do Recorte IA para ${rawFileName}.`, error);
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    // Aqui NÃO enviamos res.status(500) pois a resposta já foi enviada no início
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

// Helper nativo para obter IP local sem dependências externas
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    for (const iface of interfaces[devName]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
};
const localIP = getLocalIP();

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] 🚀 HTTPS rodando em https://${localIP}:${PORT} (Porta do Booth)`);
});

httpServer.listen(3001, '0.0.0.0', () => {
  console.log(`[Server] 🔓 HTTP Fallback em http://${localIP}:3001 (Porta da Unity)`);
});
