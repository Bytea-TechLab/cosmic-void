const COMBAT_DIRECTOR = {
  intensity: 0,
  peakTimer: 0,
  reliefTimer: 0,
  maxAllowedPeakDuration: 3.5, // Após 3.5s sob estresse máximo, força janela de alívio
  reliefDuration: 3.0,          // Janela de 3.0s de alívio tático
  archetype: 'GAUNTLET',        // 'INTERCEPTION', 'SIEGE', 'GAUNTLET', 'ANOMALY'
  archetypes: ['INTERCEPTION', 'SIEGE', 'GAUNTLET', 'ANOMALY'],

  reset() {
    this.intensity = 0;
    this.peakTimer = 0;
    this.reliefTimer = 0;
    this.archetype = 'GAUNTLET';
  },

  selectSectorArchetype(sector) {
    if (sector % 4 === 1) this.archetype = 'INTERCEPTION';
    else if (sector % 4 === 2) this.archetype = 'SIEGE';
    else if (sector % 4 === 3) this.archetype = 'ANOMALY';
    else this.archetype = 'GAUNTLET';
    return this.archetype;
  },

  update(dt) {
    let bulletCount = 0;
    if (window.PROJ_POOL && window.PROJ_POOL.items) {
      for (let i = 0; i < window.PROJ_POOL.items.length; i++) {
        if (window.PROJ_POOL.items[i].active && !window.PROJ_POOL.items[i].isPlayer) {
          bulletCount++;
        }
      }
    }

    let threatWeight = 0;
    if (window.ENEMY_POOL && window.ENEMY_POOL.items) {
      for (let i = 0; i < window.ENEMY_POOL.items.length; i++) {
        let e = window.ENEMY_POOL.items[i];
        if (e.active) {
          if (e.type === 'heavy' || e.type.startsWith('miniboss')) threatWeight += 3;
          else if (e.type === 'hunter' || e.type === 'sniper') threatWeight += 2;
          else threatWeight += 1;
        }
      }
    }

    let bulletLoad = Math.min(1.0, bulletCount / 30);
    let enemyLoad = Math.min(1.0, threatWeight / 16);
    this.intensity = (bulletLoad * 0.5) + (enemyLoad * 0.5);

    if (this.reliefTimer > 0) {
      this.reliefTimer -= dt;
      if (this.reliefTimer < 0) this.reliefTimer = 0;
    } else {
      if (this.intensity > 0.75) {
        this.peakTimer += dt;
        if (this.peakTimer >= this.maxAllowedPeakDuration) {
          this.reliefTimer = this.reliefDuration;
          this.peakTimer = 0;
        }
      } else {
        this.peakTimer = Math.max(0, this.peakTimer - dt * 0.5);
      }
    }
  },

  isReliefActive() {
    return this.reliefTimer > 0;
  },

  getDensityReport() {
    return {
      intensity: Number(this.intensity.toFixed(2)),
      isRelief: this.isReliefActive(),
      reliefTimeLeft: Number(this.reliefTimer.toFixed(1)),
      archetype: this.archetype
    };
  },

  modifySpawnDelay(baseDelay) {
    if (this.isReliefActive()) {
      return baseDelay * 1.8;
    }
    if (this.intensity > 0.8) {
      return baseDelay * 1.25;
    }
    return baseDelay;
  }
};

