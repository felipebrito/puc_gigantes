# PUC Gigantes - Trilho App (Exposição Interativa)

Aplicativo interativo react + vite em formato Totem/Kiosk Vertical (1080x1920) desenvolvido para exibir a linhagem evolutiva, slides informativos sobre a fauna marinha do período Ordoviciano, Siluriano, o evento de Extinção em Massa e o período Devoniano.

O App é desenhado estritamente para espelhar a apresentação criada pela PUC e pelo Museu de Ciências e Tecnologia.

> **Importante:** Este repositório foi reestruturado para ser **exclusivo para a aplicação do Trilho**. Outros serviços (como o Photo Booth, Server e Projeções) foram separados.

## 🎛️ Sistema de Controle (Rotary Encoder ESP32)

A instalação utiliza um moderno sistema de navegação física, garantindo interatividade de ponta para os visitantes, substituindo controles tradicionais (teclado/touch). A interface é montada para ser controlada de maneira orgânica por hardware direcional através de uma integração do React com um microcontrolador **ESP32** acoplado a um **Rotary Encoder**:

*   **Girar para a Direita (Clockwise):** Simula a entrada `ArrowRight`, avançando de forma fluida para a tela ou slide seguinte.
*   **Girar para a Esquerda (Counter-Clockwise):** Simula a entrada `ArrowLeft`, retornando à lâmina anterior da evolução pré-histórica.
*   **Pressionar (Click/SW do Encoder):** Simula a entrada `Enter`, disparando a ação principal do slide (ou retornando ao menu principal dependendo do contexto interativo).

Essa comunicação assegura uma experiência lúdica em que os visitantes controlam facilmente a linha do tempo geológica.

### Pinagem Básica (ESP32):
- **CLK:** Pino de Clock.
- **DT:** Pino de Direção (Data).
- **SW:** Pino do Switch (Botão/Click).
- **GND/3V3:** Alimentação padrão e terra.

## 🚀 Como Rodar o Aplicativo Principal

### Pré-requisitos
*   Node.js (v16+) instalado.

### 1. Iniciar o Servidor React
O código da aplicação front-end está concentrado na pasta `trilho_app`:

```bash
cd trilho_app
npm install
npm run dev
```

A aplicação será iniciada na porta padrão (`http://localhost:5173`). Configure a tela do monitor/totem para exibição vertical visando manter o design pixel-perfect (`1080x1920`).

## 🦖 Estrutura Interativa do Front-End

A navegação baseia-se num sistema segmentado reativo de slides (`slidesData.js`) formando uma trilha:
1. **Home/SectionIntro**: Capa e chamada interativa para a época a ser explorada.
2. **Biodiversidade (`BiodiversityIntro`)**: Exposição geral sobre a vida marinha no período selecionado.
3. **Catálogo de Espécimes (`SpecimenDetail`, `SilurianDoubleSpecimen`, etc.)**: Layout dedicado ao detalhamento 3D ou visual das espécies com descrições imersivas.
4. **Eventos de Extinção (`ExtinctionIntro`, `ExtinctionContent`)**: Telas imersivas e dramáticas ilustrando como o período geológico encontrou seu fim antes de originar o próximo estágio de evolução.

## 📦 Tecnologias 
- `React 18` + `Vite`
- `Framer Motion` (Transições microscópicas e grandes aberturas)
- `C/C++ Arduino Core` (Software microcontrolador ESP32)

---
*Produzido sob a estrutura de roteamento segmentário do React via estados por SlideIndex*
