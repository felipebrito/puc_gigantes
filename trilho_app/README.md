# Trilho App - Exposição Interativa Ordoviciano

Aplicativo interativo react + vite em formato Totem/Kiosk Vertical (1080x1920) desenvolvido para exibir a linhagem evolutiva, slides informativos sobre a fauna marinha do período Ordoviciano, o evento de Extinção em Massa e o período Devoniano.

O App é desenhado estritamente para espelhar a apresentação lincada no Canva criada pela PUC Minas e o Museu de Ciências e Tecnologia. 

## Instalação e Execução Local

### Requisitos:
- Node.js (v16+)
- NPM

### Passos:
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Navegação (Controles do Tótem)
O aplicativo é montado para ser controlado por hardware direcional (D-PAD ou setas do teclado):
- **Seta Direita (`ArrowRight`)**: Avança para o próximo slide
- **Seta Esquerda (`ArrowLeft`)**: Retorna ao slide anterior
- **`Enter`**: Retorna ao menu principal instantaneamente (se não estiver na tela principal)

## Estrutura Atual Implementada

Telas integradas ao `slidesData.js` que formam uma trilha linear com roteamento reativo:

1. **`Home.jsx`**: Tela principal de chamada à ação.
2. **`BiodiversityIntro.jsx`**: Slide explicativo sobre a vida no período.
3. **`SpecimenDetail.jsx`**: Layout focado numa imagem, com texto lateral (e.g. *Homotelus*, *Cameroceras*).
4. **`ExtinctionIntro.jsx`**: Tela inicial da extinção.
5. **`ExtinctionContent.jsx`**: Slide profundo com mapeamento SVG original do Pangea/Gondwana, espelhado do design exato via JSX inline translation pixel-perfect para consistência absoluta da documentação.

## Dependências
- `React 18`
- `Framer Motion` (Transições suaves entre as lâminas orgânicas do Figma/Canva)

--- 

*Produzido sob a estrutura de roteamento segmentário do React via estados por SlideIndex*
