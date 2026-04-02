# Scripts Unity — Gigantes de Porto Alegre

Cena principal: `Assets/Scenes/walk-cycle.unity`

---

## Arquitetura Geral

```
PhotoProvider  ──polls 1.5s──▶  GET /visitors  (Node.js :3001)
     │                                │
     │  DownloadTexture()             │ JSON: ["nobg-*.png", ...]
     ▼                                ▼
VisitorSpawner._availableFaces ◀── Texture2D
     │
     │  SpawnVisitor() a cada 2s
     ▼
VisitorController  ──────────────────────────────────────────┐
     ├── ProceduralAnimator  (animação senoidal procedural)   │
     └── CC2DFaceAligner     (overlay de foto no bone Head)   │
                                                              │
                            Scene                            ◀┘
                             ├── CameraManager  (6 presets)
                             ├── ProjectionUI   (texto live)
                             └── SceneSetup     (dino + cenário)
```

O **GameManager** (único GameObject de controle) carrega: `ProjectionUI`, `CameraManager`, `PhotoProvider`, `VisitorSpawner` e `SceneSetup`.

---

## Scripts

### `PhotoProvider.cs`
> Conecta Unity ao servidor Node.js. Faz polling contínuo e baixa novas fotos.

| Campo | Valor padrão | Descrição |
|---|---|---|
| `serverUrl` | `http://localhost:3001/visitors` | Endpoint da lista de fotos |
| `serverBase` | `http://localhost:3001` | Base para download das texturas |
| `pollInterval` | `1.5f` | Intervalo de polling em segundos |
| `spawner` | ref | `VisitorSpawner` para gerenciar o pool |

**Fluxo:**
1. `PollRoutine()` — loop infinito com `WaitForSeconds(pollInterval)`
2. `FetchList()` — `GET /visitors` → JSON `["file1.png", ...]`
3. Detecta arquivos novos → `DownloadTexture()` → `spawner.AddFace()`
4. Detecta arquivos removidos → `spawner.RemoveFace()`

**Notas:** usa `BypassCertificate` para aceitar o certificado autoassinado do localhost. Parser JSON manual (sem JsonUtility) para suportar arrays simples.

---

### `VisitorSpawner.cs`
> Gerencia o ciclo de vida dos visitantes: pool de texturas, spawn e destruição.
``
| Campo | Valor padrão | Descrição |
|---|---|---|
| `interval` | `2.0f` | Segundos entre spawns |
| `maxVisitors` | `15` | Máximo de visitantes simultâneos |
| `areaMarkers` | `Transform[4]` | 4 cantos do retângulo de spawn |
| `minSpeed/maxSpeed` | `1.0–2.5` | Faixa de velocidade aleatória |
| `minScale/maxScale` | `1.05–1.25` | Faixa de escala aleatória |
| `texturesPath` | `"Textures"` | Pasta de texturas em Resources/ |
| `visitorPrefab` | ref | Prefab CC2D (modo alternativo) |

**Métodos principais:**
- `SpawnVisitor()` — cria visitante em posição aleatória dentro dos markers
- `AddFace(Texture)` / `RemoveFace(string)` — gerencia o pool de rostos
- `OnVisitorDestroyed()` — callback de limpeza ao sair do boundary

Texturas de roupa são filtradas por palavras-chave: `suit`, `dress`, `casual`, `fur`, `leather`, `leopard`.

---

### `VisitorController.cs`
> Controla um visitante individual: movimento, aparência e destruição.

| Campo | Descrição |
|---|---|
| `speed` | Velocidade de caminhada (unidades/s) |
| `direction` | `1.0` = direita, `-1.0` = esquerda |
| `boundary` | Posição X onde o visitante é destruído (`25.0`) |
| `faceRenderer` | `MeshRenderer` do quad do rosto |
| `clothingRenderers` | Renderers de torso, pernas, braços |
| `animator` | Referência ao `ProceduralAnimator` |

`Initialize(speed, direction, faceTexture, clothingTexture, walkStyle, scale, onComplete)` — configura tudo e instancia materiais individuais para evitar conflito de texturas entre personagens.

`Update()` — move o personagem no eixo X e verifica boundary para auto-destruição.

Suporta tanto `ProceduralAnimator` (procedural) quanto `Animator` Unity (CC2D).

---

### `ProceduralAnimator.cs`
> Gera animação de caminhada 100% procedural via funções senoidais. Sem clips de animação.

