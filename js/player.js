class Player {
    constructor(cls, isPlayer2 = false) {
        this.active = true; this.isP2 = isPlayer2; this.cls = cls;
        this.state = 'ALIVE'; // ALIVE, DOWN
        this.downTimer = 0;
        this.reviveProgress = 0;
        
        this.recoilY = 0;
        this.hoverTimer = Math.random() * 100;
        this.tilt = 0;

        let screenW = GAME.w || window.innerWidth;
        let screenH = GAME.h || window.innerHeight;
        
        this.x = screenW / (isPlayer2 ? 1.5 : 3); 
        this.y = screenH * 0.8; 
        this.vx = 0; this.vy = 0;
        
        this.radius = 8; this.cooldown = 0; this.dashCooldown = 0; this.iFrames = 0; 
        this.rotation = -Math.PI/2; 
        
        this.special = 0; this.specialActive = 0; this.parryWindow = 0; 
        this.trail = []; this.extraShots = 0; this.shotFlip = 1; this.comboSpecialWindow = 0;
        
        this.orbDash = 0; this.orbWeapon = 0; this.orbOverdrive = 0; this.orbParity = 0;
        
        this.color = this.isP2 ? '#ffaa00' : '#00e5ff'; // P1: Ciano Tático | P2: Âmbar/Dourado Tático
        this.maxHp = 100; this.hp = 100; this.shieldTimer = 0;
        this.lastParryHealTime = 0;

        this.applyUpgrades(true); 
    }

    applyUpgrades(isInit = false) {
        const classStats = {
            assault: { hp: 110, spd: 460, dmg: 12, firerate: 0.12, type: 'normal', critChance: 0.05, critMult: 1.5 },
            scout:   { hp: 80,  spd: 600, dmg: 8,  firerate: 0.085, type: 'plasma', critChance: 0.15, critMult: 1.6 },
            tank:    { hp: 175, spd: 360, dmg: 8,  firerate: 0.45, type: 'shotgun', critChance: 0.05, critMult: 1.5 },
            ranger:  { hp: 95,  spd: 440, dmg: 38, firerate: 0.55, type: 'railgun', critChance: 0.20, critMult: 1.8 }
        };
        let base = classStats[this.cls] || classStats.assault;
        let pSkills = Array.isArray(SAVE.data.skills) ? SAVE.data.skills[this.isP2 ? 1 : 0] : SAVE.data.skills;
        if (!pSkills) pSkills = { damage: 0, mobility: 0, defense: 0, specialty: 0 }; 

        let dmgLvl = pSkills.damage || 0; let spdLvl = pSkills.mobility || 0; let defLvl = pSkills.defense || 0;
        this.specialtyLvl = pSkills.specialty || 0;

        let oldMaxHp = this.maxHp;
        // Bônus gradual de dano: +18% de dano base por nível
        let upgradedDmg = base.dmg + (dmgLvl * Math.round(base.dmg * 0.18));
        // Teto seguro de cadência: no máximo 30% de redução no intervalo de tiro (evita spam de projéteis e queda de FPS)
        let upgradedFirerate = Math.max(base.firerate * 0.70, base.firerate * Math.pow(0.965, dmgLvl));
        // Defesa: Vida máxima moderada (+20 por nível) + Redução de dano percentual (3.5% por nível, cap 35%)
        let upgradedHp = base.hp + (defLvl * 20);
        let dmgReduction = Math.min(0.35, defLvl * 0.035);
        // Crítico por classe + melhorias de especialidade
        let critChance = base.critChance + (this.specialtyLvl * 0.02);
        let critMult = base.critMult + (this.specialtyLvl * 0.05);

        this.stats = { 
            hp: upgradedHp, 
            spd: base.spd + (spdLvl * 25), 
            dmg: upgradedDmg, 
            firerate: upgradedFirerate, 
            dmgReduction: dmgReduction,
            critChance: critChance,
            critMult: critMult,
            type: base.type 
        }; 
        this.maxHp = this.stats.hp;
        
        // Cooldown de Dash com piso seguro para impedir invulnerabilidade permanente
        let minDashCd = this.cls === 'scout' ? 0.45 : (this.cls === 'tank' ? 0.80 : 0.60);
        let baseDashCd = this.cls === 'scout' ? 0.90 : (this.cls === 'tank' ? 1.40 : 1.20);
        this.dashCdBase = Math.max(minDashCd, baseDashCd - (spdLvl * 0.06));

        if (isInit) { this.hp = this.maxHp; this.shieldTimer = defLvl * 1.5; } 
        else { if (this.maxHp > oldMaxHp) this.hp += (this.maxHp - oldMaxHp); }
        
        UI.updateHP(this.hp, this.maxHp, this.isP2);
    }

    fireProjectile(x, y, vx, vy, type, color, damageMult = 1) {
        let proj = window.PROJ_POOL?.get();
        let cc = this.stats ? this.stats.critChance : 0.05;
        let cm = this.stats ? this.stats.critMult : 1.5;
        if(proj) proj.spawn(x, y, vx, vy, true, type, color, this.isP2 ? 1 : 0, damageMult, cc, cm);
    }

    radialBurst(count, type, color, speed, damageMult = 1) {
        for(let i = 0; i < count; i++) {
            let a = (Math.PI * 2 / count) * i;
            this.fireProjectile(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, type, color, damageMult);
        }
    }

    activateSpecial() {
        let lvl = this.specialtyLvl || 0;
        this.special = 0;
        this.comboSpecialWindow = 0.75;
        UI.updateSpecial(this.special, this.isP2);

        // Efeito global de "Parada de Tempo" Dramática
        GAME.timeScale = 0.15; 
        GAME.slowMoTimer = 0.6;
        GAME.triggerFlash(this.color, 0.7);
        GAME.shake = 45;

        if(this.cls === 'assault') {
            this.specialActive = 5.0 + lvl * 0.35;
            this.cooldown = 0;
            UI.showTransmission("ASSAULT OVERDRIVE: CADÊNCIA MÁXIMA.");
        } else if(this.cls === 'scout') {
            this.specialActive = 3.2 + lvl * 0.3;
            this.iFrames = Math.max(this.iFrames, 1.2 + lvl * 0.15);
            this.orbDash = Math.max(this.orbDash, 2.5 + lvl * 0.4);
            // Explosão radial mais densa
            this.radialBurst(16 + lvl * 2, 'plasma', '#0ff', 25, 0.8);
            UI.showTransmission("SCOUT PHASE NOVA: DESVIO ABSOLUTO.");
        } else if(this.cls === 'tank') {
            this.specialActive = 5.5 + lvl * 0.45;
            this.shieldTimer = Math.max(this.shieldTimer, 4.0 + lvl * 0.6);
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.20);
            UI.updateHP(this.hp, this.maxHp, this.isP2);
            this.radialBurst(24 + lvl * 2, 'shotgun', '#0f0', 18, 0.75);
            UI.showTransmission("TANK FORTRESS: BARREIRA IMPENETRÁVEL.");
        } else if(this.cls === 'ranger') {
            this.specialActive = 3.8 + lvl * 0.25;
            this.cooldown = 0;
            // Ranger ganha um Time-Stop mais longo para obliterar tudo
            GAME.timeScale = 0.05; 
            GAME.slowMoTimer = 0.9 + lvl * 0.1;
            for(let i = -3; i <= 3; i++) {
                this.fireProjectile(this.x + i * 15, this.y - 15, 0, -75, 'bfg', '#f0f', 2.0);
            }
            UI.showTransmission("RANGER DEAD EYE: DESTRUIÇÃO TOTAL.");
        }
    }

    fireWeapon(isSpec, isGod, tipX, tipY, projColor) {
        let lvl = isGod ? 5 : this.specialtyLvl;
        let extra = Math.min(3, this.extraShots || 0);
        let baseAngle = -Math.PI / 2;
        this.shotFlip *= -1;

        if (this.orbWeapon > 0) {
            this.cooldown = 0.12;
            this.fireProjectile(tipX, tipY, 0, -45, 'bfg', '#ff0', 1.4);
            return;
        }

        if(this.cls === 'assault') {
            this.cooldown = isSpec ? Math.max(0.045, this.stats.firerate * 0.42) : this.stats.firerate;
            let lanes = isSpec ? 3 + Math.min(4, lvl) : 1 + extra * 2;
            let half = Math.floor(lanes / 2);
            for(let i = -half; i <= half; i++) {
                this.fireProjectile(tipX, tipY, Math.cos(baseAngle + i * 0.075) * 38, Math.sin(baseAngle + i * 0.075) * 38, 'normal', projColor, i === 0 ? 1 : 0.72);
            }
        } else if(this.cls === 'scout') {
            this.cooldown = isSpec ? 0.055 : this.stats.firerate;
            let bolts = isSpec ? 3 + Math.min(3, lvl) : 1 + Math.min(1, extra);
            for(let i = 0; i < bolts; i++) {
                let offset = (i - (bolts - 1) / 2) * 0.11 + this.shotFlip * 0.035;
                this.fireProjectile(tipX, tipY, Math.cos(baseAngle + offset) * 34, Math.sin(baseAngle + offset) * 34, 'plasma', projColor, isSpec ? 0.62 : 0.82);
            }
        } else if(this.cls === 'tank') {
            this.cooldown = isSpec ? Math.max(0.2, this.stats.firerate * 0.48) : this.stats.firerate;
            let pellets = (isSpec ? 9 + lvl : 5) + extra * 2;
            let spread = isSpec ? 0.62 : 0.42;
            for(let i = 0; i < pellets; i++) {
                let t = pellets === 1 ? 0 : (i / (pellets - 1)) - 0.5;
                let angle = baseAngle + t * spread;
                this.fireProjectile(tipX, tipY, Math.cos(angle) * 27, Math.sin(angle) * 27, 'shotgun', projColor, isSpec ? 0.45 : 0.5);
            }
            if(isSpec) this.shieldTimer = Math.max(this.shieldTimer, 0.7 + lvl * 0.12);
        } else if(this.cls === 'ranger') {
            this.cooldown = isSpec ? Math.max(0.22, this.stats.firerate * 0.48) : this.stats.firerate;
            let rails = isSpec ? 1 + Math.floor((lvl + 1) / 2) : 1 + Math.min(1, extra);
            for(let i = 0; i < rails; i++) {
                let offset = (i - (rails - 1) / 2) * 11;
                let type = isSpec && lvl >= 4 && i === Math.floor(rails / 2) ? 'bfg' : 'railgun';
                let speed = type === 'bfg' ? 32 : 58;
                this.fireProjectile(tipX + offset, tipY, 0, -speed, type, projColor, type === 'bfg' ? 1.8 : 1.35);
            }
        }
    }
    
    update(dt) {
        if(!this.active || this.state === 'DEAD') return;

        if (this.state === 'DOWN') {
            this.downTimer -= dt;
            
            let partner = this.isP2 ? GAME.p1 : GAME.p2;
            if (partner && partner.active && partner.state === 'ALIVE') {
                let dist = Math.hypot(this.x - partner.x, this.y - partner.y);
                if (dist < 85) {
                    this.reviveProgress += dt;
                    if (Math.random() < 0.4) EFFECTS.explosion(this.x + (Math.random()-0.5)*20, this.y, this.color);
                    if (this.reviveProgress > 1.5) {
                        this.state = 'ALIVE';
                        this.hp = Math.round(this.maxHp * 0.5);
                        this.iFrames = 2.5;
                        this.shieldTimer = 3.0;
                        this.reviveProgress = 0;
                        this.downTimer = 0;
                        UI.updateHP(this.hp, this.maxHp, this.isP2);
                        GAME.triggerFlash('#00ffff', 0.5);
                        EFFECTS.explosion(this.x, this.y, '#00ffff', true);
                        UI.showTransmission((this.isP2 ? "PILOTO 2 " : "PILOTO 1 ") + "REATIVADO! SISTEMAS ONLINE!");
                    }
                } else {
                    this.reviveProgress = Math.max(0, this.reviveProgress - dt * 1.5);
                }
            }

            if (this.downTimer <= 0) {
                this.state = 'DEAD';
                this.active = false;
                if (typeof GAME.areAllPlayersDefeated === 'function' && GAME.areAllPlayersDefeated()) {
                    UI.showGameOver();
                } else {
                    UI.showTransmission((this.isP2 ? "PILOTO 2 " : "PILOTO 1 ") + "EM ESTASE. CONCLUA O SETOR PARA RESGATE!");
                }
            }
            return;
        }

        this.hoverTimer += dt * 7;
        this.recoilY -= this.recoilY * dt * 16;

        if(this.orbDash > 0) this.orbDash -= dt;
        if(this.orbWeapon > 0) this.orbWeapon -= dt;
        if(this.orbOverdrive > 0) this.orbOverdrive -= dt;
        if(this.orbParity > 0) this.orbParity -= dt;

        let isGod = this.orbOverdrive > 0;

        if(GAME.timeScale > 0.08) {
            this.trail.unshift({x: this.x, y: this.y, rot: this.rotation, t: 1.0});
            if(this.trail.length > (this.specialActive > 0 || this.dashCooldown > (this.dashCdBase*0.75) || isGod ? 12 : 3)) this.trail.pop();
        }

        if(GAME.inputLocked) return;
        
        if(this.shieldTimer > 0) this.shieldTimer -= dt;
        if(this.special < 100) {
            this.special += dt * (isGod ? 45 : (5 + this.specialtyLvl * 2.5)); 
            if(this.special > 100) this.special = 100;
            UI.updateSpecial(this.special, this.isP2);
        }
        if(this.specialActive > 0) this.specialActive -= dt;
        if(this.comboSpecialWindow > 0) this.comboSpecialWindow -= dt;

        let ax = 0, ay = 0;
        let up = false, down = false, left = false, right = false;
        let dash = false, shoot = false, specBtn = false, synBtn = false;

        if (this.isP2) {
            up = !!INPUT.keys['ArrowUp'];
            down = !!INPUT.keys['ArrowDown'];
            left = !!INPUT.keys['ArrowLeft'];
            right = !!INPUT.keys['ArrowRight'];
            dash = !!(INPUT.keys['ShiftRight'] || INPUT.keys['NumpadDecimal'] || INPUT.keys['ControlRight']);
            shoot = !!(INPUT.keys['Enter'] || INPUT.keys['Numpad0']);
            specBtn = !!(INPUT.keys['KeyL'] || INPUT.keys['Numpad1']);
            synBtn = !!(INPUT.keys['KeyK'] || INPUT.keys['Numpad2'] || INPUT.keys['KeyM']);

            if (typeof INPUT !== 'undefined' && INPUT.touchJoyP2 && (INPUT.touchJoyP2.dx !== 0 || INPUT.touchJoyP2.dy !== 0)) {
                ax = INPUT.touchJoyP2.dx;
                ay = INPUT.touchJoyP2.dy;
            }
            if (typeof INPUT !== 'undefined' && INPUT.touchButtonsP2) {
                if (INPUT.touchButtonsP2.dash) dash = true;
                if (INPUT.touchButtonsP2.shoot || (typeof SAVE !== 'undefined' && SAVE.data?.settings?.autoFire)) shoot = true;
                if (INPUT.touchButtonsP2.special) specBtn = true;
                if (INPUT.touchButtonsP2.synergy) synBtn = true;
            }
            if (typeof INPUT !== 'undefined' && typeof INPUT.getGamepadState === 'function') {
                let gp = INPUT.getGamepadState(1);
                if (gp) {
                    if (gp.dx !== 0 || gp.dy !== 0) { ax = gp.dx; ay = gp.dy; }
                    if (gp.dash) dash = true;
                    if (gp.shoot) shoot = true;
                    if (gp.special) specBtn = true;
                    if (gp.synergy) synBtn = true;
                }
            }
        } else {
            up = !!(INPUT.keys['KeyW'] || (!GAME.isCoop && INPUT.keys['ArrowUp']));
            down = !!(INPUT.keys['KeyS'] || (!GAME.isCoop && INPUT.keys['ArrowDown']));
            left = !!(INPUT.keys['KeyA'] || (!GAME.isCoop && INPUT.keys['ArrowLeft']));
            right = !!(INPUT.keys['KeyD'] || (!GAME.isCoop && INPUT.keys['ArrowRight']));
            dash = !!(INPUT.keys['ShiftLeft'] || (!GAME.isCoop && INPUT.keys['ShiftRight']));
            shoot = !!(INPUT.keys['Space'] || (!GAME.isCoop && INPUT.keys['Enter']));
            specBtn = !!(INPUT.keys['KeyC'] || (!GAME.isCoop && INPUT.keys['KeyL']));
            synBtn = !!(INPUT.keys['KeyX'] || (!GAME.isCoop && INPUT.keys['KeyK']));

            let joy = (GAME.isCoop && INPUT.touchJoyP1) ? INPUT.touchJoyP1 : INPUT.touchJoy;
            if (typeof INPUT !== 'undefined' && joy && (joy.dx !== 0 || joy.dy !== 0)) {
                ax = joy.dx;
                ay = joy.dy;
            }
            let btns = (GAME.isCoop && INPUT.touchButtonsP1) ? INPUT.touchButtonsP1 : INPUT.touchButtons;
            if (typeof INPUT !== 'undefined' && btns) {
                if (btns.dash) dash = true;
                if (btns.shoot || (typeof SAVE !== 'undefined' && SAVE.data?.settings?.autoFire)) shoot = true;
                if (btns.special) specBtn = true;
                if (btns.synergy) synBtn = true;
            }
            if (typeof INPUT !== 'undefined' && typeof INPUT.getGamepadState === 'function') {
                let gp = INPUT.getGamepadState(0);
                if (gp) {
                    if (gp.dx !== 0 || gp.dy !== 0) { ax = gp.dx; ay = gp.dy; }
                    if (gp.dash) dash = true;
                    if (gp.shoot) shoot = true;
                    if (gp.special) specBtn = true;
                    if (gp.synergy) synBtn = true;
                }
            }
        }

        if (ax === 0 && ay === 0) {
            if(up) ay -= 1; if(down) ay += 1;
            if(left) ax -= 1; if(right) ax += 1;
            if (ax !== 0 && ay !== 0) { let len = Math.hypot(ax, ay); ax /= len; ay /= len; }
        }
        
        this.tilt += (ax * 0.4 - this.tilt) * dt * 12;

        if(dash && this.dashCooldown <= 0) {
            let dashAx = ax;
            let dashAy = ay;
            if (dashAx === 0 && dashAy === 0) {
                dashAy = -1; // Dash e Parry para frente por padrão se a nave estiver parada
            }
            // Dash firme que corta a tela e preserva o momento
            this.vx += dashAx * 2500; this.vy += dashAy * 2500; 
            this.dashCooldown = this.orbDash > 0 ? 0.25 : this.dashCdBase; 
            this.iFrames = 0.25; this.parryWindow = 0.20; 
            GAME.shake = 12; 
            
            let partner = this.isP2 ? GAME.p1 : GAME.p2;
            if (partner && partner.dashCooldown > (partner.dashCdBase * 0.75)) {
                if(GAME.evaluateLinkMoment) GAME.evaluateLinkMoment(this, partner);
            }
        }

        if(specBtn && this.special >= 100) {
            this.activateSpecial();
            EFFECTS.explosion(this.x, this.y, '#f0f'); 
            
            let partner = this.isP2 ? GAME.p1 : GAME.p2;
            if (partner && partner.comboSpecialWindow > 0) {
                if(GAME.triggerCombinedSpecial) {
                    GAME.triggerCombinedSpecial(this, partner);
                    this.comboSpecialWindow = 0;
                    partner.comboSpecialWindow = 0;
                }
            }
        }

        if (synBtn) {
            let partner = this.isP2 ? GAME.p1 : GAME.p2;
            if (GAME.isCoop && partner && partner.active && partner.state === 'ALIVE') {
                if (this.special >= 80 || partner.special >= 80 || GAME.linkStateTimer > 0) {
                    this.special = Math.max(0, this.special - 80);
                    partner.special = Math.max(0, partner.special - 80);
                    UI.updateSpecial(this.special, this.isP2);
                    UI.updateSpecial(partner.special, partner.isP2);
                    if (GAME.triggerCombinedSpecial) {
                        GAME.triggerCombinedSpecial(this, partner);
                    }
                }
            } else if (!GAME.isCoop && !this.isP2 && this.special >= 100) {
                this.special = 0;
                UI.updateSpecial(this.special, this.isP2);
                let allyClass = this.cls === 'assault' ? 'scout' : (this.cls === 'scout' ? 'tank' : (this.cls === 'tank' ? 'ranger' : 'assault'));
                let dummyAlly = { cls: allyClass, x: this.x + 70, y: this.y + 30, active: true, state: 'ALIVE' };
                if (GAME.triggerCombinedSpecial) {
                    GAME.triggerCombinedSpecial(this, dummyAlly);
                    UI.showTransmission(`SUPORTE DE ALA CONVOCADO: ${allyClass.toUpperCase()} EXECUTOU SINERGIA!`);
                }
            }
        }
        
        let spdMult = isGod ? 1.7 : (GAME.linkStateTimer > 0 ? 1.5 : 1.0);
        let maxSpd = this.stats.spd * spdMult;
        
        // FÍSICA CORRIGIDA: Aceleração linear balanceada
        let accel = 14; 
        this.vx += ax * maxSpd * dt * accel; 
        this.vy += ay * maxSpd * dt * accel; 
        
        // Atrito inteligente: Freia a nave em 0.1s ao soltar o controle, 
        // mas desliza suavemente enquanto você pilota.
        let isMoving = (ax !== 0 || ay !== 0);
        let frictionMult = isMoving ? 0.82 : 0.60; 
        let friction = Math.pow(frictionMult, dt * 60); 
        this.vx *= friction; 
        this.vy *= friction; 
        
        this.x += this.vx * dt; this.y += this.vy * dt;

        this.x = Math.max(15, Math.min(GAME.w - 15, this.x));
        this.y = Math.max(15, Math.min(GAME.h - 15, this.y));

        if(this.dashCooldown > 0) this.dashCooldown -= dt;
        if(this.iFrames > 0) this.iFrames -= dt;
        if(this.parryWindow > 0) this.parryWindow -= dt;
        if(this.cooldown > 0) this.cooldown -= dt;
        
        if(shoot && this.cooldown <= 0) {
            this.recoilY = this.stats.type === 'railgun' || this.stats.type === 'shotgun' ? 7 : 3;
            let isSpec = this.specialActive > 0 || isGod; 
            let tipX = this.x + Math.cos(this.rotation) * 15;
            let tipY = this.y + Math.sin(this.rotation) * 15;
            let projColor = isSpec ? '#f0f' : this.color; 

            this.fireWeapon(isSpec, isGod, tipX, tipY, projColor);
        }
    }
    
    takeDamage(amt) { 
        if(this.state === 'DOWN' || this.shieldTimer > 0 || this.iFrames > 0) return;
        GAME.combo = 0;
        
        // Redução proporcional de dano pela defesa (até 35% de redução)
        let reduction = (this.stats && this.stats.dmgReduction) ? this.stats.dmgReduction : 0;
        let finalAmt = Math.max(1, Math.round(amt * (1 - reduction)));
        
        this.hp -= finalAmt;
        if (typeof QUICKRUN !== 'undefined' && QUICKRUN.active) {
            QUICKRUN.damageTaken = (QUICKRUN.damageTaken || 0) + finalAmt;
        }
        if (typeof BLACKOUT !== 'undefined' && BLACKOUT.active) {
            BLACKOUT.damageTaken = (BLACKOUT.damageTaken || 0) + finalAmt;
        }
        this.iFrames = 1.0;
        GAME.shake = 18;
        if (typeof navigator !== 'undefined' && navigator.vibrate && typeof SAVE !== 'undefined' && SAVE.data?.settings?.haptics) {
            navigator.vibrate(35);
        }
        UI.updateHP(this.hp, this.maxHp, this.isP2);

        if(this.hp <= 0) {
            this.hp = 0;
            let partner = this.isP2 ? GAME.p1 : GAME.p2;
            if (GAME.isCoop && partner && partner.active && partner.state === 'ALIVE') { 
                this.state = 'DOWN';
                this.downTimer = 15.0; 
                this.reviveProgress = 0;
                UI.showTransmission(this.cls.toUpperCase() + (this.isP2 ? " [P2] IMPEDIDO. SOLICITANDO REPAROS!" : " [P1] SINAL FRACO. ME REVIVE!"));
            } else {
                this.state = 'DEAD';
                this.active = false;
                if (partner && partner.state === 'DOWN') {
                    partner.state = 'DEAD';
                    partner.active = false;
                }
                UI.showGameOver();
            }
        }
    }
    
    draw(ctx) {
        let vY = this.y + Math.sin(this.hoverTimer) * 2.5 + this.recoilY;

        this.trail.forEach(t => {
            t.t -= 0.12; if(t.t <= 0) return;
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot + Math.PI/2);
            ctx.fillStyle = this.state === 'DOWN' ? 'rgba(80,80,80,0.2)' : `rgba(${this.isP2 ? '255,170,0' : '0,229,255'}, ${t.t*0.4})`;
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-9, 9); ctx.lineTo(9, 9); ctx.fill(); ctx.restore();
        });

        if (this.state === 'DOWN') {
            ctx.save(); ctx.translate(this.x, vY); ctx.rotate(this.rotation + Math.PI/2);
            let pulse = (Math.sin(GAME.time * 6) + 1) * 0.5;
            ctx.strokeStyle = `rgba(255, 0, 85, ${0.4 + pulse * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 24 + pulse * 8, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = '#444'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-9, 9); ctx.lineTo(9, 9); ctx.fill();
            if (this.reviveProgress > 0) {
                ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4; ctx.beginPath();
                ctx.arc(0, 0, 18, -Math.PI/2, (-Math.PI/2) + (this.reviveProgress / 1.5) * Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
            if (Math.floor(GAME.time * 8) % 2 === 0) {
                ctx.fillStyle = '#ff0055'; ctx.font = "bold 13px Courier New"; ctx.textAlign = "center";
                ctx.fillText(`SOS [${this.isP2 ? 'P2' : 'P1'}] ${Math.ceil(this.downTimer)}s`, this.x, vY - 26);
            }
            return;
        }

        if(this.iFrames > 0 && Math.floor(GAME.time*24)%2===0) return;

        // Floating Pilot Marker
        ctx.save();
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = this.isP2 ? '#ffaa00' : '#00e5ff';
        ctx.fillText(this.isP2 ? "P2" : "P1", this.x, vY - 18);
        ctx.restore();
        
        if (typeof window !== 'undefined' && window.RENDERER2D) {
            if (this.cls === 'assault') { window.RENDERER2D.drawAssaultShip(ctx, this, vY); return; }
            if (this.cls === 'scout')   { window.RENDERER2D.drawScoutShip(ctx, this, vY); return; }
            if (this.cls === 'tank')    { window.RENDERER2D.drawTankShip(ctx, this, vY); return; }
            if (this.cls === 'ranger')  { window.RENDERER2D.drawRangerShip(ctx, this, vY); return; }
        }

        ctx.save(); ctx.translate(this.x, vY); ctx.rotate(this.rotation + Math.PI/2 + this.tilt);
        
        let fSize = (INPUT.keys['KeyW'] || INPUT.keys['ArrowUp']) ? 28 : 12;
        if (this.dashCooldown > this.dashCdBase * 0.7) fSize = 50;
        ctx.fillStyle = this.isP2 ? 'rgba(255,0,150,0.6)' : 'rgba(0,200,255,0.6)';
        ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(5, 9); ctx.lineTo(0, 9 + fSize); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2, 9); ctx.lineTo(2, 9); ctx.lineTo(0, 9 + fSize * 0.5); ctx.fill();

        ctx.fillStyle = this.specialActive > 0 || this.orbOverdrive > 0 ? '#f0f' : this.color; 
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-9, 9); ctx.lineTo(9, 9); ctx.fill();
        
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}