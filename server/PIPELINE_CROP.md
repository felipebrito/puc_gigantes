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
3. AI Background Removal (removeBackground)
   Gera máscara de silhueta via @imgly/background-removal
        │
        ▼
4. Composição destination-in
   rawImg → aplica aiMask → aplica shoulderMask
   Resultado: apenas rosto+cabelo visível, resto transparente
        │
        ▼
5. trimTransparentRows(buffer) → PNG 400×400
```

---

## Função trimTransparentRows (server.js ~linha 186)

Responsável por:
1. Encontrar o bounding box de pixels realmente opacos (alpha > 50)
2. Escalar esse conteúdo para 400×400 com proporção fixa

### Parâmetros críticos

| Parâmetro | Valor | Por quê |
|-----------|-------|---------|
| **alpha threshold** | `> 50` | Ignorar pixels semi-transparentes do blur (blur=15px) do Shoulder Killer. Se usar `> 10`, ombros e bordas borradas inflam o bounding box → rosto fica pequeno quando pessoa está perto. |
| **scale** | `(400 / Math.max(faceW, faceH)) * 0.95` | Preenche 95% do eixo maior. Já é naturalmente invariante à distância: face maior → scale menor, face menor → scale maior. **NÃO mudar para fórmula baseada em box.height** (ver seção "Armadilhas"). |
| **destY** | `400 - destH` | Alinhamento na base — queixo sempre próximo ao fundo. |
| **destX** | `(400 - destW) / 2` | Centralizado horizontalmente. |

---

## Parâmetros do Shoulder Killer (server.js ~linha 484)

```js
const topPad = 0.5, jawPad = 0.0, earPad = 0.18, neckPad = 0.7, blur = 15;
```

| Parâmetro | Efeito |
|-----------|--------|
| `earPad = 0.18` | Largura lateral da máscara em relação a `box.width` |
| `neckPad = 0.7` | Agressividade do corte dos ombros (0=nenhum, 1=máximo) |
| `jawPad = 0.0` | Deslocamento vertical da linha do queixo |
| `blur = 15` | Suavização da borda da máscara em px |

> **Atenção:** `blur = 15` gera pixels com alpha entre 1–50 abaixo do jawline. Esses pixels são exatamente os que o threshold `> 50` filtra.

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

**Por quê falha:** A janela fixa pode ultrapassar a área mascarada pelo Shoulder Killer, expondo pixels de ombro semi-transparentes que não foram removidos.

### ❌ Armadilha 3: Alpha threshold muito baixo

```js
// ERRADO
if (alpha(x, y) > 10) return false;
```

**Por quê falha:** Captura pixels do blur do Shoulder Killer (~alpha 20–50), inflando `faceH`. Quando a pessoa está perto (ombros maiores no frame), inflação é maior → escala menor → rosto aparece pequeno → oscilação por distância.

---

## Diagnóstico de Problemas Futuros

| Sintoma | Provável causa | Onde mexer |
|---------|---------------|------------|
| Rosto muito pequeno quando perto | Ombro vazando no bounding box | Aumentar alpha threshold (ex: 60–80) ou aumentar `neckPad` |
| Rosto muito grande / cabeça cortada | Scale baseada em `box.height` em vez de `faceH` | Verificar se `trimTransparentRows` usa `Math.max(faceW,faceH)` |
| Ombro visível na imagem final | `neckPad` baixo ou `blur` alto demais | Reduzir `blur` para 10 ou aumentar `neckPad` para 0.8 |
| Rosto descentrado | `destX` errado | Verificar se é `(400 - destW) / 2` |
| Fundo branco em vez de transparente | `clearRect` ausente ou cor de fundo no canvas | Verificar `octx.clearRect(0, 0, 400, 400)` antes do drawImage |
