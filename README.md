# Gigantes de Porto Alegre - Instalação Interativa

Project for the interactive installation where visitors are projected into a prehistoric landscape of Porto Alegre alongside giant dinosaurs.

## 🦖 Visão Geral

O sistema é composto por 3 partes principais que rodam em rede local (Offline-First):

1.  **Server (`/server`)**: O "cérebro" da operação.
    *   Node.js + Express + Socket.io.
    *   Gerencia uploads de fotos e avisa a projeção quando um novo visitante chega.
    *   Armazena as fotos na pasta `public/uploads`.
2.  **Photo Booth (`/booth`)**: O "Totem".
    *   Web App (React + Vite) rodando em tablet/celular.
    *   Tira a foto, recorta o rosto e envia para o servidor.
3.  **Projection (`/projection`)**: A "Tela".
    *   Aplicação 3D (React Three Fiber) rodando no projetor/PC Gamer.
    *   Renderiza o cenário, o dinossauro e os visitantes caminhando.

## 🚀 Como Rodar

### Pré-requisitos
*   Node.js instalado.
*   Conexão de rede entre os dispositivos (Wi-Fi Local ou Cabo).

### 1. Iniciar o Servidor
```bash
cd server
npm install
node server.js
```
*   O servidor rodará em `http://localhost:3000`.

### 2. Iniciar a Projeção (Tela Grande)
```bash
cd projection
npm install
npm run dev -- --host
```
*   Acesse pelo browser em `http://localhost:5174` (ou IP da rede).

### 3. Iniciar o Photo Booth (Tablet/Celular)
```bash
cd booth
npm install
npm run dev -- --host
```
*   Acesse pelo browser em `http://localhost:5173` (ou IP da rede).

## 🛠 Configuração de IP
Se estiver rodando em máquinas diferentes, edite o arquivo `App.jsx` dentro de `booth/src` e `projection/src` para apontar para o IP correto do computador que está rodando o servidor (ex: substituir `localhost` por `192.168.0.X`).

## 📦 Estrutura de Pastas
*   `/server`: Backend Node.js.
*   `/booth`: Frontend React do Totem.
*   `/projection`: Frontend React Three Fiber da Projeção.

## 📜 Licença
PUC-RS - Uso educacional/criativo.
