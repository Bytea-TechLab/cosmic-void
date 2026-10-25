// ============================================================================
// COSMIC VOID — BLACKOUT MODE (Campanha Paralela Roguelite)
// Setor Sombra Classificado: Navegação por Rotas, Upgrades e Anomalias Cósmicas
// ============================================================================

const BLACKOUT = {
  active: false,
  depth: 1,
  maxDepth: 5,
  currentNode: null,
  routeMap: [],
  cls: 'assault',
  isCoop: false,
  p2Class: 'scout',
  startTime: 0,
  elapsedTime: 0,
  kills: 0,
  damageTaken: 0,
  score: 0,
  blackBoxesRecovered: 0,
  upgrades: [],
  anomalies: [],
  seed: 0,

  // Catálogo Roguelite de Upgrades Modulares e Anomalias do Vazio
  UPGRADES: [
    {
      id: 'bo_hyper_sabot',
      name: 'Projétil Perfurante de Urânio',
      type: 'armamento',
      desc: '+40% de dano e projéteis perfuram o primeiro inimigo atingido.',
      apply(p) {
        p.stats.dmg = Math.round(p.stats.dmg * 1.4);
      }
    },
    {
      id: 'bo_plasma_cascade',
      name: 'Injetor de Plasma Quente',
      type: 'armamento',
      desc: 'Disparos deixam micro-orbes de queima que persistem no ar por 1.5s.',
      apply(p) {
        p.extraShots = (p.extraShots || 0) + 1;
      }
    },
    {
      id: 'bo_reaction_jets',
      name: 'Propulsores Vetoriais de Éter',
      type: 'propulsao',
      desc: '+60 Velocidade de voo e recuperação de Dash 30% mais ágil.',
      apply(p) {
        p.stats.spd += 60;
        p.dashCdBase = Math.max(0.35, p.dashCdBase * 0.70);
      }
    },
    {
      id: 'bo_reactive_shield',
      name: 'Escudo Ablativo Automatizado',
      type: 'defesa',
      desc: 'A cada 15 segundos sem receber dano, ganha uma barreira contra 1 impacto.',
      apply(p) {
        p.shieldTimer = Math.max(p.shieldTimer, 6.0);
      }
    },
    {
      id: 'bo_overclock_core',
      name: 'Capacitor de Pulso Sincronizado',
      type: 'nucleo',
      desc: 'Especial carrega 50% mais rápido e a duração da habilidade aumenta em 1.5s.',
      apply(p) {
        p.specialtyLvl = (p.specialtyLvl || 0) + 3;
      }
    }
  ],

  ANOMALIES: [
    {
      id: 'anom_void_blood',
      name: 'Pacto do Vazio: Dano Corrompido',
      type: 'anomalia',
      risk: 'ALTO RISCO // ALTO RETORNO',
      desc: '+75% Dano em todas as armas, porém qualquer dano recebido é amplificado em 25%.',
      apply(p) {
        p.stats.dmg = Math.round(p.stats.dmg * 1.75);
        p.stats.dmgReduction = (p.stats.dmgReduction || 0) - 0.25;
      }
    },
    {
      id: 'anom_entropy_siphon',
      name: 'Ressonância Entrópica',
      type: 'anomalia',
      risk: 'RISCO EXTREMO',
      desc: 'Eliminações restauram 20 de HP instantaneamente, mas seu HP Máximo cai em 25.',
      apply(p) {
        p.maxHp = Math.max(40, p.maxHp - 25);
        p.hp = Math.min(p.hp, p.maxHp);
        p.vampiricChance = 0.40;
        if (typeof UI !== 'undefined') UI.updateHP(p.hp, p.maxHp, p.isP2);
      }
    },
    {
      id: 'anom_warp_drive',
      name: 'Curvatura Dimensional Descontrolada',
      type: 'anomalia',
      risk: 'ANOMALIA DE MOVIMENTO',
      desc: 'O Dash viaja o dobro da distância e reflete projéteis automaticamente em 360°, mas tem 0.2s a mais de recarga.',
      apply(p) {
        p.dashCdBase += 0.20;
        p.orbParity = 30.0;
      }
    }
  ],

  initSaveData() {
    if (typeof SAVE !== 'undefined') {
      if (!SAVE.data.blackout) {
        SAVE.data.blackout = {
          runsAttempted: 0,
          runsCleared: 0,
          highestDepth: 1,
          blackBoxes: [],
          unlockedAnomalies: []
        };
      }
    }
  },

  generateRouteMap(seed) {
    // 5 Camadas de profundidade conectadas por grafos legíveis
    return [
      {
        depth: 1,
        title: 'SETOR DE INFILTRAÇÃO',
        nodes: [
          { id: 'n1_1', type: 'COMBAT', label: 'Patrulha de Reconhecimento', desc: 'Esquadrão hostil em rota de interdição.', connectedTo: ['n2_1', 'n2_2'] },
          { id: 'n1_2', type: 'RESUPPLY', label: 'Estação de Abastecimento Abandonada', desc: 'Sinal fraco de baliza. Reparo de 40% de integridade.', connectedTo: ['n2_2', 'n2_3'] }
        ]
      },
      {
        depth: 2,
        title: 'COMPLEXO DE PESQUISA SUBTERFÚGIO',
        nodes: [
          { id: 'n2_1', type: 'COMBAT', label: 'Guarda da Instalação', desc: 'Drones blindados patrulhando o perímetro.', connectedTo: ['n3_1'] },
          { id: 'n2_2', type: 'ELITE', label: 'Caçador Alfa Modificado', desc: 'Nave de combate experimental com campo de dobra.', connectedTo: ['n3_1', 'n3_2'] },
          { id: 'n2_3', type: 'WORKSHOP', label: 'Laboratório de Armas Oculto', desc: 'Estação de trabalho com upgrades militares raros.', connectedTo: ['n3_2'] }
        ]
      },
      {
        depth: 3,
        title: 'NÚCLEO DA ANOMALIA GRAVITACIONAL',
        nodes: [
          { id: 'n3_1', type: 'MINIBOSS', label: 'Superarma: Guardião Gravitacional', boss: 'miniboss_gravity', desc: 'Fenda de gravidade artificial operada por máquina de guerra.', connectedTo: ['n4_1', 'n4_2'] },
          { id: 'n3_2', type: 'ANOMALY', label: 'Ruptura Espacial Viva', desc: 'Manifestação cósmica que altera as regras do combate.', connectedTo: ['n4_2', 'n4_3'] }
        ]
      },
      {
        depth: 4,
        title: 'CEMITÉRIO DA FROTA FANTASMA',
        nodes: [
          { id: 'n4_1', type: 'LOG', label: 'Registro de Caixa Preta', desc: 'Dados confidenciais da 7ª Frota Desaparecida.', connectedTo: ['n5_1'] },
          { id: 'n4_2', type: 'ELITE', label: 'Cruzador Fantasma Pesado', desc: 'Casco automatizado hostil disparando artilharia de cerco.', connectedTo: ['n5_1'] },
          { id: 'n4_3', type: 'WORKSHOP', label: 'Hangar de Engenharia Reversa', desc: 'Preparação final antes do sinal central.', connectedTo: ['n5_1'] }
        ]
      },
      {
        depth: 5,
        title: 'ORIGEM DO SINAL BLACKOUT',
        nodes: [
          { id: 'n5_1', type: 'BOSS', label: 'CONFRONTO: THE BLACKOUT SIGNAL', bossType: 'blackout_signal', desc: 'A fonte da anomalia. Destrua-a para conter o setor.', connectedTo: [] }
        ]
      }
    ];
  },

  start(cls = 'assault', isCoop = true, p2Class = 'scout') {
    this.initSaveData();
    if (typeof SAVE !== 'undefined' && SAVE.data.blackout) {
      SAVE.data.blackout.runsAttempted++;
      SAVE.save();
    }

    this.active = true;
    this.cls = cls;
    this.isCoop = isCoop;
    this.p2Class = p2Class;
    this.depth = 1;
    this.seed = Math.floor(Math.random() * 900000) + 100000;
    this.routeMap = this.generateRouteMap(this.seed);
    this.currentNode = null;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.kills = 0;
    this.damageTaken = 0;
    this.score = 0;
    this.blackBoxesRecovered = 0;
    this.upgrades = [];
    this.anomalies = [];

    // Ocultar menus e HUD
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'block';

    GAME.isCoop = isCoop;
    GAME.mode = isCoop ? '2P' : '1P';
    GAME.state = 'PLAYING';
    GAME.timeScale = 1.0;
    GAME.slowMoTimer = 0;
    GAME.combo = 0;
    GAME.comboTimer = 0;

    // Instanciar caças do jogador distribuídos sem sobreposição
    let screenW = GAME.w || (typeof window !== 'undefined' ? window.innerWidth : 800);
    GAME.p1 = new Player(cls, false);
    if (isCoop) {
      GAME.p2 = new Player(p2Class, true);
      GAME.p1.x = screenW * 0.35;
      GAME.p2.x = screenW * 0.65;
    } else {
      GAME.p2 = null;
      GAME.p1.x = screenW * 0.50;
    }

    if (typeof UI !== 'undefined') {
      UI.updateHP(GAME.p1.hp, GAME.p1.maxHp, false);
      UI.updateSpecial(0, false);
      const p2Cont = document.getElementById('p2-hp-container');
      if (p2Cont) p2Cont.style.display = isCoop ? 'block' : 'none';
      if (isCoop && GAME.p2) {
        UI.updateHP(GAME.p2.hp, GAME.p2.maxHp, true);
        UI.updateSpecial(0, true);
      }
    }

    if (typeof INPUT !== 'undefined' && INPUT.updateTouchHUDVisibility) {
      INPUT.updateTouchHUDVisibility();
    }

    // Exibir tela de seleção de rota inicial
    this.showRouteMapScreen();
  },

  showRouteMapScreen() {
    GAME.timeScale = 0;
    let modal = document.getElementById('blackout-route-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'blackout-route-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(6, 4, 12, 0.98)';
      modal.style.border = '2px solid #ff0055';
      modal.style.boxShadow = '0 0 35px rgba(255, 0, 85, 0.4)';
      modal.style.padding = '24px';
      modal.style.zIndex = '2000';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '330px';
      modal.style.maxWidth = '92vw';
      modal.style.maxHeight = '88vh';
      modal.style.overflowY = 'auto';
      modal.style.pointerEvents = 'auto';
      document.body.appendChild(modal);
    }

    modal.style.display = 'block';

    const currentLayer = this.routeMap[this.depth - 1];
    let nodesHtml = currentLayer.nodes.map((node, idx) => {
      let isAvailable = true;
      if (this.currentNode && this.currentNode.connectedTo) {
        isAvailable = this.currentNode.connectedTo.includes(node.id);
      }

      let tagColor = '#00e5ff';
      if (node.type === 'ELITE') tagColor = '#ffea00';
      if (node.type === 'ANOMALY') tagColor = '#bf00ff';
      if (node.type === 'BOSS') tagColor = '#ff0044';
      if (node.type === 'RESUPPLY') tagColor = '#00ff88';
      if (node.type === 'LOG') tagColor = '#ff9900';

      return `
        <div style="border: 1px solid ${isAvailable ? tagColor : '#333'}; background: ${isAvailable ? 'rgba(20, 10, 30, 0.85)' : 'rgba(10,10,15,0.4)'}; padding: 14px; margin: 8px 0; border-radius: 4px; text-align: left; opacity: ${isAvailable ? '1.0' : '0.45'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: bold; color: ${tagColor}; letter-spacing: 2px;">[${node.type}]</span>
            <span style="font-size: 10px; color: #888;">PROFUNDIDADE ${this.depth}/5</span>
          </div>
          <h4 style="color: #fff; margin: 2px 0 6px 0; font-size: 14px;">${node.label}</h4>
          <p style="color: #aaa; font-size: 12px; margin: 0 0 10px 0;">${node.desc}</p>
          <button onclick="BLACKOUT.selectNode('${node.id}')" ${!isAvailable ? 'disabled' : ''} style="width: 100%; border-color: ${tagColor}; color: ${tagColor}; font-weight: bold; padding: 8px;">
            ${isAvailable ? 'ESTABELECER ROTA // ENTRAR' : 'CAMINHO INACESSÍVEL'}
          </button>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div style="border-bottom: 1px solid #331525; padding-bottom: 10px; margin-bottom: 15px;">
        <span style="color: #ff0055; font-size: 11px; letter-spacing: 4px;">OPERAÇÃO BLACKOUT // SETOR SOMBRA</span>
        <h2 style="color: #fff; margin: 6px 0; letter-spacing: 2px;">${currentLayer.title}</h2>
        <span style="color: #889; font-size: 12px;">Selecione o vetor de incursão para prosseguir</span>
      </div>
      <div>${nodesHtml}</div>
    `;
  },

  selectNode(nodeId) {
    const currentLayer = this.routeMap[this.depth - 1];
    const node = currentLayer.nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.currentNode = node;
    const modal = document.getElementById('blackout-route-modal');
    if (modal) modal.style.display = 'none';

    GAME.timeScale = 1.0;
    this.executeNode(node);
  },

  executeNode(node) {
    if (typeof UI !== 'undefined' && UI.updateSector) {
      UI.updateSector(`BLACKOUT P-${this.depth} [${node.type}]`);
    }

    if (node.type === 'RESUPPLY') {
      // Reparo de HP
      if (GAME.p1) {
        GAME.p1.hp = Math.min(GAME.p1.maxHp, GAME.p1.hp + Math.round(GAME.p1.maxHp * 0.40));
        GAME.p1.shieldTimer = Math.max(GAME.p1.shieldTimer, 8.0);
        if (typeof UI !== 'undefined') UI.updateHP(GAME.p1.hp, GAME.p1.maxHp, false);
      }
      if (GAME.p2) {
        GAME.p2.hp = Math.min(GAME.p2.maxHp, GAME.p2.hp + Math.round(GAME.p2.maxHp * 0.40));
        GAME.p2.shieldTimer = Math.max(GAME.p2.shieldTimer, 8.0);
        if (typeof UI !== 'undefined') UI.updateHP(GAME.p2.hp, GAME.p2.maxHp, true);
      }
      if (typeof UI !== 'undefined') {
        UI.showTransmission("REABASTECIMENTO CONCLUÍDO: +40% BLINDAGEM E ESCUDO ATIVO.");
      }
      setTimeout(() => this.advanceDepth(), 2000);
      return;
    }

    if (node.type === 'LOG') {
      this.blackBoxesRecovered++;
      if (typeof SAVE !== 'undefined' && SAVE.data.blackout) {
        SAVE.data.blackout.blackBoxes.push(`Registro-${this.depth}-${Date.now()}`);
        SAVE.save();
      }
      if (typeof UI !== 'undefined') {
        UI.showTransmission("CAIXA PRETA RECUPERADA: '...não era uma frota inimiga. Era algo que acordamos.'");
      }
      setTimeout(() => {
        this.promptUpgradeChoice(false, true);
      }, 2500);
      return;
    }

    if (node.type === 'WORKSHOP') {
      this.promptUpgradeChoice(false, false);
      return;
    }

    if (node.type === 'ANOMALY') {
      this.promptUpgradeChoice(true, false);
      return;
    }

    // Nodos de combate
    if (node.type === 'BOSS') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: 'ANOMALIA FINAL IDENTIFICADA' },
        { type: 'BOSS_WAIT', bossType: node.bossType }
      ];
    } else if (node.type === 'MINIBOSS') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: node.label },
        { type: 'MINIBOSS', boss: node.boss, text: node.label },
        { type: 'SILENCE', time: 2, text: 'SETOR LIMPO' }
      ];
    } else if (node.type === 'ELITE') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: 'ENGALFINHAMENTO COM FORÇA DE ELITE' },
        { type: 'HORDE_FORMATION', waves: 4, text: 'DESTRUA A ESCOLTA DE ELITE' },
        { type: 'SILENCE', time: 2, text: 'AMEAÇA DE ELITE NEUTRALIZADA' }
      ];
    } else {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: 'ZONA DE COMBATE SOMBRA' },
        { type: 'HORDE', kills: 25, text: 'EXPURGUE A FORMAÇÃO' },
        { type: 'SILENCE', time: 2, text: 'PERÍMETRO SEGURO' }
      ];
    }

    PACING.phaseIdx = 0;
    PACING.startPhase();
  },

  promptUpgradeChoice(isAnomaly = false, isLogReward = false) {
    GAME.timeScale = 0;
    let pool = isAnomaly ? this.ANOMALIES : this.UPGRADES;
    let shuffled = pool.slice().sort(() => 0.5 - Math.random());
    let draft = shuffled.slice(0, 2);

    let modal = document.getElementById('blackout-upgrade-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'blackout-upgrade-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(10, 4, 18, 0.98)';
      modal.style.border = isAnomaly ? '2px solid #bf00ff' : '2px solid #00e5ff';
      modal.style.boxShadow = isAnomaly ? '0 0 35px rgba(191, 0, 255, 0.4)' : '0 0 35px rgba(0, 229, 255, 0.4)';
      modal.style.padding = '25px';
      modal.style.zIndex = '2050';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '330px';
      modal.style.maxWidth = '92vw';
      modal.style.pointerEvents = 'auto';
      document.body.appendChild(modal);
    }

    modal.style.display = 'block';

    let cards = draft.map((item, idx) => `
      <div style="border: 1px solid ${isAnomaly ? '#bf00ff' : '#00e5ff'}; background: rgba(20, 10, 35, 0.85); padding: 14px; margin: 10px 0; border-radius: 4px; text-align: left;">
        <span style="font-size: 10px; color: ${isAnomaly ? '#ff33aa' : '#ffea00'}; font-weight: bold; letter-spacing: 2px;">
          ${item.risk || ('MODULO: ' + item.type.toUpperCase())}
        </span>
        <h4 style="color: #fff; margin: 4px 0 6px 0; font-size: 15px;">${item.name}</h4>
        <p style="color: #cad8e5; font-size: 12px; margin: 0 0 10px 0; line-height: 1.5;">${item.desc}</p>
        <button onclick="BLACKOUT.applyChosenUpgrade(${isAnomaly}, '${item.id}')" style="width: 100%; border-color: ${isAnomaly ? '#bf00ff' : '#00e5ff'}; color: #fff; font-weight: bold; padding: 9px; cursor: pointer;">
          ${isAnomaly ? 'SINCRONIZAR ANOMALIA' : 'INSTALAR UPGRADE'}
        </button>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="border-bottom: 1px solid #331535; padding-bottom: 8px; margin-bottom: 12px;">
        <span style="color: ${isAnomaly ? '#bf00ff' : '#00e5ff'}; font-size: 11px; letter-spacing: 3px;">
          ${isAnomaly ? 'ANOMALIA CÓSMICA IDENTIFICADA' : 'OFICINA DE CAMPO AVANÇADA'}
        </span>
        <h3 style="color: #fff; margin: 4px 0; letter-spacing: 2px;">
          ${isAnomaly ? 'ACEITAR MODIFICAÇÃO DO VAZIO' : 'SELEÇÃO DE ENGENHARIA'}
        </h3>
      </div>
      <div>${cards}</div>
    `;
  },

  applyChosenUpgrade(isAnomaly, itemId) {
    let pool = isAnomaly ? this.ANOMALIES : this.UPGRADES;
    let item = pool.find(i => i.id === itemId);
    if (item) {
      if (isAnomaly) this.anomalies.push(item);
      else this.upgrades.push(item);

      if (GAME.p1) item.apply(GAME.p1);
      if (GAME.p2) item.apply(GAME.p2);
      if (typeof UI !== 'undefined') UI.showTransmission(`MODIFICAÇÃO ATIVA: ${item.name}`);
    }

    const modal = document.getElementById('blackout-upgrade-modal');
    if (modal) modal.style.display = 'none';

    GAME.timeScale = 1.0;
    this.advanceDepth();
  },

  onEncounterComplete() {
    this.advanceDepth();
  },

  advanceDepth() {
    if (typeof GAME !== 'undefined' && typeof GAME.restoreFallenPilotsAfterSector === 'function') {
      GAME.restoreFallenPilotsAfterSector();
    }
    this.depth++;
    if (typeof SAVE !== 'undefined' && SAVE.data.blackout) {
      if (this.depth > SAVE.data.blackout.highestDepth) {
        SAVE.data.blackout.highestDepth = this.depth;
        SAVE.save();
      }
    }

    if (this.depth > this.maxDepth) {
      this.finishRun(true);
    } else {
      this.showRouteMapScreen();
    }
  },

  finishRun(victory = true) {
    if (!victory && typeof GAME !== 'undefined' && typeof GAME.isAnyPlayerAlive === 'function' && GAME.isAnyPlayerAlive()) {
      return; // O parceiro ainda está vivo na tentativa
    }
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.score = (this.kills * 150) + (this.blackBoxesRecovered * 1000) + (this.depth * 800);
    if (victory && typeof SAVE !== 'undefined' && SAVE.data.blackout) {
      SAVE.data.blackout.runsCleared++;
      SAVE.save();
    }

    GAME.state = 'BLACKOUT_SUMMARY';
    this.renderSummaryModal(victory);
  },

  renderSummaryModal(victory) {
    let modal = document.getElementById('blackout-summary-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'blackout-summary-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(8, 4, 15, 0.98)';
      modal.style.border = victory ? '2px solid #bf00ff' : '2px solid #ff0044';
      modal.style.boxShadow = victory ? '0 0 35px rgba(191, 0, 255, 0.4)' : '0 0 35px rgba(255, 0, 68, 0.4)';
      modal.style.padding = '30px';
      modal.style.zIndex = '2100';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '330px';
      modal.style.maxWidth = '92vw';
      modal.style.pointerEvents = 'auto';
      document.body.appendChild(modal);
    }

    modal.style.display = 'block';
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = this.elapsedTime % 60;
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    modal.innerHTML = `
      <div style="border-bottom: 1px solid #331535; padding-bottom: 10px; margin-bottom: 15px;">
        <span style="font-size: 11px; letter-spacing: 4px; color: ${victory ? '#bf00ff' : '#ff0044'};">
          ${victory ? 'SETOR SOMBRA PURIFICADO // REGISTROS SALVOS' : 'TRANSMISSÃO PERDIDA NO SETOR'}
        </span>
        <h2 style="color: #fff; margin: 6px 0; letter-spacing: 3px;">
          ${victory ? 'MISSÃO BLACKOUT CONCLUÍDA' : 'UNIDADE DESTRUIDA'}
        </h2>
      </div>

      <div style="text-align: left; background: rgba(18, 10, 28, 0.7); border: 1px solid #331535; padding: 15px; margin: 15px 0; font-size: 13px; line-height: 1.8;">
        <div><b>PROFUNDIDADE MÁXIMA:</b> ${this.depth} / ${this.maxDepth}</div>
        <div><b>DURAÇÃO DA INCURSÃO:</b> ${timeFormatted}</div>
        <div><b>CAIXAS PRETAS RECUPERADAS:</b> ${this.blackBoxesRecovered}</div>
        <div><b>ABATES HOSTIS:</b> ${this.kills}</div>
        <div><b>ANOMALIAS SINCRONIZADAS:</b> ${this.anomalies.length}</div>
        <div style="color: #ffaa00; font-size: 16px; margin-top: 6px;"><b>PONTUAÇÃO DE INCURSÃO:</b> ${this.score} PTS</div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="BLACKOUT.retry()" style="border-color: #bf00ff; color: #bf00ff; font-weight: bold; min-height: 42px; padding: 0 16px;">NOVA TENTATIVA</button>
        <button onclick="BLACKOUT.exitToMenu()" style="border-color: #88aabb; color: #88aabb; min-height: 42px; padding: 0 16px;">MENU PRINCIPAL</button>
      </div>
    `;
  },

  retry() {
    const summary = document.getElementById('blackout-summary-modal');
    if (summary) summary.style.display = 'none';
    this.start(this.cls, this.isCoop, this.p2Class);
  },

  exitToMenu() {
    this.active = false;
    const summary = document.getElementById('blackout-summary-modal');
    if (summary) summary.style.display = 'none';
    const route = document.getElementById('blackout-route-modal');
    if (route) route.style.display = 'none';
    const upg = document.getElementById('blackout-upgrade-modal');
    if (upg) upg.style.display = 'none';

    GAME.state = 'MENU';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'block';
  }
};

if (typeof window !== 'undefined') {
  window.BLACKOUT = BLACKOUT;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BLACKOUT };
}
