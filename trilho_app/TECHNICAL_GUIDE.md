# Documentação Técnica: Trilho App (Ordoviciano)

Este documento centraliza as informações técnicas e funcionais do `trilho_app` para garantir a continuidade do desenvolvimento e manutenção.

## 🏗️ Arquitetura
O projeto é um Aplicativo Web progressivo (SPA) desenvolvido com:
- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Renderização**: [Vite](https://vitejs.dev/) (Fast Refresh HMR)
- **Animações**: [Framer Motion](https://www.framer.com/motion/) (utilizado para transições de slides e efeitos de blur/fade)
- **Estilização**: CSS Vanilla (foco em layouts absolutos para Kiosk/Totem Vertical 1080x1920)

### Organização de Conteúdo
O App utiliza uma estrutura hierárquica baseada em:
1.  **Período** (Ex: `ordoviciano`, `devoniano`, `permiano`)
2.  **Seção** (Ex: `biodiversidade`, `extincao`, `pos_extincao`)
3.  **Slide** (Conteúdo individual extraído do Canva)

## 🎮 Funcionalidades Atuais

### 1. Sistema de Slides Dinâmico
A navegação é baseada em um array centralizado em `src/data/slides.js`. Cada slide possui metadados que garantem a navegação correta dentro do período e seção atuais.
Campos principais:
- `period`: Identificador do período geológico.
- `section`: Identificador da seção (capítulo).
- `type`: Determina o componente React a ser renderizado.

### 2. Navegação e Interatividade
O App suporta três métodos de entrada:
- **Teclado (HID)**:
    - `Seta Direita`: Avança para o próximo slide da seção.
    - `Seta Esquerda`: Volta para o slide anterior.
    - `Enter`: No menu (Home), confirma a seleção. Em qualquer outra tela, retorna ao Menu Principal.
- **Hardware (Encoder)**:
    - O App possui um listener de Socket.io em `App.jsx` que escuta eventos `encoder_action`. 
    - Comandos recebidos (`LEFT`, `RIGHT`, `CLICK`) são disparados como eventos de teclado virtuais para manter a compatibilidade.
- **Interface Visual**:
    - `MorphingPageDots`: Indicador visual inferior que permite navegar entre os slides da seção atual.

### 3. Seções Implementadas
- **Home**: Tela de "Call to Action" com 3 trilhas principais.
- **Biodiversidade**: Foco na vida marinha do Ordoviciano (Homotelus, Cameroceras, etc).
- **Extinção**: Detalhes sobre o resfriamento global e deglaciação.
- **E Depois?**: Transição para o período Siluriano e Devoniano.

## 🛠️ Comandos de Manutenção

### Reparar Cache e Reinstalar
Caso ocorram erros de permissão (`EPERM`) ou arquivos corrompidos no `node_modules`:
```bash
rm -rf node_modules package-lock.json && npm install
```

### Iniciar em Desenvolvimento
```bash
npm run dev
```

---
*Este guia deve ser atualizado sempre que uma nova funcionalidade de roteamento ou hardware for implementada.*
