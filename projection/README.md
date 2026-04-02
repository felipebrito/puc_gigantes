# projection — Three.js Scene

App React/Vite que renderiza a cena de projeção do **Gigantes de Porto Alegre**.

## Stack

| Lib | Versão | Uso |
|---|---|---|
| react-three-fiber | ^9 | Bridge React ↔ Three.js |
| @react-three/drei | ^10 | Helpers (Billboard, Text, useTexture…) |
| three | ^0.182 | Renderer 3D |
| leva | ^0.10 | Painel de configuração em tempo real |
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
      └── Billboard (texto GIGANTES DE PORTO ALEGRE + contador)
```

---

## Componentes

### `App.jsx`

Ponto de entrada. Gerencia:

- **Pool de fotos** — poll a cada 10s em `GET /visitors`; atualizado imediatamente na chegada
- **Spawn de visitantes** — timer configurável (padrão 0.1s); um personagem por intervalo
- **Socket** — evento `new_visitor` spawna personagem imediatamente com a foto recebida
- **Configurador Leva** — painel em tempo real com todos os parâmetros (ver tabela abaixo)

#### Parâmetros Leva — "Personagem Sprite"

| Parâmetro | Padrão | Descrição |
|---|---|---|
| FPS animação | 14 | Frames por segundo do walk cycle |
| Altura corpo | 2.0 | Altura do sprite em unidades 3D |
| Posição Y cabeça | 0.82 | Fração da altura onde a foto é centrada |
| Tamanho foto | 0.54 | Largura da foto como fração da largura do corpo |
| Offset X cabeça | 0.0 | Deslocamento horizontal da foto |
| Movimento cabeça | true | Ativa head bob |
| Amplitude bob | 0.0 | Amplitude vertical do head bob (unidades) |
| Escala mín/máx | 1.2 / 1.4 | Range de escala aleatória por personagem |
| Vel. mín/máx | 0.8 / 1.2 | Range de velocidade de travessia (unidades/s) |
| Intervalo spawn | 0.1 s | Segundos entre spawns automáticos |
| Labels debug | false | Exibe `v:` e `s:` ao lado de cada personagem |

#### Botões Leva
- **Adicionar visitante** — spawna um personagem com foto aleatória do pool
- **Remover todos** — limpa todos os personagens da cena

---

### `SpriteCharacter.jsx`

Renderiza um personagem com:
- **Corpo** — plane com UV offset animado sobre o sprite sheet
- **Face** — plane transparente sobreposto na posição da cabeça
- **Head bob** — `sin` sincronizado com o fps do walk cycle (2 bobs/ciclo)

#### Props

| Prop | Padrão | Descrição |
|---|---|---|
| `faceUrl` | — | URL da foto do visitante (servidor) |
| `sheetUrl` | `character_walk_new_character_4x3_12f.png` | Sprite sheet |
| `meta` | `{cols:4, rows:3, frameCount:12, frameWidth:256, frameHeight:512}` | Layout do sheet |
| `scale` | 1 | Escala global |
| `direction` | 1 | 1 = direita, -1 = esquerda (espelha sprite) |
| `spriteConfig` | DEFAULTS | Objeto com todos os parâmetros do Leva |

---

## Sprite Sheet

Gerado pelo Unity Editor via **Tools → Sprite Sheet Exporter**.

- Localização: `projection/public/sprites/`
- Nome: `character_walk_[prefab]_[cols]x[rows]_[frames]f.png`
- Layout padrão: 4 colunas × 3 linhas = 12 frames, 256×512px por frame

Para regenerar: abra o Unity, selecione o prefab CC2D e clique em **Auto-fit + Exportar**.

---

## Endpoints consumidos

| Método | URL | Retorno | Usado por |
|---|---|---|---|
| `GET` | `http://localhost:3001/visitors` | `["http://.../nobg-*.png"]` | Pool de fotos |
| WebSocket | `http://localhost:3001` | evento `new_visitor` | Spawn imediato |
