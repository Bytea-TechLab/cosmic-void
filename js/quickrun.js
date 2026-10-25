// ============================================================================
// COSMIC VOID — QUICK RUN MODE (Modo Rápido Independente)
// Partidas rápidas e autocontidas (4-6 min curto / 8-12 min padrão)
// Sistema de encontros controlados, upgrades temporários e estatísticas de run.
// ============================================================================

const QUICKRUN = {
  active: false,
  lengthType: 'standard', // 'standard' (7 encontros) ou 'short' (4 encontros)
  encounterIndex: 0,
  totalEncounters: 7,
  seed: 0,
  cls: 'assault',
  isCoop: false,
  p2Class: 'scout',
  startTime: 0,
  elapsedTime: 0,
  kills: 0,
  damageTaken: 0,
  score: 0,
  upgrades: [],
  currentDraft: [],

  // Catálogo balanceado de Upgrades exclusivos da Run
  UPGRADE_CATALOG: [
    {
      id: 'rail_overclock',
      category: 'armamento',
      name: 'Sabot Hiper-Acelerado',
      desc: '+35% Dano de projéteis e perfuração aprimorada.',
      apply(player) {
        player.stats.dmg = Math.round(player.stats.dmg * 1.35);
      }
    },
    {
      id: 'plasma_scatter',
      category: 'armamento',
      name: 'Difusor de Plasma',
      desc: 'Dispara +1 projétil lateral adicional a cada salva.',
      apply(player) {
        player.extraShots = (player.extraShots || 0) + 1;
      }
    },
    {
      id: 'rapid_charge',
      category: 'armamento',
      name: 'Alimentador Magnético',
      desc: 'Cadência de tiro ampliada em 20%.',
      apply(player) {
        player.stats.firerate = Math.max(0.05, player.stats.firerate * 0.80);
      }
    },
    {
      id: 'boost_thrusters',
      category: 'propulsao',
      name: 'Micro-Propulsores de Manobra',
      desc: 'Recarga do Dash reduzida em 25% e velocidade de deslocamento +30.',
      apply(player) {
        player.dashCdBase = Math.max(0.35, player.dashCdBase * 0.75);
        player.stats.spd += 30;
      }
    },
    {
      id: 'phase_afterburn',
      category: 'propulsao',
      name: 'Rastro Térmico',
      desc: 'O Dash concede +0.15s de invulnerabilidade e causa dano de choque.',
      apply(player) {
        player.orbDash = 5.0;
      }
    },
    {
      id: 'shield_matrix',
      category: 'defesa',
      name: 'Barreira Cinética Reativa',
      desc: 'Gera um escudo de absorção de dano temporário a cada setor (5s).',
      apply(player) {
        player.shieldTimer = Math.max(player.shieldTimer, 5.0);
      }
    },
    {
      id: 'parry_shockwave',
      category: 'defesa',
      name: 'Ressonador de Contra-Ataque',
      desc: 'Parry bem-sucedido cura 15% de HP e gera uma onda radial ofensiva.',
      apply(player) {
        player.orbParity = 15.0;
      }
    },
    {
      id: 'vampiric_siphon',
      category: 'defesa',
      name: 'Sifão Nanotecnológico',
      desc: 'Abates têm 15% de chance de restaurar 10 pontos de integridade estrutural.',
      apply(player) {
        player.vampiricChance = 0.15;
      }
    },
    {
      id: 'overdrive_reactor',
      category: 'nucleo',
      name: 'Reator de Fusão em Sobrecarga',
      desc: 'O Especial carrega 35% mais rápido.',
      apply(player) {
        player.specialtyLvl = (player.specialtyLvl || 0) + 2;
      }
    },
    {
      id: 'critical_lens',
      category: 'nucleo',
      name: 'Lente de Foco Quântico',
      desc: '+15% Chance de acerto crítico e multiplicador elevado para 2.2x.',
      apply(player) {
        player.stats.critChance = (player.stats.critChance || 0.05) + 0.15;
        player.stats.critMult = 2.2;
      }
    },
    {
      id: 'reinforced_plating',
      category: 'defesa',
      name: 'Blindagem de Titânio Composto',
      desc: '+40 HP Máximo e reparo imediato de 40 de HP.',
      apply(player) {
        player.maxHp += 40;
        player.hp = Math.min(player.maxHp, player.hp + 40);
        if (typeof UI !== 'undefined') UI.updateHP(player.hp, player.maxHp, player.isP2);
      }
    }
  ],

  // Definição dos encontros estruturados para Quick Run
  getEncounterPlan(isShort) {
    if (isShort) {
      return [
        { id: 'qr_skirmish_1', title: 'ESCARAMUÇA DE RECONHECIMENTO', type: 'HORDE_FORMATION', waves: 3, rewardUpgrade: true },
        { id: 'qr_elite_squad', title: 'INTERCEPTAÇÃO DE ESQUADRÃO DE ELITE', type: 'HORDE', kills: 22, rewardUpgrade: true },
        { id: 'qr_miniboss', title: 'AMEAÇA PESADA: COLOSSO REGIONAL', type: 'MINIBOSS', boss: 'miniboss_flailer', rewardUpgrade: true },
        { id: 'qr_boss_climax', title: 'CONFRONTO FINAL: THE GATEKEEPER', type: 'BOSS', bossType: 'gatekeeper', rewardUpgrade: false }
      ];
    } else {
      return [
        { id: 'qr_patrol_1', title: 'PATRULHA DE VANGUARDA', type: 'HORDE_FORMATION', waves: 3, rewardUpgrade: true },
        { id: 'qr_heavy_siege', title: 'CERCO DE BLINDADOS', type: 'HORDE', kills: 24, rewardUpgrade: true },
        { id: 'qr_miniboss_1', title: 'ANOMALIA: O FLAGELADOR', type: 'MINIBOSS', boss: 'miniboss_flailer', rewardUpgrade: true },
        { id: 'qr_formation_elite', title: 'FORMAÇÃO DE CAÇADORES ALFA', type: 'HORDE_FORMATION', waves: 4, rewardUpgrade: true },
        { id: 'qr_miniboss_2', title: 'SUPERARMA: CAVALEIRO DO VAZIO', type: 'MINIBOSS', boss: 'miniboss_knight', rewardUpgrade: true },
        { id: 'qr_cataclysm', title: 'SURTO DE ANOMALIA GRAVITACIONAL', type: 'MINIBOSS', boss: 'miniboss_gravity', rewardUpgrade: true },
        { id: 'qr_final_boss', title: 'COMANDO CENTRAL: THE DREAD FLEET', type: 'BOSS', bossType: 'dread_fleet', rewardUpgrade: false }
      ];
    }
  },

  start(cls = 'assault', lengthType = 'standard', isCoop = true, p2Class = 'scout') {
    this.active = true;
    this.lengthType = lengthType;
    this.cls = cls;
    this.isCoop = isCoop;
    this.p2Class = p2Class;
    this.encounterIndex = 0;
    this.plan = this.getEncounterPlan(lengthType === 'short');
    this.totalEncounters = this.plan.length;
    this.seed = Math.floor(Math.random() * 900000) + 100000;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.kills = 0;
    this.damageTaken = 0;
    this.score = 0;
    this.upgrades = [];
    this.currentDraft = [];

    // Ocultar menus e inicializar jogo
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'block';

    // Iniciar sessão de gameplay sem alterar checkpoint de campanha
    GAME.isCoop = isCoop;
    GAME.mode = isCoop ? '2P' : '1P';
    GAME.state = 'PLAYING';
    GAME.timeScale = 1.0;
    GAME.slowMoTimer = 0;
    GAME.combo = 0;
    GAME.comboTimer = 0;

    // Criar instâncias dos jogadores com base limpa e sem sobreposição
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

    this.loadCurrentEncounter();
  },

  loadCurrentEncounter() {
    if (this.encounterIndex >= this.totalEncounters) {
      this.finishRun(true);
      return;
    }

    const enc = this.plan[this.encounterIndex];
    if (typeof UI !== 'undefined' && UI.updateSector) {
      UI.updateSector(`QR ${this.encounterIndex + 1}/${this.totalEncounters}`);
    }

    // Configurar fases do Pacing para o encontro
    if (enc.type === 'BOSS') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: enc.title },
        { type: 'BOSS_WAIT', bossType: enc.bossType }
      ];
    } else if (enc.type === 'MINIBOSS') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: enc.title },
        { type: 'MINIBOSS', boss: enc.boss, text: enc.title },
        { type: 'SILENCE', time: 2, text: 'ZONA PURIFICADA' }
      ];
    } else if (enc.type === 'HORDE_FORMATION') {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: enc.title },
        { type: 'HORDE_FORMATION', waves: enc.waves, text: 'INTERCEPTE AS FORMAÇÕES' },
        { type: 'SILENCE', time: 2, text: 'SETOR LIMPO' }
      ];
    } else {
      PACING.phases = [
        { type: 'INTRO', time: 2, text: enc.title },
        { type: 'HORDE', kills: enc.kills, text: 'ELIMINE A FORÇA INIMIGA' },
        { type: 'SILENCE', time: 2, text: 'SETOR LIMPO' }
      ];
    }

    PACING.phaseIdx = 0;
    PACING.startPhase();
  },

  // Chamado quando um encontro do Quick Run é concluído
  onEncounterComplete() {
    const enc = this.plan[this.encounterIndex];
    if (enc && enc.rewardUpgrade) {
      this.promptUpgradeDraft();
    } else {
      this.advanceEncounter();
    }
  },

  promptUpgradeDraft() {
    // Escolher 3 opções aleatórias do catálogo que o jogador ainda não tenha pego no máximo
    const available = this.UPGRADE_CATALOG.filter(u => {
      let count = this.upgrades.filter(p => p.id === u.id).length;
      return count < 2;
    });

    // Baralhar e pegar 3
    const shuffled = available.slice().sort(() => 0.5 - Math.random());
    this.currentDraft = shuffled.slice(0, 3);

    // Se estiver em ambiente com DOM, exibir modal de escolha
    this.renderDraftModal();
  },

  renderDraftModal() {
    let modal = document.getElementById('quickrun-draft-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickrun-draft-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(5, 10, 20, 0.96)';
      modal.style.border = '2px solid #00e5ff';
      modal.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.35)';
      modal.style.padding = '25px';
      modal.style.zIndex = '2000';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '320px';
      modal.style.maxWidth = '90vw';
      modal.style.pointerEvents = 'auto';
      document.body.appendChild(modal);
    }

    GAME.timeScale = 0;
    modal.style.display = 'block';

    let cardsHtml = this.currentDraft.map((upg, idx) => `
      <div style="border: 1px solid #1a3a50; background: rgba(10, 25, 45, 0.8); padding: 14px; margin: 10px 0; text-align: left; border-radius: 4px; transition: border 0.2s;">
        <span style="font-size: 10px; color: #ffaa00; text-transform: uppercase; letter-spacing: 2px;">[${upg.category}]</span>
        <h4 style="color: #00e5ff; margin: 4px 0 6px 0; letter-spacing: 1px;">${upg.name}</h4>
        <p style="color: #cad8e5; font-size: 12px; margin: 0 0 10px 0;">${upg.desc}</p>
        <button onclick="QUICKRUN.selectUpgrade(${idx})" style="width: 100%; border-color: #00e5ff; color: #00e5ff; font-weight: bold; padding: 8px;">EQUIPAR MELHORIA</button>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="border-bottom: 1px solid #1a3040; padding-bottom: 8px; margin-bottom: 12px;">
        <span style="color: #00e5ff; font-size: 11px; letter-spacing: 3px;">SUPRIMENTO TÁTICO DE REFORÇO // RUN #${this.seed}</span>
        <h3 style="color: #fff; margin: 4px 0; letter-spacing: 2px;">ESCOLHA UM UPGRADE MODULAR</h3>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${cardsHtml}
      </div>
    `;
  },

  selectUpgrade(draftIndex) {
    const selected = this.currentDraft[draftIndex];
    if (selected) {
      this.upgrades.push(selected);
      if (GAME.p1) selected.apply(GAME.p1);
      if (GAME.p2) selected.apply(GAME.p2);
      if (typeof UI !== 'undefined' && UI.showTransmission) {
        UI.showTransmission(`UPGRADE INSTALADO: ${selected.name}`);
      }
    }

    const modal = document.getElementById('quickrun-draft-modal');
    if (modal) modal.style.display = 'none';

    GAME.timeScale = 1.0;
    this.advanceEncounter();
  },

  advanceEncounter() {
    if (typeof GAME !== 'undefined' && typeof GAME.restoreFallenPilotsAfterSector === 'function') {
      GAME.restoreFallenPilotsAfterSector();
    }
    this.encounterIndex++;
    if (this.encounterIndex >= this.totalEncounters) {
      this.finishRun(true);
    } else {
      this.loadCurrentEncounter();
    }
  },

  finishRun(victory = true) {
    if (!victory && typeof GAME !== 'undefined' && typeof GAME.isAnyPlayerAlive === 'function' && GAME.isAnyPlayerAlive()) {
      return; // O parceiro ainda está vivo no combate
    }
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.score = (this.kills * 120) + (this.encounterIndex * 500) + Math.max(0, 3000 - this.elapsedTime * 5);
    if (!victory) this.score = Math.floor(this.score * 0.5);

    GAME.state = 'QUICKRUN_SUMMARY';
    this.renderSummaryModal(victory);
  },

  renderSummaryModal(victory) {
    let modal = document.getElementById('quickrun-summary-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickrun-summary-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(5, 8, 15, 0.98)';
      modal.style.border = victory ? '2px solid #00ff88' : '2px solid #ff3344';
      modal.style.boxShadow = victory ? '0 0 35px rgba(0, 255, 136, 0.3)' : '0 0 35px rgba(255, 51, 68, 0.3)';
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
      <div style="border-bottom: 1px solid #1a3040; padding-bottom: 10px; margin-bottom: 15px;">
        <span style="font-size: 11px; letter-spacing: 4px; color: ${victory ? '#00ff88' : '#ff3344'};">
          ${victory ? 'OPERAÇÃO CONCLUÍDA COM SUCESSO' : 'SINAL DE CAÇA INTERROMPIDO'}
        </span>
        <h2 style="color: #fff; margin: 6px 0; letter-spacing: 3px;">
          ${victory ? 'VITÓRIA TÁTICA' : 'MISSÃO ABORTADA'}
        </h2>
      </div>

      <div style="text-align: left; background: rgba(10, 20, 30, 0.7); border: 1px solid #1a3045; padding: 15px; margin: 15px 0; font-size: 13px; line-height: 1.8;">
        <div><b>MODALIDADE:</b> Quick Run (${this.lengthType === 'short' ? 'Blitz 4 Fases' : 'Padrão 7 Fases'})</div>
        <div><b>DURAÇÃO TOTAL:</b> ${timeFormatted}</div>
        <div><b>ABATES CONFIRMADOS:</b> ${this.kills}</div>
        <div><b>SETOR FINAL ALCANÇADO:</b> ${this.encounterIndex} / ${this.totalEncounters}</div>
        <div><b>UPGRADES COLETADOS:</b> ${this.upgrades.length}</div>
        <div><b>SEED DETERMINÍSTICA:</b> #${this.seed}</div>
        <div style="color: #ffea00; font-size: 16px; margin-top: 6px;"><b>PONTUAÇÃO FINAL:</b> ${this.score} PTS</div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="QUICKRUN.retry()" style="border-color: #00e5ff; color: #00e5ff; font-weight: bold; min-height: 42px; padding: 0 16px;">JOGAR NOVAMENTE</button>
        <button onclick="QUICKRUN.exitToMenu()" style="border-color: #88aabb; color: #88aabb; min-height: 42px; padding: 0 16px;">MENU PRINCIPAL</button>
      </div>
    `;
  },

  retry() {
    const summary = document.getElementById('quickrun-summary-modal');
    if (summary) summary.style.display = 'none';
    this.start(this.cls, this.lengthType, this.isCoop, this.p2Class);
  },

  exitToMenu() {
    this.active = false;
    const summary = document.getElementById('quickrun-summary-modal');
    if (summary) summary.style.display = 'none';
    const draft = document.getElementById('quickrun-draft-modal');
    if (draft) draft.style.display = 'none';

    GAME.state = 'MENU';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'block';
  }
};

if (typeof window !== 'undefined') {
  window.QUICKRUN = QUICKRUN;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUICKRUN };
}
