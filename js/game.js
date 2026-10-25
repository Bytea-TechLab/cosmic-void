const GAME_VERSION = "2.1.0";
if (typeof window !== 'undefined') window.GAME_VERSION = GAME_VERSION;

const GAME = {
  version: GAME_VERSION,
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  state: "MENU",
  lastTime: 0,
  time: 0,
  p1: null,
  p2: null,
  paused: false,
  inputLocked: false,
  diff: 1.0,
  shake: 0,
  timeScale: 1.0,
  slowMoTimer: 0,
  isCoop: true,
  mode: "2P",
  menuP1Class: "assault",
  menuP2Class: "scout",

  get players() {
    let arr = [];
    if (this.p1) arr.push(this.p1);
    if (this.p2) arr.push(this.p2);
    return arr;
  },
  getAlivePlayers() {
    return this.players.filter(p => p && p.active && p.state === 'ALIVE');
  },
  getActivePlayers() {
    return this.players.filter(p => p && p.active);
  },
  isAnyPlayerAlive() {
    return this.getAlivePlayers().length > 0;
  },
  areAllPlayersDefeated() {
    if (this.players.length === 0) return true;
    return this.getAlivePlayers().length === 0;
  },
  getTargetPlayer(sourceX = 0, sourceY = 0, strategy = 'nearest') {
    let alive = this.getAlivePlayers();
    if (alive.length === 0) alive = this.getActivePlayers();
    if (alive.length === 0) return null;
    if (alive.length === 1) return alive[0];

    if (strategy === 'nearest') {
      let d1 = Math.hypot(alive[0].x - sourceX, alive[0].y - sourceY);
      let d2 = Math.hypot(alive[1].x - sourceX, alive[1].y - sourceY);
      return d1 <= d2 ? alive[0] : alive[1];
    }
    if (strategy === 'furthest') {
      let d1 = Math.hypot(alive[0].x - sourceX, alive[0].y - sourceY);
      let d2 = Math.hypot(alive[1].x - sourceX, alive[1].y - sourceY);
      return d1 >= d2 ? alive[0] : alive[1];
    }
    if (strategy === 'p1') return this.p1 && this.p1.active ? this.p1 : alive[0];
    if (strategy === 'p2') return this.p2 && this.p2.active ? this.p2 : alive[0];
    return Math.random() < 0.5 ? alive[0] : alive[1];
  },
  restoreFallenPilotsAfterSector() {
    this.players.forEach(p => {
      if (p && (p.state === 'DOWN' || p.state === 'DEAD' || !p.active)) {
        p.active = true;
        p.state = 'ALIVE';
        p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.50));
        p.downTimer = 0;
        p.reviveProgress = 0;
        p.iFrames = 2.0;
        p.shieldTimer = Math.max(p.shieldTimer, 3.0);
        if (typeof UI !== 'undefined' && UI.updateHP) {
          UI.updateHP(p.hp, p.maxHp, p.isP2);
        }
      }
    });
  },

  combo: 0,
  comboTimer: 0,
  maxComboTimer: 4.0,
  comboTier: 0,
  syncCombo: 0,
  linkStateTimer: 0,

  globalFilter: "none",
  isGlitching: false,
  flashAlpha: 0,
  flashColor: "#fff",

  init() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d", { alpha: false }) : null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 150));

    // Pausa automática ao alternar abas, suspender navegador móvel ou perder foco
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "PLAYING" && !this.paused) {
        if (typeof UI !== "undefined") UI.togglePause(true);
      }
    });
    window.addEventListener("blur", () => {
      if (this.state === "PLAYING" && !this.paused) {
        if (typeof UI !== "undefined") UI.togglePause(true);
      }
    });

    EFFECTS.init();
    WORLD.init();
    if (typeof UI !== "undefined" && UI.initMobileMenuUI) {
      UI.initMobileMenuUI();
    }
    requestAnimationFrame((t) => this.loop(t));
  },
  resize() {
    if (!this.canvas) return;
    const isPortrait = window.innerHeight > window.innerWidth;
    const portraitWarning = document.getElementById("portrait-warning");
    if (portraitWarning) {
      if (typeof UI !== "undefined" && UI.portraitDismissed) {
        portraitWarning.style.display = "none";
      } else {
        portraitWarning.style.display = isPortrait ? "flex" : "none";
      }
    }

    let quality = (typeof SAVE !== "undefined" && SAVE.data?.settings?.graphicProfile) || "high";
    let maxDpr = quality === "low" ? 1.0 : quality === "medium" ? 1.5 : 2.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    if (this.ctx && typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    if (typeof INPUT !== "undefined" && INPUT.updateTouchHUDVisibility) {
      INPUT.updateTouchHUDVisibility();
    }
  },

  continueGame() {
    const checkpoint = (typeof SAVE !== "undefined" && SAVE.data?.checkpoint) ? SAVE.data.checkpoint : {};
    let isCoop = checkpoint.p2Class !== undefined && checkpoint.p2Class !== null ? true : true; // 2P por padrão
    this.start(checkpoint.p1Class || "assault", true, isCoop, checkpoint.p2Class || "scout");
  },
  triggerFlash(color = "#fff", duration = 0.5, priority = "COMBAT") {
    if (typeof IMPACT_CONTROLLER !== "undefined") {
      IMPACT_CONTROLLER.triggerFlash(color, duration, priority);
    } else {
      let mult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.flashIntensity !== undefined) ? SAVE.data.settings.flashIntensity : 1.0;
      if (mult <= 0) return;
      this.flashColor = color;
      this.flashAlpha = Math.min(0.5, duration) * mult;
    }
  },
  setDifficulty(mult, selectedButton) {
    this.diff = mult;
    document.querySelectorAll("#difficulty-select button").forEach((btn) => {
      btn.style.background = "rgba(0,0,0,0.5)";
      btn.style.color = "#0ff";
    });
    if (selectedButton) {
      selectedButton.style.background = "#0ff";
      selectedButton.style.color = "#000";
    }
  },
  selectCoopClass(playerIndex, cls, selectedButton) {
    if (playerIndex === 0) this.menuP1Class = cls;
    else this.menuP2Class = cls;

    let groupId =
      playerIndex === 0 ? "coop-p1-class-select" : "coop-p2-class-select";
    document.querySelectorAll(`#${groupId} button`).forEach((btn) => {
      btn.style.background = "rgba(0,0,0,0.5)";
      btn.style.color = playerIndex === 0 ? "#0ff" : "#0f0";
      if (!selectedButton && btn.dataset && btn.dataset.class === cls)
        selectedButton = btn;
    });
    if (selectedButton) {
      selectedButton.style.background = playerIndex === 0 ? "#0ff" : "#0f0";
      selectedButton.style.color = "#000";
    }
  },
  startCoopFromMenu() {
    this.start(this.menuP1Class, false, true, this.menuP2Class);
  },
  evaluateLinkMoment(a, b) {
    let dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (dist < 160) {
      // Proximidade correta
      this.linkStateTimer = 4.0; // 4s de Link State Cinematográfico
      this.syncCombo += 10;
      this.triggerFlash("#00ffff", 0.25);
      this.timeScale = 0.6;
      this.slowMoTimer = 0.4;
      UI.showTransmission("LINK MOMENT ATIVADO: TIROS AMPLIFICADOS!");
    }
  },
  getSynergyPair(a, b) {
    let c1 = (a && a.cls) ? a.cls : "assault";
    let c2 = (b && b.cls) ? b.cls : "scout";
    return [c1, c2].sort().join("+");
  },

  getSynergyName(a, b) {
    let pair = this.getSynergyPair(a, b);
    const names = {
      "assault+scout": "TEMPESTADE DE INTERCEPTAÇÃO",
      "assault+tank": "BASTIÃO DE RUPTURA",
      "assault+ranger": "LANÇA DE SUPRESSÃO",
      "scout+tank": "VETOR DE CONTRA-ATAQUE",
      "ranger+scout": "RUPTURA VETORIAL",
      "ranger+tank": "CANHÃO DE CERCO"
    };
    return names[pair] || "VOID RESONANCE";
  },

  triggerCombinedSpecial(a, b) {
    let pair = this.getSynergyPair(a, b);
    let synName = this.getSynergyName(a, b);
    this.syncCombo += 40;
    this.timeScale = 0.15;
    this.slowMoTimer = 1.0;
    this.shake = 65;

    this.triggerFlash("#00ffff", 0.45, "SUPER_SPECIAL");
    UI.showTransmission(`SINERGIA ATIVADA: ${synName}!`);

    // 1. Assault + Scout — Tempestade de Interceptação
    if (pair === "assault+scout") {
      if (a) a.specialActive = 4.5;
      if (b) b.specialActive = 4.5;
      if (window.ENEMY_POOL) {
        window.ENEMY_POOL.items.forEach(e => {
          if (e.active) {
            e.hp -= 350;
            EFFECTS.explosion(e.x, e.y, "#00ffff");
            if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
          }
        });
      }
      if (window.BOSS && window.BOSS.active) {
        window.BOSS.hp = Math.max(0, window.BOSS.hp - 1200);
      }
    }
    // 2. Assault + Tank — Bastião de Ruptura
    else if (pair === "assault+tank") {
      if (a) { a.shieldTimer = 5.0; a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.25); }
      if (b) { b.shieldTimer = 5.0; b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.25); }
      if (window.PROJ_POOL) {
        window.PROJ_POOL.items.forEach(p => { if (p.active && !p.isPlayer) p.active = false; });
      }
      if (window.ENEMY_POOL) {
        window.ENEMY_POOL.items.forEach(e => {
          if (e.active && e.y > this.h * 0.3) {
            e.hp -= 500;
            EFFECTS.explosion(e.x, e.y, "#ffea00", true);
            if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
          }
        });
      }
      if (window.BOSS && window.BOSS.active) {
        window.BOSS.hp = Math.max(0, window.BOSS.hp - 1500);
      }
    }
    // 3. Assault + Ranger — Lança de Supressão
    else if (pair === "assault+ranger") {
      if (a) a.specialActive = 4.0;
      if (b) b.specialActive = 4.0;
      if (window.ENEMY_POOL) {
        window.ENEMY_POOL.items.forEach(e => {
          if (e.active) {
            e.hp -= 600;
            EFFECTS.explosion(e.x, e.y, "#ff00aa", true);
            if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
          }
        });
      }
      if (window.BOSS && window.BOSS.active) {
        window.BOSS.hp = Math.max(0, window.BOSS.hp - 2000);
      }
    }
    // 4. Scout + Tank — Vetor de Contra-ataque
    else if (pair === "scout+tank") {
      if (a) a.orbDash = 4.0;
      if (b) b.orbDash = 4.0;
      if (window.PROJ_POOL) {
        window.PROJ_POOL.items.forEach(p => {
          if (p.active && !p.isPlayer) {
            p.isPlayer = true;
            p.isParried = true;
            p.damageMult = 4.0;
            p.vy = -Math.abs(p.vy) - 20;
            p.color = "#00ff88";
          }
        });
      }
      if (window.ENEMY_POOL) {
        window.ENEMY_POOL.items.forEach(e => {
          if (e.active) {
            e.hp -= 450;
            if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
          }
        });
      }
    }
    // 5. Scout + Ranger — Ruptura Vetorial
    else if (pair === "ranger+scout") {
      let primeTarget = null;
      if (window.BOSS && window.BOSS.active) {
        primeTarget = window.BOSS;
      } else if (window.ENEMY_POOL) {
        let activeMiniboss = window.ENEMY_POOL.items.find(e => e.active && e.type && e.type.startsWith("miniboss"));
        if (activeMiniboss) primeTarget = activeMiniboss;
        else primeTarget = window.ENEMY_POOL.items.filter(e => e.active).sort((x, y) => y.hp - x.hp)[0];
      }
      if (primeTarget) {
        primeTarget.hp = Math.max(0, primeTarget.hp - 2500);
        EFFECTS.explosion(primeTarget.x, primeTarget.y, "#00e5ff", true);
        if (primeTarget.hp <= 0 && primeTarget !== window.BOSS && window.COLLISIONS) {
          window.COLLISIONS.killEnemy(primeTarget);
        }
      }
    }
    // 6. Tank + Ranger — Canhão de Cerco
    else if (pair === "ranger+tank") {
      this.shake = 85;
      if (window.ENEMY_POOL) {
        window.ENEMY_POOL.items.forEach(e => {
          if (e.active) {
            e.hp -= 550;
            EFFECTS.explosion(e.x, e.y, "#ff5500", true);
            if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
          }
        });
      }
      if (window.BOSS && window.BOSS.active) {
        window.BOSS.hp = Math.max(0, window.BOSS.hp - 1800);
      }
    }
    // 7. Void Resonance (Classes Idênticas)
    else {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          EFFECTS.explosion(
            Math.random() * this.w,
            Math.random() * this.h,
            Math.random() > 0.5 ? "#0ff" : "#f0f",
            true
          );
          if (window.ENEMY_POOL) {
            window.ENEMY_POOL.items.forEach(e => {
              if (e.active) {
                e.hp -= 200;
                if (e.hp <= 0 && window.COLLISIONS) window.COLLISIONS.killEnemy(e);
              }
            });
          }
        }, i * 60);
      }
      if (window.BOSS && window.BOSS.active) {
        window.BOSS.hp = Math.max(0, window.BOSS.hp - 1600);
      }
    }
    return true;
  },
  start(cls = "assault", fromCheckpoint = false, coop = true, p2Class = "scout") {
    if (typeof INPUT !== "undefined" && typeof INPUT.resetInputs === "function") {
      INPUT.resetInputs();
    }
    this.resize();
    this.isCoop = coop;
    this.mode = coop ? "2P" : "1P";
    this.paused = false;
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
    if (typeof INPUT !== "undefined" && INPUT.updateTouchHUDVisibility) INPUT.updateTouchHUDVisibility();
    let pauseMenu = document.getElementById("pause-menu");
    if (pauseMenu) pauseMenu.style.display = "none";

    // CORREÇÃO: Reset absoluto do progresso ao iniciar um Novo Jogo
    if (!fromCheckpoint) {
      SAVE.data.checkpoint.sector = 1;
      SAVE.data.checkpoint.bossPhase = 0;
      SAVE.data.credits = [0, 0];
      SAVE.data.skills = [
        { damage: 0, mobility: 0, defense: 0, specialty: 0 },
        { damage: 0, mobility: 0, defense: 0, specialty: 0 },
      ];
      if (typeof VILLAIN !== 'undefined') VILLAIN.resetProgress();
      SAVE.save(); // Salva a limpeza imediatamente
    } else {
      if (typeof VILLAIN !== 'undefined') VILLAIN.initFromSave();
    }

    // Instanciar participantes com distribuição espacial sem sobreposição
    let screenW = this.w || window.innerWidth || 800;
    this.p1 = new Player(cls, false);
    if (coop) {
      this.p2 = new Player(p2Class, true);
      this.p1.x = screenW * 0.35;
      this.p2.x = screenW * 0.65;
    } else {
      this.p2 = null;
      this.p1.x = screenW * 0.50;
    }

    document.getElementById("p2-hp-container").style.display = coop
      ? "block"
      : "none";
    let p2CredBox = document.getElementById("hud-credits-p2-box");
    if (p2CredBox) p2CredBox.style.display = coop ? "inline" : "none";

    this.state = "PLAYING";
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTier = 0;
    this.syncCombo = 0;
    this.globalFilter = "none";
    this.isGlitching = false;

    UI.updateCredits();
    UI.updateSpecial(0, false);
    UI.updateHP(this.p1.hp, this.p1.maxHp, false);
    if (coop) {
      UI.updateSpecial(0, true);
      UI.updateHP(this.p2.hp, this.p2.maxHp, true);
    }

    SAVE.data.checkpoint.p1Class = cls;
    SAVE.data.checkpoint.p2Class = coop ? p2Class : null;
    UI.updateSector(SAVE.data.checkpoint.sector);
    PACING.reset();
  },
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dtReal = (timestamp - this.lastTime) / 1000;
    if (isNaN(dtReal) || dtReal < 0) dtReal = 0.016;
    if (dtReal > 0.05) dtReal = 0.05;
    this.lastTime = timestamp;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dtReal;
      if (this.slowMoTimer <= 0) this.timeScale = 1.0;
    }

    let dt = dtReal * this.timeScale;
    if (!this.paused) {
      this.time += dt;
      this.update(dt, dtReal);
    }
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  },
  update(dt, dtReal = null) {
    if (
      [
        "PLAYING",
        "LAUNCHING",
        "DOCKING",
        "ENDING",
        "EPILOGUE",
        "FAKE_CREDITS",
      ].includes(this.state)
    ) {
      WORLD.update(dt);
      PACING.update(dt);
      if (this.p1) this.p1.update(dt);
      if (this.p2) this.p2.update(dt);

      if (window.ENEMY_POOL) window.ENEMY_POOL.updateAll(dt);
      if (window.PROJ_POOL) window.PROJ_POOL.updateAll(dt);
      if (window.DROP_POOL) window.DROP_POOL.updateAll(dt);
      BOSS.update(dt);
      if (typeof VILLAIN !== 'undefined') VILLAIN.update(dt, dtReal);
      EFFECTS.update(dt, this.ctx);
      COLLISIONS.check(dt);

      if (this.combo > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          // Decaimento progressivo suave: perde 1 tier (15 combo) por vez com 2.0s de tolerância
          if (this.combo > 15) {
            this.combo -= 15;
            this.comboTimer = 2.0;
          } else {
            this.combo = 0;
            this.comboTimer = 0;
          }
        }
      }
      this.comboTier = Math.floor(this.combo / 15);
      if (this.comboTier > 4) this.comboTier = 4;

      if (this.flashAlpha > 0) this.flashAlpha -= dt * 2.5;
      if (this.linkStateTimer > 0) this.linkStateTimer -= dt;

      // Clutches finais desesperadores (Fases 17-20)
      // Clutches finais desesperadores (Fases 17-20)
      // Clutches finais desesperadores e Zona Morta (Fases 17-20)
      let sector = SAVE.data.checkpoint.sector;
      if (this.state === 'PLAYING' && sector >= 3) {
          // ACESSIBILIDADE E GAME FEEL: Redução drástica da frequência (1/5 da original)
          // Setores normais (0.0004): Ocorrerá em média 1 vez a cada 40 segundos, em vez de a cada 8s.
          // Zona Morta (0.00002): Quase nulo, mantém a melancolia opressiva.
          let glitchChance = (sector >= 17) ? 0.00002 : 0.0004; 
          if (Math.random() < glitchChance) EFFECTS.triggerGlitch();
      }
  } // Fim do bloco if(['PLAYING', 'LAUNCHING'...
},
  draw() {
    this.ctx.save();
        let shakeMult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.screenShake !== undefined) ? SAVE.data.settings.screenShake : 1.0;
    if (typeof SAVE !== 'undefined' && SAVE.data?.settings?.reducedMotion) {
      shakeMult = 0.0;
    }
    let currentShake = this.shake * shakeMult;
    if (this.comboTier >= 4 || this.linkStateTimer > 0) currentShake += 4 * shakeMult;

    if (currentShake > 0) {
      this.ctx.translate(
        (Math.random() - 0.5) * currentShake,
        (Math.random() - 0.5) * currentShake,
      );
      this.shake *= 0.88;
    }

    // Filtros nativos aplicados via render pipeline leve
    if (this.isGlitching) {
      this.ctx.filter = "hue-rotate(180deg) invert(100%)";
    } else if (this.linkStateTimer > 0) {
      this.ctx.filter = "contrast(1.4) saturate(1.8)";
    } else {
      this.ctx.filter = "none";
    }

    WORLD.draw(this.ctx);

    if (
      [
        "PLAYING",
        "LAUNCHING",
        "DOCKING",
        "ENDING",
        "EPILOGUE",
        "FAKE_CREDITS",
      ].includes(this.state)
    ) {
      // Conexão energética visível do Link State
      if (
        this.isCoop &&
        this.p1 &&
        this.p2 &&
        this.p1.state === "ALIVE" &&
        this.p2.state === "ALIVE" &&
        this.linkStateTimer > 0
      ) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.strokeStyle = "#0ff";
        this.ctx.lineWidth = 4 + Math.random() * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.p1.x, this.p1.y);
        this.ctx.lineTo(this.p2.x, this.p2.y);
        this.ctx.stroke();
        this.ctx.strokeStyle = "#ff00ff";
        this.ctx.lineWidth = 14;
        this.ctx.beginPath();
        this.ctx.moveTo(this.p1.x, this.p1.y);
        this.ctx.lineTo(this.p2.x, this.p2.y);
        this.ctx.stroke();
        this.ctx.restore();
      }

      if (window.DROP_POOL) window.DROP_POOL.drawAll(this.ctx);
      if (window.PROJ_POOL) window.PROJ_POOL.drawAll(this.ctx);
      EFFECTS.pool.drawAll(this.ctx);

      if (window.ENEMY_POOL) window.ENEMY_POOL.drawAll(this.ctx);
      BOSS.draw(this.ctx);
      if (typeof VILLAIN !== 'undefined') VILLAIN.draw(this.ctx);

      // --- NOVA ATMOSFERA: TERROR DA ZONA MORTA (Setor 17+) ---
      let sector = SAVE.data.checkpoint.sector || 1;
      if (this.state === "PLAYING" && sector >= 17) {
        // Escuridão opressiva nas bordas (efeito de claustrofobia)
        let grad = this.ctx.createRadialGradient(
          this.w / 2,
          this.h / 2,
          this.h * 0.2,
          this.w / 2,
          this.h / 2,
          this.h * 0.9,
        );
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, "rgba(8, 0, 15, 0.95)");
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.w, this.h);

        // Estática "morta" ocasional no fundo para dar suspense
        if (Math.random() < 0.15) {
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          this.ctx.fillRect(
            Math.random() * this.w,
            Math.random() * this.h,
            2,
            2,
          );
        }
      }
      // --------------------------------------------------------

      // Ordem de sobreposição correta para naves caídas
      if (this.p1 && this.p1.state === "DOWN") this.p1.draw(this.ctx);
      if (this.p2 && this.p2.state === "DOWN") this.p2.draw(this.ctx);
      if (this.p1 && this.p1.state === "ALIVE") this.p1.draw(this.ctx);
      if (this.p2 && this.p2.state === "ALIVE") this.p2.draw(this.ctx);

      if (this.mode === '2P' && window.RENDERER2D && window.RENDERER2D.drawSynergyTelemetry) {
        window.RENDERER2D.drawSynergyTelemetry(this.ctx, this.p1, this.p2);
      }

      if (this.flashAlpha > 0) {
        this.ctx.fillStyle = this.flashColor;
        this.ctx.globalAlpha = this.flashAlpha;
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.ctx.globalAlpha = 1.0;
      }

      if (typeof IMPACT_CONTROLLER !== "undefined") {
        IMPACT_CONTROLLER.draw(this.ctx);
      }

      // Renderização da interface cinematográfica superior
      if (this.state === "PLAYING") {
        this.ctx.textAlign = "center";
        if (PACING.currentObjText) {
          this.ctx.shadowBlur = 20;
          this.ctx.shadowColor = "#0ff";
          this.ctx.font = "bold 34px 'Courier New'";
          this.ctx.fillStyle = "#fff";
          this.ctx.fillText(PACING.currentObjText, this.w / 2, 65);
          this.ctx.shadowBlur = 0;

          if (PACING.objProgressText) {
            this.ctx.font = "bold 26px 'Courier New'";
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText(PACING.objProgressText, this.w / 2, 105);
          }
        }

        // Renderização das informações do Sync Combo na direita
        if (this.isCoop && this.syncCombo > 5) {
          this.ctx.textAlign = "right";
          this.ctx.font = "italic bold 26px 'Courier New'";
          this.ctx.fillStyle = "#ff00ff";
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = "#ff00ff";
          this.ctx.fillText(
            `SYNC MULTIPLIER: x${(1 + this.syncCombo / 50).toFixed(1)}`,
            this.w - 30,
            45,
          );
          this.ctx.shadowBlur = 0;
        }
      }
    }
    this.ctx.restore();
  },
};
window.addEventListener("DOMContentLoaded", () => {
  GAME.init();
});
