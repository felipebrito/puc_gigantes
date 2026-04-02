# Changelog — Gigantes de Porto Alegre

Todas as mudanças relevantes do projeto são registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

---

## [0.4.0] — 2026-04-02

### Adicionado
- **`SpriteSheetExporter.cs`** — botão **Auto-fit**: amostra bounds reais do personagem
  em 32 frames da animação e dimensiona/centraliza a câmera automaticamente
- **`SpriteCharacter.jsx`** — componente Three.js para renderizar personagem via sprite sheet
  com overlay de foto do visitante e head bob configurável
- **Configurador Leva em tempo real** (`App.jsx`) com 13 parâmetros ajustáveis ao vivo:
  FPS, altura, posição Y da cabeça, tamanho da foto, offset X, head bob + amplitude,
  escala mín/máx, velocidade mín/máx, intervalo de spawn, labels debug
- **Botões no painel**: "Adicionar visitante" e "Remover todos"
- **Spawn por timer** — personagens aparecem em intervalos regulares (não mais em rajadas)
- **Auto-spawn via socket** — nova foto no booth spawna personagem imediatamente
- **Labels de debug** — exibem `v:` e `s:` ao lado de cada personagem (toggle)
- **Contador de personagens** no texto da cena

### Alterado
- `App.jsx`: substituído `SkeletonCharacter` por `SpriteCharacter` como renderizador principal
- `App.jsx`: pool de fotos atualizado imediatamente após primeiro poll (sem esperar 15s)
- `App.jsx`: `moveConfig` (velocidade, escala, direção) calculado no momento do spawn
  com valores atuais dos sliders — cada personagem tem valores individuais fixos
- `SpriteCharacter.jsx`: walk cycle usa fps fixo (sem multiplicador de velocidade)
- `SpriteCharacter.jsx`: head bob com frequência natural — 2 bobs por ciclo de caminhada
- `SpriteSheetExporter.cs`: output path corrigido → `projection/public/sprites/`
- `SpriteSheetExporter.cs`: nome canônico gerado: `character_walk_[prefab]_[cols]x[rows]_[frames]f.png`
- `SpriteSheetExporter.cs`: amostras de bounds aumentadas de 16 para 32 frames
- `SpriteSheetExporter.cs`: padding padrão aumentado de 8% para 15%

### Removido
- Visitante de teste hardcoded (`/models/face_test.png`) da cena principal
- `animSpeed` (multiplicador de animação por velocidade) — causava walk cycle inconsistente

### Preset padrão definido
| Parâmetro | Valor |
|---|---|
| FPS animação | 14 |
| Altura corpo | 2.0 |
| Posição Y cabeça | 0.82 |
| Tamanho foto | 0.54 |
| Offset X cabeça | 0.0 |
| Head bob amplitude | 0.0 |
| Escala mín/máx | 1.2 / 1.4 |
| Velocidade mín/máx | 0.8 / 1.2 u/s |
| Intervalo spawn | 0.1 s |

---

## [0.3.0] — 2026-03-28

### Adicionado
- Pipeline Unity → Three.js: `SpriteSheetExporter.cs` (Editor Window)
  - Câmera ortográfica dedicada com fundo transparente (ARGB32)
  - Exporta sprite sheet PNG + JSON de metadados
  - Varredura de presets: 6–9 combinações de câmera geradas de uma vez
- `SpriteCharacter.jsx` — primeira versão com UV offset animation

### Alterado
- Cena `walk-cycle.unity` configurada para o personagem CC2D de referência

---

## [0.2.0] — 2026-03-20

### Adicionado
- `SkeletonCharacter.jsx` — personagem procedural 2D com walk cycle senoidal
- `ProceduralAnimator.cs` — animação de caminhada sem clips (senos/cossenos)
- `VisitorBuilder.cs` — factory que constrói hierarquia de GameObjects em runtime
- `CC2DFaceAligner.cs` — overlay de foto sobre bone Head do CC2D
- `CameraManager.cs` — 6 presets de câmera com transições suaves
- `ProjectionUI.cs` — texto 3D billboard com contador live

### Alterado
- `VisitorSpawner.cs`: suporte a texturas de roupa por keyword
- `VisitorController.cs`: suporte a `ProceduralAnimator` + `Animator` Unity

---

## [0.1.0] — 2026-03-10

### Adicionado
- Estrutura inicial do projeto (monorepo: `Unity/`, `server/`, `projection/`)
- `server/server.js` — Express + Socket.io, remoção de fundo (`@imgly/background-removal-node`)
- `PhotoProvider.cs` — polling do servidor Node.js a cada 1.5s
- `VisitorSpawner.cs` — pool de visitantes com spawn aleatório
- `VisitorController.cs` — movimento e destruição por boundary
- Cena Unity principal com dinossauro Dreadnoughtus (GLB)
- App Three.js (React + Vite + react-three-fiber) com câmera ortográfica e grid
