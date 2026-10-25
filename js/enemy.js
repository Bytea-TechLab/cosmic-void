class Enemy {
    constructor() { this.active = false; }
    
    spawn(x, y, baseHp, forcedType=null) {
        this.active = true; this.timer = Math.random() * -1; this.startX = x; this.preferP1 = Math.random() < 0.5; this.state = 'moving';
        
        if (forcedType) this.type = forcedType;
        else {
            let rand = Math.random();
            if(rand < 0.35) this.type = 'basic'; else if(rand < 0.60) this.type = 'weaver';
            else if(rand < 0.75) this.type = 'hunter'; else if(rand < 0.90) this.type = 'heavy'; else this.type = 'sniper'; 
        }

        if (this.type.startsWith('miniboss')) {
            // Balanceamento proporcional de Minibosses: meta de 45 a 90 segundos por combate
            let sector = SAVE.data.checkpoint.sector || 1;
            let baseMinibossHp = 3600 + sector * 1500;
            if (this.type === 'miniboss_warden') baseMinibossHp = 30000;
            else if (this.type === 'miniboss_observer_apex') baseMinibossHp = 34000;
            
            this.hp = Math.round(baseMinibossHp * GAME.diff); 
            this.maxHp = this.hp;
            this.color = '#fff';
            this.vulnerableTimer = 0;
            
            if (this.type === 'miniboss_flailer') { this.radius = 40; this.vx = 50; this.vy = 15; this.color = '#f90'; } 
            else if (this.type === 'miniboss_gravity') { this.radius = 35; this.vx = 30; this.vy = 10; this.color = '#800080'; }
            else if (this.type === 'miniboss_knight') { this.radius = 30; this.vx = 250; this.vy = 0; this.color = '#ccc'; } 
            else if (this.type === 'miniboss_hangman') { this.radius = 45; this.vx = 20; this.vy = 15; this.color = '#555'; }
            else if (this.type === 'miniboss_seraph') { this.radius = 30; this.vx = 60; this.vy = 10; this.color = '#fff'; }
            else if (this.type === 'miniboss_warden') { this.radius = 50; this.vx = 40; this.vy = 10; this.color = '#0f0'; }
            else if (this.type === 'miniboss_observer_apex') { this.radius = 40; this.vx = 45; this.vy = 10; this.color = '#0ff'; }
            else if (this.type === 'miniboss_crusher') { this.radius = 45; this.vx = 80; this.vy = 30; this.color = '#f90'; } 
            else if (this.type === 'miniboss_swarm') { this.radius = 35; this.vx = 40; this.vy = 15; this.color = '#f0f'; } 
            else if (this.type === 'miniboss_sniper') { this.radius = 25; this.vx = 200; this.vy = 0; this.color = '#0ff'; } 
        }
        else if (this.type === 'asteroid') {
            this.hp = baseHp * 2; this.radius = 25; this.color = '#555'; 
            this.vx = (Math.random() - 0.5) * 18; this.vy = 34 + Math.random() * 24; this.rot = 0; this.rotSpd = (Math.random() - 0.5) * 3;
        } else if (this.type === 'basic') {
            this.hp = baseHp; this.radius = 12; this.color = '#f00'; 
            this.vx = (Math.random() - 0.5) * 45 * GAME.diff; this.vy = (26 + Math.random() * 22) * (GAME.diff > 1 ? 1.1 : 1);
        } else if (this.type === 'weaver') {
            this.hp = baseHp * 0.8; this.radius = 12; this.color = '#ff0'; 
            this.vx = 90 * GAME.diff; this.vy = 18 * GAME.diff;
        } else if (this.type === 'hunter') {
            this.hp = baseHp * 0.6; this.radius = 11; this.color = '#f90'; 
            this.vx = (Math.random() - 0.5) * 80; this.vy = 70 + 20 * GAME.diff;
            this.state = 'tracking'; this.chargeTimer = 0.75 + Math.random() * 0.5; this.recoverTimer = 0; this.aimAngle = Math.PI / 2;
            this.chargeSpeed = (285 + SAVE.data.checkpoint.sector * 5) * (0.9 + GAME.diff * 0.08);
        } else if (this.type === 'heavy') {
            this.hp = baseHp * 3; this.radius = 18; this.color = '#90f'; 
            this.vx = (Math.random() - 0.5) * 25; this.vy = 12 * GAME.diff; 
        } else if (this.type === 'sniper') {
            this.hp = baseHp; this.radius = 12; this.color = '#0ff'; this.vx = 0; this.vy = 78; this.aimAngle = 0;
        }
        
        this.x = x; this.y = y;
        
        // Correção de Override: Como Knight e Sniper não têm VY, forçamos o spawn direto na visão do jogador
        if (this.type === 'miniboss_knight' || this.type === 'miniboss_sniper') {
            this.y = 150; 
        }
    }

    update(dt) {
        if(!this.active) return;
        this.timer += dt; 

        let target = null;
        let p1Alive = GAME.p1 && GAME.p1.active; let p2Alive = GAME.p2 && GAME.p2.active;
        if (p1Alive && p2Alive) target = this.preferP1 ? GAME.p1 : GAME.p2;
        else if (p1Alive) target = GAME.p1; else if (p2Alive) target = GAME.p2;

        // FÍSICA DE REBOTE CORRIGIDA: Agora checamos a direção da velocidade (vx/vy).
        // Isso permite que o inimigo nasça fora da tela e entre de forma natural sem voar de ré.
        if (this.type === 'miniboss_flailer') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 80 && this.vx < 0) || (this.x > GAME.w - 80 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 120 && this.vy < 0) || (this.y > 320 && this.vy > 0)) this.vy *= -1;
            if (this.timer > 3.0) {
                GAME.shake = 25; UI.showTransmission("IMPACTO COLOSSAL DETECTADO.");
                let ast = window.ENEMY_POOL.get();
                if (ast) { ast.spawn(this.x, this.y, 500, 'asteroid'); ast.vy = 600; ast.vx = (Math.random()-0.5)*100; }
                this.timer = 0;
            }
            if (Math.floor(this.timer * 10) % 5 === 0) { let a = this.timer * 5; window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(a)*25, Math.sin(a)*25, false, 'normal', '#0ff'); }
        } 
        else if (this.type === 'miniboss_gravity') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 80 && this.vx < 0) || (this.x > GAME.w - 80 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 120 && this.vy < 0) || (this.y > 320 && this.vy > 0)) this.vy *= -1;
            [GAME.p1, GAME.p2].forEach(p => {
                if (p && p.active) { let dx = this.x - p.x; let dy = this.y - p.y; let dist = Math.hypot(dx, dy); if (dist > 50) { p.x += (dx/dist) * 150 * dt; p.y += (dy/dist) * 150 * dt; } }
            });
            if (this.timer > 4.0) {
                GAME.shake = 30; UI.showTransmission("BLACK HOLE GENERATED.");
                for(let i=0; i<12; i++) { let a = (Math.PI*2/12)*i; window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(a)*20, Math.sin(a)*20, false, 'plasma', '#800080'); }
                this.timer = 0;
            }
        }
        else if (this.type === 'miniboss_knight') {
            this.x += this.vx * dt * 4;
            if((this.x < 50 && this.vx < 0) || (this.x > GAME.w - 50 && this.vx > 0)) {
                this.vx *= -1; this.y = 120 + Math.random() * 150; GAME.shake = 25;
                window.PROJ_POOL?.get()?.spawn(this.x, this.y, 0, 45, false, 'railgun', '#fff');
                UI.showTransmission("VOID SLASH.");
            }
            if (this.timer > 1.5 && target) { let a = Math.atan2(target.y - this.y, target.x - this.x); this.vx = Math.cos(a) * 800; this.timer = 0; }
        }
        else if (this.type === 'miniboss_hangman') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 100 && this.vx < 0) || (this.x > GAME.w - 100 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 120 && this.vy < 0) || (this.y > 280 && this.vy > 0)) this.vy *= -1;
            if (this.timer > 3.0) {
                UI.showTransmission("CHAIN PRISON."); GAME.shake = 20;
                for(let i=0; i<20; i++) { let a = (Math.PI*2/20)*i; window.PROJ_POOL?.get()?.spawn(this.x + Math.cos(a)*100, this.y + Math.sin(a)*100, 0, 25, false, 'normal', '#555'); }
                this.timer = 0;
            }
        }
        else if (this.type === 'miniboss_seraph') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 80 && this.vx < 0) || (this.x > GAME.w - 80 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 120 && this.vy < 0) || (this.y > 300 && this.vy > 0)) this.vy *= -1;
            if (this.timer > 2.5) {
                UI.showTransmission("DIVINE CROSS."); GAME.shake = 10;
                window.PROJ_POOL?.get()?.spawn(this.x, this.y, 0, 35, false, 'railgun', '#fff'); window.PROJ_POOL?.get()?.spawn(this.x, this.y, 0, -35, false, 'railgun', '#fff');
                window.PROJ_POOL?.get()?.spawn(this.x, this.y, 35, 0, false, 'railgun', '#fff'); window.PROJ_POOL?.get()?.spawn(this.x, this.y, -35, 0, false, 'railgun', '#fff');
                for(let i=-4; i<=4; i++) { window.PROJ_POOL?.get()?.spawn(this.x + i*50, this.y, 0, 20, false, 'plasma', '#0ff'); }
                this.timer = 0;
            }
        }
        else if (this.type === 'miniboss_warden') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 80 && this.vx < 0) || (this.x > GAME.w - 80 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 100 && this.vy < 0) || (this.y > 250 && this.vy > 0)) this.vy *= -1;
            if (Math.floor(this.timer) === 5 && !this.hudHacked) { this.hudHacked = true; UI.showTransmission("SIGNAL FAILURE."); document.getElementById('hud').style.display = 'none'; }
            if (Math.floor(this.timer) === 10) { this.hudHacked = false; document.getElementById('hud').style.display = 'block'; this.timer = 0; }
            if (Math.floor(this.timer * 10) % 15 === 0) window.PROJ_POOL?.get()?.spawn(this.x, this.y, (Math.random()-0.5)*25, 25, false, 'normal', '#0f0');
        }
        else if (this.type === 'miniboss_crusher') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 50 && this.vx < 0) || (this.x > GAME.w - 50 && this.vx > 0)) this.vx *= -1;
            if(this.y < 120 && this.vy < 0) this.vy *= -1;
            if(this.y > 380 && this.vy > 0) { 
                this.vy *= -1; GAME.shake = 15; 
                for(let i=0; i<8; i++) { window.PROJ_POOL?.get()?.spawn(this.x - 80 + (i*20), this.y + 45, 0, 30, false, 'normal', '#f90'); }
            }
        } 
        else if (this.type === 'miniboss_swarm') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 50 && this.vx < 0) || (this.x > GAME.w - 50 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 120 && this.vy < 0) || (this.y > 280 && this.vy > 0)) this.vy *= -1;
            if(this.timer > 1.0) { let e = window.ENEMY_POOL.get(); if(e) e.spawn(this.x, this.y + 30, 40, 'weaver'); this.timer = 0; }
        }
        else if (this.type === 'miniboss_sniper') {
            this.x += this.vx * dt * 4;
            if((this.x < 50 && this.vx < 0) || (this.x > GAME.w - 50 && this.vx > 0)) this.vx *= -1;
            if(this.timer > 1.5 && target) {
                let angle = Math.atan2(target.y - this.y, target.x - this.x);
                window.PROJ_POOL?.get()?.spawn(this.x - 30, this.y, Math.cos(angle)*50, Math.sin(angle)*50, false, 'bfg', '#0ff');
                window.PROJ_POOL?.get()?.spawn(this.x + 30, this.y, Math.cos(angle)*50, Math.sin(angle)*50, false, 'bfg', '#0ff');
                this.timer = 0;
            }
        }
        else if (this.type === 'miniboss_observer_apex') {
            this.x += this.vx * dt * 4; this.y += this.vy * dt * 4;
            if((this.x < 70 && this.vx < 0) || (this.x > GAME.w - 70 && this.vx > 0)) this.vx *= -1; 
            if((this.y < 100 && this.vy < 0) || (this.y > 260 && this.vy > 0)) this.vy *= -1;
            if (this.vulnerableTimer > 0) this.vulnerableTimer -= dt;
            if (this.timer > 3.5) {
                if (target) {
                    let angle = Math.atan2(target.y - this.y, target.x - this.x);
                    window.PROJ_POOL?.get()?.spawn(this.x - 20, this.y, Math.cos(angle)*28, Math.sin(angle)*28, false, 'railgun', '#0ff');
                    window.PROJ_POOL?.get()?.spawn(this.x + 20, this.y, Math.cos(angle)*28, Math.sin(angle)*28, false, 'railgun', '#0ff');
                }
                for(let i=0; i<6; i++) {
                    let a = (Math.PI*2/6)*i;
                    window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(a)*16, Math.sin(a)*16, false, 'plasma', '#f0f');
                }
                this.vulnerableTimer = 1.5;
                this.timer = 0;
            }
        }
        else if (this.type === 'asteroid') {
            this.x += this.vx * dt * 3.5; this.y += this.vy * dt * 3.5; this.rot += this.rotSpd * dt;
        } else if (this.type === 'basic' || this.type === 'heavy') {
            this.x += this.vx * dt * 3.4; this.y += this.vy * dt * 3.4;
            if ((this.x < 20 && this.vx < 0) || (this.x > GAME.w - 20 && this.vx > 0)) {
                this.vx *= -1; 
            }
        } 
        else if (this.type === 'weaver') {
            this.y += this.vy * dt * 3.6;
            this.x = this.startX + Math.sin(this.timer * 3.4) * 125; 
            this.x = Math.max(20, Math.min(GAME.w - 20, this.x)); 
        } 
        else if (this.type === 'hunter') {
            if (!this.recoverLoopTime) this.recoverLoopTime = 0;

            if (this.state === 'tracking') {
                if (target) {
                    // Interceptação preditiva considerando velocidade do jogador
                    let dist = Math.hypot(target.x - this.x, target.y - this.y);
                    let predTime = Math.min(0.65, dist / (this.chargeSpeed || 320));
                    let predX = target.x + (target.vx || 0) * predTime * 0.6;
                    let predY = target.y + (target.vy || 0) * predTime * 0.6;
                    this.aimAngle = Math.atan2(predY - this.y, predX - this.x);

                    // Manobra tática de aproximação cadenciada
                    this.vx += (Math.cos(this.aimAngle) * 110 - this.vx) * dt * 2.5;
                    this.vy += (Math.sin(this.aimAngle) * 90 + 60 - this.vy) * dt * 2.5;
                }
                this.chargeTimer -= dt;
                if (this.chargeTimer <= 0.35 && this.chargeTimer > 0) {
                    this.color = '#ffaa00'; // Telegrafia visual do travamento de mira
                }
                if (this.chargeTimer <= 0 && target) {
                    this.vx = Math.cos(this.aimAngle) * this.chargeSpeed;
                    this.vy = Math.sin(this.aimAngle) * this.chargeSpeed;
                    this.state = 'charging';
                    this.recoverTimer = 0.55;
                    this.color = '#ff3300';
                    this.recoverLoopTime = 0;
                }
            } else if (this.state === 'charging') {
                this.recoverTimer -= dt;
                // Se completou a investida ou atingiu a proximidade do fundo
                if (this.recoverTimer <= 0 || this.y > GAME.h - 20) {
                    this.state = 'recovering';
                    this.recoverTimer = 0.6;
                    this.color = '#ff9900';
                    this.vy = Math.min(this.vy * 0.1, 30);
                }
            } else if (this.state === 'recovering') {
                this.recoverTimer -= dt;
                this.recoverLoopTime += dt;

                // Curva aerodinâmica de retorno se ultrapassou a tela ou está no fundo
                if (this.y > GAME.h - 50) {
                    // Puxa com força para CIMA e abre rota para as laterais
                    let steerX = this.x < GAME.w / 2 ? -160 : 160;
                    this.vx += (steerX - this.vx) * dt * 4.0;
                    this.vy += (-280 - this.vy) * dt * 4.5;
                } else {
                    // Frenagem e ganho de altitude
                    this.vy += (-180 - this.vy) * dt * 3.0;
                    this.vx *= 0.88;
                }

                // Quando atinge altitude tática segura ou expira o tempo de manobra
                if (this.y < GAME.h * 0.40 || this.recoverTimer <= 0) {
                    this.state = 'repositioning';
                    this.recoverTimer = 0.5;
                }
            } else if (this.state === 'repositioning') {
                // Curva de retorno suave em direção ao centro da arena
                let targetCenterX = GAME.w / 2;
                this.vx += ((targetCenterX - this.x) * 0.9 - this.vx) * dt * 2.5;
                this.vy += (50 - this.vy) * dt * 2.5;
                this.recoverTimer -= dt;

                if (this.recoverTimer <= 0 || (this.y > 40 && this.y < GAME.h * 0.35)) {
                    this.state = 'tracking';
                    this.chargeTimer = 0.85 + Math.random() * 0.5;
                    this.color = '#f90';
                    this.recoverLoopTime = 0;
                }
            }

            // Proteção de limites de arena laterais (nunca se perde no infinito)
            if (this.x < 30) this.vx += (140 - this.vx) * dt * 5.0;
            if (this.x > GAME.w - 30) this.vx += (-140 - this.vx) * dt * 5.0;

            // Failsafe de recuperação: se ficar mais de 10s tentando manobrar fora da tela
            if (this.recoverLoopTime > 10.0) {
                this.y = -30;
                this.x = Math.max(50, Math.min(GAME.w - 50, this.x));
                this.vy = 80;
                this.state = 'tracking';
                this.chargeTimer = 1.0;
                this.recoverLoopTime = 0;
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        else if (this.type === 'sniper') {
            if(this.state === 'moving') {
                this.y += this.vy * dt * 4;
                if(this.y > 100) { this.state = 'aiming'; this.timer = 0; }
            } else if (this.state === 'aiming') {
                if(target && this.timer < 1.0) this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
                if(this.timer > 1.5) {
                    window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(this.aimAngle)*35, Math.sin(this.aimAngle)*35, false, 'railgun', '#f00');
                    this.state = 'fleeing';
                }
            } else if (this.state === 'fleeing') {
                this.y -= 300 * dt; 
            }
        }

        if (this.type === 'basic' && this.timer > (3.0 / Math.sqrt(GAME.diff)) && target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(angle)*15, Math.sin(angle)*15, false, 'normal', this.color);
            this.timer = 0;
        } else if (this.type === 'weaver' && this.timer > (1.1 / Math.sqrt(GAME.diff))) {
            window.PROJ_POOL?.get()?.spawn(this.x, this.y, 0, 15, false, 'normal', this.color);
            this.timer = 0;
        } else if (this.type === 'heavy' && this.timer > (4.0 / Math.sqrt(GAME.diff)) && target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            for(let i = -1; i <= 1; i++) {
                window.PROJ_POOL?.get()?.spawn(this.x, this.y, Math.cos(angle + i*0.3)*12, Math.sin(angle + i*0.3)*12, false, 'normal', this.color);
            }
            this.timer = 0;
        }

        if(this.y > GAME.h + 200 || this.y < -200 || this.x < -250 || this.x > GAME.w + 250) {
            // Se for hunter em manobra aerodinâmica de recuperação, permite a curva retornar à arena
            if (this.type === 'hunter' && (this.state === 'recovering' || this.state === 'repositioning') && this.y < GAME.h + 350) {
                // Preserva o ciclo da IA
            } else {
                this.active = false;
                if(this.type.startsWith('miniboss')) { 
                    PACING.miniBossActive = false; 
                    if(this.type === 'miniboss_warden') {
                        let hud = document.getElementById('hud');
                        if (hud) hud.style.display = 'block';
                    }
                }
            }
        }
    }

    draw(ctx) {
        if(!this.active) return;
        
        if (typeof window !== 'undefined' && window.RENDERER2D) {
            if (this.type === 'basic')  { window.RENDERER2D.drawBasicEnemy(ctx, this); return; }
            if (this.type === 'weaver') { window.RENDERER2D.drawWeaverEnemy(ctx, this); return; }
            if (this.type === 'hunter') { window.RENDERER2D.drawHunterEnemy(ctx, this); return; }
            if (this.type === 'heavy')  { window.RENDERER2D.drawHeavyEnemy(ctx, this); return; }
            if (this.type === 'sniper') { window.RENDERER2D.drawSniperEnemy(ctx, this); return; }
            if (this.type.startsWith('miniboss')) { window.RENDERER2D.drawMiniboss(ctx, this); return; }
        }

        if ((this.type === 'sniper' && this.state === 'aiming') || (this.type === 'miniboss_sniper' && this.timer > 1.0)) {
            let a = this.type === 'sniper' ? this.aimAngle : Math.PI/2;
            ctx.save();
            ctx.setLineDash([15, 10]); 
            ctx.lineDashOffset = -GAME.time * 60; 
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); 
            ctx.lineTo(this.x + Math.cos(a)*2000, this.y + Math.sin(a)*2000); ctx.stroke();
            ctx.setLineDash([5, 25]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255, 150, 150, 0.9)'; ctx.stroke();
            ctx.restore();
        }

        if (this.type === 'hunter' && this.state === 'tracking' && this.chargeTimer < 0.35) {
            let alpha = Math.max(0.15, 1 - this.chargeTimer / 0.35);
            ctx.save();
            ctx.setLineDash([10, 15]); ctx.lineDashOffset = -GAME.time * 120;
            ctx.strokeStyle = `rgba(255, 120, 0, ${alpha})`; ctx.lineWidth = 1 + alpha * 3;
            ctx.beginPath(); ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.aimAngle) * 200, this.y + Math.sin(this.aimAngle) * 200); 
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'miniboss_flailer') {
            ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 3;
            ctx.beginPath();
            let a = this.timer * 5;
            ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(a)*100, this.y + Math.sin(a)*100);
            ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(a+Math.PI)*100, this.y + Math.sin(a+Math.PI)*100);
            ctx.stroke();
        } 
        else if (this.type === 'miniboss_gravity') {
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'purple'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + Math.sin(this.timer*10)*10, 0, Math.PI*2); ctx.stroke();
        } 
        else if (this.type === 'miniboss_knight') {
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.moveTo(this.x, this.y-20); ctx.lineTo(this.x-15, this.y+20); ctx.lineTo(this.x+15, this.y+20); ctx.fill();
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(this.x+15, this.y); ctx.lineTo(this.x+100, this.y); ctx.stroke();
        } 
        else if (this.type === 'miniboss_hangman') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(this.x, this.y-50); ctx.lineTo(this.x, this.y); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, 60 + Math.sin(this.timer)*10, 0, Math.PI*2); ctx.stroke();
        } 
        else if (this.type === 'miniboss_seraph') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(this.x, this.y-20); ctx.lineTo(this.x-10, this.y+10); ctx.lineTo(this.x+10, this.y+10); ctx.fill();
            ctx.strokeStyle = 'rgba(0,255,255,0.5)'; ctx.lineWidth = 2;
            let wingSpread = Math.abs(Math.sin(this.timer*2)) * 100;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - 50 - wingSpread, this.y - 50); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + 50 + wingSpread, this.y - 50); ctx.stroke();
        } 
        else if (this.type === 'miniboss_warden') {
            ctx.fillStyle = '#111';
            ctx.fillRect(this.x - 30, this.y - 30, 60, 60);
            ctx.fillStyle = '#0f0';
            ctx.beginPath(); ctx.arc(this.x - 15, this.y, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x + 15, this.y, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y - 15, 5, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type === 'miniboss_observer_apex') {
            ctx.fillStyle = this.vulnerableTimer > 0 ? '#ff0' : '#0ff';
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = '#f0f'; ctx.beginPath(); ctx.arc(this.x, this.y, 30 + Math.sin(this.timer*5)*4, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
        }
        else if (this.type.startsWith('miniboss')) {
            ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x - this.radius - 5 - Math.sin(GAME.time*10)*5, this.y - this.radius - 5 - Math.sin(GAME.time*10)*5, this.radius*2 + 10 + Math.sin(GAME.time*10)*10, this.radius*2 + 10 + Math.sin(GAME.time*10)*10);
        } 
        else if (this.type === 'asteroid') {
            ctx.translate(this.x, this.y); ctx.rotate(this.rot);
            ctx.moveTo(-15, -20); ctx.lineTo(10, -25); ctx.lineTo(25, 0); 
            ctx.lineTo(15, 20); ctx.lineTo(-20, 15); ctx.lineTo(-25, -5);
            ctx.fill(); ctx.strokeStyle='#333'; ctx.lineWidth = 2; ctx.stroke();
            ctx.rotate(-this.rot); ctx.translate(-this.x, -this.y);
        } else if (this.type === 'heavy') {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); 
            ctx.fillStyle = 'rgba(144, 0, 255, 0.5)';
            ctx.beginPath(); ctx.arc(this.x, this.y - 10, this.radius*0.8, 0, Math.PI*2); ctx.fill();
        } else if (this.type === 'hunter' || this.type === 'sniper') {
            let angle = this.type === 'sniper' ? this.aimAngle : Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y); ctx.rotate(angle - Math.PI/2);
            ctx.moveTo(0, 15); ctx.lineTo(-10, -10); ctx.lineTo(0, -5); ctx.lineTo(10, -10);
            ctx.rotate(-(angle - Math.PI/2)); ctx.translate(-this.x, -this.y);
        } else {
            ctx.moveTo(this.x, this.y+10); ctx.lineTo(this.x-10, this.y-10); ctx.lineTo(this.x+10, this.y-10); 
        }
        
        if(!this.type.startsWith('miniboss') || ['miniboss_gravity', 'miniboss_knight', 'miniboss_hangman', 'miniboss_seraph'].includes(this.type)) {
            ctx.fill();
        }

        if (this.type.startsWith('miniboss') && this.hp > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60, 6);
            
            ctx.fillStyle = '#f00';
            let hpPerc = Math.max(0, this.hp / this.maxHp);
            ctx.fillRect(this.x - 30, this.y - this.radius - 20, 60 * hpPerc, 6);
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 30, this.y - this.radius - 20, 60, 6);
            
            ctx.fillStyle = this.color;
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText("ANOMALY", this.x, this.y - this.radius - 25);
        }
    }
}

window.ENEMY_POOL = new Pool(() => new Enemy(), 250);