# Changelog — Gigantes de Porto Alegre

Todas as mudanças relevantes do projeto são registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.6.4] — 2026-05-25

### Corrigido
- **Booth: Prevenção de Zoom** — Desabilitado o comportamento padrão de toque do navegador no Booth (pinch-to-zoom e overscroll/bounce), garantindo a estabilidade da interface em tablets.

---

## [0.6.3] — 2026-05-24

### Adicionado
- **Novos vídeos de fundo v17** — Fundo H264 otimizado e composição Cards com alpha Luma (WEBM) adicionados e configurados na projeção.
- **Booth: Configuração de Rede** — Adicionado campo "Backend URL" na tela de calibração (`/?calibrate`) para resolver problemas de CORS/SSL em tablets clientes, permitindo forçar o envio de fotos pela porta HTTP local (`3001`).

### Alterado
- **Booth: Captura instantânea** — O tempo de espera de 3 segundos foi removido. A foto agora é tirada imediatamente quando o sorriso é detectado.
- **Booth: Envio automático** — A foto é exibida por 3 segundos e enviada automaticamente, caso não seja clicado o botão de "Tentar de Novo". O botão "Enviar" foi removido para simplificar o fluxo.
- **Projection: Pool de visitantes** — O limite do sorteio de fotos aleatórias aumentou das 10 para as 20 fotos mais recentes, mantendo o limite visual de 10 visitantes exibidos simultaneamente.

### Corrigido
- **Projection: Bug de inicialização do Warping** — A malha de distorção (keystoning) agora é devidamente carregada e ativada no início da aplicação, sem precisar pressionar "C". A verificação de sincronia de estado foi aprimorada para incluir o status de ativação.

---

## [0.6.2] — 2026-04-02

### Corrigido
- **Collar/ombro visível nos lados do rosto** — substituído gradiente horizontal pelo "Jaw Killer": `destination-out` que segue a curva real dos 17 pontos do jawline (+ 8% de margem), com blur 6px. O gradiente horizontal anterior falhava nos lados porque `jawline[0]`/`jawline[16]` ficam em Y menor que o queixo.
- **Rosto pequeno ou deslocado conforme posição da cabeça** — `trimTransparentRows` agora recebe o `box` da detecção e limita a varredura de pixels a uma janela expandida em torno do rosto (±35% H, −70%/+110% V). Artefatos da remoção AI fora dessa janela são ignorados.

### Documentação
- `server/PIPELINE_CROP.md` expandido com a etapa "Jaw Killer", tabela de parâmetros completa e 5 armadilhas documentadas.

---

## [0.6.1] — 2026-04-02

### Corrigido
- **Oscilação de tamanho do rosto por distância** — `trimTransparentRows` aumentou o threshold de alpha de `10` para `50`, ignorando pixels semi-transparentes gerados pelo `blur: 15px` do Shoulder Killer. Antes, ombros próximos da câmera inflavam o bounding box → escala menor → rosto aparecia menor. Agora o bounding box considera apenas pixels com opacidade real (> 50).
- **Ombro visível na imagem final** — corrigida abordagem intermediária que usava janela de crop fixa centrada no `box` da detecção, o que extrapolava a área mascarada pelo Shoulder Killer.

### Adicionado
- **`server/PIPELINE_CROP.md`** — documentação técnica completa do pipeline de recorte: fluxo, parâmetros críticos, armadilhas conhecidas e tabela de diagnóstico.

---

## [0.6.0] — 2026-04-02

### Adicionado
- **Ferramenta de Grid Mesh Warp (Keystoning)** — sistema profissional de calibração geométrica para projeção mapeada:
  - Subdivisão de malha dinâmica (`warpSubdiv`) para distorções suaves (bicubic/bilinear interpolation).
  - Modo de Edição Visual via HUD com feedback de seleção.
  - Atalhos de Teclado Globais: `C` (Calibração), `1-4` (Seleção), `Setas` (Movimento), `S` (Salvar).
- **Vídeo de Fundo (Ambiente)** — suporte a texturas de vídeo em loop que cobrem exatamente as extremidades da tela (`viewport.getCurrentViewport`).
- **Monitor de Performance** — integração do `@react-three/drei/Stats` para monitoramento de FPS e oscilações em tempo real.
- **Controles de Visibilidade** — toggles no menu para Dinossauro, Chão/Grid e Título da cena.
- **Ajuste de Altura de Visitantes** — slider `spritesYOffset` para alinhar os personagens com o chão físico sem mover a câmera.