| Campo | Valor padrão | Descrição |
|---|---|---|
| `speed` | `5f` | Frequência da animação |
| `stride` | `0.4f` | Amplitude do balanço de pernas/braços |
| `bounce` | `0.08f` | Bounce vertical dos quadris |
| `walkStyle` | `"normal"` | `"normal"`, `"fast"`, `"long"` |

**Física do Update:**
```
cycle = Time.time × (speed × 1.5)

Quadris   → bounce: sin(cycle×2) × bounce
Pernas    → rotação antifásica (PI apart) simulando joelho
Braços    → oposto às pernas, amplitude × 0.8
Cabeça    → leve balanço vertical + rotação
```

Estilos: `fast` = 1.2× freq + 1.3× bounce; `long` = 0.8× freq + 1.5× stride.

---

### `VisitorBuilder.cs`
> Factory estática que constrói o GameObject do visitante proceduralmente (hierarquia + meshes + materiais).

**Hierarquia gerada:**
```
Visitor (root)  ← VisitorController + ProceduralAnimator
└── Hips  (animado)
    ├── Torso   [quad — roupa]
    ├── Head    (animado)
    │   └── Face  [quad — foto]
    ├── LegL    (animado) → Mesh [quad — roupa]
    ├── LegR    (animado) → Mesh [quad — roupa]
    ├── ArmL    (animado) → Mesh [quad — roupa]
    └── ArmR    (animado) → Mesh [quad — roupa]
```

`CreateVisitor(defaultFace, defaultCloth)` — ponto de entrada público.

Detecta pipeline automaticamente: **URP Lit → URP Unlit → Standard Shader**. Configura transparência (`_Surface=1`, `renderQueue=3000`) para suportar PNGs sem fundo.

---

### `CC2DFaceAligner.cs`
> Aplica a foto do visitante sobre um prefab CharacterCreator2D, sobrepondo um quad transparente no bone `Head`.

| Campo | Valor padrão | Descrição |
|---|---|---|
| `partsToHide` | `["Eyebrow","Eyes","Nose","Mouth"]` | Partes faciais desativadas |
| `headBoneName` | `"Head"` | Nome do bone alvo |
| `faceScale` | `3.9f` | Escala do quad de foto |
| `faceOffset` | `Vector3` | Offset local do quad |

**Fluxo do `SetFace(Texture2D photo)`:**
1. Aguarda 1 frame (coroutine)
2. Busca recursivamente o bone `Head` / `Bone_Head`
3. Desativa os `Renderer`s das partes faciais originais
4. Cria quad com `Sprites/Default` shader, `sortingOrder=100`
5. Parenta ao bone com posição/rotação/escala configuráveis

---

### `CameraManager.cs`
> Gerencia transições suaves entre 6 presets de câmera.

| Preset | Posição | Alvo |
|---|---|---|
| `Cinematic` | (0, 0, 45) | (0, 0, 0) |
| `SideScale` | (8, 0, 35) | (5, 0, 0) |
| `Comparison` | (0, -0.5, 40) | (0, 0, 0) |
| `Top` | (0, 40, 5) | (0, 0, 0) |
| `DinoFocus` | (5, 5, 30) | (5, 3, -8) |
| `Free` | (0, 0, 40) | (0, 0, 0) |

`transitionSpeed = 2.0f` — fator de `Vector3.Lerp` / `Quaternion.Slerp` no `Update()`.

`SetMode(string)` exposto para chamada externa. Botões de debug via `OnGUI()`.

---

### `ProjectionUI.cs`
> Exibe título e contador de visitantes em tempo real como `TextMesh` no espaço 3D com efeito billboard.

- **Título:** `"GIGANTES DE PORTO ALEGRE"` — posição `(0, 2.5, -15)`, branco, tamanho 50
- **Status:** `"● LIVE SCAN | N PERSONS"` — posição `(0, 1.5, -15)`, verde, tamanho 25
- `Update()` busca contagem em `VisitorSpawner._activeVisitors.Count` e rotaciona para a câmera

---

### `SceneSetup.cs`
> Inicializa o modelo do dinossauro e configura elementos da cena no `Start()`.

- Carrega `Resources/Models/Dino` (GLB)
- Escala com multiplicador `3.0 × 0.4 = 1.2`
- Adiciona `SimpleDinoAnim` (classe aninhada):
  - Rotação Y suave: `sin(t × 0.1) × 0.1`
  - Bob vertical: `sin(t × 0.5) × 0.0005`

