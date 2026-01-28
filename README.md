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
*   **Importante**: O servidor mostrará o **IP da Rede** (ex: `https://192.168.1.5:3000`). Anote esse IP.
*   Acesse esse link no celular para testar a conexão. O navegador dará alerta de "Sua conexão não é particular" (Self-signed cert). Clique em **Avançado -> Ir para Site (Inseguro)**.

### 2. Iniciar a Projeção (Tela Grande)
```bash
cd projection
npm install
npm run dev -- --host
```
*   Acesse `https://localhost:5174` (PC) ou via IP. Aceite o certificado inseguro.

### 3. Iniciar o Photo Booth (Tablet/Celular)
```bash
cd booth
npm install
npm run dev -- --host
```
*   No celular, acesse `https://IP-DO-SEU-PC:5173`.
*   **Aceite o Certificado**: Como estamos usando HTTPS local, o Chrome/Safari vai reclamar. Clique em "Visitar site mesmo assim".
*   **Camera**: O navegador pedirá permissão de câmera. Aceite.

## 🛠 Troubleshooting Mobile
*   **Permissão de Câmera**: Só funciona em HTTPS ou Localhost. Por isso configuramos tudo para HTTPS.
*   **Erro de Certificado**: É normal. Certificados locais não são assinados por autoridades globais.
*   **Conexão**: Certifique-se que o celular e o PC estão na **mesma rede Wi-Fi**.

## 📦 Estrutura de Pastas
*   `/server`: Backend Node.js.
*   `/booth`: Frontend React do Totem.
*   `/projection`: Frontend React Three Fiber da Projeção.

## 📜 Licença
PUC-RS - Uso educacional/criativo.
