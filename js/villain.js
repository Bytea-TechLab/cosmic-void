// ============================================================================
// COSMIC VOID — VILÃO RECORRENTE: NULL-ECLIPSE // O JUIZ DA NÃO-EXISTÊNCIA
// Módulo de encontros por tier, cinematografia, manipulação de arena e clímax.
// ============================================================================

const VILLAIN = {
  name: "NULL-ECLIPSE",
  title: "O JUIZ DA NÃO-EXISTÊNCIA",
  active: false,
  x: 0,
  y: -200,
  vx: 0,
  vy: 0,
  radius: 38,
  color: "#a855f7",
  accentColor: "#00e5ff",
  state: "INACTIVE", // INACTIVE, INTRO, COMBAT, FINAL_EXECUTION, RETREATING, DEFEATED
  tier: 1,
  hp: 14000,
  maxHp: 14000,
  initialHp: 14000,
  timer: 0,
  combatDuration: 0,
  attackTimer: 0,
  vulnerableTimer: 0,
  counterActive: 0,
  shieldTimer: 0,
  cameraZoom: 1.0,
  introStep: 0,

  // Telemetria e Instrumentação por Aparição
  damageReceived: 0,
  damageDealtToPlayer: 0,
  vulnerableTimeTotal: 0,
  playerDeathsDuringFight: 0,
  executionTimer: 0,
  executionWindowMax: 4.0,
  executionFailsCount: 0,
  assistedKill: false,

  // Estado dos Poderes Surreais
  powers: {
    // 1. Ambiente: Arena de Supressão (Paredes de plasma móveis)
    arena: {
      active: false,
      warnTimer: 0,
      duration: 0,
      side: "left", // "left", "right", "both"
      wallWidth: 0,
      targetWidth: 0
    },
    // 2. Gravidade: Onda Gravitacional Polarizada
    gravity: {
      active: false,
      warnTimer: 0,
      duration: 0,
      direction: 1, // 1: puxa para o vilão, -1: empurra para o fundo
      strength: 0
    },
    // 3. Tempo: Fenda de Dilatação Temporal Local
    timeDilation: {
      active: false,
      warnTimer: 0,
      duration: 0,
      x: 0,
      y: 0,
      radius: 120,
      timeScale: 0.40
    },
    // 4. Destino: Espelho de Trajetória Simulada
    destiny: {
      active: false,
      warnTimer: 0,
      duration: 0,
      projX: 0,
      projY: 0,
      targetX: 0,
      targetY: 0
    }
  },

  // Configurações das Janelas e Tiers (Totalmente ajustáveis)
  config: {
    introDuration: 7.0, // Alvo inicial: 6 a 10s ajustável
    executionDuration: 4.0, // Duração da janela final em tempo real (configurável)
    executionSlowMo: 0.18,   // Escala de slow-motion durante a execução
    windows: [
      [3, 4],       // Bloco 1: Preserva The Gatekeeper (5)
      [7, 8, 9],    // Bloco 2: Preserva The Leviathan (10)
      [12, 13, 14], // Bloco 3: Preserva Seraph-0 (15)
      [20]          // Bloco 4: Setor 20 (Clímax antes de The Ascended)
    ],
    tierStats: {
      1: {
        hp: 14000,
        speed: 180,
        attackInterval: 1.75,
        retreatHpRatio: 0.45, // Retira-se aos 45% de HP
        maxDuration: 180,     // 3 min limite
        pressure: 1.0,
        threatName: "AMEAÇA ELEVADA",
        powerCooldown: 7.0
      },
      2: {
        hp: 28000,
        speed: 220,
        attackInterval: 1.35,
        retreatHpRatio: 0.40, // Retira-se aos 40% de HP
        maxDuration: 200,     // 3m20s limite
        pressure: 1.3,
        threatName: "AMEAÇA CRÍTICA",
        powerCooldown: 6.0
      },
      3: {
        hp: 52000,
        speed: 260,
        attackInterval: 1.05,
        retreatHpRatio: 0.35, // Retira-se aos 35% de HP
        maxDuration: 220,     // 3m40s limite
        pressure: 1.6,
        threatName: "AMEAÇA EXTREMA",
        powerCooldown: 5.0
      },
      4: {
        hp: 95000,
        speed: 310,
        attackInterval: 0.80,
        retreatHpRatio: 0.0,  // Luta até a morte definitiva
        maxDuration: 360,     // 6 min limite
        pressure: 2.0,
        threatName: "AMEAÇA SUPREMA // COLAPSO",
        powerCooldown: 4.0
      }
    }
  },

  powerCycleTimer: 0,

  // Estado persistido no Checkpoint
  data: {
    seed: null,
    scheduledSectors: [4, 8, 13, 20],
    currentTier: 1,
    encountersCompleted: 0,
    defeated: false,
    seenIntro: false,
    history: []
  },

  // --------------------------------------------------------------------------
  // 1. GERADOR DETERMINÍSTICO DE NÚMEROS PSEUDO-ALEATÓRIOS (PRNG Mulberry32)
  // --------------------------------------------------------------------------
  _prng(seed) {
    let s = Math.floor(Math.abs(seed)) || 123456789;
    return function() {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  generateSeed() {
    return Math.floor(Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
  },

  scheduleEncounters(seedInput = null) {
    let seed = seedInput !== null ? seedInput : this.generateSeed();
    let rng = this._prng(seed);
    let scheduled = [];

    for (let i = 0; i < this.config.windows.length; i++) {
      let windowOptions = this.config.windows[i];
      if (windowOptions.length === 1) {
        scheduled.push(windowOptions[0]);
      } else {
        let chosenIdx = Math.floor(rng() * windowOptions.length);
        scheduled.push(windowOptions[chosenIdx]);
      }
    }

    this.data.seed = seed;
    this.data.scheduledSectors = scheduled;

    console.log(`[VILLAIN] Seed registrada: 0x${seed.toString(16).toUpperCase()} (${seed})`);
    console.log(`[VILLAIN] Aparições agendadas: Setores [${scheduled.join(', ')}]`);

    return scheduled;
  },

  // --------------------------------------------------------------------------
  // 2. SALVAMENTO E SINCRONIZAÇÃO COM CHECKPOINT
  // --------------------------------------------------------------------------
  initFromSave() {
    if (typeof SAVE === 'undefined' || !SAVE.data) return;
    if (!SAVE.data.checkpoint) SAVE.data.checkpoint = {};

    if (SAVE.data.checkpoint.villain) {
      let v = SAVE.data.checkpoint.villain;
      this.data.seed = v.seed;
      this.data.scheduledSectors = Array.isArray(v.scheduledSectors) ? v.scheduledSectors : [4, 8, 13, 20];
      this.data.currentTier = Math.min(4, Math.max(1, v.currentTier || 1));
      this.data.encountersCompleted = v.encountersCompleted || 0;
      this.data.defeated = !!v.defeated;
      this.data.seenIntro = !!v.seenIntro;
      this.data.history = Array.isArray(v.history) ? v.history : [];
      this.tier = this.data.currentTier;
    } else {
      this.resetProgress();
    }
  },

  syncToSave() {
    if (typeof SAVE === 'undefined' || !SAVE.data) return;
    if (!SAVE.data.checkpoint) SAVE.data.checkpoint = {};
    SAVE.data.checkpoint.villain = {
      seed: this.data.seed,
      scheduledSectors: [...this.data.scheduledSectors],
      currentTier: this.data.currentTier,
      encountersCompleted: this.data.encountersCompleted,
      defeated: this.data.defeated,
      seenIntro: this.data.seenIntro,
      history: [...this.data.history]
    };
    SAVE.save();
  },

  resetProgress() {
    let seed = this.generateSeed();
    this.data.currentTier = 1;
    this.data.encountersCompleted = 0;
    this.data.defeated = false;
    this.data.seenIntro = false;
    this.data.history = [];
    this.tier = 1;
    this.scheduleEncounters(seed);
    this.syncToSave();
  },

  shouldIntercept(sector) {
    if (this.data.defeated) return false;
    let expectedTier = this.data.encountersCompleted + 1;
    if (expectedTier > 4) return false;

    let scheduledSector = this.data.scheduledSectors[expectedTier - 1];
    return sector === scheduledSector;
  },

  // --------------------------------------------------------------------------
  // 3. SPAWN DO VILÃO E ENTRADA TRIUNFAL
  // --------------------------------------------------------------------------
  spawn(forcedTier = null) {
    this.tier = forcedTier !== null ? forcedTier : (this.data.currentTier || 1);
    let stats = this.config.tierStats[this.tier] || this.config.tierStats[1];

    let diffMult = (typeof GAME !== 'undefined' && GAME.diff) ? GAME.diff : 1.0;
    this.hp = Math.floor(stats.hp * diffMult);
    this.maxHp = this.hp;
    this.initialHp = this.hp;
    this.lastHp = this.hp;

    this.active = true;
    this.state = "INTRO";
    this.timer = 0;
    this.combatDuration = 0;
    this.attackTimer = 0;
    this.powerCycleTimer = 0;
    this.vulnerableTimer = 0;
    this.counterActive = 0;
    this.shieldTimer = 0;
    this.cameraZoom = 1.0;
    this.introStep = 0;
    this.executionTimer = 0;
    this.executionFailsCount = 0;
    this.assistedKill = false;

    this._resetPowers();

    // Reset de telemetria desta batalha
    this.damageReceived = 0;
    this.damageDealtToPlayer = 0;
    this.vulnerableTimeTotal = 0;
    this.playerDeathsDuringFight = 0;

    let screenW = (typeof GAME !== 'undefined' && GAME.w) ? GAME.w : 800;
    this.x = screenW / 2;
    this.y = -180;
    this.vx = 0;
    this.vy = 0;
    this._skipKeyHeldAtStart = (typeof INPUT !== 'undefined' && INPUT.keys && !!INPUT.keys['KeyV']);

    console.log(`[VILLAIN] Spawn: Tier ${this.tier} (${this.name}) - HP: ${this.hp}`);

    // Exibição do botão de Skip após a primeira vez que o jogador já assistiu
    if (this.data.seenIntro) {
      let btn = (typeof document !== 'undefined') ? document.getElementById('villain-skip-btn') : null;
      if (btn) btn.style.display = 'block';
    }

    if (typeof UI !== 'undefined') {
      let threatLabel = stats.threatName || "AMEAÇA ELEVADA";
      UI.showBossWarning(`${this.name} [TIER ${this.tier}]`);
      UI.toggleBossUI(true, `${this.name} // ${threatLabel}`);
      UI.updateBossHP(this.hp, this.maxHp);
    }
  },

  _resetPowers() {
    this.powers.arena.active = false;
    this.powers.arena.warnTimer = 0;
    this.powers.arena.duration = 0;
    this.powers.arena.wallWidth = 0;

    this.powers.gravity.active = false;
    this.powers.gravity.warnTimer = 0;
    this.powers.gravity.duration = 0;

    this.powers.timeDilation.active = false;
    this.powers.timeDilation.warnTimer = 0;
    this.powers.timeDilation.duration = 0;

    this.powers.destiny.active = false;
    this.powers.destiny.warnTimer = 0;
    this.powers.destiny.duration = 0;
  },

  skipIntro() {
    if (this.state !== "INTRO") return;
    this.timer = this.config.introDuration;
    this.y = 140;
    this.state = "COMBAT";
    this.cameraZoom = 1.0;
    let btn = (typeof document !== 'undefined') ? document.getElementById('villain-skip-btn') : null;
    if (btn) btn.style.display = 'none';

    if (typeof GAME !== 'undefined') {
      GAME.shake = 20;
      GAME.globalFilter = "none";
    }
    if (typeof UI !== 'undefined' && UI.showTransmission) {
      UI.showTransmission(`${this.name}: "Chega de formalidades. Iniciando combate."`);
    }
    this.data.seenIntro = true;
    this.syncToSave();
  },

  takeDamage(amount, isCrit = false, isVuln = false, proj = null) {
    if (!this.active) return;

    // Se estiver na janela dramática de execução final (Tier 4 / Setor 20)
    if (this.state === "FINAL_EXECUTION") {
      this.executeFinalKill();
      return;
    }

    if (this.state !== "COMBAT") return;

    let finalAmt = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - finalAmt);
    this.damageReceived += finalAmt;

    if (typeof UI !== 'undefined' && UI.updateBossHP) {
      UI.updateBossHP(this.hp, this.maxHp);
    }

    if (isCrit || isVuln) {
      if (typeof EFFECTS !== 'undefined') EFFECTS.explosion(this.x, this.y, '#f0abfc', true);
      if (typeof GAME !== 'undefined') GAME.shake = Math.min(20, GAME.shake + 3);
    } else {
      if (typeof EFFECTS !== 'undefined') EFFECTS.explosion(this.x, this.y, '#a855f7');
    }

    // Aparições 1 a 3: Retirada tática por roteiro
    if (this.tier < 4) {
      let stats = this.config.tierStats[this.tier];
      let threshold = this.maxHp * stats.retreatHpRatio;
      if (this.hp <= threshold && this.state === "COMBAT") {
        this.triggerRetreat("DAMAGE_THRESHOLD");
      }
    } else {
      // Tier 4: Ao zerar o HP, abre a Janela Dramática de Morte Cinematográfica
      if (this.hp <= 0 && this.state === "COMBAT") {
        this.startFinalExecutionWindow();
      } else if (this.state === "FINAL_EXECUTION") {
        this.executeFinalKill();
      }
    }
  },

  // --------------------------------------------------------------------------
  // 4. RETIRADA TÁTICA (APARIÇÕES 1 A 3)
  // --------------------------------------------------------------------------
  triggerRetreat(reason = "DAMAGE_THRESHOLD") {
    if (this.state === "RETREATING" || this.state === "DEFEATED" || this.state === "FINAL_EXECUTION") return;
    this.state = "RETREATING";
    this.timer = 0;
    this._resetPowers();

    let quotes = {
      1: "Protocolo de Supressão suspenso... Dados de combate assimilados.",
      2: "Vocês adaptaram seus vetores. O próximo salto não terá misericórdia.",
      3: "A fenda se recusa a fechar... Nos veremos no epicentro do Vazio."
    };
    let quote = quotes[this.tier] || "Reagrupando vetores dimensionais...";

    if (typeof UI !== 'undefined' && UI.showTransmission) {
      UI.showTransmission(`${this.name}: "${quote}"`);
    }

    if (typeof GAME !== 'undefined') {
      GAME.timeScale = 0.4;
      GAME.slowMoTimer = 1.2;
      GAME.shake = 45;
    }

    let perfRatio = Math.min(1.0, this.damageReceived / (this.maxHp * (1 - this.config.tierStats[this.tier].retreatHpRatio)));
    let baseCredits = { 1: 1000, 2: 2000, 3: 3000 }[this.tier] || 1000;
    let rewardCredits = Math.min(baseCredits, Math.round(baseCredits * (0.5 + perfRatio * 0.5)));

    if (typeof SAVE !== 'undefined' && SAVE.data) {
      if (Array.isArray(SAVE.data.credits)) {
        SAVE.data.credits[0] = (SAVE.data.credits[0] || 0) + rewardCredits;
        if (SAVE.data.credits.length > 1) {
          SAVE.data.credits[1] = (SAVE.data.credits[1] || 0) + rewardCredits;
        }
      } else {
        SAVE.data.credits = (SAVE.data.credits || 0) + rewardCredits;
      }
      if (typeof UI !== 'undefined' && UI.updateCredits) UI.updateCredits();
    }

    if (typeof DROP_POOL !== 'undefined') {
      let dropsCount = Math.max(2, Math.floor(perfRatio * 4));
      for (let i = 0; i < dropsCount; i++) {
        let d = DROP_POOL.get();
        if (d) d.spawn(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60, i === 0 ? "hp" : "scrap");
      }
    }

    this.data.history.push({
      tier: this.tier,
      sector: typeof SAVE !== 'undefined' && SAVE.data?.checkpoint ? SAVE.data.checkpoint.sector : 0,
      damageReceived: this.damageReceived,
      duration: Number(this.combatDuration.toFixed(1)),
      reason: reason,
      timestamp: Date.now()
    });

    this.data.encountersCompleted++;
    this.data.currentTier = Math.min(4, this.tier + 1);
    this.syncToSave();

    console.log(`[VILLAIN] Retirada concluída. Tier avançado para ${this.data.currentTier}. Recompensa: ${rewardCredits}C.`);
  },

  // --------------------------------------------------------------------------
  // 5. MORTE DRAMÁTICA INTERATIVA COM SEGUNDA CHANCE (ETAPA 4)
  // --------------------------------------------------------------------------
  startFinalExecutionWindow() {
    this.state = "FINAL_EXECUTION";
    this.executionTimer = this.config.executionDuration;
    this.hp = 1;
    this._resetPowers();

    // Slow-motion cinematográfico seguro via timeScale sincronizado em tempo real (respeita toggle de acessibilidade)
    let isSlowMoEnabled = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.slowMotion !== false);
    if (typeof GAME !== 'undefined') {
      GAME.timeScale = isSlowMoEnabled ? this.config.executionSlowMo : 1.0;
      GAME.slowMoTimer = isSlowMoEnabled ? this.config.executionDuration : 0;
      GAME.shake = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.reducedMotion) ? 0 : 30;
      GAME.triggerFlash("#ffffff", (typeof SAVE !== 'undefined' && SAVE.data?.settings?.reducedMotion) ? 0.1 : 0.5);
    }

    this.counterActive = this.config.executionDuration;
    this.vulnerableTimer = this.config.executionDuration;

    if (typeof UI !== 'undefined' && UI.showTransmission) {
      UI.showTransmission("JANELA DE EXECUÇÃO: PRESSIONE DASH OU DISPARE NO NÚCLEO!");
    }
  },

  executeFinalKill(assisted = false) {
    if (this.state === "DEFEATED") return;
    if (assisted) this.assistedKill = true;
    this.state = "DEFEATED";
    this.timer = 0;
    this.hp = 0;
    this.data.defeated = true;
    this._resetPowers();

    if (typeof UI !== 'undefined') {
      UI.showTransmission(`${this.name}: "A integridade do núcleo... rompeu... O Vazio... agora é de vocês..."`);
      UI.toggleBossUI(false);
    }

    if (typeof GAME !== 'undefined') {
      GAME.timeScale = 0.12;
      GAME.slowMoTimer = 3.0;
      GAME.shake = 85;
      GAME.triggerFlash("#a855f7", 1.0);
    }

    if (typeof EFFECTS !== 'undefined') {
      for (let i = 0; i < 50; i++) {
        EFFECTS.explosion(this.x + (Math.random() - 0.5) * 160, this.y + (Math.random() - 0.5) * 160, "#00e5ff", true);
        EFFECTS.explosion(this.x + (Math.random() - 0.5) * 160, this.y + (Math.random() - 0.5) * 160, "#a855f7", true);
      }
    }

    if (typeof DROP_POOL !== 'undefined') {
      for (let i = 0; i < 6; i++) {
        DROP_POOL.get()?.spawn(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, i < 2 ? "hp" : "scrap");
      }
    }

    this.data.history.push({
      tier: 4,
      sector: 20,
      damageReceived: this.damageReceived,
      duration: Number(this.combatDuration.toFixed(1)),
      reason: this.assistedKill ? "DEFEATED_ASSISTED" : "DEFEATED",
      assisted: !!this.assistedKill,
      timestamp: Date.now()
    });

    this.data.encountersCompleted++;
    this.syncToSave();

    console.log(`[VILLAIN] Concluída Morte Definitiva do Tier 4.${this.assistedKill ? ' (Execução Assistida)' : ''}`);
  },

  // Segunda chance com no máximo 2 recuperações, janela ampliada (8s) na 3ª falha e execução assistida na 4ª
  _onExecutionWindowMissed() {
    if (this.state !== "FINAL_EXECUTION") return;
    this.executionFailsCount = (this.executionFailsCount || 0) + 1;
    console.log(`[VILLAIN] Janela de execução expirou (Falha #${this.executionFailsCount}).`);

    if (this.executionFailsCount <= 2) {
      // Falha 1 e 2: Recupera 10% de HP para uma nova oportunidade (máximo de 2 recuperações)
      this.hp = Math.round(this.maxHp * 0.10);
      this.state = "COMBAT";
      this.counterActive = 0;
      this.vulnerableTimer = 0;

      if (typeof GAME !== 'undefined') {
        GAME.timeScale = 1.0;
        GAME.slowMoTimer = 0;
        GAME.shake = 40;
      }
      if (typeof UI !== 'undefined') {
        let msg = this.executionFailsCount === 1 
          ? `${this.name}: "Tentativa falha! O núcleo se estabilizou temporariamente!"`
          : "ALERTA: SEGUNDA CHANCE! SOBRECARREGUE O NÚCLEO AGORA!";
        UI.showTransmission(msg);
        UI.updateBossHP(this.hp, this.maxHp);
      }
    } else if (this.executionFailsCount === 3) {
      // 3ª Falha: Janela ampliada (8 s)
      console.log(`[VILLAIN] 3ª falha consecutiva: Janela ampliada para 8.0s.`);
      this.state = "FINAL_EXECUTION";
      this.executionTimer = 8.0;
      this.hp = 1;
      this._resetPowers();

      let slowMoScale = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.slowMotion === false) ? 1.0 : this.config.executionSlowMo;
      if (typeof GAME !== 'undefined') {
        GAME.timeScale = slowMoScale;
        GAME.slowMoTimer = 8.0;
        GAME.shake = 30;
        GAME.triggerFlash("#ffffff", 0.5);
      }
      if (typeof UI !== 'undefined') {
        UI.showTransmission("COLAPSO IRREVERSÍVEL DETECTADO: JANELA FINAL EXPANDIDA (8.0s)!");
      }
    } else {
      // 4ª Falha (após os 8s da janela expandida): Execução assistida imediata
      console.log(`[VILLAIN] 4ª falha: Acionando Execução Assistida registrada na telemetria.`);
      this.assistedKill = true;
      if (typeof UI !== 'undefined') {
        UI.showTransmission("SOBRECARGA TÁTICA ASSISTIDA: NÚCLEO COLAPSADO!");
      }
      this.executeFinalKill(true);
    }
  },

  // --------------------------------------------------------------------------
  // 6. ATUALIZAÇÃO NO GAME LOOP E PODERES SURREAIS (ETAPA 3)
  // --------------------------------------------------------------------------
  update(dt, dtReal = null) {
    if (!this.active) return;
    this.timer += dt;
    let actualDtReal = dtReal !== null ? dtReal : ((typeof GAME !== 'undefined' && GAME.timeScale > 0) ? dt / GAME.timeScale : dt);

    if (this.vulnerableTimer > 0) {
      this.vulnerableTimer -= dt;
      this.vulnerableTimeTotal += dt;
    }
    if (this.counterActive > 0) {
      this.counterActive -= dt;
    }

    let p1 = (typeof GAME !== 'undefined' && GAME.p1 && GAME.p1.active && GAME.p1.state === 'ALIVE') ? GAME.p1 : null;
    let p2 = (typeof GAME !== 'undefined' && GAME.p2 && GAME.p2.active && GAME.p2.state === 'ALIVE') ? GAME.p2 : null;
    let p = (typeof GAME !== 'undefined' && typeof GAME.getTargetPlayer === 'function') 
      ? GAME.getTargetPlayer(this.x, this.y, 'nearest') : (p1 || p2);

    // Estado: INTRO (Entrada em cena cinematográfica com invulnerabilidade e Skip)
    if (this.state === "INTRO") {
      if (p1) { p1.shieldTimer = Math.max(p1.shieldTimer, 0.5); p1.iFrames = Math.max(p1.iFrames, 0.5); }
      if (p2) { p2.shieldTimer = Math.max(p2.shieldTimer, 0.5); p2.iFrames = Math.max(p2.iFrames, 0.5); }

      // Pular introdução via Tecla V com exigência de keydown novo (não pula se já estava pressionada no spawn)
      if (this.data.seenIntro && typeof INPUT !== 'undefined' && INPUT.keys) {
        if (!INPUT.keys['KeyV']) {
          this._skipKeyHeldAtStart = false;
        } else if (!this._skipKeyHeldAtStart) {
          this.skipIntro();
          return;
        }
      }

      if (this.timer < 2.0) {
        if (typeof window !== 'undefined') {
          window.ENEMY_POOL?.clear();
          window.PROJ_POOL?.clear();
        }
        if (typeof GAME !== 'undefined') {
          GAME.globalFilter = "brightness(0.7) contrast(1.2)";
        }
      } else if (this.timer < 4.5) {
        let tProg = (this.timer - 2.0) / 2.5;
        let isReducedMotion = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.reducedMotion);
        this.cameraZoom = isReducedMotion ? 1.0 : (1.0 + Math.sin(tProg * Math.PI) * 0.10);
        this.y = -180 + tProg * 260; // Desce até 80
      } else if (this.timer < this.config.introDuration) {
        let tEnd = (this.timer - 4.5) / (this.config.introDuration - 4.5);
        this.y = 80 + tEnd * 60; // Desce até 140
        if (this.introStep === 0) {
          this.introStep = 1;
          if (typeof GAME !== 'undefined') {
            GAME.shake = 40;
            GAME.triggerFlash('#00e5ff', 0.6);
            GAME.globalFilter = "none";
          }
          if (typeof UI !== 'undefined' && UI.showTransmission) {
            UI.showTransmission(`${this.name}: "Vocês não têm autorização para navegar nesta dobra."`);
          }
        }
      } else {
        this.y = 140;
        this.state = "COMBAT";
        this.cameraZoom = 1.0;
        let btn = (typeof document !== 'undefined') ? document.getElementById('villain-skip-btn') : null;
        if (btn) btn.style.display = 'none';
        if (typeof GAME !== 'undefined') {
          GAME.globalFilter = "none";
          GAME.shake = 25;
        }
        if (typeof EFFECTS !== 'undefined') EFFECTS.explosion(this.x, this.y, '#00e5ff', true);
        this.data.seenIntro = true;
        this.syncToSave();
      }
      return;
    }

    // Estado: FINAL_EXECUTION (Janela dramática de golpe final)
    if (this.state === "FINAL_EXECUTION") {
      this.executionTimer -= actualDtReal;
      if (typeof GAME !== 'undefined') {
        let isSlowMoEnabled = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.slowMotion !== false);
        if (isSlowMoEnabled) {
          GAME.slowMoTimer = Math.max(0, this.executionTimer);
          if (this.executionTimer <= 0) {
            GAME.slowMoTimer = 0;
            GAME.timeScale = 1.0;
          }
        } else {
          GAME.slowMoTimer = 0;
          GAME.timeScale = 1.0;
        }
      }
      if (p) {
        // Se o jogador pressionar Dash ou Parry durante a janela
        let isDashing = (p.dashCooldown > (p.dashCdBase * 0.7));
        let isParrying = (p.parryWindow > 0);
        if (isDashing || isParrying) {
          this.executeFinalKill();
          return;
        }
      }

      if (this.executionTimer <= 0) {
        this._onExecutionWindowMissed();
      }
      return;
    }

    // Estado: RETREATING (Dobra dimensional de saída)
    if (this.state === "RETREATING") {
      this.y -= 140 * dt;
      this.radius = Math.max(4, this.radius - 20 * dt);
      if (this.timer > 2.0 || this.y < -220) {
        this.active = false;
        this.state = "INACTIVE";
        if (typeof UI !== 'undefined') UI.toggleBossUI(false);
        if (typeof PACING !== 'undefined' && typeof PACING.nextPhase === 'function') {
          PACING.nextPhase();
        }
      }
      return;
    }

    // Estado: DEFEATED (Colapso pós-morte)
    if (this.state === "DEFEATED") {
      if (this.timer > 3.0) {
        this.active = false;
        this.state = "INACTIVE";
        if (typeof PACING !== 'undefined' && typeof PACING.nextPhase === 'function') {
          PACING.nextPhase();
        }
      }
      return;
    }

    // Estado: COMBAT
    if (this.state === "COMBAT") {
      this.combatDuration += dt;
      this.attackTimer += dt;
      this.powerCycleTimer += dt;

      let targetX = p ? p.x : ((typeof GAME !== 'undefined' && GAME.w) ? GAME.w / 2 : 400);
      let targetY = 130 + Math.sin(this.timer * 2.2) * 45;

      this.x += (targetX - this.x) * dt * 1.4;
      this.y += (targetY - this.y) * dt * 1.8;

      let stats = this.config.tierStats[this.tier] || this.config.tierStats[1];

      // Verificação de tempo limite
      if (this.tier < 4 && this.combatDuration >= stats.maxDuration) {
        this.triggerRetreat("TIME_LIMIT");
        return;
      }

      // Ciclo dos Poderes Surreais por Tier
      if (this.powerCycleTimer >= stats.powerCooldown) {
        this.powerCycleTimer = 0;
        this._triggerNextSurrealPower(p);
      }

      this._updateSurrealPowers(dt, p, p1, p2);

      // Disparos normais
      if (this.attackTimer >= stats.attackInterval) {
        this.attackTimer = 0;
        this._firePattern(p);
      }
    }
  },

  // --------------------------------------------------------------------------
  // 7. MECÂNICA DOS 4 PODERES SURREAIS (ETAPA 3)
  // --------------------------------------------------------------------------
  _triggerNextSurrealPower(targetPlayer) {
    let available = [];
    if (this.tier >= 1) available.push("ARENA");
    if (this.tier >= 2) available.push("GRAVITY");
    if (this.tier >= 3) available.push("TIME");
    if (this.tier >= 4) available.push("DESTINY");

    let chosen = available[Math.floor(Math.random() * available.length)];

    if (chosen === "ARENA") {
      this.powers.arena.active = true;
      this.powers.arena.warnTimer = 1.2; // 1.2s de aviso legível
      this.powers.arena.duration = 7.5;
      this.powers.arena.side = Math.random() < 0.5 ? "left" : "right";
      let screenW = (typeof GAME !== 'undefined' && GAME.w) ? GAME.w : 800;
      this.powers.arena.targetWidth = screenW * 0.22;
      this.powers.arena.wallWidth = 0;
      if (typeof UI !== 'undefined' && UI.showTransmission) {
        UI.showTransmission("ALERTA: CAMPO DE SUPRESSÃO DE ARENA IMINENTE!");
      }
    } else if (chosen === "GRAVITY") {
      this.powers.gravity.active = true;
      this.powers.gravity.warnTimer = 1.0; // 1.0s de aviso legível
      this.powers.gravity.duration = 6.0;
      this.powers.gravity.direction = Math.random() < 0.5 ? 1 : -1;
      this.powers.gravity.strength = 140 * this.config.tierStats[this.tier].pressure;
      if (typeof UI !== 'undefined' && UI.showTransmission) {
        UI.showTransmission(this.powers.gravity.direction > 0 ? "ALERTA: ONDA GRAVITACIONAL DE ATRAÇÃO!" : "ALERTA: ONDA GRAVITACIONAL DE REPULSÃO!");
      }
    } else if (chosen === "TIME") {
      this.powers.timeDilation.active = true;
      this.powers.timeDilation.warnTimer = 1.0;
      this.powers.timeDilation.duration = 8.0;
      this.powers.timeDilation.x = targetPlayer ? targetPlayer.x : (this.x);
      this.powers.timeDilation.y = targetPlayer ? targetPlayer.y : (this.y + 150);
      this.powers.timeDilation.radius = 140;
      if (typeof UI !== 'undefined' && UI.showTransmission) {
        UI.showTransmission("ALERTA: FENDA DE DILATAÇÃO TEMPORAL DETECTADA!");
      }
    } else if (chosen === "DESTINY") {
      this.powers.destiny.active = true;
      this.powers.destiny.warnTimer = 1.5; // 1.5s para o jogador reagir e desviar
      this.powers.destiny.duration = 3.0;
      let px = targetPlayer ? targetPlayer.x : 400;
      let py = targetPlayer ? targetPlayer.y : 500;
      let pvx = targetPlayer && targetPlayer.vx ? targetPlayer.vx : 0;
      let pvy = targetPlayer && targetPlayer.vy ? targetPlayer.vy : 0;
      // Projeção futura determinística (1.2s à frente)
      this.powers.destiny.projX = px + pvx * 0.4;
      this.powers.destiny.projY = py + pvy * 0.4;
      this.powers.destiny.targetX = px;
      this.powers.destiny.targetY = py;
      if (typeof UI !== 'undefined' && UI.showTransmission) {
        UI.showTransmission("ALERTA: ESPELHO DE DESTINO — VETOR DE DISPARO ANTECIPADO!");
      }
    }
  },

  _updateSurrealPowers(dt, p, p1, p2) {
    // 1. Atualização da Arena de Supressão
    let arena = this.powers.arena;
    if (arena.active) {
      if (arena.warnTimer > 0) {
        arena.warnTimer -= dt;
      }
      if (arena.warnTimer <= 0) {
        arena.duration -= dt;
        arena.wallWidth += (arena.targetWidth - arena.wallWidth) * dt * 2.5;
        // Dano de barreira se o jogador colidir com a parede de plasma
        [p1, p2].forEach(pilot => {
          if (pilot && pilot.active && pilot.state === 'ALIVE' && pilot.iFrames <= 0) {
            let screenW = (typeof GAME !== 'undefined' && GAME.w) ? GAME.w : 800;
            let inWall = false;
            if (arena.side === "left" && pilot.x < arena.wallWidth) inWall = true;
            if (arena.side === "right" && pilot.x > screenW - arena.wallWidth) inWall = true;
            if (inWall) {
              pilot.takeDamage(15);
              if (typeof GAME !== 'undefined') GAME.shake = 12;
            }
          }
        });
        if (arena.duration <= 0) arena.active = false;
      }
    }

    // 2. Atualização da Onda Gravitacional
    let grav = this.powers.gravity;
    if (grav.active) {
      if (grav.warnTimer > 0) {
        grav.warnTimer -= dt;
      }
      if (grav.warnTimer <= 0) {
        grav.duration -= dt;
        [p1, p2].forEach(pilot => {
          if (pilot && pilot.active && pilot.state === 'ALIVE') {
            let dy = grav.direction > 0 ? (this.y - pilot.y) : (pilot.y - this.y);
            let dirY = dy > 0 ? 1 : -1;
            pilot.y += dirY * grav.strength * dt * 0.65;
          }
        });
        if (grav.duration <= 0) grav.active = false;
      }
    }

    // 3. Atualização da Fenda de Dilatação Temporal
    let timeD = this.powers.timeDilation;
    if (timeD.active) {
      if (timeD.warnTimer > 0) {
        timeD.warnTimer -= dt;
      }
      if (timeD.warnTimer <= 0) {
        timeD.duration -= dt;
        // Projéteis e naves dentro do raio sofrem dilatação
        if (typeof window !== 'undefined' && window.PROJ_POOL) {
          window.PROJ_POOL.items.forEach(proj => {
            if (proj.active) {
              let d = Math.hypot(proj.x - timeD.x, proj.y - timeD.y);
              if (d < timeD.radius) {
                proj.inTimeDilation = true;
                proj.x -= proj.vx * dt * (1 - timeD.timeScale);
                proj.y -= proj.vy * dt * (1 - timeD.timeScale);
              }
            }
          });
        }
        if (timeD.duration <= 0) timeD.active = false;
      }
    }

    // 4. Atualização do Espelho de Destino
    let dest = this.powers.destiny;
    if (dest.active) {
      if (dest.warnTimer > 0) {
        dest.warnTimer -= dt;
      } else {
        dest.duration -= dt;
        // Ao fim do aviso, o vilão dispara uma salva concentrada no ponto previsto
        if (dest.duration > 2.7) {
          if (typeof window !== 'undefined' && window.PROJ_POOL) {
            for (let i = -1; i <= 1; i++) {
              let angle = Math.atan2(dest.projY - this.y, dest.projX - this.x) + i * 0.15;
              window.PROJ_POOL.get()?.spawn(this.x, this.y, Math.cos(angle) * 32, Math.sin(angle) * 32, false, "railgun", "#ffffff");
            }
          }
          if (typeof GAME !== 'undefined') GAME.shake = 18;
        }
        if (dest.duration <= 0) dest.active = false;
      }
    }
  },

  _firePattern(targetPlayer) {
    if (typeof window === 'undefined' || !window.PROJ_POOL) return;

    let projColor = this.tier >= 3 ? "#e879f9" : "#c084fc";
    let speed = 18 + this.tier * 2;

    let bulletCount = 4 + this.tier * 2;
    let baseAngle = targetPlayer ? Math.atan2(targetPlayer.y - this.y, targetPlayer.x - this.x) : Math.PI / 2;
    let spread = 0.5 + this.tier * 0.15;

    for (let i = 0; i < bulletCount; i++) {
      let a = baseAngle - (spread / 2) + (spread / (bulletCount - 1)) * i;
      window.PROJ_POOL.get()?.spawn(
        this.x,
        this.y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        false,
        "plasma",
        projColor
      );
    }
  },

  // --------------------------------------------------------------------------
  // 8. RENDERIZAÇÃO VETORIAL DA SILHUETA, PODERES E ACESSIBILIDADE (ETAPA 5)
  // --------------------------------------------------------------------------
  draw(ctx) {
    if (!this.active || !ctx) return;

    // Respeito às configurações de acessibilidade
    let shakeMult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.screenShake !== undefined) ? SAVE.data.settings.screenShake : 1.0;
    let flashMult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.flashIntensity !== undefined) ? SAVE.data.settings.flashIntensity : 1.0;

    let screenW = (typeof GAME !== 'undefined' && GAME.w) ? GAME.w : 800;
    let screenH = (typeof GAME !== 'undefined' && GAME.h) ? GAME.h : 600;

    ctx.save();

    // 1. Render de Letterbox durante a INTRO
    if (this.state === "INTRO") {
      let barH = 45;
      ctx.fillStyle = "#05020a";
      ctx.fillRect(0, 0, screenW, barH);
      ctx.fillRect(0, screenH - barH, screenW, barH);

      ctx.strokeStyle = this.accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, barH);
      ctx.lineTo(screenW, barH);
      ctx.moveTo(0, screenH - barH);
      ctx.lineTo(screenW, screenH - barH);
      ctx.stroke();
    }

    // 2. Renderização dos Poderes Surreais
    this._drawSurrealPowers(ctx, screenW, screenH);

    // 3. Render da Fuselagem e Anéis Orbitais
    let osc = Math.sin(this.timer * 4) * 3;

    if (this.state === "FINAL_EXECUTION" || this.counterActive > 0 || this.vulnerableTimer > 0) {
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#00e5ff";
    } else {
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
    }

    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 2.5;
    let ringRadius = this.radius + 16 + osc;

    // Anel 1
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, ringRadius, ringRadius * 0.45, this.timer * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Anel 2
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, ringRadius * 0.85, ringRadius * 0.35, -this.timer * 2.0, 0, Math.PI * 2);
    ctx.stroke();

    // Casco Principal (Prisma Asimétrico Militar)
    ctx.fillStyle = "#11071f";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.radius + 8);
    ctx.lineTo(this.x + this.radius * 0.9, this.y - 10);
    ctx.lineTo(this.x + this.radius * 0.4, this.y - this.radius);
    ctx.lineTo(this.x - this.radius * 0.4, this.y - this.radius);
    ctx.lineTo(this.x - this.radius * 0.9, this.y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fenda Central de Energia
    ctx.fillStyle = (this.state === "FINAL_EXECUTION" || this.counterActive > 0 || this.vulnerableTimer > 0) ? "#00ffff" : "#e879f9";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.radius * 0.4);
    ctx.lineTo(this.x + 6, this.y - 8);
    ctx.lineTo(this.x, this.y - 18);
    ctx.lineTo(this.x - 6, this.y - 8);
    ctx.closePath();
    ctx.fill();

    // Prompt visual de Execução Final
    if (this.state === "FINAL_EXECUTION") {
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("[ GOLPE FINAL: DASH / PARRY ]", this.x, this.y + this.radius + 40);
    }

    ctx.restore();
  },

  _drawSurrealPowers(ctx, screenW, screenH) {
    // Arena de Supressão
    let arena = this.powers.arena;
    if (arena.active) {
      if (arena.warnTimer > 0) {
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "rgba(255, 0, 85, 0.8)";
        ctx.lineWidth = 3;
        let xPos = arena.side === "left" ? arena.targetWidth : (screenW - arena.targetWidth);
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, screenH);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = "rgba(255, 0, 85, 0.22)";
        if (arena.side === "left") ctx.fillRect(0, 0, arena.wallWidth, screenH);
        else ctx.fillRect(screenW - arena.wallWidth, 0, arena.wallWidth, screenH);
      }
    }

    // Onda Gravitacional
    let grav = this.powers.gravity;
    if (grav.active) {
      ctx.strokeStyle = grav.warnTimer > 0 ? "rgba(0, 229, 255, 0.5)" : "rgba(168, 85, 247, 0.6)";
      ctx.lineWidth = 2;
      let yOffset = (this.timer * 80) % 60;
      for (let y = yOffset; y < screenH; y += 60) {
        ctx.beginPath();
        ctx.moveTo(screenW * 0.1, y);
        ctx.lineTo(screenW * 0.9, y);
        ctx.stroke();
      }
    }

    // Fenda Temporal
    let timeD = this.powers.timeDilation;
    if (timeD.active) {
      ctx.strokeStyle = timeD.warnTimer > 0 ? "rgba(232, 121, 249, 0.8)" : "rgba(168, 85, 247, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(timeD.x, timeD.y, timeD.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
      ctx.fill();
    }

    // Espelho de Destino
    let dest = this.powers.destiny;
    if (dest.active && dest.warnTimer > 0) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(dest.projX, dest.projY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#ff0055";
      ctx.beginPath();
      ctx.arc(dest.projX, dest.projY, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
};

if (typeof window !== 'undefined') {
  window.VILLAIN = VILLAIN;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VILLAIN };
}