`SetupGround()` e `SetupGrid()` existem mas não são chamados na versão atual.

---

### `SpriteSheetExporter.cs`
> **Ferramenta de Editor.** Exporta personagem CC2D como sprite sheet PNG para uso no Three.js.
> Acesso: Unity menu → **Tools → Sprite Sheet Exporter**

| Campo | Padrão | Descrição |
|---|---|---|
| `animStateName` | `"Walk"` | Estado do Animator a capturar |
| `frameCount` | `12` | Frames por ciclo |
| `cols` | `4` | Colunas no sheet (layout 4×3) |
| `frameWidth/Height` | `256×512` | Resolução por frame |
| `paddingFactor` | `0.15` | Margem ao redor do personagem (15%) |
| `outputFolder` | `projection/public/sprites/` | Destino automático |

**Botões:**
- **Auto-fit + Exportar** — amostra os bounds reais do personagem em 32 frames da animação, calcula `cameraSize` e `offsetY` automaticamente para encaixar o personagem inteiro, exporta com nome canônico
- **Exportar com configuração manual** — usa os valores dos campos da janela

**Nome gerado:** `character_walk_[prefab]_[cols]x[rows]_[frames]f.png`

**Fluxo interno do Auto-fit:**
1. Instancia o prefab fora da câmera principal (posição `x=999`)
2. Amostra `Renderer.bounds` em 32 instantes do ciclo de animação
3. Calcula `minY/maxY/minX/maxX` → `centerY`, `fitSize` (respeitando aspect ratio do frame)
4. Aplica `paddingFactor` e salva PNG + JSON de metadados
5. Abre a pasta de saída automaticamente

> O arquivo gerado vai direto para `projection/public/sprites/` — pasta pública do Vite.
> O Three.js carrega sem nenhuma etapa manual adicional.

---

### `FaceTester.cs`
> **Ferramenta de desenvolvimento.** Carrega fotos diretamente do disco e spawna personagens em linha para validar alinhamento.

- Lê `.png` de `/Users/brito/Desktop/PUC/server/public/uploads` (path fixo)
- Limita a 5 faces, ignora arquivos com `"visiting"` no nome
- Expõe `faceScale`, `faceOffset`, `faceRotation` no Inspector para ajuste em tempo real
- Desativa `VisitorController` nos personagens de teste (não se movem)

> ⚠️ Path hardcoded — uso exclusivo em desenvolvimento local.

---

## Parâmetros de Configuração Rápida

| Script | Campo | Valor | Efeito |
|---|---|---|---|
| `PhotoProvider` | `pollInterval` | `1.5` | Frequência de busca de novas fotos |
| `VisitorSpawner` | `maxVisitors` | `15` | Lotação máxima da cena |
| `VisitorSpawner` | `interval` | `2.0` | Segundos entre spawns |
| `VisitorSpawner` | `minSpeed/maxSpeed` | `1.0–2.5` | Velocidade de caminhada |
| `ProceduralAnimator` | `walkStyle` | `normal/fast/long` | Estilo de animação |
| `CameraManager` | `transitionSpeed` | `2.0` | Velocidade de troca de câmera |
| `CC2DFaceAligner` | `faceScale` | `3.9` | Tamanho da foto sobre o personagem |

---

## Endpoints Consumidos pela Unity

| Método | URL | Retorno | Usado por |
|---|---|---|---|
| `GET` | `http://localhost:3001/visitors` | `["nobg-*.png", ...]` | `PhotoProvider.FetchList()` |
| `GET` | `http://localhost:3001/uploads/nobg-*.png` | Imagem PNG | `PhotoProvider.DownloadTexture()` |

O servidor HTTP na porta `3001` é usado pela Unity (sem SSL). O HTTPS na `3000` é exclusivo do totem Android.

---

## Observações Técnicas

| Ponto | Situação |
|---|---|
| Memória de texturas | Sem cleanup explícito — depende do GC ou reload de cena |
| Instância de materiais | Cada visitante cria instâncias próprias — avaliar object pooling para crowds grandes |
| TextMesh | `ProjectionUI` usa `TextMesh` legado — migrar para `TextMeshPro` se necessário |
| JSON parsing | Manual em `PhotoProvider` — robusto para arrays simples |
| Certificado SSL | `BypassCertificate` ativo — somente para desenvolvimento local |
