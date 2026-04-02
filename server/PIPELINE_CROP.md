# Pipeline de Recorte de Rosto — Documentação Técnica

## Objetivo
Produzir sempre uma imagem **400×400 px** com o rosto centralizado e na mesma proporção, independente da distância que a pessoa estava no momento da foto no booth.

## Imagem de Referência
`server/public/uploads/nobg-visitor-1774308612719-90928454.png`

Esta imagem define o padrão visual desejado:
- Rosto ocupa ~95% da altura do canvas
- Cabelo visível no topo
- Queixo próximo ao fundo
- Centralizado horizontalmente
- Sem ombros / sem fundo

---

## Fluxo da Pipeline (server.js — rota POST /upload)

```
Foto bruta (JPEG do tablet)
        │
        ▼
1. faceapi.detectSingleFace → landmarks + box
        │
        ▼
2. Shoulder Killer Mask (canvas)
   Desenha forma branca cobrindo rosto+cabelo,
   transparente abaixo do jawline → blur 15px nas bordas
        │
        ▼
2b. Jaw Killer (destination-out)
   Apaga tudo abaixo do jawline real (17 pontos + 8% margem)
   com blur 6px — elimina collar/ombro que vaza pelo blur da etapa 2
        │
        ▼
3. AI Background Removal (removeBackground)
   Gera máscara de silhueta via @imgly/background-removal
        │
        ▼
4. Composição destination-in
   rawImg → aplica aiMask → aplica shoulderMask (com jaw killer)
   Resultado: apenas rosto+cabelo visível, resto transparente
        │
        ▼
5. trimTransparentRows(buffer, box) → PNG 400×400
   Varre pixels apenas dentro da janela expandida do box da detecção
```

---

## Função trimTransparentRows (server.js ~linha 188)

Responsável por:
1. Limitar a varredura à região expandida do `box` da detecção (evita artefatos distantes)
2. Encontrar o bounding box de pixels realmente opacos (alpha > 50)
3. Escalar esse conteúdo para 400×400 com proporção fixa

### Parâmetros críticos

| Parâmetro | Valor | Por quê |
|-----------|-------|---------|
| **alpha threshold** | `> 50` | Ignorar pixels semi-transparentes do blur (blur=15px) do Shoulder Killer. Se usar `> 10`, ombros e bordas borradas inflam o bounding box → rosto fica pequeno quando pessoa está perto. |
| **search region** | `box ±35% H, -70%/+110% V` | Limita varredura ao rosto. Sem isso, pixels artefato da remoção AI (alpha 50–150) longe do rosto inflam o bounding box → rosto pequeno ou deslocado. |
| **scale** | `(400 / Math.max(faceW, faceH)) * 0.95` | Preenche 95% do eixo maior. Naturalmente invariante à distância. **NÃO mudar para fórmula baseada em box.height** (ver Armadilhas). |
| **destY** | `400 - destH` | Alinhamento na base — queixo sempre próximo ao fundo. |
| **destX** | `(400 - destW) / 2` | Centralizado horizontalmente. |

---

## Parâmetros do Shoulder Killer + Jaw Killer (server.js ~linha 491)

```js
const topPad = 0.5, jawPad = 0.0, earPad = 0.18, neckPad = 0.7, blur = 15;
```

| Parâmetro | Efeito |
|-----------|--------|
| `earPad = 0.18` | Largura lateral da máscara em relação a `box.width` |
| `neckPad = 0.7` | Agressividade do corte dos ombros (0=nenhum, 1=máximo) |
| `jawPad = 0.0` | Deslocamento vertical da linha do queixo |
| `blur = 15` | Suavização da borda da máscara em px |

### Jaw Killer (etapa 2b)

```js
const jawMargin = box.height * 0.08;   // margem abaixo dos pontos do jawline
// blur 6px no destination-out → borda suave sem collar visível
```

