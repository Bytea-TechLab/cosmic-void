# COSMIC VOID 2.0: GUERRA GALÁCTICA

> **Bullet-hell espacial militar tático em HTML5 Canvas e JavaScript puro.**  
> Desenvolvido por **Bytea TechLab** (Mateus Mendes).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5 / Canvas](https://img.shields.io/badge/Tech-Vanilla%20JS%20%2F%20Canvas%202D-yellow.svg)](index.html)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-green.svg)](manifest.json)
[![GitHub Org](https://img.shields.io/badge/Organization-Bytea--TechLab-00e5ff.svg)](https://github.com/Bytea-TechLab)

---

## 🚀 Sobre o Jogo

**Cosmic Void** é um jogo de nave espacial do gênero *bullet-hell* de precisão tática militar, construído do zero utilizando apenas **Vanilla JavaScript e Canvas 2D puro**, sem bibliotecas ou engines externas.

O jogo conta com progressão em 20 setores da Campanha principal, 4 modos distintos de combate, árvore permanente de melhorias no entre-fases (*Sanctuary*), mecânica de **PARRY com Dash** (refletindo disparos inimigos em 4x de dano), suporte a **Cooperativo Local para 2 jogadores na mesma tela**, suporte a celular com controles táteis virtuais e instalação como aplicativo (PWA).

### Modos de Jogo
1. **⚔ Campanha Principal (1P ou Co-op 2P)**: 20 setores divididos em 4 Atos, incluindo embates contra chefes militares (*The Gatekeeper*, *The Leviathan*, *The Absolute Core*, *Observer Apex*, *The Ascended*) e a ameaça dimensional do *NULL-ECLIPSE*.
2. **⚡ Quick Run (Blitz / Standard)**: Partidas rápidas com seleção de melhorias temporárias por rascunho (*draft*).
3. **☣ BLACKOUT (Roguelite)**: Incursões no Setor Sombra com escolha de rotas ramificadas, anomalias e gerenciamento de risco.
4. **👑 Boss Rush**: Desafio consecutivo contra o catálogo integral de chefes do universo.

---

## 🛸 Classes de Caça

* **Assault**: Caça equilibrado de média distância com alta cadência e canhões duplos de fótons.
* **Scout**: Interceptador ultrarrápido com disparos contínuos de plasma e alta chance de acerto crítico.
* **Tank**: Fortaleza móvel blindada armada com escopeta de dispersão em leque e elevadíssima tolerância a impacto.
* **Ranger**: Caça de longa distância com canhão acelerador linear (*Railgun*) perfurante que atravessa fileiras inteiras de inimigos.

---

## 🎮 Controles Reais

### Teclado Desktop (1 Jogador / Piloto 1)
| Ação | Tecla |
| :--- | :--- |
| **Mover** | `W`, `A`, `S`, `D` ou Setas direcionais |
| **Atirar** | `Espaço` (ou `Enter` no modo Solo) |
| **Dash / PARRY** | `Shift Esquerdo` (ou `Shift Direito` no modo Solo) |
| **Habilidade Especial** | `C` (quando medidor estiver em 100%) |
| **Sinergia Solo (Suporte de Ala)** | `X` (requer especial carregado) |
| **Pausar** | `P` |
| **Pular Intro do Vilão** | `V` (ou clique no botão na tela) |
| **Melhorias / Decolar (Sanctuary)** | `U` (Abrir Melhorias) / `Enter` (Decolar) |

### Piloto 2 (Co-op Local no mesmo Teclado)
| Ação | Tecla |
| :--- | :--- |
| **Mover** | `Setas` (`Cima`, `Baixo`, `Esquerda`, `Direita`) |
| **Atirar** | `Enter` ou `Numpad 0` |
| **Dash / PARRY** | `Shift Direito`, `Numpad .` ou `Ctrl Direito` |
| **Habilidade Especial** | `L` ou `Numpad 1` |
| **Sinergia Cooperativa** | `K`, `M` ou `Numpad 2` |

### Mobile / Touchscreen
* **Movimentação**: Joystick virtual analógico dinâmico no lado esquerdo da tela.
* **Botões Táticos Virtuais**:
  * Botão Ciano: **Dash / PARRY**
  * Botão Vermelho: **Disparo Contínuo**
  * Botão Dourado: **Habilidade Especial**
  * Botão Magenta: **Sinergia de Esquadrão**
* **Orientação**: Otimizado para visualização em modo Paisagem (*Landscape*).

---

## 💻 Como Rodar Localmente

Por se tratar de uma aplicação Web pura com Service Worker e assets estáticos, basta servir a pasta raiz com qualquer servidor HTTP local:

### Opção 1: Usando Python (3.x)
```bash
python -m http.server 8080
```
Em seguida, abra o navegador em `http://localhost:8080`.

### Opção 2: Usando Node.js / npx
```bash
npx serve .
```

### Opção 3: Usando a extensão Live Server do VS Code
Clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.

---

## 🌐 Como Jogar Online (GitHub Pages)

Para hospedar o jogo diretamente no GitHub da organização:
1. No repositório, vá em **Settings** > **Pages**.
2. Em **Build and deployment** > **Source**, selecione **Deploy from a branch**.
3. Escolha a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**. O jogo estará acessível online em:
   `https://bytea-techlab.github.io/cosmic-void/`

---

## 📂 Estrutura de Pastas

```text
COSMIC_VOID/
├── index.html        # Página principal e ponto de entrada da aplicação
├── style.css         # Folha de estilos retrô sci-fi, HUD e layout responsivo
├── manifest.json     # Manifesto PWA para instalação como aplicativo
├── sw.js             # Service Worker para execução offline e cache
├── LICENSE           # Licença MIT (código) + Direitos Reservados (marca/assets)
├── README.md         # Documentação do projeto
├── CHANGELOG.md      # Histórico de versões e alterações
├── package.json      # Configuração mínima de scripts de teste
├── img/              # Ícones oficiais do jogo (192x192 e 512x512)
└── js/               # Módulos do motor e lógica de jogo
    ├── game.js       # Loop central, máquina de estados e temporização
    ├── player.js     # Classes de caça, armas, mobilidade e sinergias
    ├── villain.js    # Inteligência e poderes dimensionais do NULL-ECLIPSE
    ├── boss.js       # Chefes de setor e subsistemas destrutíveis
    ├── enemy.js      # Formações de frotas e tipos de inimigos
    ├── collisions.js # Detecção de colisão unificada, parry e dano
    ├── effects.js    # Partículas, clarões e impactos de tela
    ├── pacing.js     # Direção de ondas e progressão dos 20 setores
    ├── renderer.js   # Renderizador 2D procedural no Canvas
    ├── ui.js         # Interface, transmissões e telas de menu/créditos
    ├── controls.js   # Gestão de teclado, touch joystick e gamepads
    ├── sanctuary.js  # Base estelar aliada e terminal de melhorias
    ├── save.js       # Persistência de savegame e acessibilidade no localStorage
    ├── quickrun.js   # Modo Quick Run
    ├── blackout.js   # Modo Roguelite BLACKOUT
    └── bossrush.js   # Modo Boss Rush
```

---

## 🧪 Testes Automatizados

O repositório inclui suítes completas de validação em Node.js cobrindo balanceamento matemático, persistência de save, inteligência artificial e expansão cinemática:

```bash
npm test
```

---

## 👥 Créditos & Autoria

* **Desenvolvimento Principal**: [Bytea TechLab](https://github.com/Bytea-TechLab)
* **Lead Developer**: Mateus Mendes
* **GitHub da Organização**: [https://github.com/Bytea-TechLab](https://github.com/Bytea-TechLab)

---

## 📜 Licença

* O **código-fonte** deste projeto está licenciado sob os termos da licença [MIT](LICENSE).
* O **nome "Cosmic Void"**, marca, identidade visual e logotipos pertencem exclusivamente à **Bytea TechLab** (Todos os direitos reservados).

---

### English Summary
**Cosmic Void** is a military tactical bullet-hell space shooter built entirely in vanilla HTML5 Canvas and JavaScript without external libraries. Features 20 sectors of campaign progression, 4 unique starfighter classes, full local 2-player co-op on a single screen, touch joystick controls, and offline PWA capability. Developed by Bytea TechLab (Mateus Mendes).
