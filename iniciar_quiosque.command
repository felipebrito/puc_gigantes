#!/bin/bash

# Script de Inicialização Automática - Gigantes de Porto Alegre
ROOT="$(dirname "$0")"
cd "$ROOT"

update_code() {
  echo "🔄 Verificando atualizações..."

  local config_file="server/projection-config.json"
  local backup_file="/tmp/gigantes_projection-config.backup.json"
  local status_output
  local blocking_changes

  status_output="$(git status --porcelain --untracked-files=no 2>/dev/null || true)"
  blocking_changes="$(printf '%s\n' "$status_output" | grep -v 'server/projection-config.json' | sed '/^$/d' || true)"

  if [ -n "$blocking_changes" ]; then
    echo "⚠️ Atualização automática ignorada: existem mudanças locais além do warping."
    return
  fi

  if [ -f "$config_file" ]; then
    cp "$config_file" "$backup_file"
  fi

  git fetch gigantes main >/tmp/gigantes_git_fetch.log 2>&1 || {
    echo "⚠️ Não foi possível verificar o GitHub. Continuando com a versão atual."
    return
  }

  local current_head remote_head
  current_head="$(git rev-parse HEAD 2>/dev/null || true)"
  remote_head="$(git rev-parse gigantes/main 2>/dev/null || true)"

  if [ -z "$remote_head" ] || [ "$current_head" = "$remote_head" ]; then
    echo "✅ Código já está atualizado."
    return
  fi

  echo "⬇️ Baixando atualização..."
  git pull --ff-only gigantes main >/tmp/gigantes_git_pull.log 2>&1 || {
    echo "⚠️ Falha ao atualizar automaticamente. Continuando com a versão atual."
    if [ -f "$backup_file" ]; then
      cp "$backup_file" "$config_file"
    fi
    return
  }

  if printf '%s\n' "$status_output" | grep -q 'server/projection-config.json'; then
    cp "$backup_file" "$config_file"
    echo "✅ Atualizado sem perder o warping local."
  else
    echo "✅ Atualização concluída."
  fi
}

echo "🚀 Iniciando Sistema Gigantes de Porto Alegre..."

update_code

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
  --user-data-dir="$HOME/Library/Application Support/ChromeKioskGigantes" \
  --no-first-run \
  --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required

echo "✅ Sistema iniciado!"
