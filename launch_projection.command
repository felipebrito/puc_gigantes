#!/bin/bash

# Garante que o script rode na pasta onde ele está localizado
cd "$(dirname "$0")"

echo "🦕 Iniciando Ecossistema Gigantes (Server + Booth + Projection)..."

# 1. Inicia o servidor e os apps em background
# O 'npm start' roda o servidor na 3000, booth na 5300 e projection na 5200
npm start &

# 2. Aguarda o sistema subir (modelos 3D podem demorar)
echo "⏳ Aguardando inicialização (12 segundos)..."
sleep 12

# 3. Abre o Chrome em modo Kiosk apontando para a Projeção (Porta 5200)
echo "📺 Abrindo Projeção no Chrome..."
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --app=http://localhost:5200 \
  --user-data-dir="/tmp/chrome_kiosk_gigantes" \
  --no-first-run \
  --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required \
  --ignore-certificate-errors

# Obs: Se precisar abrir o Dashboard também, ele abrirá na aba padrão do sistema pelo npm start.
