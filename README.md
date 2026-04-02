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
Módulo de visualização e projeção mapeada.
- **Calibração Profissional (Warp):** Sistema de Keystoning com subdivisão de malha para ajuste em superfícies irregulares.
- **Ambiente Dinâmico:** Suporte a vídeo de fundo 16:9 que preenche a tela, toggles para elementos da cena (Gigantes, Chão, Grid) e controle de pós-processamento (Bloom, DoF, Vignette).
- **Sincronização Booth:** Spawn instantâneo de novos visitantes via Socket.io com preload de texturas para evitar flickers.

## ⌨️ Atalhos de Teclado (Projeção)

| Tecla | Ação |
|---|---|
| **C** | Ativa/Desativa modo de **CALIBRAÇÃO** (Warp) |
| **1, 2, 3, 4** | Seleciona os cantos (TL, TR, BR, BL) |
| **Setas** | Move o ponto selecionado (Precisão) |
| **Shift + Setas** | Move o ponto selecionado (Rápido) |
| **S** | **SALVA** a calibração no navegador (LocalStorage) |
| **F** | Toggle Fullscreen (Nativo do Browser) |

## 🚀 Como Rodar

### Servidor Local
Vá para a raiz do repositório e execute:
```bash
npm install
npm run all
```

### Tablet (Booth)
Vá para a pasta `booth/`:
```bash
npm install
npm run build
npx cap sync android
```
No Android Studio, basta gerar o APK e rodar no tablet dinamicamente.

---
*Desenvolvido para MCT / PUCRS*
