# Changelog — Cosmic Void

Todas as alterações notáveis deste projeto são registradas neste arquivo.

## [2.1.0] - 2026-10-25

### Adicionado
- **Tela de Créditos / Sobre no Menu Principal**: Painel interativo com informações de autoria (Bytea TechLab: Mateus Mendes), versão centralizada e links institucionais.
- **Suporte Nativo a Acessibilidade**:
  - Detecção automática de `prefers-reduced-motion` via `matchMedia`.
  - Configuração nas opções para alternar Movimento Reduzido (eliminando tremores de tela bruscos e distorções de zoom da câmera).
  - Configuração para ligar/desligar Câmera Lenta (Slow Motion) com ajuste automático do tempo de execução em tempo real.
- **Mecânica de Segunda Chance e Execução Assistida do NULL-ECLIPSE**:
  - Limite estrito de 2 recuperações a 10% de HP.
  - Na 3ª falha, ativação de janela expandida de 8,0 segundos.
  - Na 4ª falha, disparo de Execução Assistida registrada na telemetria, garantindo término de loop sem travamentos.
- **Degradação Dinâmica de Partículas**: Redução inteligente de 45% na carga de partículas durante ativação de poderes surreais do vilão para preservação de 60 FPS.
- **Pular Entrada via Tecla V**: Substituição de Espaço/Enter por `V` e exigência de novo keydown (evitando disparos acidentais ao início de combate).

### Modificado
- **Balanceamento Econômico das Retiradas**: Créditos concedidos nos Tiers 1, 2 e 3 reduzidos e limitados a 1.000, 2.000 e 3.000 C respectivamente, substituindo `orb_rare` por reparo de integridade de casco (`hp`).
- **Sincronização de Janela de Execução**: `executionTimer` e `slowMoTimer` unificados rigorosamente na mesma base de tempo real (4,0 s).
- **Detecção de Projéteis no Núcleo**: Remoção de trava de estado em `collisions.js`, permitindo que disparos de projéteis finalizem o vilão durante `FINAL_EXECUTION`.
- **Offline PWA (`sw.js`)**: Adição de `js/villain.js` à lista de cache de assets do Service Worker.

## [2.0.0] - 2026-10-20
- **Expansão Cinemática e Novos Modos**:
  - Modo Quick Run (Blitz e Standard) com rascunho de melhorias temporárias.
  - Modo Roguelite BLACKOUT (Incursão ao Setor Sombra com árvore de rotas e anomalias).
  - Modo Boss Rush com catalogação consecutiva de chefes.
  - Sistema de Sinergia Solo (Suporte de Ala) e Co-op Local em tela única.
  - Novos chefes canônicos: *The Dread Fleet* e *The Blackout Signal*.
