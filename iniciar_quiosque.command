#!/bin/bash

# Script de Inicialização Automática - Gigantes de Porto Alegre
# Garante que o script rode na pasta onde ele está localizado
cd "$(dirname "$0")"

echo "🚀 Iniciando Sistema Gigantes de Porto Alegre..."

# 1. Limpa processos antigos (evita erro de EADDRINUSE)
echo "🧹 Limpando processos anteriores..."
pkill -f "node server/server.js"
pkill -f "vite"

# 2. Inicia o Servidor
echo "📡 Iniciando Servidor..."
cd server && npm run server > /dev/null 2>&1 &
cd ..

# 3. Inicia a Projeção
echo "🖼️ Iniciando Projeção..."
cd projection && npm run server > /dev/null 2>&1 &
cd ..

# 4. Inicia o Booth (Tablet)
echo "📱 Iniciando Booth..."
cd booth && npm run server > /dev/null 2>&1 &
cd ..

# 5. Aguarda o sistema carregar (12 segundos para garantir assets pesados)
echo "⏳ Aguardando carregamento dos assets..."
sleep 12

# 6. Abre o Chrome em modo Kiosk (Projeção)
echo "🌐 Abrindo Chrome em Modo Quiosque..."
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --app=http://localhost:5173 \
  --user-data-dir="/tmp/chrome_kiosk_gigantes" \
  --no-first-run \
  --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required

echo "✅ Sistema iniciado!"
