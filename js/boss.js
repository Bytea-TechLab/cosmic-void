const BOSS = {
    active: false,
    type: "",
    x: 0,
    y: 0,
    hp: 1000,
    maxHp: 1000,
    timer: 0,
    radius: 40,
    state: "INTRO",
    attackTimer: 0,
    shieldTimer: 0,
    mobTimer: 0,
    p50: false,
    pFake: false,
    subsystems: [],
  
    spawn(forcedType = null) {
      this.active = true;
      this.timer = 0;
      this.attackTimer = 0;
      this.mobTimer = 0;
      this.shieldTimer = 0;
      this.p50 = false;
      this.pFake = false;
      this.type = "";
      this.subsystems = [];
  
      let sector = SAVE.data.checkpoint.sector || 1;
      let effectiveType = forcedType;
  
      if (effectiveType === "dread_fleet") {
        this.type = "dread_fleet";
        this.name = "THE DREAD FLEET";
        this.color = "#ff6600";
        this.hp = 42000;
        this.radius = 55;
        let subHp = Math.floor(4500 * GAME.diff);
        let shieldHp = Math.floor(6000 * GAME.diff);
        this.subsystems = [
          { id: "turretPort", name: "Bateria Railgun Bombordo", offsetX: -110, offsetY: -10, radius: 24, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 },
          { id: "turretStarboard", name: "Bateria Mísseis Estibordo", offsetX: 110, offsetY: -10, radius: 24, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 },
          { id: "shieldCore", name: "Gerador de Blindagem Frontal", offsetX: 0, offsetY: 40, radius: 26, hp: shieldHp, maxHp: shieldHp, alive: true, smokeTimer: 0 }
        ];
      } else if (effectiveType === "blackout_signal") {
        this.type = "blackout_signal";
        this.name = "THE BLACKOUT SIGNAL";
        this.color = "#bf00ff";
        this.hp = 48000;
        this.radius = 42;
        this.signalTimer = 0;
        this.vulnerableTimer = 0;
      } else if (sector === 5 || effectiveType === "gatekeeper") {
        this.type = "gatekeeper";
        this.name = "THE GATEKEEPER";
        this.color = "#f90";
        this.hp = 15000;
        this.radius = 40;
        let subHp = Math.floor(2500 * GAME.diff);
        this.subsystems = [
          { id: "turretLeft", name: "Torre Railgun Esquerda", offsetX: -80, offsetY: 0, radius: 22, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 },
          { id: "turretRight", name: "Torre Railgun Direita", offsetX: 80, offsetY: 0, radius: 22, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 }
        ];
      } else if (sector === 10 || effectiveType === "leviathan") {
        this.type = "leviathan";
        this.name = "THE LEVIATHAN";
        this.color = "#90f";
        this.hp = 36000;
        this.radius = 45;
        let subHp = Math.floor(4000 * GAME.diff);
        this.subsystems = [
          { id: "gravLeft", name: "Estabilizador Gravitacional Alfa", offsetX: -90, offsetY: 0, radius: 26, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 },
          { id: "gravRight", name: "Estabilizador Gravitacional Beta", offsetX: 90, offsetY: 0, radius: 26, hp: subHp, maxHp: subHp, alive: true, smokeTimer: 0 }
        ];
      } else if (sector === 16 || effectiveType === "absolute_core") {
        this.type = "absolute_core";
        this.name = "THE ABSOLUTE CORE";
        this.color = "#f00";
        this.hp = 90000;
        this.radius = 40;
      } else if (effectiveType === "ascended" || sector >= 20) {
        this.type = "ascended";
        this.name = "THE ASCENDED";
        this.color = "#fff";
        this.hp = 180000; // Calibrado para o combate final em 5 fases (5-7 minutos)
        this.radius = 12;
  
        this.ascendedState = "IDLE";
        this.ascendedTimer = 2.0;
        this.phase = 1;
        this.counterActive = 0;
        this.alpha = 1.0;
        this.isAttacking = false;
        this.saidFinalWord = false;
      } else if (sector === 19 || effectiveType === "observer_apex" || this.type === "observer_apex") {
        this.type = "observer_apex";
        this.name = "OBSERVER APEX";
        this.color = "#0ff";
        this.hp = 65000;
        this.radius = 35;
      }
  
      // Aplica multiplicador de dificuldade selecionado pelo jogador (sem escalonamento exponencial)
      this.hp = Math.floor(this.hp * GAME.diff);
      
      this.maxHp = this.hp;
      this.lastHp = this.hp;
      this.x = GAME.w / 2;
      this.y = -200;
      this.state = "INTRO";
  
      if (this.type === "ascended") {
        UI.showTransmission("...");
        GAME.shake = 10;
      } else {
        UI.showBossWarning(this.name);
        GAME.shake = 50;
        EFFECTS.triggerGlitch();
      }
    },
  
    summonMinibosses() {
      let e1 = window.ENEMY_POOL.get();
      if (e1) e1.spawn(100, -50, 1500, "miniboss_crusher");
      let e2 = window.ENEMY_POOL.get();
      if (e2) e2.spawn(GAME.w - 100, -50, 1500, "miniboss_sniper");
    },
  
    update(dt) {
      if (!this.active) return;
      this.timer += dt;
      let p1 = (GAME.p1 && GAME.p1.active && GAME.p1.state === 'ALIVE') ? GAME.p1 : null;
      let p2 = (GAME.p2 && GAME.p2.active && GAME.p2.state === 'ALIVE') ? GAME.p2 : null;
      let p = (typeof GAME.getTargetPlayer === 'function') ? GAME.getTargetPlayer(this.x, this.y, 'nearest') : (p1 || p2);
  
      if (this.state === "INTRO") {
        this.y += 30 * dt;
        if (this.y >= 150) {
          this.state = "COMBAT";
          this.y = 150;
  
          // Mostrar UI imediatamente para TODOS os chefes (garante a leitura da barra de vida)
          UI.toggleBossUI(true, this.name);
          UI.updateBossHP(this.hp, this.maxHp);
          GAME.shake = 20;
          EFFECTS.explosion(this.x, this.y, "#fff");
          
          if (this.type === "ascended") {
              UI.showTransmission("THE ASCENDED.");
          }
        }
        if (Math.random() < 0.5 && this.type !== "ascended")
          EFFECTS.pool
            .get()
            ?.spawn(
              this.x + (Math.random() - 0.5) * 150,
              this.y,
              0,
              -10,
              this.color,
              30,
              4,
            );
        return;
      }
  
      // ==========================================
      //  THE ASCENDED (Cinemática e Mecânicas)
      // ==========================================
      if (this.type === "ascended") {
        // Atualiza a vida em tempo real (Corrige a "imortalidade" visual)
        UI.updateBossHP(this.hp, this.maxHp);
  
        // FIM DE JOGO
        if (this.hp <= 0 && this.state !== "DEFEATED") {
          this.hp = 0;
          this.state = "DEFEATED";
          this.timer = 0;
          window.PROJ_POOL.clear();
          window.ENEMY_POOL.clear();
          GAME.shake = 0;
          GAME.globalFilter = "none";
          return;
        }
  
        if (this.state === "DEFEATED") {
          this.timer += dt;
          if (this.timer < 3) {
            this.y += 15 * dt; 
            this.alpha = Math.max(0.3, 1 - this.timer / 3);
          } else if (this.timer >= 3 && !this.saidFinalWord) {
            this.saidFinalWord = true;
            this.vx = 0;
            this.vy = 0;
            UI.showTransmission("They survived."); 
          } else if (this.timer > 6) {
            this.active = false;
            UI.triggerTrueEnding();
          }
          return;
        }
  
        this.lastHp = this.hp;
  
        // 5 FASES CANÔNICAS DO THE ASCENDED (Balanceadas para 5-7 minutos totais)
        let hpPerc = this.hp / this.maxHp;
        if (hpPerc <= 0.75 && this.phase === 1) {
          this.phase = 2;
          UI.showTransmission("PHASE II: LIMITER REMOVED.");
          GAME.shake = 30;
          EFFECTS.triggerGlitch();
          this.ascendedState = "IDLE";
          this.ascendedTimer = 1.0;
        } else if (hpPerc <= 0.50 && this.phase === 2) {
          this.phase = 3;
          UI.showTransmission("PHASE III: DOMINION.");
          GAME.shake = 40;
          this.ascendedState = "HORIZON_PREP";
          this.ascendedTimer = 1.5;
        } else if (hpPerc <= 0.25 && this.phase === 3) {
          this.phase = 4;
          UI.showTransmission("PHASE IV: EXECUTION.");
          GAME.shake = 45;
          this.ascendedState = "SHOCKED";
          this.ascendedTimer = 1.0;
          window.PROJ_POOL.clear();
        } else if (hpPerc <= 0.10 && this.phase === 4) {
          this.phase = 5;
          UI.showTransmission("PHASE V: BEYOND THE VOID.");
          GAME.shake = 60;
          GAME.triggerFlash("#fff", 1.0);
          EFFECTS.triggerGlitch();
          this.ascendedState = "IDLE";
          this.ascendedTimer = 0.5;
          window.PROJ_POOL.clear();
        }
  
        if (this.counterActive > 0) {
          this.counterActive -= dt;
          return; 
        }
  
        // DETECÇÃO DE PARRY / PERFECT DODGE
        if (p && p.dashCooldown > p.dashCdBase * 0.7 && this.isAttacking) {
          let dist = Math.hypot(p.x - this.x, p.y - this.y);
          if (dist < 130 && this.counterActive <= 0) {
            this.counterActive = 1.0; 
            GAME.timeScale = 0.15; 
            GAME.slowMoTimer = 1.0;
            GAME.triggerFlash("#fff", 0.8);
            UI.showTransmission("COUNTER WINDOW DETECTED.");
            EFFECTS.explosion(this.x, this.y, "#fff", true);
            this.isAttacking = false; 
            return;
          }
        }
  
        // MÁQUINA DE ESTADOS (Silêncio e Cálculo)
        if (this.ascendedState === "IDLE") {
          this.isAttacking = false;
          this.alpha = 1.0;
  
          this.x += Math.sin(this.timer) * 0.2;
          this.y += Math.cos(this.timer) * 0.2;
  
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            let attacks = ["FLASH_WARN", "RUSH_WARN", "PRESSURE_WARN"];
            let next = attacks[Math.floor(Math.random() * attacks.length)];
            this.ascendedState = next;
  
            // Intervalos que aumentam o suspense, não apenas atiram aleatoriamente
            this.ascendedTimer = this.phase >= 2 ? 0.4 : 1.2;
  
            if (next === "RUSH_WARN" && p) {
              this.targetX = p.x;
              this.targetY = p.y;
            } else if (next === "PRESSURE_WARN" && p) {
              this.pressureZones = [];
              let zoneCount = this.phase >= 2 ? 5 : 2; 
              for (let i = 0; i < zoneCount; i++) {
                this.pressureZones.push({
                  x: Math.random() * GAME.w,
                  y: Math.random() * GAME.h,
                  t: 1.2,
                });
              }
            }
          }
        } else if (this.ascendedState === "SHOCKED") {
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            this.ascendedState = "IDLE";
            this.ascendedTimer = 0; 
          }
        }
        // ATAQUE 1: FLASH STEP (Teleporte Explosivo)
        else if (this.ascendedState === "FLASH_WARN") {
          this.alpha -= dt * 6; 
          if (this.alpha <= 0) {
            this.alpha = 0;
            if (p) {
              this.x = p.x;
              this.y = p.y - 100;
            } 
            this.ascendedState = "FLASH_STRIKE";
            this.ascendedTimer = 0.2; // Tempo de reação cinematográfico
            this.isAttacking = true;
            
            EFFECTS.explosion(this.x, this.y, '#0ff');
          }
        } else if (this.ascendedState === "FLASH_STRIKE") {
          this.alpha += dt * 15;
          if (this.alpha > 1) this.alpha = 1;
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            GAME.shake = 15;
            for (let i = 0; i < 16; i++) {
              let a = ((Math.PI * 2) / 16) * i;
              window.PROJ_POOL.get()?.spawn(
                this.x,
                this.y,
                Math.cos(a) * 35,
                Math.sin(a) * 35,
                false,
                "railgun",
                "#fff",
              );
            }
            if (this.phase >= 2) {
                for(let i=0; i<8; i++) {
                    let a = (Math.PI*2/8) * i + (Math.PI/8);
                    window.PROJ_POOL.get()?.spawn(this.x, this.y, Math.cos(a)*20, Math.sin(a)*20, false, 'plasma', '#0ff');
                }
            }
            this.ascendedState = "IDLE";
            this.ascendedTimer = this.phase >= 4 ? 0.2 : this.phase >= 2 ? 0.5 : 1.2;
          }
        }
        // ATAQUE 2: SONIC RUSH (Física Bruta e Colisão)
        else if (this.ascendedState === "RUSH_WARN") {
          this.ascendedTimer -= dt; 
          if (this.ascendedTimer <= 0) {
            this.ascendedState = "RUSH_STRIKE";
            this.ascendedTimer = 0.15; 
            this.isAttacking = true;
            this.rushStartX = this.x;
            this.rushStartY = this.y;
  
            let angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            this.targetX = this.x + Math.cos(angle) * 2500;
            this.targetY = this.y + Math.sin(angle) * 2500;
            
            EFFECTS.explosion(this.x, this.y, '#fff', true);
            GAME.shake = 20;
          }
        } else if (this.ascendedState === "RUSH_STRIKE") {
          this.ascendedTimer -= dt;
          this.x += (this.targetX - this.rushStartX) * dt * (1 / 0.15);
          this.y += (this.targetY - this.rushStartY) * dt * (1 / 0.15);
          
          if(Math.random() < 0.6) window.EFFECTS.pool.get()?.spawn(this.x, this.y, 0, 0, '#fff', 20, 5);
  
          if (
            p &&
            Math.hypot(p.x - this.x, p.y - this.y) < this.radius + p.radius + 15
          ) {
            p.takeDamage(35); 
          }
  
          if (this.ascendedTimer <= 0) {
            if (this.x < -200 || this.x > GAME.w+200 || this.y < -200 || this.y > GAME.h+200) {
              this.x = GAME.w / 2;
              this.y = 150; 
              EFFECTS.explosion(this.x, this.y, '#0ff');
            }
            GAME.shake = 15;
            this.ascendedState = "IDLE";
            this.ascendedTimer = this.phase >= 4 ? 0.2 : this.phase >= 2 ? 0.5 : 1.2;
          }
        }
        // ATAQUE 3: PRESSURE FIELD (Zonas Geométricas)
        else if (this.ascendedState === "PRESSURE_WARN") {
          this.ascendedTimer -= dt;
          this.pressureZones.forEach((z) => (z.t -= dt));
  
          if (this.pressureZones[0].t <= 0) {
            this.pressureZones.forEach((z) => {
              EFFECTS.explosion(z.x, z.y, "#f0f", true);
              if (p && Math.hypot(p.x - z.x, p.y - z.y) < 100) p.takeDamage(25);
            });
            GAME.shake = 30;
            this.ascendedState = "IDLE";
            this.ascendedTimer = this.phase >= 4 ? 0.2 : this.phase >= 2 ? 0.5 : 1.2;
          }
  
          if (this.phase >= 2 && Math.random() < 0.15) {
            window.PROJ_POOL.get()?.spawn(
              this.x,
              this.y,
              (Math.random() - 0.5) * 20,
              20,
              false,
              "plasma",
              "#fff",
            );
          }
        }
        // ATAQUE SUPREMO: EVENT HORIZON
        else if (this.ascendedState === "HORIZON_PREP") {
          this.x += (GAME.w / 2 - this.x) * dt * 2;
          this.y += (150 - this.y) * dt * 2;
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            this.ascendedState = "HORIZON_WARN";
            this.ascendedTimer = 1.5; 
  
            GAME.globalFilter = "brightness(0.1) contrast(1.5)";
  
            this.glimmers = [];
            for (let i = 0; i < 18; i++) {
              this.glimmers.push({
                x: GAME.w * 0.05 + Math.random() * GAME.w * 0.9,
                y: GAME.h * 0.1 + Math.random() * GAME.h * 0.8,
              });
            }
          }
        } else if (this.ascendedState === "HORIZON_WARN") {
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            this.ascendedState = "HORIZON_STRIKE";
            this.ascendedTimer = 1.0;
            GAME.globalFilter = "none"; 
            GAME.shake = 100;
            GAME.triggerFlash("#fff", 1.2);
  
            this.glimmers.forEach((g) => {
              for (let i = 0; i < 10; i++) {
                let a = ((Math.PI * 2) / 10) * i;
                window.PROJ_POOL.get()?.spawn(
                  g.x,
                  g.y,
                  Math.cos(a) * 40,
                  Math.sin(a) * 40,
                  false,
                  "bfg",
                  "#fff",
                );
              }
              if (p && Math.hypot(p.x - g.x, p.y - g.y) < 160) p.takeDamage(45); 
            });
          }
        } else if (this.ascendedState === "HORIZON_STRIKE") {
          this.ascendedTimer -= dt;
          if (this.ascendedTimer <= 0) {
            this.ascendedState = "IDLE";
            this.ascendedTimer = 1.0; 
            // Janela de oportunidade recompensadora após o golpe supremo
            this.counterActive = 1.2;
            UI.showTransmission("COUNTER WINDOW DETECTED.");
          }
        }
        return; 
      }
  
      // ==========================================
      //  COMPORTAMENTO DOS OUTROS CHEFES
      // ==========================================
      UI.updateBossHP(this.hp, this.maxHp); // Atualiza para outros chefes também
  
      this.attackTimer += dt;
      if (this.shieldTimer > 0) this.shieldTimer -= dt;
  
      this.mobTimer += dt;
      let mobDelay = this.type === "absolute_core" ? 2.5 : 4.0;
      if (this.mobTimer > mobDelay) {
        let e = window.ENEMY_POOL.get();
        if (e) e.spawn(Math.random() * GAME.w, -20, 100, "basic");
        this.mobTimer = 0;
      }

      // Atualização de fumaça e destroços para subsistemas avariados
      if (this.subsystems && this.subsystems.length > 0) {
        for (let i = 0; i < this.subsystems.length; i++) {
          let sub = this.subsystems[i];
          if (!sub.alive) {
            sub.smokeTimer = (sub.smokeTimer || 0) + dt;
            if (sub.smokeTimer > 0.15) {
              sub.smokeTimer = 0;
              let sx = this.x + sub.offsetX;
              let sy = this.y + sub.offsetY;
              if (window.EFFECTS && window.EFFECTS.pool) {
                window.EFFECTS.pool.get()?.spawn(
                  sx + (Math.random() - 0.5) * 10,
                  sy + (Math.random() - 0.5) * 10,
                  (Math.random() - 0.5) * 15,
                  -20,
                  '#444',
                  16,
                  3
                );
              }
            }
          }
        }
      }

      if (this.type === "gatekeeper") {
        if (this.attackTimer > 0.6) {
          let leftTurret = this.subsystems ? this.subsystems.find(s => s.id === 'turretLeft') : null;
          let rightTurret = this.subsystems ? this.subsystems.find(s => s.id === 'turretRight') : null;

          if (!leftTurret || leftTurret.alive) {
            let aimX = (p1 ? p1.x : this.x - 80) - (this.x - 80);
            let vx = Math.max(-8, Math.min(8, aimX * 0.02));
            window.PROJ_POOL.get()?.spawn(
              this.x - 80,
              this.y,
              vx,
              16,
              false,
              "railgun",
              this.color,
            );
          }
          if (!rightTurret || rightTurret.alive) {
            let aimX = (p2 ? p2.x : this.x + 80) - (this.x + 80);
            let vx = Math.max(-8, Math.min(8, aimX * 0.02));
            window.PROJ_POOL.get()?.spawn(
              this.x + 80,
              this.y,
              vx,
              16,
              false,
              "railgun",
              this.color,
            );
          }
          let targetP = Math.random() < 0.5 ? (p1 || p) : (p2 || p);
          let a = targetP ? Math.atan2(targetP.y - this.y, targetP.x - this.x) : Math.PI / 2;
          window.PROJ_POOL.get()?.spawn(
            this.x,
            this.y,
            Math.cos(a) * 9,
            Math.sin(a) * 9,
            false,
            "normal",
            "#ff0",
          );
          this.attackTimer = 0;
        }
      } else if (this.type === "leviathan") {
        let gravLeft = this.subsystems ? this.subsystems.find(s => s.id === 'gravLeft') : null;
        let gravRight = this.subsystems ? this.subsystems.find(s => s.id === 'gravRight') : null;
        let activePods = 0;
        if (this.subsystems && this.subsystems.length > 0) {
          if (gravLeft && gravLeft.alive) activePods++;
          if (gravRight && gravRight.alive) activePods++;
        } else {
          activePods = 2;
        }
        let gravFactor = activePods === 2 ? 0.4 : activePods === 1 ? 0.15 : 0;

        if (gravFactor > 0) {
          if (GAME.p1 && GAME.p1.active) {
            GAME.p1.x += (this.x - GAME.p1.x) * dt * gravFactor;
            GAME.p1.y += (this.y - GAME.p1.y) * dt * gravFactor;
          }
          if (GAME.p2 && GAME.p2.active) {
            GAME.p2.x += (this.x - GAME.p2.x) * dt * gravFactor;
            GAME.p2.y += (this.y - GAME.p2.y) * dt * gravFactor;
          }
        }
        if (this.attackTimer > 1.2) {
          for (let i = 0; i < 16; i++) {
            let angle = ((Math.PI * 2) / 16) * i + this.timer;
            window.PROJ_POOL.get()?.spawn(
              this.x,
              this.y,
              Math.cos(angle) * 6,
              Math.sin(angle) * 6,
              false,
              "normal",
              this.color,
            );
          }
          this.attackTimer = 0;
        }
      } else if (this.type === "absolute_core") {
        if (!this.coreTimer) this.coreTimer = 0;
        this.coreTimer += dt;
        if (this.vulnerableTimer > 0) this.vulnerableTimer -= dt;

        // Ciclo de vulnerabilidade do Núcleo: a cada 7 segundos, abre por 2 segundos
        if (this.coreTimer > 7.0) {
            this.vulnerableTimer = 2.0;
            this.coreTimer = 0;
            UI.showTransmission("CORE EXPOSED: FOGO CONCENTRADO!");
            EFFECTS.explosion(this.x, this.y, "#ff0", true);
        }

        if (this.attackTimer > 0.12) {
          let a = this.timer * 10;
          window.PROJ_POOL.get()?.spawn(
            this.x,
            this.y,
            Math.cos(a) * 12,
            Math.sin(a) * 12,
            false,
            "bfg",
            "#f00",
          );
          window.PROJ_POOL.get()?.spawn(
            this.x,
            this.y,
            Math.cos(a + Math.PI) * 12,
            Math.sin(a + Math.PI) * 12,
            false,
            "bfg",
            "#f00",
          );
          this.attackTimer = 0;
        }
      } else if (this.type === "observer_apex") {
        if (!this.apexTimer) this.apexTimer = 0;
        this.apexTimer += dt;
        if (this.vulnerableTimer > 0) this.vulnerableTimer -= dt;

        this.x = GAME.w / 2 + Math.sin(this.timer * 1.5) * 180;
        
        // Ciclo de sobrecarga do olho: vulnerabilidade
        if (this.apexTimer > 8.0) {
            this.vulnerableTimer = 2.0;
            this.apexTimer = 0;
            UI.showTransmission("APEX OVERLOAD: ATAQUE AGORA!");
            EFFECTS.explosion(this.x, this.y, "#0ff", true);
        }
        if (this.attackTimer > 0.7) {
            if (p) {
                let a = Math.atan2(p.y - this.y, p.x - this.x);
                window.PROJ_POOL.get()?.spawn(this.x - 20, this.y, Math.cos(a)*28, Math.sin(a)*28, false, "railgun", "#0ff");
                window.PROJ_POOL.get()?.spawn(this.x + 20, this.y, Math.cos(a)*28, Math.sin(a)*28, false, "railgun", "#0ff");
            }
            for (let i = 0; i < 8; i++) {
                let a = ((Math.PI * 2) / 8) * i + this.timer;
                window.PROJ_POOL.get()?.spawn(this.x, this.y, Math.cos(a)*14, Math.sin(a)*14, false, "plasma", "#f0f");
            }
            this.attackTimer = 0;
        }
      } else if (this.type === "dread_fleet") {
        if (!this.fleetTimer) this.fleetTimer = 0;
        this.fleetTimer += dt;
        this.attackTimer += dt;
        
        // Movimento tático de bombardeio
        this.x = GAME.w / 2 + Math.sin(this.timer * 0.8) * 140;

        let shieldCore = this.subsystems ? this.subsystems.find(s => s.id === 'shieldCore') : null;
        let portTurret = this.subsystems ? this.subsystems.find(s => s.id === 'turretPort') : null;
        let starTurret = this.subsystems ? this.subsystems.find(s => s.id === 'turretStarboard') : null;

        // Se o gerador de blindagem estiver vivo, ativa escudo no casco principal
        this.shieldTimer = (shieldCore && shieldCore.alive) ? 0.5 : 0;

        // Bateria de Bombordo: Linhas de Railgun mirando no flanco esquerdo / P1
        if ((!portTurret || portTurret.alive) && this.attackTimer > 1.3) {
          let targetLeft = p1 || p;
          let aimVx = targetLeft ? (targetLeft.x - (this.x - 110)) * 0.03 : -4;
          aimVx = Math.max(-10, Math.min(10, aimVx));
          window.PROJ_POOL.get()?.spawn(this.x - 110, this.y - 10, aimVx, 20, false, "railgun", "#ff3300");
          window.PROJ_POOL.get()?.spawn(this.x - 110, this.y - 10, aimVx + 3, 20, false, "railgun", "#ff3300");
        }

        // Bateria de Estibordo: Salvas de Mísseis de Plasma no flanco direito / P2
        if ((!starTurret || starTurret.alive) && this.attackTimer > 1.3) {
          let targetRight = p2 || p;
          for (let i = -2; i <= 2; i++) {
            let aimVx = targetRight ? (targetRight.x - (this.x + 110)) * 0.02 + i * 5 : i * 6;
            window.PROJ_POOL.get()?.spawn(this.x + 110, this.y - 10, aimVx, 15, false, "plasma", "#ffaa00");
          }
        }

        // Disparo do Canhão Principal da Nave Capitânia alternando entre os pilotos
        if (this.attackTimer > 1.3) {
          let mainTarget = Math.random() < 0.5 ? (p1 || p) : (p2 || p);
          if (mainTarget) {
            let angle = Math.atan2(mainTarget.y - this.y, mainTarget.x - this.x);
            window.PROJ_POOL.get()?.spawn(this.x, this.y + 40, Math.cos(angle) * 18, Math.sin(angle) * 18, false, "bfg", "#ff6600");
          }
          this.attackTimer = 0;
        }

        // Fase 2 da Frota (<50% HP): Esquadrilha de caças interceptadores
        if (this.hp < this.maxHp * 0.5 && !this.p50) {
          this.p50 = true;
          GAME.shake = 35;
          GAME.triggerFlash("#ff6600", 0.5);
          UI.showTransmission("DREAD FLEET: ESQUADRÃO DE ESCOLTA LANÇADO!");
          let e1 = window.ENEMY_POOL.get();
          if (e1) e1.spawn(this.x - 140, this.y, 400 * GAME.diff, "hunter");
          let e2 = window.ENEMY_POOL.get();
          if (e2) e2.spawn(this.x + 140, this.y, 400 * GAME.diff, "hunter");
        }
      } else if (this.type === "blackout_signal") {
        if (!this.signalTimer) this.signalTimer = 0;
        this.signalTimer += dt;
        this.attackTimer += dt;
        if (this.vulnerableTimer > 0) this.vulnerableTimer -= dt;

        // Vôo irregular e micro-saltos de teleporte quântico
        this.x = GAME.w / 2 + Math.sin(this.timer * 2.2) * 160 + Math.cos(this.timer * 3.7) * 40;
        this.y = 140 + Math.sin(this.timer * 1.8) * 45;

        // Micro-salto a cada 5 segundos
        if (this.signalTimer > 5.0) {
          this.signalTimer = 0;
          this.vulnerableTimer = 2.0; // Abre janela de vulnerabilidade pós-salto
          EFFECTS.triggerGlitch();
          GAME.triggerFlash("#bf00ff", 0.4);
          GAME.shake = 20;
          UI.showTransmission("SINAL DESTABILIZADO: VULNERABILIDADE ABERTA!");
          this.x = Math.max(100, Math.min(GAME.w - 100, GAME.w * (0.2 + Math.random() * 0.6)));
        }

        // Disparo de vetores de distorção cósmica
        if (this.attackTimer > 0.8) {
          for (let i = 0; i < 12; i++) {
            let a = ((Math.PI * 2) / 12) * i + this.timer * 2;
            window.PROJ_POOL.get()?.spawn(this.x, this.y, Math.cos(a) * 14, Math.sin(a) * 14, false, "plasma", "#bf00ff");
          }
          if (p) {
            let a = Math.atan2(p.y - this.y, p.x - this.x);
            window.PROJ_POOL.get()?.spawn(this.x, this.y, Math.cos(a) * 26, Math.sin(a) * 26, false, "railgun", "#ffffff");
          }
          this.attackTimer = 0;
        }
      }
  
      if (this.hp <= 0 && this.type !== "ascended") {
        this.active = false;
        SAVE.data.stats.bossesDefeated++;
        window.PROJ_POOL.clear();
        window.ENEMY_POOL.clear();
        UI.toggleBossUI(false);
  
        let p1 = GAME.p1 && GAME.p1.active;
        let p2 = GAME.p2 && GAME.p2.active;
        if (p1) {
          if (Array.isArray(SAVE.data.credits)) SAVE.data.credits[0] += 5000;
          else SAVE.data.credits += 5000;
        }
        if (p2) {
          if (Array.isArray(SAVE.data.credits)) SAVE.data.credits[1] += 5000;
        }
        UI.updateCredits();
  
        GAME.timeScale = 0.01;
        GAME.slowMoTimer = 3.0;
        GAME.shake = 100;
        for (let i = 0; i < 100; i++)
          EFFECTS.explosion(
            this.x + (Math.random() - 0.5) * 200,
            this.y + (Math.random() - 0.5) * 200,
            "#fff",
          );
  
        if (typeof QUICKRUN !== 'undefined' && QUICKRUN.active) {
          setTimeout(() => {
            QUICKRUN.advanceEncounter();
          }, 2500);
        } else if (typeof BLACKOUT !== 'undefined' && BLACKOUT.active) {
          setTimeout(() => {
            BLACKOUT.advanceDepth();
          }, 2500);
        } else if (typeof BOSSRUSH !== 'undefined' && BOSSRUSH.active) {
          setTimeout(() => {
            BOSSRUSH.onBossDefeated();
          }, 2500);
        } else if (this.type === "absolute_core") {
          setTimeout(() => {
            UI.triggerFinalSequence();
          }, 4000);
        } else {
          setTimeout(() => {
            SANCTUARY.startDocking();
          }, 3000);
        }
      }
    },
  
    draw(ctx) {
      if (!this.active) return;
      if (typeof window !== 'undefined' && window.RENDERER2D && this.type !== 'ascended') {
        window.RENDERER2D.drawBossEncounter(ctx, this);
        return;
      }
  
      // EFEITOS VISUAIS DE TELEMETRIA: THE ASCENDED
      if (this.type === "ascended") {
        ctx.save();
        ctx.globalAlpha = this.alpha !== undefined ? this.alpha : 1.0;
  
        // Brilho extremo da Janela de Counter (A recompensa do jogador)
        if (this.counterActive > 0) {
          ctx.shadowBlur = 50;
          ctx.shadowColor = "#0ff";
        }
  
        // A Linha da Morte do Sonic Rush
        if (this.ascendedState === "RUSH_WARN") {
          ctx.setLineDash([10, 15]);
          ctx.lineDashOffset = -GAME.time * 80;
          ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          let angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
          ctx.lineTo(
            this.x + Math.cos(angle) * 2000,
            this.y + Math.sin(angle) * 2000,
          );
          ctx.stroke();
          ctx.setLineDash([]);
        }
  
        // O Campo de Pressão (Zonas geométricas)
        if (this.ascendedState === "PRESSURE_WARN" && this.pressureZones) {
          this.pressureZones.forEach((z) => {
            ctx.strokeStyle = `rgba(255, 0, 255, ${1 - z.t / 1.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(z.x, z.y, 100, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(255, 0, 255, 0.08)`;
            ctx.fill();
          });
        }
  
        // Os pequenos Glimmers do Event Horizon
        if (this.ascendedState === "HORIZON_WARN" && this.glimmers) {
          ctx.fillStyle = "#fff";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#fff";
          this.glimmers.forEach((g) => {
            ctx.beginPath();
            ctx.arc(g.x, g.y, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.shadowBlur = 0;
        }
  
        // Rastro fantasma do impacto corporal
        if (this.ascendedState === "RUSH_STRIKE" && this.rushStartX) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.beginPath();
          ctx.arc(this.rushStartX, this.rushStartY, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }
  
        // O Corpo minimalista do Chefe Final
        ctx.fillStyle = this.counterActive > 0 ? "#0ff" : "#fff";
        ctx.beginPath();
        // Só oscila quando parado. Se ataca, vira um ponto fixo e violento.
        let osc =
          this.ascendedState === "IDLE" ? Math.sin(this.timer * 3) * 2 : 0;
        ctx.arc(this.x, this.y, this.radius + osc, 0, Math.PI * 2);
        ctx.fill();
  
        ctx.restore();
        return;
      }
  
      // DESENHO DOS OUTROS CHEFES
      if (this.state === "INTRO") {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 20 + Math.sin(this.timer * 20) * 10,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
  
      if (this.shieldTimer > 0) {
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 30 + Math.sin(GAME.time * 20) * 5,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
  
      ctx.fillStyle = this.color;
  
      if (this.type === "gatekeeper") {
        ctx.fillRect(this.x - 30, this.y - 30, 60, 60);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(
          this.x - 35 + Math.sin(this.timer * 10) * 5,
          this.y - 35,
          70,
          70,
        );
      } else if (this.type === "leviathan") {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 30,
          this.timer,
          this.timer + Math.PI,
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 15,
          -this.timer * 2,
          -this.timer * 2 + Math.PI,
        );
        ctx.stroke();
      } else if (this.type === "absolute_core") {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius / 4 + Math.sin(this.timer * 20) * 8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (this.type === "observer_apex") {
        ctx.save();
        ctx.fillStyle = this.vulnerableTimer > 0 ? "#ff0" : this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        // Anel orbital de observação
        ctx.strokeStyle = "#f0f";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 18 + Math.sin(this.timer * 6) * 4, 0, Math.PI * 2);
        ctx.stroke();
        // Pupila central cósmica
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
  };