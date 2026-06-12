#!/bin/bash

# Garante que o script rode na pasta onde ele está localizado
cd "$(dirname "$0")"

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

echo "🦕 Iniciando Ecossistema Gigantes (Server + Booth + Projection)..."

update_code

# 1. Inicia o servidor e os apps em background
# O 'npm start' roda o servidor na 3000, booth na 5300 e projection na 5200
npm start &

# 2. Aguarda o servidor e a projeção ficarem disponíveis (polling real)
echo "⏳ Aguardando servidor (porta 3000)..."
until curl -sk http://localhost:3000 > /dev/null 2>&1; do sleep 1; done
echo "✅ Servidor OK. Aguardando projeção (porta 5200)..."
until curl -sk http://localhost:5200 > /dev/null 2>&1; do sleep 1; done
echo "✅ Projeção OK."
sleep 2

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
