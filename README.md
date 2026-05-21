# PUC Dinossauros POA — Gigantes

Este repositório contém o ecossistema de captura de fotos e cenografia virtual para a exposição interativa dos dinossauros. 

## 🏗️ Arquitetura do Sistema

O projeto é dividido em três módulos principais que trabalham de forma sincronizada:

### 1. 📱 Booth (Tablet Android)
Aplicação React + Vite empacotada com Capacitor para rodar em modo Fullscreen Kiosk.
- **Detecção Facial Local:** Utiliza `face-api.js` para rastreamento em tempo real (68 landmarks).
- **Recorte Híbrido:** Aplica um recorte geométrico em "V" (Jawline Clip) para isolar o rosto e remover o corpo/tórax antes do envio.
- **Comunicação:** Envia a foto isolada via HTTP para o servidor local.

### 2. 🖥️ Server (Node.js MacOS)
Servidor central que processa o "trabalho pesado" da Inteligência Artificial.
- **Recorte Biométrico "Shoulder Killer":** Algoritmo proprietário que utiliza FaceAPI (68 landmarks) para isolar o rosto com precisão cirúrgica.
    - **Zero Neck:** Recorte exato na linha da mandíbula para remover golas e pescoço.
    - **V-Taper Suave:** Suavização quadrática que afunila os ombros mantendo o contorno facial natural.
- **Background Removal:** Utiliza `@imgly/background-removal-node` (WASM) para remover o fundo preservando cabelos e detalhes.
- **Normalização por distância:** Saída sempre 400×400 px com proporção invariante — rosto preenche ~95% independente da distância da foto. Ver [`server/PIPELINE_CROP.md`](server/PIPELINE_CROP.md) para detalhes técnicos.
- **Socket.io Bridge:** Notifica instantaneamente a Unity e a Projeção sobre novos visitantes.
- **Gerenciamento:** Serve como diretório de uploads e ponte de hardware para encoders/sensores.

### 3. 📺 Projection / Virtual Scene
Módulo de visualização e projeção mapeada em React Three Fiber.
- **Calibração Profissional (Warp):** Sistema de Keystoning com subdivisão de malha para ajuste em superfícies irregulares. Pontos preservados ao entrar/sair do modo de edição.
- **Camadas de Vídeo:** BG independente (H.264) + FG com transparência nativa via WebM VP9 alpha — sem dessincronia por ser um único arquivo.
- **Posicionamento de Visitantes:** Teclas A/S ajustam a altura dos personagens em tempo real, salvo automaticamente ao soltar.
- **Menu GUI:** Retraído por padrão, abre/fecha com M. Inclui controles de pós-processamento (Bloom, DoF, Vignette, Noise), presets e modo luma.
- **Sincronização Booth:** Spawn instantâneo de novos visitantes via Socket.io com preload de texturas para evitar flickers. Pool das últimas 10 fotos, sem duplicatas em tela.

## ⌨️ Atalhos de Teclado (Projeção)

| Tecla | Ação |
|---|---|
| **C** | Entra/sai do modo de **CALIBRAÇÃO** (Warp) |
| **1, 2, 3, 4** | Seleciona os cantos (TL, TR, BR, BL) |
| **Setas** | Move o ponto selecionado (Precisão) |
| **Shift + Setas** | Move o ponto selecionado (Rápido) |
| **S** | **SALVA** a calibração (LocalStorage) |
| **A / S** | Move visitantes para **cima / baixo** |
| **Shift + A / S** | Move visitantes (passo maior) |
| **M** | Abre/fecha o **menu** de configurações |

## 🎬 Formato de Vídeo

| Layer | Formato | Codec | Observação |
|---|---|---|---|
| BG (fundo) | `.mp4` | H.264 High, CRF 23 | `faststart`, sem áudio |
| FG (foreground) | `.webm` | VP9 + alpha (yuva420p) | Transparência nativa, sem luma separado |

Para gerar o WebM com alpha a partir de FG + matte:
```bash
ffmpeg -i FG.mp4 -i LUMMA.mp4 \
  -filter_complex "[0:v]format=yuva420p[fg];[1:v]format=gray[alpha];[fg][alpha]alphamerge[out]" \
  -map "[out]" -c:v libvpx-vp9 -crf 30 -b:v 0 -auto-alt-ref 0 FG_alpha.webm
```

## 🚀 Como Rodar

```bash
npm install
npm start   # inicia server + projection + booth + abre dashboard
```

### Tablet (Booth)
```bash
cd booth
npm install && npm run build
npx cap sync android
```
No Android Studio, gerar APK e rodar no tablet.

---

## 📋 Changelog

### 2026-05-20

**Booth — Controles de Câmera (Zoom, Crop, Filtros)**
- Adicionados controles de **Zoom** (1×–4×), **Offset Horizontal/Vertical** e **Espelhamento (Flip)** para compensar lentes wide-angle
- Filtros de imagem em tempo real: **Brilho**, **Contraste**, **Saturação** (aplicados via CSS `filter` no preview e na foto capturada)
- Interface reorganizada para **modo paisagem (horizontal)** — câmera à esquerda, controles à direita
- Painel de configurações oculto no modo kiosk: acesso via **toque longo (3s) no canto superior direito**
- Todas as configurações **persistidas por tablet** via `localStorage` (zoom, offsets, filtros, flip sobrevivem a reloads e reboot)
- `cameraSettings` incluído no payload enviado ao servidor para processamento consistente

**Projection — Atualização de Vídeo BG**
- Substituído vídeo de fundo para **Ambiente 8 v16**: convertido com `ffmpeg` H.264 High CRF 23 `faststart` (712 MB → 43 MB)
- `DEFAULT_CONFIG.bgVideoUrl` atualizado para `/videos/v5/8_bg_v16.mp4`
- `.gitignore` atualizado para excluir arquivos de vídeo de produção (`.mp4`, `.webm` em `projection/public/videos/`)

### 2026-04-14
- Atualiza cena para vídeos **v4** (BG 677MB→52MB, FG+LUMA 524MB→9.3MB WebM alpha)

### 2026-04-13
- **Warp:** `setEnabled` corrigido para não resetar offsets ao pressionar C — pontos preservados
- **FG layer:** substituído luma matte shader por **WebM VP9 com alpha nativo** (sem dessincronia)
- **VideoLayers:** FG e LUMA iniciavam com drift — substituído por arquivo único WebM
- **A/S:** movimentação vertical dos visitantes sem causar reset de posição X (grupos separados)
- **Menu M:** GUI lil-gui inicia retraído, abre/fecha com M; C reservado exclusivamente para calibração
- **VideoLayers v1:** BG + FG com luma matte GLSL shader + sync por evento `loop`
- Vídeos otimizados com ffmpeg: BG 710MB→38MB, FG 325MB→2MB, LUMA→4MB

### Anterior
- `npm start` unificado abre dashboard automaticamente
- Deduplicação de visitantes em tela, pool das últimas 10 fotos
- Jaw killer segue curva da mandíbula para eliminar colarinho lateral
- Warp profissional com subdivisão de malha (v0.6.0)
- Pipeline sprite sheet Three.js

---
*Desenvolvido para MCT / PUCRS*
