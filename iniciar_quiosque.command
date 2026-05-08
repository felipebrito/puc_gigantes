#!/bin/bash

# Script de Inicialização Automática - Gigantes de Porto Alegre
ROOT="$(dirname "$0")"
cd "$ROOT"

echo "🚀 Iniciando Sistema Gigantes de Porto Alegre..."

# 1. Limpa processos antigos
echo "🧹 Limpando processos anteriores..."
pkill -f "node server/server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# 2. Inicia os serviços (--prefix garante cwd correto sem cd)
echo "📡 Iniciando Servidor..."
npm --prefix "$ROOT/server" run server > /tmp/gigantes_server.log 2>&1 &

echo "🖼️ Iniciando Projeção..."
npm --prefix "$ROOT/projection" run server > /tmp/gigantes_projection.log 2>&1 &

echo "📱 Iniciando Booth..."
npm --prefix "$ROOT/booth" run server > /tmp/gigantes_booth.log 2>&1 &

# 3. Aguarda servidor e projeção responderem de verdade
echo "⏳ Aguardando servidor (porta 3001)..."
until curl -s http://localhost:3001 > /dev/null 2>&1; do sleep 1; done
echo "✅ Servidor OK. Aguardando projeção (porta 5200)..."
until curl -s http://localhost:5200 > /dev/null 2>&1; do sleep 1; done
echo "✅ Projeção OK."
sleep 2

# 4. Abre o Chrome em modo Kiosk
echo "🌐 Abrindo Chrome em Modo Quiosque..."
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --kiosk \
  --app=http://localhost:5200 \
  --user-data-dir="/tmp/chrome_kiosk_gigantes" \
  --no-first-run \
  --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required

echo "✅ Sistema iniciado!"
