# Cosmic Void v2.1.0

> Bullet-hell espacial militar tático em HTML5 Canvas e JavaScript puro desenvolvido pela **Bytea TechLab** (Mateus Mendes).

[![Licença: MIT + Ativos Reservados](https://img.shields.io/badge/License-MIT%20%2B%20Assets%20Reserved-blue.svg)](LICENSE)
[![Tecnologia](https://img.shields.io/badge/Tech-Vanilla%20JS%20%2F%20Canvas%202D-yellow.svg)](index.html)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-green.svg)](manifest.json)
[![Organização](https://img.shields.io/badge/Organization-Bytea--TechLab-00e5ff.svg)](https://github.com/Bytea-TechLab)

---

## 1. Sobre o Jogo

**Cosmic Void** é um jogo de nave espacial do gênero *bullet-hell* de precisão tática militar, programado inteiramente em **Vanilla JavaScript** e renderizado em **Canvas 2D**, sem motores ou bibliotecas de terceiros. O jogo possui campanha com 20 setores estruturados em 4 Atos, 4 classes distintas de caças espaciais, mecânica de **PARRY com Dash** que reflete projéteis inimigos devolvendo **4x de dano**, suporte a **Cooperativo Local para dois jogadores na mesma tela**, interface adaptada para toque em telas móveis (*touchscreen*), compatibilidade com Gamepad e suporte a PWA para execução offline.

---

## 2. Modos de Jogo

O jogo possui 4 modos reais selecionáveis no menu principal:

1. **Campanha Principal (Solo 1P ou Co-op Local 2P)**:
   * Progressão contínua por 20 setores divididos em 4 Atos.
   * 3 seleções de dificuldade: Fácil (dano/HP 0.5x), Normal (1.0x) e Difícil (1.5x).
   * Estação aliada *Sanctuary* entre setores para conserto automático de 25% do casco e terminal de compra de melhorias permanentes via créditos obtidos em combate.
   * Confrontos contra chefes capitais nos setores 5, 10, 16 e 20, além de interceptações do vilão dimensional *NULL-ECLIPSE*.

2. **Quick Run (Solo 1P ou Co-op Local 2P)**:
   * Sessões rápidas de combate divididas em dois formatos:
     * **Padrão (Standard)**: 7 fases (~10 minutos).
     * **Blitz (Curto)**: 4 fases (~5 minutos).
   * Sistema de *draft*: a cada setor concluído, os pilotos escolhem cartas de melhorias temporárias cumulativas.
   * Chefe final exclusivo do modo: **The Dread Fleet** (Flagship de guerra com 3 subsistemas destrutíveis).

3. **BLACKOUT — Roguelite (Solo 1P ou Co-op Local 2P)**:
   * Incursão ao Setor Sombra com mapa ramificado procedural organizado por profundidade (*depth*).
   * Escolha de rotas contendo nós de patrulha regular, emboscadas de elite, zonas de resgate de caixas-pretas e anomalias dimensionais.
   * Oferta de *Pactos do Vazio* (modificadores com bônus poderosos e penalidades associadas).
   * Chefe final de incursão: **The Blackout Signal** (48.000 HP base).

4. **Boss Rush (Solo 1P ou Co-op Local 2P)**:
   * Sequência direta contra os 6 chefes capitais do jogo:
     1. The Gatekeeper
     2. The Dread Fleet
     3. The Leviathan
     4. The Absolute Core
     5. The Blackout Signal
     6. Observer Apex
   * Cronometragem por setor, cálculo de tempo total da incursão e persistência do recorde (*Best Time*).

> **Nota sobre "The Dread Fleet"**: The Dread Fleet não é um modo de jogo isolado, mas sim um chefe capital militar implementado em `js/boss.js`, enfrentado na fase final do modo Quick Run e como o segundo combate do modo Boss Rush.

---

## 3. Classes de Caça

Cada caça possui atributos numéricos, tipo balístico e comportamento de tiro verificados em `js/player.js` e `js/collisions.js`:

| Atributo / Classe | Assault | Scout | Tank | Ranger |
| :--- | :--- | :--- | :--- | :--- |
| **HP Base** | 110 | 80 | 175 | 95 |
| **Velocidade** | 460 | 600 | 360 | 440 |
| **Cadência Base** | 0.12s | 0.085s | 0.45s | 0.55s |
| **Dano Base** | 12 | 8 | 8 por projétil | 38 |
| **Tipo de Disparo** | Normal (frontal/leque) | Plasma contínuo | Shotgun (cone de 5 a 9+ projéteis) | Railgun (linear perfurante) |
| **Perfuração** | Não | Não | Não | **Sim** (projéteis atravessam inimigos e subsistemas) |
| **Crítico Base** | 5% (mult. 1.5x) | 15% (mult. 1.6x) | 5% (mult. 1.5x) | 20% (mult. 1.8x) |
| **Dash Cooldown** | 1.20s (mínimo 0.60s) | 0.90s (mínimo 0.45s) | 1.40s (mínimo 0.80s) | 1.20s (mínimo 0.60s) |
| **Habilidade Especial** | **Assault Overdrive** (5.0s+ de cadência máxima e leque expandido) | **Phase Nova** (3.2s+ de desvio com iFrames, dash contínuo e rajada radial de plasma) | **Tank Fortress** (5.5s+ com escudo frontal, cura imediata de 20% do HP e dispersão shotgun radial) | **Ranger Dead Eye** (3.8s+ com desaceleração temporal a 0.05 e rajadas de tiros pesados BFG) |

---

## 4. Chefes e Inimigos de Destaque

### Chefes da Campanha Principal
* **The Gatekeeper (Setor 5 / Ato I)**: 15.000 HP base. Equipado com 2 subsistemas destrutíveis: *Bateria Railgun Esquerda* e *Bateria Railgun Direita* (2.500 HP cada x dificuldade).
* **The Leviathan (Setor 10 / Ato II)**: 36.000 HP base. Possui atração gravitacional e 2 subsistemas destrutíveis: *Estabilizadores Gravitacionais Alfa e Beta* (4.000 HP cada x dificuldade).
* **The Absolute Core (Setor 16 / Ato III)**: 90.000 HP base. Chefe de inteligência bélica central; ao ser derrotado, engatilha a quebra cinemática de sinal (*Fake Credits* e invasão de sistema) que redireciona a campanha para o Setor 17 na Zona Morta.
* **The Ascended (Setor 20 / Ato IV)**: 180.000 HP base. Chefe final da campanha enfrentado em 5 fases sequenciais com teletransporte tático, pós-imagens e janelas estritas de contra-ataque. Sua destruição libera a sequência do Verdadeiro Final (*True Ending*).

### Vilão Dimensional Recorrente
* **NULL-ECLIPSE**: Entidade dimensional com inteligência e diálogos em `js/villain.js`.
  * Intercepta a campanha em setores pré-agendados (Setores 4, 8, 13 e 20) com 4 Tiers progressivos de perigo.
  * Habilidades de dobra do espaço: Barreira de encolhimento de arena, Vórtice gravitacional central, Dilatação temporal de projéteis e Linhas de destino focadas nos pilotos.
  * **Pular Introdução**: Pressionando a tecla `V` ou clicando no botão na tela, a introdução cinemática pode ser pulada diretamente para o combate — recurso ativado apenas se o jogador já tiver assistido à introdução anteriormente (`seenIntro`).
  * Clímax no Tier 4 com Janela de Execução Final cronometrada em 4,0 segundos.

### Chefes de Modos Especiais
* **The Dread Fleet**: 42.000 HP base. Chefe de guerra do Quick Run e Boss Rush, dotado de 3 subsistemas destrutíveis (*Bateria Railgun Bombordo*, *Bateria Mísseis Estibordo* e *Gerador de Blindagem Frontal*).
* **The Blackout Signal**: 48.000 HP base. Chefe final do modo BLACKOUT e integrante do Boss Rush, com emissão de pulsos de distorção de sensor e disparos anômalos.

### Minibosses de Setor
* **Flailer**: Setor 3.
* **Gravity**: Setor 6.
* **Knight**: Setor 9.
* **Hangman**: Setor 12.
* **Seraph-0 (Miniboss Seraph)**: Setor 15 (rajadas radiais de feixes concentrados).
* **The Warden (Miniboss Warden)**: Setor 18 (30.000 HP base, projeta barreira frontal impenetrável e gera orbes defensivos).
* **Observer Apex (Miniboss)**: Setor 19 (34.000 HP base como miniboss; versão autônoma de 65.000 HP no Boss Rush).

---

## 5. Controles do Jogo

### Teclado — Modo Solo (1 Jogador)
| Ação | Teclas Compatíveis |
| :--- | :--- |
| **Mover** | `W`, `A`, `S`, `D` **ou** `Setas Direcionais` |
| **Atirar** | `Espaço` **ou** `Enter` |
| **Dash / PARRY** | `Shift Esquerdo` **ou** `Shift Direito` |
| **Habilidade Especial** | `C` **ou** `L` (requer barra em 100%) |
| **Sinergia Solo (Suporte de Ala)** | `X` **ou** `K` (chama nave parceira para especial conjunto) |

### Teclado — Cooperativo Local (2 Jogadores no Mesmo Teclado)
Quando o modo Co-op está ativo, as teclas de direção e ação são divididas rigidamente entre os dois pilotos:

| Ação | Piloto 1 (Esquerda) | Piloto 2 (Direita) |
| :--- | :--- | :--- |
| **Mover** | **Exclusivamente** `W`, `A`, `S`, `D` | **Exclusivamente** `Setas Direcionais` |
| **Atirar** | `Espaço` | `Enter` **ou** `Numpad 0` |
| **Dash / PARRY** | `Shift Esquerdo` | `Shift Direito`, `Numpad .` **ou** `Ctrl Direito` |
| **Habilidade Especial** | `C` | `L` **ou** `Numpad 1` |
| **Sinergia de Esquadrão** | `X` | `K`, `M` **ou** `Numpad 2` |

### Atalhos Gerais e Menus (Teclado)
* `P`: Pausar ou despausar o jogo.
* `V`: Pular introdução cinematográfica do vilão NULL-ECLIPSE (requer que a cena já tenha sido vista uma vez).
* `U`: Abrir ou fechar o terminal de Melhorias na estação *Sanctuary*.
* `Enter`: Decolar da estação *Sanctuary* para o próximo setor (quando o painel de melhorias estiver fechado).
* `Q`, `E`, `R`, `F`: Atalhos no menu principal para iniciar diretamente em Solo com Assault, Scout, Tank ou Ranger.
* `T`: Iniciar Campanha Cooperativa pelo menu principal.
* `C`: Continuar jogo a partir do último checkpoint salvo.
* `1`, `2`, `3`, `4`: Alternar a classe do Piloto 2 diretamente no menu cooperativo.

### Dispositivos Móveis (Touchscreen)
* **Movimentação**: Analógico virtual flutuante (*touch joystick*) posicionado no canto inferior esquerdo.
* **Botões Virtuais de Ação**:
  * **Ciano**: Dash / PARRY.
  * **Vermelho**: Disparo contínuo de canhão.
  * **Dourado**: Habilidade Especial.
  * **Magenta**: Sinergia de Esquadrão / Suporte de Ala.
* **Co-op Móvel**: Suporte a tela dividida com analógico e botões duplos independentes para o Piloto 2.

### Gamepad (Controles USB / Bluetooth)
Implementado via Gamepad API nativa (`navigator.getGamepads()`):
* **Identificação**: Gamepad 0 controla o Piloto 1. O Gamepad 1 (ou Gamepad 0, se o P1 estiver no teclado WASD) assume o Piloto 2.
* **Movimentação**: Analógico Esquerdo (`axes 0 e 1`) com zona morta calibrada em 0.22, ou direcional D-Pad (`buttons 12, 13, 14, 15`).
* **Atirar**: Botão 0 (A / Cruz) ou Botão 7 (RT / R2).
* **Dash / PARRY**: Botão 1 (B / Círculo) ou Botão 6 (LT / L2).
* **Habilidade Especial**: Botão 2 (X / Quadrado) ou Botão 4 (LB / L1).
* **Sinergia**: Botão 3 (Y / Triângulo) ou Botão 5 (RB / R1).

---

## 6. Mecânica de PARRY e Dano

A mecânica de defesa ativa do jogo é vinculada ao acionamento do Dash:
1. Ao acionar o Dash, o piloto recebe uma janela de PARRY de **0.20 segundos** (`p.parryWindow`), além de 0.25 segundos de invulnerabilidade (`iFrames`). O item `orb_parity` expande a janela em +0.30s.
2. Qualquer projétil inimigo dentro do raio de contato durante essa janela é convertido em projétil aliado (`proj.isPlayer = true`), acelerado e refletido com velocidade invertida (`vx *= -3`, `vy *= -3`).
3. **Multiplicador de Dano**: Em `js/collisions.js` (linha 18), o tiro de parry recebe multiplicador fixo de **4.0x** (`let parryMult = proj.isParried ? 4.0 : 1.0`).
4. **Recompensa**: O parry concede imediatamente **+20% de barra especial** e restaura **6% do HP máximo** (ou **12%** se o piloto estiver utilizando a classe **Tank**), com limitador de cadência de cura a cada 0.8s.

---

## 7. Como Rodar Localmente

O jogo é uma aplicação web estática sem compilação. Contudo, devido às regras de segurança dos navegadores para **Service Workers** e chamadas de API, ele **não deve ser executado diretamente pelo protocolo `file://`**, pois o cache offline e recursos estáticos serão bloqueados.

Execute a pasta raiz por qualquer servidor HTTP estático local:

### Com Python 3
```bash
python -m http.server 8080
```
Abra o navegador em: `http://localhost:8080`

### Com Node.js / npx
```bash
npx serve .
```

### Com extensão Live Server (VS Code)
Clique com o botão direito sobre o arquivo `index.html` e selecione **"Open with Live Server"**.

---

## 8. Como Jogar Online

O projeto está publicado e funcional através do GitHub Pages oficial da organização:

👉 **[https://bytea-techlab.github.io/cosmic-void/](https://bytea-techlab.github.io/cosmic-void/)** & **[https://projetocosmicvoid.gamer.gd/](https://projetocosmicvoid.gamer.gd/)**

---

## 9. Instalação como Aplicativo (PWA)

O jogo atende integralmente aos requisitos de Progressive Web App:
* Manifesto configurado em `manifest.json` com orientação paisagem prioritária (`landscape`), tema `#00ffff` e ícones oficiais de 192x192 e 512x512 em `img/`.
* Service Worker registrado em `sw.js` com estratégia de cache para todos os módulos JavaScript, folha de estilo e páginas, permitindo carregar e jogar sem conexão à internet após o primeiro acesso.
* Em navegadores compatíveis (Chrome, Edge, Safari e navegadores mobile), utilize o ícone de instalação na barra de endereços para instalar o executável autônomo na Área de Trabalho ou tela inicial.

---

## 10. Estrutura de Pastas e Arquivos

```text
COSMIC_VOID/
├── index.html          # Ponto de entrada, marcação do HUD, telas de menu, modais de opções e créditos
├── style.css           # Estilos visuais retrô sci-fi, HUD militar, animações e layout responsivo
├── manifest.json       # Manifesto PWA com metadados de instalação e ícones
├── sw.js               # Service Worker com cache offline e política de resposta rápida
├── LICENSE             # Licença MIT para código + Reserva de direitos sobre marca e ativos visuais
├── README.md           # Documentação técnica e guia do jogo
├── CHANGELOG.md        # Histórico de alterações e lançamentos por versão
├── package.json        # Manifesto do projeto Node.js com script de teste e metadados
├── img/                # Ativos visuais estáticos e ícones de aplicação
│   ├── icon-192.png    # Ícone PWA em resolução 192x192
│   └── icon-512.png    # Ícone PWA em resolução 512x512
└── js/                 # Motores e subsistemas lógicos do jogo
    ├── blackout.js     # Modo Roguelite BLACKOUT (geração procedural de rotas, eventos e chefe Signal)
    ├── boss.js         # Entidade BOSS, fases de combate, subsistemas destrutíveis e chefes capitais
    ├── bossrush.js     # Modo Boss Rush com fila sequencial de chefes e registro de tempo
    ├── collisions.js   # Colisões AABB/círculo, dano composto, parry (4x) e coleta de drops
    ├── controls.js     # Gestão de teclado (1P/2P), joystick touch mobile, botões táteis e gamepads
    ├── drops.js        # Entidade Drop, atração magnética em direção às naves e tipos de coletáveis
    ├── effects.js      # Partículas de impacto, clarões coloridos (flashes) e glitches procedurais
    ├── enemy.js        # Classes da frota inimiga, inteligência artificial de perseguição e minibosses
    ├── events.js       # Barramento Publish/Subscribe (on/emit) para troca de sinais assíncronos
    ├── game.js         # Loop principal (requestAnimationFrame), máquina de estados, timeScale e combo
    ├── observer.js     # Módulo utilitário de checagem de metadados (checkMeta)
    ├── pacing.js       # Diretor de combate da campanha, controle dos 20 setores, ondas e 4 Atos
    ├── particles.js    # Definição básica da classe Particle para efeitos de partículas
    ├── player.js       # Entidade Player, estatísticas das 4 classes, dash, especiais e estados Co-op
    ├── pool.js         # Implementação de Object Pool genérico (PROJ_POOL, ENEMY_POOL, DROP_POOL)
    ├── projectile.js   # Entidade Projectile, tipos balísticos (railgun, bfg, normal, plasma, shotgun)
    ├── quickrun.js     # Modo Quick Run (Standard e Blitz), drafts temporários e chefe Dread Fleet
    ├── renderer.js     # Renderizador vetorial procedural em Canvas 2D de naves, chefes e HUD
    ├── sanctuary.js    # Estação estelar aliada de entre-fases, acoplamento, reparo e decolagem
    ├── save.js         # Persistência em localStorage (checkpoints, créditos, árvore de skills e opções)
    ├── ui.js           # Gerenciador da interface, HUD, modais de créditos/opções e cinemáticas finais
    ├── villain.js      # Vilão dimensional NULL-ECLIPSE, Tiers 1-4, dobra espacial e Janela de Execução
    └── world.js        # Fundo espacial com paralaxe estelar procedural e hangar da estação
```

---

## 11. Testes Automatizados

O `package.json` define o script de teste com o comando:
```bash
npm test
```
O comando executa: `node scratch/test_villain_etapa1.js && node scratch/test_verification.js && node scratch/test_cinematic_expansion.js`.

> ⚠️ **Nota Importante sobre Clonagem**: A pasta `scratch/` onde esses testes residem está listada no arquivo `.gitignore` do repositório. Consequentemente, ao clonar o repositório a partir de um ambiente novo, esses arquivos de teste não estarão presentes no disco e a execução de `npm test` falhará com erro de módulo não encontrado até que a pasta de testes seja versionada formalmente ou transferida para fora de `scratch/`.

---

## 12. Créditos e Autoria

* **Desenvolvimento e Direção**: [Bytea TechLab](https://github.com/Bytea-TechLab)
* **Lead Developer**: Mateus Mendes
* **Repositório Oficial**: [https://github.com/Bytea-TechLab/cosmic-void](https://github.com/Bytea-TechLab/cosmic-void)
* **Organização no GitHub**: [https://github.com/Bytea-TechLab](https://github.com/Bytea-TechLab)

O jogo possui painel interativo de **Créditos / Sobre** acessível diretamente pelo botão do Menu Principal, renderizado por `UI.toggleCredits()` em `js/ui.js`.

---

## 13. Licença

Este projeto adota uma política de licenciamento mista expressa no arquivo [LICENSE](LICENSE):

* **Código-Fonte**: Licenciado sob os termos da licença permissiva **MIT** (livre para uso, cópia, modificação e distribuição com manutenção dos avisos de direitos autorais).
* **Marca e Ativos Visuais**: A marca comercial "Cosmic Void", logotipos, ativos visuais e ícones contidos no diretório `img/` têm **Todos os Direitos Reservados** à organização **Bytea TechLab** e **Mateus Mendes**. O uso sob MIT não concede permissão para utilização comercial da marca ou de seus ativos proprietários sem consentimento prévio por escrito.

---

### English Summary

**Cosmic Void** is a military tactical bullet-hell space shooter built entirely in vanilla HTML5 Canvas and JavaScript without external libraries. It features 20 campaign sectors structured into 4 Acts, 4 distinct starfighter classes, a Dash-Parry mechanic that reflects hostile bullets for 4x damage, full local 2-player co-op on a single screen, virtual touch controls, gamepad API support, and offline PWA capability. Developed by Bytea TechLab (Lead Developer: Mateus Mendes).
