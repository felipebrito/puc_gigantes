# projection — Three.js Scene

App React/Vite que renderiza a cena de projeção do **Gigantes de Porto Alegre**.

## Stack

| Lib | Versão | Uso |
|---|---|---|
| react-three-fiber | ^9 | Bridge React ↔ Three.js |
| @react-three/drei | ^10 | Helpers (Billboard, Text, useTexture…) |
| @react-three/postprocessing | ^3 | Pipeline de pós-processamento |
| three | ^0.182 | Renderer 3D |
| lil-gui | ^0.20 | Painel de configuração em tempo real |
| socket.io-client | ^4 | Eventos do servidor (nova foto) |

## Rodar localmente

```bash
cd projection
npm install
npm run dev       # http://localhost:5200
```

Requer servidor Node.js em `http://localhost:3001` (ver `../server/`).

---

## Arquitetura

```
App.jsx
 └── Scene
      ├── Dinosaur          (GLB, posição fixa)
      ├── Visitor × N       (personagens caminhando)
      │    └── SpriteCharacter  (sprite sheet animado + overlay de foto)
      ├── EffectComposer    (pós-processamento)
      └── Billboard (texto GIGANTES DE PORTO ALEGRE + contador)
```

---

## Componentes

### `App.jsx`

Ponto de entrada. Gerencia:

- **Pool de fotos** — poll a cada 10s em `GET /visitors`; preload de texturas antes do spawn
- **Spawn de visitantes** — timer configurável (padrão 2.5s); um personagem por intervalo
- **Socket** — evento `new_visitor` spawna personagem imediatamente com a foto recebida
- **Configurador lil-gui** — painel em tempo real com todos os parâmetros (ver tabela abaixo)
- **Sistema de Presets** — salvar/carregar configurações por nome via `localStorage`;
  exportar como JSON; auto-save a cada mudança; versionamento de compatibilidade

#### Parâmetros — "Personagem Sprite"

| Parâmetro | Padrão | Descrição |
|---|---|---|
| FPS animação | 14 | Frames por segundo do walk cycle |
| Altura corpo | 2.0 | Altura do sprite em unidades 3D |
| Posição Y cabeça | 0.82 | Fração da altura onde a foto é centrada |
| Tamanho foto | 0.54 | Largura da foto como fração da largura do corpo |
| Offset X cabeça | 0.0 | Deslocamento horizontal da foto |
| Movimento cabeça | true | Ativa head bob |
| Amplitude bob | 0.005 | Amplitude vertical do head bob (unidades 3D) |
| Escala mín/máx | 1.2 / 1.4 | Range de escala aleatória por personagem |
| Vel. mín/máx | 0.8 / 1.2 | Range de velocidade de travessia (unidades/s) |
| Intervalo spawn | 2.5 s | Segundos entre spawns automáticos |
| Labels debug | false | Exibe `v:` e `s:` ao lado de cada personagem |

#### Parâmetros — "Pós-Processamento"

| Pasta | Parâmetros | |
|---|---|---|
| Cores | Ativar, Brilho, Contraste, Matiz, Saturação | desativado por padrão |
| Bloom | Ativar, Intensidade (0–5), Threshold (0–1) | desativado por padrão |
| Vignette | Ativar, Escurecimento (0–1), Offset (0–1) | desativado por padrão |
| Noise (Film Grain) | Ativar, Opacidade (0–1) | desativado por padrão |
| Profundidade (DoF) | Ativar, Z Target (-20–15), Focal Length (0–0.1), Bokeh Scale (0–30) | desativado por padrão |

> **DoF — foco na cena:**
> Câmera em Z=45. Personagens nascem entre Z=2 e Z=8. Dinossauro em Z=-15.
> Para focar personagens e borrar o fundo, use **Z Target entre 2 e 8**.

#### Botões
- **▶ Adicionar visitante** — spawna um personagem com foto aleatória do pool
- **✕ Remover todos** — limpa todos os personagens da cena
- **💾 Salvar preset** — salva estado atual com nome customizável
- **📂 Carregar preset** — restaura estado salvo pelo nome
- **⬇️ Exportar JSON** — download do preset atual
- **↩️ Resetar padrão** — restaura todos os valores de fábrica

---

### `SpriteCharacter.jsx`

Renderiza um personagem com:
- **Corpo** — plane com UV offset animado sobre o sprite sheet
- **Face** — plane transparente sobreposto na posição da cabeça
- **Head bob** — `sin` com fase aleatória por personagem (evita sincronismo visual)
- **Geometria dinâmica** — recalculada via `useFrame` quando parâmetros mudam;
  zero re-renders React ao ajustar sliders

#### Props

| Prop | Padrão | Descrição |
|---|---|---|
| `faceUrl` | — | URL da foto do visitante (servidor) |
| `sheetUrl` | `character_walk_new_character_4x3_12f.png` | Sprite sheet |
| `meta` | `{cols:4, rows:3, frameCount:12, frameWidth:256, frameHeight:512}` | Layout do sheet |
| `scale` | 1 | Escala global |
| `direction` | 1 | 1 = direita, -1 = esquerda (espelha sprite) |
| `phaseOffset` | 0 | Fase inicial do head bob (0–2π) |
| `spriteConfigRef` | — | Ref para o objeto de configuração (zero re-renders) |

---

## Sprite Sheet

Gerado pelo Unity Editor via **Tools → Sprite Sheet Exporter**.

- Localização: `projection/public/sprites/`
- Nome: `character_walk_[prefab]_[cols]x[rows]_[frames]f.png`
- Layout padrão: 4 colunas × 3 linhas = 12 frames, 256×512px por frame

Para regenerar: abra o Unity, selecione o prefab CC2D e clique em **Auto-fit + Exportar**.

---

## Câmera

Posição fxa cinematográfica: `position=[0, 0, 45]`, `fov=10`.
Não possui OrbitControls — câmera travada para estabilidade de projeção.

---

## Endpoints consumidos

| Método | URL | Retorno | Usado por |
|---|---|---|---|
| `GET` | `http://localhost:3001/visitors` | `["http://.../nobg-*.png"]` | Pool de fotos |
| WebSocket | `http://localhost:3001` | evento `new_visitor` | Spawn imediato |