| Parâmetro | Valor atual | Efeito |
|-----------|------------|--------|
| `jawMargin` | `box.height * 0.08` | Margem preservada abaixo de cada ponto do jawline antes de apagar. Aumentar → preserva mais queixo/pescoço. Diminuir → corte mais rente ao jawline. |
| blur do jaw killer | `6px` | Suaviza a borda do corte. Valores > 10px podem deixar collar vazar. |

> **Como funciona:** Após o Shoulder Killer mask (blur 15px), o Jaw Killer desenha um polígono seguindo os 17 pontos reais do jawline deslocados `+jawMargin` para baixo, e apaga (`destination-out`) tudo abaixo dessa curva. O blur de 6px cria uma transição suave que coincide com a curva da mandíbula.

---

## Armadilhas Conhecidas (não fazer de novo)

### ❌ Armadilha 1: Normalizar escala pelo box.height da faceapi

```js
// ERRADO — não usar isso
const scale = (outputSize * FACE_FILL) / box.height;
```

**Por quê falha:** `faceH` (pixels não-transparentes) é tipicamente 1.2–1.4× `box.height` porque inclui cabelo acima e pescoço abaixo da detecção. Ao aplicar essa escala em `faceH`, `destH > outputSize` → cabeça cortada no topo.

### ❌ Armadilha 2: Crop de janela fixa centrada no box

```js
// ERRADO — não usar isso
octx.drawImage(sourceCanvas, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
```

**Por quê falha:** A janela fixa pode ultrapassar a área mascarada, expondo pixels de ombro semi-transparentes.

### ❌ Armadilha 3: Alpha threshold muito baixo

```js
// ERRADO
if (alpha(x, y) > 10) return false;
```

**Por quê falha:** Captura pixels do blur (~alpha 20–50), inflando `faceH` → oscilação por distância.

### ❌ Armadilha 4: Jaw Killer com gradiente horizontal

```js
// ERRADO — não usar gradiente horizontal
const chinFade = mctx.createLinearGradient(0, chinY, 0, fadeEnd);
mctx.fillRect(0, chinY, rawImg.width, rawImg.height - chinY);
```

**Por quê falha:** O gradiente horizontal começa no Y do queixo (`jawline[8].y`), mas os cantos do maxilar (`jawline[0]` e `jawline[16]`) ficam em Y **menor** (mais alto na imagem). O gradiente começa tarde demais nas bordas laterais → collar ainda visível nos lados.

### ❌ Armadilha 5: Varrer a imagem inteira no trimTransparentRows sem `box`

```js
// ERRADO — busca por toda a imagem
let top = 0; while (top < height && isRowEmpty(top)) top++;
```

**Por quê falha:** Remoção AI deixa pixels artefato (alpha 50–150) espalhados. Sem limitar ao `box`, bounding box infla → rosto pequeno ou deslocado dependendo da posição da cabeça.

---

## Diagnóstico de Problemas Futuros

| Sintoma | Provável causa | Onde mexer |
|---------|---------------|------------|
| Rosto muito pequeno quando perto | Artefatos inflando bounding box | Verificar se `trimTransparentRows` recebe `box` e usa search region |
| Rosto deslocado para um lado | Pixel artefato fora da search region | Verificar se search region está sendo aplicada |
| Rosto muito grande / cabeça cortada | Scale baseada em `box.height` | Verificar se usa `Math.max(faceW,faceH)` |
| Collar visível no centro | `jawMargin` muito grande | Reduzir de 0.08 para 0.05 |
| Collar visível nos lados | Jaw Killer com gradiente horizontal | Verificar se Jaw Killer usa polígono com os 17 pontos do jawline |
| Borda dura/jagged no queixo | blur do Jaw Killer zerado | Verificar se `mctx.filter = 'blur(6px)'` antes do destination-out |
| Queixo cortado | `jawMargin` muito pequeno | Aumentar de 0.08 para 0.12 |
| Rosto descentrado | `destX` errado | Verificar se é `(400 - destW) / 2` |
| Fundo branco em vez de transparente | `clearRect` ausente | Verificar `octx.clearRect(0, 0, 400, 400)` antes do drawImage |