const PACING = {
  state: "INIT",
  phaseIdx: 0,
  timer: 0,
  spawnTimer: 0,
  currentObjText: "",
  objProgressText: "",
  hordeKillsRemaining: 0,
  miniBossActive: false,
  phases: [],
  debug: false,
  _lastDiagTime: 0,

  reset() {
    this.timer = 0;
    this.spawnTimer = 0;
    this.hordeKillsRemaining = 0;
    this.miniBossActive = false;
    this.currentObjText = "";
    this.objProgressText = "";
    GAME.watcherEyeOpen = 0;
    GAME.globalFilter = "none";
    let sector = SAVE.data.checkpoint.sector;
    if (typeof COMBAT_DIRECTOR !== 'undefined') {
      COMBAT_DIRECTOR.reset();
      COMBAT_DIRECTOR.selectSectorArchetype(sector);
    }

    if (sector === 5 || sector === 10 || sector === 16 || sector === 20) {
      if (sector === 20 && typeof VILLAIN !== 'undefined' && VILLAIN.shouldIntercept(20)) {
        this.phases = [
          { type: "VILLAIN_ENCOUNTER", tier: 4, text: "CONFRONTO FINAL: NULL-ECLIPSE" },
          { type: "BOSS_WAIT" }
        ];
      } else {
        this.phases = [{ type: "BOSS_WAIT" }];
      }
    } else if (typeof VILLAIN !== 'undefined' && VILLAIN.shouldIntercept(sector)) {
      this.phases = [
        { type: "INTRO", time: 3, text: `INTERCEPTAÇÃO: ${VILLAIN.name}` },
        { type: "VILLAIN_ENCOUNTER", tier: VILLAIN.data.encountersCompleted + 1, text: "SOBREVIVA AO JUIZ DO VAZIO" },
        { type: "SILENCE", time: 3, text: "ZONA PURIFICADA" },
        { type: "DOCKING" }
      ];
    } else if (sector >= 17 && sector <= 19) {
      if (sector === 17)
        this.phases = [
          { type: "INTRO", time: 4, text: "SINAL RESTAURADO...?" },
          { type: "AFTERMATH", time: 24, text: "ZONA MORTA" },
          { type: "DOCKING" },
        ];
      else if (sector === 18)
        this.phases = [
          { type: "INTRO", time: 3, text: "O GUARDIÃO FINAL" },
          {
            type: "MINIBOSS",
            boss: "miniboss_warden",
            text: "ELIMINE A BARREIRA",
          },
          { type: "DOCKING" },
        ];
      else if (sector === 19)
        this.phases = [
          { type: "INTRO", time: 3, text: "THEY ARE WATCHING" },
          { type: "WATCHER_SURVIVE", time: 30, text: "NÃO OLHE PARA TRÁS" },
          {
            type: "MINIBOSS",
            boss: "miniboss_observer_apex",
            text: "ANOMALIA: OBSERVER APEX",
          },
          { type: "DOCKING" },
        ];
    } else if (sector % 3 === 0 || sector === 15) {
      let bossType = "miniboss_flailer";
      if (sector === 6) bossType = "miniboss_gravity";
      if (sector === 9) bossType = "miniboss_knight";
      if (sector === 12) bossType = "miniboss_hangman";
      if (sector === 15) bossType = "miniboss_seraph";

      this.phases = [
        { type: "INTRO", time: 3, text: `ZONA DE ALTO RISCO: SETOR ${sector}` },
        { type: "SURVIVE_LONG", time: 90, text: "SOBREVIVA ATÉ A ANOMALIA" },
        { type: "MINIBOSS", boss: bossType, text: "ELIMINE A AMEAÇA LOCAL" },
        { type: "SILENCE", time: 4, text: "ZONA PURIFICADA" },
        { type: "DOCKING" },
      ];
    } else {
      this.phases = [
        { type: "INTRO", time: 3, text: `SETOR ${sector} ALCANÇADO` },
      ];
      let r = Math.random();
      this.phases.push({
        type: "HORDE_FORMATION",
        waves: 5 + Math.floor(sector),
        text: "SOBREVIVA ÀS FORMAÇÕES",
      });

      if (r < 0.33) {
        this.phases.push({ type: "EVENT_SIGNAL_LOST", time: 4, text: "" });
        this.phases.push({
          type: "HORDE",
          kills: 40 + sector * 5,
          text: "LIMPE OS RESTOS",
        });
      } else if (r < 0.66) {
        this.phases.push({ type: "EVENT_WATCHER", time: 6, text: "" });
        this.phases.push({
          type: "HORDE",
          kills: 50 + sector * 5,
          text: "CRUZE A LINHA INIMIGA",
        });
      } else {
        this.phases.push({ type: "EVENT_FALSE_FREEZE", time: 3, text: "" });
        this.phases.push({
          type: "HORDE",
          kills: 40 + sector * 5,
          text: "FUJA DO SETOR",
        });
      }
      this.phases.push({ type: "SILENCE", time: 4, text: "SETOR LIMPO..." });
      this.phases.push({ type: "DOCKING" });
    }

    this.rebalancePhases(sector);
    this.phaseIdx = 0;
    this.startPhase();
  },

  getActInfo(sector) {
    if (sector <= 5) return { act: 1, name: "ATO I — THE FRONT", subtitle: "Frente de Guerra Galáctica" };
    if (sector <= 10) return { act: 2, name: "ATO II — THE BREACH", subtitle: "Ruptura do Perímetro Defensivo" };
    if (sector <= 16) return { act: 3, name: "ATO III — THE COLLAPSE", subtitle: "Colapso do Sistema" };
    return { act: 4, name: "ATO IV — BEYOND THE VOID", subtitle: "Além do Vazio" };
  },

  rebalancePhases(sector) {
    this.phases.forEach((p) => {
      if (p.type === "AFTERMATH") p.time = 24;
      if (p.type === "WATCHER_SURVIVE") p.time = 30;
      if (p.type === "SURVIVE_LONG") p.time = 45;
      if (p.type === "HORDE_FORMATION") {
        p.waves = Math.min(6, 3 + Math.ceil(sector * 0.3));
        p.text = "QUEBRE AS FORMACOES";
      }
      if (p.type === "HORDE") {
        p.kills = (p.text === "CRUZE A LINHA INIMIGA" ? 18 : 14) + sector * 2;
      }
    });
  },

  spawnDelay(base, floor = 0.2) {
    // O multiplicador de combo dita o ritmo da horda.
    // Combo Tier 4 = 40% mais rápido.
    let comboIntensity = Math.max(0.6, 1.0 - GAME.comboTier * 0.1);

    // Se o jogador estiver com menos de 30% de HP, o jogo dá um pequeno "fôlego" (15% mais devagar).
    let p1HpPerc = GAME.p1 ? GAME.p1.hp / GAME.p1.maxHp : 1;
    let p2HpPerc = GAME.p2 ? GAME.p2.hp / GAME.p2.maxHp : 1;
    let mercyRule = p1HpPerc < 0.3 || p2HpPerc < 0.3 ? 1.15 : 1.0;

    let finalDelay = (base * comboIntensity * mercyRule) / Math.sqrt(GAME.diff);
    if (typeof COMBAT_DIRECTOR !== 'undefined') {
      finalDelay = COMBAT_DIRECTOR.modifySpawnDelay(finalDelay);
    }
    return Math.max(floor, finalDelay);
  },

  startPhase() {
    if (this.phaseIdx >= this.phases.length) {
      if (typeof QUICKRUN !== 'undefined' && QUICKRUN.active) {
        QUICKRUN.onEncounterComplete();
        return;
      }
      if (typeof BLACKOUT !== 'undefined' && BLACKOUT.active) {
        BLACKOUT.onEncounterComplete();
        return;
      }
      return;
    }
    let p = this.phases[this.phaseIdx];
    this.state = p.type;
    this.timer = 0;
    this.spawnTimer = 0;
    this.currentObjText = p.text || "";
    this.objProgressText = "";

    if (p.type === "INTRO") {
      let sector = SAVE.data.checkpoint.sector;
      if (sector === 1 || sector === 6 || sector === 11 || sector === 17) {
        let actInfo = this.getActInfo(sector);
        if (typeof UI !== 'undefined' && UI.showTransmission) {
          UI.showTransmission(`${actInfo.name}: ${actInfo.subtitle}`);
        }
      }
    }

    if (
      [
        "MINIBOSS",
        "SILENCE",
        "BOSS_WAIT",
        "VILLAIN_ENCOUNTER",
        "DOCKING",
        "AFTERMATH",
        "GLITCH_HORDE",
      ].includes(p.type)
    ) {
      window.ENEMY_POOL?.clear();
      window.PROJ_POOL?.clear();
    }

    if (p.type === "VILLAIN_ENCOUNTER") {
      if (typeof VILLAIN !== 'undefined') {
        VILLAIN.spawn(p.tier);
      }
    } else if (p.type === "HORDE") this.hordeKillsRemaining = p.kills;
    else if (p.type === "HORDE_FORMATION") this.hordeKillsRemaining = p.waves;
    else if (p.type === "MINIBOSS") {
      this.miniBossActive = true;
      let e = window.ENEMY_POOL?.get();
      let hpScale = (500 + SAVE.data.checkpoint.sector * 80) * GAME.diff;
      if (e) e.spawn(GAME.w / 2, -50, hpScale, p.boss);
      GAME.triggerFlash("#f00", 1.0);
      GAME.shake = 50;
      UI.showTransmission("ALERTA MASSIVO: ANOMALIA PRESENTE.");
    } else if (p.type === 'EVENT_SIGNAL_LOST') {
        UI.showTransmission("..."); 
        // Agora apenas altera as cores drasticamente, mas o HUD não some 
        // e a escuridão absoluta é removida.
        GAME.globalFilter = 'hue-rotate(90deg) saturate(0.2)'; 
        EFFECTS.triggerGlitch();
    } else if (p.type === "EVENT_WATCHER" || p.type === "WATCHER_SURVIVE") {
      UI.showTransmission("THEY ARE WATCHING.");
    } else if (p.type === "EVENT_FALSE_FREEZE") {
      GAME.timeScale = 0;
      GAME.inputLocked = true;
      document.getElementById("fake-pause").style.display = "block";
      UI.showTransmission("CORE INSTABILITY.");
    }
  },

  nextPhase() {
    this.phaseIdx++;
    this.startPhase();
  },

  update(dt) {
    if (GAME.state !== "PLAYING" || BOSS.active) return;
    this.timer += dt;
    if (typeof COMBAT_DIRECTOR !== 'undefined') {
      COMBAT_DIRECTOR.update(dt);
    }

    if (this.debug) {
      let now = (GAME && GAME.time) ? GAME.time : Date.now() / 1000;
      if (now - this._lastDiagTime >= 2.0) {
        this._lastDiagTime = now;
        this.logDiagnostics();
      }
    }

    let p = this.phases[this.phaseIdx];
    if (!p) return;

    if (this.state === "INTRO") {
      if (this.timer >= p.time) this.nextPhase();
    } else if (this.state === "EVENT_SIGNAL_LOST") {
      if (this.timer >= p.time) {
        GAME.globalFilter = "none";
        document.getElementById("hud").style.display = "block";
        GAME.triggerFlash("#fff", 0.5);
        GAME.shake = 40;
        EFFECTS.triggerGlitch();
        UI.showTransmission("SINAL RECUPERADO. SOBREVIVA.");
        this.nextPhase();
      }
    } else if (this.state === "EVENT_WATCHER") {
      GAME.watcherEyeOpen = Math.sin((this.timer / p.time) * Math.PI);
      if (this.timer >= p.time) {
        GAME.watcherEyeOpen = 0;
        this.nextPhase();
      }
    } else if (this.state === "EVENT_FALSE_FREEZE") {
      if (this.spawnTimer === 0) {
        this.spawnTimer = 1;
        // TEMPO REDUZIDO: de 3000ms (3s) para apenas 400ms (0.4s)
        // É apenas um soluço rápido, não quebra a gameplay.
        setTimeout(() => {
          GAME.timeScale = 1;
          GAME.inputLocked = false;
          document.getElementById("fake-pause").style.display = "none";
          GAME.triggerFlash("#f0f", 0.8);
          GAME.shake = 30;
          EFFECTS.triggerGlitch();
          this.nextPhase();
        }, 400);
      }
    } else if (this.state === "AFTERMATH") {
      let left = Math.ceil(p.time - this.timer);
      this.objProgressText = `Explorando: ${left}s`;
      this.spawnTimer += dt;
      if (this.spawnTimer > 1.0) {
        let e = window.ENEMY_POOL?.get();
        if (e) e.spawn(Math.random() * GAME.w, -20, 100, "asteroid");
        this.spawnTimer = 0;
      }
      if (this.timer >= p.time) this.nextPhase();
    } else if (this.state === "GLITCH_HORDE") {
      let left = Math.ceil(p.time - this.timer);
      this.objProgressText = `Sobreviva: ${left}s`;
      this.spawnTimer += dt;
      if (this.spawnTimer > this.spawnDelay(0.38, 0.22)) {
        let e = window.ENEMY_POOL?.get();
        if (e)
          e.spawn(
            Math.random() * GAME.w,
            -20,
            100,
            Math.random() < 0.5 ? "sniper" : "weaver",
          );
        this.spawnTimer = 0;
      }
      if (Math.random() < 0.05) GAME.shake = 10;
      if (this.timer >= p.time) {
        window.ENEMY_POOL?.clear();
        window.PROJ_POOL?.clear();
        this.nextPhase();
      }
    } else if (this.state === "WATCHER_SURVIVE") {
      GAME.watcherEyeOpen = 0.8 + Math.sin(this.timer * 5) * 0.2;
      let left = Math.ceil(p.time - this.timer);
      this.objProgressText = `Não Olhe: ${left}s`;
      this.spawnTimer += dt;
      if (this.spawnTimer > this.spawnDelay(0.65, 0.35)) {
        let e = window.ENEMY_POOL?.get();
        if (e) e.spawn(Math.random() * GAME.w, -20, 500, "heavy");
        this.spawnTimer = 0;
      }
      if (this.timer >= p.time) {
        GAME.watcherEyeOpen = 0;
        window.ENEMY_POOL?.clear();
        window.PROJ_POOL?.clear();
        UI.showTransmission("ELES ENCONTRARAM VOCÊ.");
        this.nextPhase();
      }
    } else if (this.state === "SURVIVE_LONG") {
      let left = Math.ceil(p.time - this.timer);
      if (left > 0) {
        let mins = Math.floor(left / 60);
        let secs = left % 60;
        this.objProgressText = `Restam: ${mins}:${secs < 10 ? "0" : ""}${secs}`;
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnDelay(0.85, 0.45)) {
          this.spawnRandomEnemy(true);
          this.spawnRandomEnemy(false);
          this.spawnTimer = 0;
        }
      } else {
        this.objProgressText = "O TEMPO ACABOU. ELIMINE OS SOBREVIVENTES!";
        // Reconciliação do estado real: descarta referências inválidas com HP <= 0 ou fora dos limites
        let hasEnemies = window.ENEMY_POOL?.items.some(
          (e) => {
            if (!e.active) return false;
            if (e.hp <= 0) {
              e.active = false;
              return false;
            }
            if (e.x < -250 || e.x > GAME.w + 250 || e.y < -200 || e.y > GAME.h + 200) {
              e.active = false;
              return false;
            }
            return !e.type.startsWith("miniboss") && e.type !== "asteroid";
          }
        );
        if (!hasEnemies) {
          window.ENEMY_POOL?.clear();
          window.PROJ_POOL?.clear();
          this.nextPhase();
        }
      }
    } else if (this.state === "HORDE_FORMATION") {
      this.spawnTimer += dt;
      if (this.hordeKillsRemaining > 0) {
        this.objProgressText = `Ondas Restantes: ${this.hordeKillsRemaining}`;
        if (this.spawnTimer > this.spawnDelay(2.15, 1.2)) {
          this.spawnFormation();
          this.hordeKillsRemaining--;
          this.spawnTimer = 0;
        }
      } else {
        this.objProgressText = `ELIMINE OS SOBREVIVENTES!`;
        let hasEnemies = window.ENEMY_POOL?.items.some(
          (e) =>
            e.active && !e.type.startsWith("miniboss") && e.type !== "asteroid",
        );
        if (!hasEnemies) {
          if (Math.random() < 0.5)
            window.DROP_POOL?.get()?.spawn(GAME.w / 2, -20, "orb_rare");
          this.nextPhase();
        }
      }
    } else if (this.state === "HORDE") {
      this.spawnTimer += dt;
      if (this.hordeKillsRemaining > 0) {
        this.objProgressText = `Alvos Restantes: ${this.hordeKillsRemaining}`;
        if (this.spawnTimer > this.spawnDelay(0.52, 0.28)) {
          this.spawnRandomEnemy(false);
          this.spawnTimer = 0;
        }
      } else {
        this.objProgressText = `ELIMINE OS SOBREVIVENTES!`;
        let hasEnemies = window.ENEMY_POOL?.items.some(
          (e) =>
            e.active && !e.type.startsWith("miniboss") && e.type !== "asteroid",
        );
        if (!hasEnemies) {
          if (Math.random() < 0.5)
            window.DROP_POOL?.get()?.spawn(GAME.w / 2, -20, "orb_rare");
          this.nextPhase();
        }
      }
    } else if (this.state === "MINIBOSS") {
      this.objProgressText = "ELIMINE O ALVO PRINCIPAL";
      // Reconciliação do estado real: verificar se a entidade miniboss ainda está fisicamente viva no pool
      if (this.miniBossActive) {
        let bossExists = window.ENEMY_POOL?.items.some(
          (e) => e.active && e.hp > 0 && e.type.startsWith("miniboss")
        );
        if (!bossExists) {
          this.miniBossActive = false;
        }
      }

      if (!this.miniBossActive) {
        let d = window.DROP_POOL?.get();
        if (d) d.spawn(GAME.w / 2, GAME.h / 2, "orb_rare");
        this.nextPhase();
      } else {
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnDelay(3.4, 2.1)) {
          let e = window.ENEMY_POOL?.get();
          if (e)
            e.spawn(
              Math.random() * (GAME.w - 40) + 20,
              -20,
              20 * GAME.diff,
              "basic",
            );
          this.spawnTimer = 0;
        }
      }
    } else if (this.state === "VILLAIN_ENCOUNTER") {
      if (typeof VILLAIN !== 'undefined') {
        if (VILLAIN.active) {
          let perc = Math.ceil((VILLAIN.hp / VILLAIN.maxHp) * 100);
          this.objProgressText = `Integridade do Juiz: ${perc}% [Tier ${VILLAIN.tier}]`;
        } else {
          this.objProgressText = "AMEAÇA RETIRADA";
        }
      }
    } else if (this.state === "SILENCE") {
      this.currentObjText = "";
      this.objProgressText = "";
      if (this.timer >= p.time) {
        window.ENEMY_POOL?.clear();
        this.nextPhase();
      }
    } else if (this.state === "BOSS_WAIT") {
      this.currentObjText = "";
      this.objProgressText = "";
      BOSS.spawn(p.bossType);
      this.state = "DONE";
    } else if (this.state === "DOCKING") {
      this.currentObjText = "";
      this.objProgressText = "";
      if (typeof GAME !== 'undefined' && typeof GAME.restoreFallenPilotsAfterSector === 'function') {
        GAME.restoreFallenPilotsAfterSector();
      }
      SANCTUARY.startDocking();
      this.state = "DONE";
    }
  },

  spawnEnemy(type, x, y, hp, setup = null) {
    let e = window.ENEMY_POOL?.get();
    if (e) {
      e.spawn(x, y, hp, type);
      if (setup) setup(e);
    }
  },

  spawnFormation() {
    let r = Math.random();
    let sector = SAVE.data.checkpoint.sector;
    let hp = (20 + sector * 5) * GAME.diff;
    let lane = GAME.w / 6;

    if (r < 0.2) {
      for (let i = -1; i <= 1; i++) {
        this.spawnEnemy(
          "hunter",
          GAME.w / 2 + i * 95,
          -35 - Math.abs(i) * 45,
          hp,
          (e) => {
            e.chargeTimer = 0.95 + Math.abs(i) * 0.2;
          },
        );
      }
      this.spawnEnemy("basic", GAME.w / 2, -120, hp);
    } else if (r < 0.4) {
      for (let i = 1; i <= 5; i++) {
        this.spawnEnemy(
          i % 2 === 0 ? "weaver" : "basic",
          lane * i,
          -20 - i * 22,
          hp,
        );
      }
    } else if (r < 0.6) {
      this.spawnEnemy("sniper", 90, -30, hp);
      this.spawnEnemy("sniper", GAME.w - 90, -30, hp);
      this.spawnEnemy("heavy", GAME.w / 2 - 80, -60, hp * 2.4);
      this.spawnEnemy("heavy", GAME.w / 2 + 80, -60, hp * 2.4);
    } else if (r < 0.8) {
      for (let i = 0; i < 4; i++) {
        this.spawnEnemy(
          "asteroid",
          GAME.w * (0.2 + i * 0.2),
          -30 - i * 35,
          hp * 1.6,
        );
      }
      this.spawnEnemy("weaver", GAME.w / 2, -150, hp);
    } else {
      this.spawnEnemy("hunter", 70, -30, hp, (e) => (e.chargeTimer = 1.15));
      this.spawnEnemy(
        "hunter",
        GAME.w - 70,
        -30,
        hp,
        (e) => (e.chargeTimer = 1.15),
      );
      for (let i = 1; i <= 3; i++)
        this.spawnEnemy("basic", (GAME.w / 4) * i, -85, hp);
    }
  },

  spawnRandomEnemy(moreAsteroids = false) {
    let e = window.ENEMY_POOL?.get();
    if (!e) return;
    let sector = SAVE.data.checkpoint.sector;
    let hp = (20 + sector * 5) * GAME.diff;
    let astChance = moreAsteroids ? 0.35 : 0.15;
    if (Math.random() < astChance)
      e.spawn(Math.random() * (GAME.w - 40) + 20, -20, hp * 2, "asteroid");
    else e.spawn(Math.random() * (GAME.w - 40) + 20, -20, hp);
  },

  registerKill() {
    if (this.state === "HORDE" || this.state === "GLITCH_HORDE")
      this.hordeKillsRemaining--;
  },

  getStageCompletionStatus() {
    let sector = SAVE.data?.checkpoint?.sector || 1;
    let phase = this.phases[this.phaseIdx] || null;
    let activeEnemies = window.ENEMY_POOL?.items?.filter(e => e.active) || [];
    let minibossEntity = activeEnemies.find(e => e.type.startsWith('miniboss')) || null;
    let nonAsteroidMinions = activeEnemies.filter(e => !e.type.startsWith('miniboss') && e.type !== 'asteroid');

    let status = {
      sector,
      gameState: GAME.state,
      pacingState: this.state,
      phaseIndex: this.phaseIdx,
      totalPhases: this.phases.length,
      currentPhaseConfig: phase,
      timer: Number(this.timer.toFixed(2)),
      spawnTimer: Number(this.spawnTimer.toFixed(2)),
      hordeKillsRemaining: this.hordeKillsRemaining,
      miniBossActiveFlag: this.miniBossActive,
      minibossEntityPresent: !!minibossEntity,
      minibossHP: minibossEntity ? minibossEntity.hp : null,
      activeEnemiesCount: activeEnemies.length,
      nonAsteroidMinionsCount: nonAsteroidMinions.length,
      blockingConditions: [],
      readyToAdvance: false
    };

    if (this.state === "INTRO") {
      let targetTime = phase ? phase.time : 3;
      if (this.timer < targetTime) {
        status.blockingConditions.push(`Intro timer running: ${(targetTime - this.timer).toFixed(1)}s remaining`);
      } else {
        status.readyToAdvance = true;
      }
    } else if (this.state === "SURVIVE_LONG") {
      let timeLeft = phase ? Math.ceil(phase.time - this.timer) : 0;
      if (timeLeft > 0) {
        status.blockingConditions.push(`Survival time remaining: ${timeLeft}s`);
      } else if (nonAsteroidMinions.length > 0) {
        status.blockingConditions.push(`Waiting for ${nonAsteroidMinions.length} remaining enemies to be cleared`);
      } else {
        status.readyToAdvance = true;
      }
    } else if (this.state === "MINIBOSS") {
      if (this.miniBossActive || minibossEntity) {
        status.blockingConditions.push(`Miniboss active (${minibossEntity ? minibossEntity.type + ' HP: ' + minibossEntity.hp : 'flag true, searching entity'})`);
      } else {
        status.readyToAdvance = true;
      }
    } else if (this.state === "VILLAIN_ENCOUNTER") {
      if (typeof VILLAIN !== 'undefined') {
        if (VILLAIN.active) {
          let perc = Math.ceil((VILLAIN.hp / VILLAIN.maxHp) * 100);
          this.objProgressText = `Integridade do Juiz: ${perc}% [Tier ${VILLAIN.tier}]`;
        } else {
          this.objProgressText = "AMEAÇA RETIRADA";
        }
      }
    } else if (this.state === "SILENCE") {
      let targetTime = phase ? phase.time : 4;
      if (this.timer < targetTime) {
        status.blockingConditions.push(`Silence delay: ${(targetTime - this.timer).toFixed(1)}s remaining`);
      } else {
        status.readyToAdvance = true;
      }
    } else if (this.state === "DOCKING" || this.state === "DONE") {
      status.readyToAdvance = true;
    }

    return status;
  },

  logDiagnostics() {
    let diag = this.getStageCompletionStatus();
    console.log(`[PACING-DIAG] Sector ${diag.sector} | Phase ${diag.phaseIndex + 1}/${diag.totalPhases} (${diag.pacingState}) | Timer: ${diag.timer}s | Enemies: ${diag.activeEnemiesCount} (Minions: ${diag.nonAsteroidMinionsCount}) | MiniBoss Flag: ${diag.miniBossActiveFlag} | Blockers: ${diag.blockingConditions.join(', ') || 'NONE (Ready)'}`);
  }
};

if (typeof window !== 'undefined') {
  window.PACING = PACING;
  window.COMBAT_DIRECTOR = COMBAT_DIRECTOR;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PACING, COMBAT_DIRECTOR };
}