### Alterado
- **Estabilização da GUI (`lil-gui`)** — refatoração completa para evitar re-renders do menu ao mudar estados; pastas agora mantêm seu estado de aberto/fechado.
- **Otimização de Spawn** — redução do limite máximo padrão para 10 personagens e adição de `verticalJitter` (pequeno desvio aleatório na altura) para evitar sobreposição perfeita de sprites.
- **Saneamento de Presets** — detecção automática de links de vídeo quebrados no `localStorage` e restauração de padrões funcionais.

### Corrigido
- Erro de `ReferenceError: cfg is not defined` ao tentar acessar configurações fora do escopo.
- Bug de abas do menu que abriam sozinhas a cada interação.
- "Tela Preta" causada por suspensão de vídeo mal tratada (adicionado `Suspense` local e carregamento condicional).
- Aspecto "bizarro" do vídeo de fundo (agora redimensiona dinamicamente com o aspecto da janela).

---

## [0.5.0] — 2026-04-02

### Adicionado
- **Pipeline de pós-processamento** (`EffectComposer`) com ativação individual por efeito:
  - **Cores** — Brilho, Contraste, Matiz, Saturação (`BrightnessContrast` + `HueSaturation`)
  - **Bloom** — Intensidade e Threshold luminância
  - **Vignette** — Escurecimento e Offset da borda
  - **Noise (Film Grain)** — Opacidade ajustável
  - **Depth of Field** — Z Target (foco real), Focal Length, Bokeh Scale
- **Sistema de Presets** — salvar/carregar configurações nomeadas via `localStorage`;
  exportar preset como arquivo `.json`; resetar para padrão; auto-save a cada mudança
- **`phaseOffset` por personagem** — cada visitante recebe uma fase aleatória (0–2π)
  no head bob, eliminando o sincronismo visual entre personagens
- **Preload de texturas** — `useTexture.preload()` chamado ao receber fotos do servidor
  e via socket, eliminando flicker na primeira aparição do personagem
- **Versionamento de preset** (`_v: CONFIG_VERSION`) — presets incompatíveis são
  descartados automaticamente; padrões corretos são restaurados sem intervenção manual

### Alterado
- **Migração de `leva` para `lil-gui`** — painel de configuração mais robusto e com
  precisão numérica real (sem saltos em valores pequenos como `0.001`)
  - `App.jsx`: `useControls` / `folder` / `button` substituídos por `useEffect` + `GUI`
  - `CharacterLab.jsx`: mesma migração
- **`sync()` síncrono** — `cfgRef.current` atualizado imediatamente no `onChange` do
  lil-gui (sem aguardar ciclo React); personagens reagem em tempo real
- **`SpriteCharacter.jsx` v4** — configuração lida via `spriteConfigRef` (ref) dentro
  do `useFrame`; elimina re-renders e flickering ao ajustar parâmetros
- **Geometria dinâmica no `useFrame`** — `bodyH`, `headSize`, `headYRatio`, `headXOffset`
  recalculados e aplicados ao mesh em tempo real sem re-render React
- **`prevCfgRef` pré-inicializado** — evita rebuild de geometria no primeiro frame,
  eliminando flash inicial
- **Câmera fixada** em posição cinematográfica `[0, 0, 45]`, `fov: 10`
- **`proxy` do lil-gui inicializado com `cfgRef.current`** — painel sempre exibe
  os valores realmente usados (incluindo preset carregado do localStorage)
- **Limites de destruição dos visitantes** restaurados para `±22` (fora do frustum)
- **`spawnInterval` padrão** ajustado para `2.5s`
- **`Vel. mín/máx`** padrão restaurado para `0.8 / 1.2 u/s`

### Removido
- Dependência `leva` — desinstalada completamente (`npm uninstall leva`)
- `OrbitControls` — removido da cena de projeção; câmera travada

### Corrigido
- Flicker de personagens causado por rebuild de geometria no frame 1
- Valores de velocidade corrompidos via localStorage (resolvido com versionamento)
- Crash do `EffectComposer` ao ativar/desativar Depth of Field (hook `useMemo`
  movido para fora de condicional; efeitos nunca desmontados, apenas zerados)
- `CharacterLab.jsx` quebrando o build por importar `leva` (removido)

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
