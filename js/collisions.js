const COLLISIONS = {
    calculatePlayerDamage(proj, target) {
        let isP2Proj = proj.ownerIndex === 1;
        let shooter = isP2Proj ? GAME.p2 : GAME.p1;
        let pDmgBase = shooter ? shooter.stats.dmg : 10;
        
        let isSpec = shooter && (shooter.specialActive > 0 || shooter.orbOverdrive > 0);
        let isLinked = GAME.linkStateTimer > 0;
        
        // Multiplicador de Combo progressivo (+5% por tier, max +25% no Tier 4)
        let comboBonus = 1.0 + (GAME.comboTier || 0) * 0.05;
        
        // Multiplicador de Especial / Link
        let specMult = isSpec ? 1.5 : 1.0;
        let linkMult = isLinked ? 1.35 : 1.0;
        
        // Se foi tiro de parry refletido: contra-ataque consistente (4x dano)
        let parryMult = proj.isParried ? 4.0 : 1.0;
        
        let dmg = pDmgBase * (proj.damageMult || 1) * comboBonus * specMult * linkMult * parryMult;
        
        // Crítico
        let isCrit = false;
        let critChance = proj.critChance !== undefined ? proj.critChance : (shooter && shooter.stats ? shooter.stats.critChance : 0.05);
        let critMult = proj.critMult !== undefined ? proj.critMult : (shooter && shooter.stats ? shooter.stats.critMult : 1.5);
        
        // Janela de vulnerabilidade garante acerto crítico + amplificação tática
        let isVuln = (target.vulnerableTimer > 0 || target.counterActive > 0);
        if (isVuln) {
            isCrit = true;
            dmg *= critMult * 1.5; // Multiplicador unificado durante vulnerabilidade
        } else if (Math.random() < critChance) {
            isCrit = true;
            dmg *= critMult;
        }
        
        return { dmg: Math.max(1, Math.round(dmg)), isCrit, isVuln };
    },

    check(dt) {
        let p1 = GAME.p1 && GAME.p1.active ? GAME.p1 : null;
        let p2 = GAME.p2 && GAME.p2.active ? GAME.p2 : null;

        for(let i = 0; i < DROP_POOL.items.length; i++) {
            let drop = DROP_POOL.items[i];
            if(!drop.active) continue;
            if(p1 && p1.state === 'ALIVE') this.checkDrop(drop, p1);
            if(!drop.active) continue;
            if(p2 && p2.state === 'ALIVE') this.checkDrop(drop, p2);
        }

        for(let i = 0; i < ENEMY_POOL.items.length; i++) {
            let enemy = ENEMY_POOL.items[i];
            if(!enemy.active) continue;
            if(p1 && p1.state === 'ALIVE' && p1.iFrames <= 0 && p1.shieldTimer <= 0) {
                let dist = Math.hypot(enemy.x - p1.x, enemy.y - p1.y);
                if(dist < (enemy.radius + p1.radius) * 0.8) this.handleEnemyBump(enemy, p1);
            }
            if(!enemy.active) continue;
            if(p2 && p2.state === 'ALIVE' && p2.iFrames <= 0 && p2.shieldTimer <= 0) {
                let dist = Math.hypot(enemy.x - p2.x, enemy.y - p2.y);
                if(dist < (enemy.radius + p2.radius) * 0.8) this.handleEnemyBump(enemy, p2);
            }
        }

        if (typeof VILLAIN !== 'undefined' && VILLAIN.active && VILLAIN.state === 'COMBAT') {
            if (p1 && p1.state === 'ALIVE' && p1.iFrames <= 0 && p1.shieldTimer <= 0) {
                let dist = Math.hypot(VILLAIN.x - p1.x, VILLAIN.y - p1.y);
                if (dist < (VILLAIN.radius + p1.radius) * 0.85) {
                    p1.takeDamage(22);
                    GAME.shake = 18;
                    EFFECTS.explosion(p1.x, p1.y, '#f00');
                }
            }
            if (p2 && p2.state === 'ALIVE' && p2.iFrames <= 0 && p2.shieldTimer <= 0) {
                let dist = Math.hypot(VILLAIN.x - p2.x, VILLAIN.y - p2.y);
                if (dist < (VILLAIN.radius + p2.radius) * 0.85) {
                    p2.takeDamage(22);
                    GAME.shake = 18;
                    EFFECTS.explosion(p2.x, p2.y, '#f00');
                }
            }
        }

        for(let i = 0; i < PROJ_POOL.items.length; i++) {
            let proj = PROJ_POOL.items[i];
            if(!proj.active) continue;
            if(!proj.hitTargets) proj.hitTargets = new Set();

            if(proj.isPlayer) {
                let isP2Proj = proj.ownerIndex === 1;
                let shooter = isP2Proj ? GAME.p2 : GAME.p1;

                if (BOSS.active && BOSS.state !== 'INTRO') {
                    // Detecção de impacto em subsistemas destrutíveis
                    let hitSubsystem = false;
                    if (BOSS.subsystems && BOSS.subsystems.length > 0) {
                        for (let s = 0; s < BOSS.subsystems.length; s++) {
                            let sub = BOSS.subsystems[s];
                            if (!sub.alive) continue;
                            let subX = BOSS.x + sub.offsetX;
                            let subY = BOSS.y + sub.offsetY;
                            let distSub = Math.hypot(proj.x - subX, proj.y - subY);
                            if (distSub < (proj.radius + sub.radius)) {
                                if (!proj.hitTargets.has(sub)) {
                                    let { dmg: subDmg, isCrit, isVuln } = this.calculatePlayerDamage(proj, BOSS);
                                    sub.hp -= subDmg;
                                    BOSS.hp -= Math.round(subDmg * 0.3);
                                    UI.updateBossHP(BOSS.hp, BOSS.maxHp);

                                    if (isCrit || isVuln) {
                                        EFFECTS.explosion(proj.x, proj.y, '#ff0', true);
                                        GAME.shake = Math.min(15, GAME.shake + 2);
                                    } else {
                                        EFFECTS.explosion(proj.x, proj.y, '#fa0');
                                    }

                                    if (sub.hp <= 0) {
                                        sub.hp = 0;
                                        sub.alive = false;
                                        EFFECTS.explosion(subX, subY, '#ff4400', true);
                                        EFFECTS.explosion(subX, subY, '#ffffff', true);
                                        GAME.shake = Math.min(25, GAME.shake + 8);
                                        GAME.triggerFlash('#ff8800', 0.4);
                                        if (window.UI && window.UI.showTransmission) {
                                            window.UI.showTransmission(`SUBSISTEMA DESTRUÍDO: ${sub.name.toUpperCase()}`);
                                        }
                                        if (window.DROP_POOL) {
                                            window.DROP_POOL.get()?.spawn(subX, subY, 'scrap');
                                            window.DROP_POOL.get()?.spawn(subX + 12, subY, 'orb_rare');
                                            window.DROP_POOL.get()?.spawn(subX - 12, subY, 'scrap');
                                        }
                                    }

                                    if (proj.type !== 'railgun' && proj.type !== 'bfg') {
                                        proj.active = false;
                                        proj.hitTargets.add(sub);
                                        hitSubsystem = true;
                                        break;
                                    } else {
                                        proj.hitTargets.add(sub);
                                    }
                                }
                            }
                        }
                    }
                    if (hitSubsystem) continue;

                    let dist = Math.hypot(proj.x - BOSS.x, proj.y - BOSS.y);
                    if(dist < (proj.radius + BOSS.radius)) {
                        if (!proj.hitTargets.has(BOSS)) {
                            if (BOSS.shieldTimer > 0) {
                                proj.active = false; EFFECTS.explosion(proj.x, proj.y, '#00f'); continue;
                            }
                            
                            let { dmg: finalDmg, isCrit, isVuln } = this.calculatePlayerDamage(proj, BOSS);
                            if (isCrit || isVuln) {
                                EFFECTS.explosion(proj.x, proj.y, '#ff0', true);
                                GAME.shake = Math.min(15, GAME.shake + 2);
                            } else {
                                EFFECTS.explosion(proj.x, proj.y, '#f00');
                            }

                            BOSS.hp -= finalDmg; 
                            UI.updateBossHP(BOSS.hp, BOSS.maxHp); 
                            
                            if(proj.type !== 'railgun' && proj.type !== 'bfg') { 
                                proj.active = false; 
                                proj.hitTargets.add(BOSS); 
                                continue; 
                            } else {
                                proj.hitTargets.add(BOSS);
                            }
                        }
                    }
                }

                if (typeof VILLAIN !== 'undefined' && VILLAIN.active && (VILLAIN.state === 'COMBAT' || VILLAIN.state === 'FINAL_EXECUTION')) {
                    let distV = Math.hypot(proj.x - VILLAIN.x, proj.y - VILLAIN.y);
                    if (distV < (proj.radius + VILLAIN.radius)) {
                        if (!proj.hitTargets.has(VILLAIN)) {
                            let { dmg: finalDmg, isCrit, isVuln } = this.calculatePlayerDamage(proj, VILLAIN);
                            VILLAIN.takeDamage(finalDmg, isCrit, isVuln, proj);
                            if (proj.type !== 'railgun' && proj.type !== 'bfg') {
                                proj.active = false;
                                proj.hitTargets.add(VILLAIN);
                                continue;
                            } else {
                                proj.hitTargets.add(VILLAIN);
                            }
                        }
                    }
                }
                
                for(let j = 0; j < ENEMY_POOL.items.length; j++) {
                    let enemy = ENEMY_POOL.items[j];
                    if(!enemy.active) continue;
                    let dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                    if(dist < (proj.radius + enemy.radius)) {
                        if (!proj.hitTargets.has(enemy)) {
                            
                            let { dmg: finalDmg, isCrit, isVuln } = this.calculatePlayerDamage(proj, enemy);
                            if (isCrit || isVuln) {
                                EFFECTS.explosion(enemy.x, enemy.y, '#ff0', true);
                            } else {
                                EFFECTS.explosion(enemy.x, enemy.y, enemy.color);
                            }
                            
                            enemy.hp -= finalDmg; 
                            
                            if(proj.type !== 'railgun' && proj.type !== 'bfg') { proj.active = false; }
                            else proj.hitTargets.add(enemy);
                            
                            if(enemy.hp <= 0) {
                                this.killEnemy(enemy, shooter, isP2Proj);
                            }
                            if(!proj.active) break; 
                        }
                    }
                }
            } else {
                if(p1 && p1.state === 'ALIVE') this.checkProjPlayer(proj, p1);
                if(!proj.active) continue;
                if(p2 && p2.state === 'ALIVE') this.checkProjPlayer(proj, p2);
            }
        }
    },

    killEnemy(enemy, killer = null, isP2 = false) {
        if (!enemy.active) return;
        enemy.active = false;
        EFFECTS.explosion(enemy.x, enemy.y, enemy.color);
        GAME.combo++; 
        GAME.comboTimer = GAME.maxComboTimer; 
        PACING.registerKill();

        if (killer && killer.cls === 'assault') {
            killer.killsToHeal = (killer.killsToHeal || 0) + 1;
            if (killer.killsToHeal >= 12) {
                killer.hp = Math.min(killer.maxHp, killer.hp + 8);
                UI.updateHP(killer.hp, killer.maxHp, killer.isP2); 
                killer.killsToHeal = 0;
            }
        }
        if (killer && killer.vampiricChance && Math.random() < killer.vampiricChance) {
            killer.hp = Math.min(killer.maxHp, killer.hp + 12);
            UI.updateHP(killer.hp, killer.maxHp, killer.isP2);
        }
        if (typeof QUICKRUN !== 'undefined' && QUICKRUN.active) {
            QUICKRUN.kills = (QUICKRUN.kills || 0) + 1;
        }
        if (typeof BLACKOUT !== 'undefined' && BLACKOUT.active) {
            BLACKOUT.kills = (BLACKOUT.kills || 0) + 1;
        }
        
        if (enemy.type.startsWith('miniboss')) {
            PACING.miniBossActive = false; 
            GAME.shake = 30;
            if (enemy.type === 'miniboss_warden') {
                let hud = document.getElementById('hud');
                if (hud) hud.style.display = 'block';
            }
        }

        let reward = 10; 
        if (enemy.type === 'heavy') reward = 30;
        else if (enemy.type === 'asteroid') reward = 60;
        else if (enemy.type.startsWith('miniboss')) reward = 1000;
        
        let pIndex = (isP2 || (killer && killer.isP2)) ? 1 : 0;
        if (Array.isArray(SAVE.data.credits)) {
            if (GAME.isCoop && GAME.p1 && GAME.p2) {
                let shareA = Math.ceil(reward * 0.60);
                let shareB = Math.max(1, Math.floor(reward * 0.40));
                SAVE.data.credits[pIndex] += shareA;
                SAVE.data.credits[pIndex === 1 ? 0 : 1] += shareB;
            } else {
                SAVE.data.credits[pIndex] += reward;
            }
        } else {
            SAVE.data.credits += reward;
        }
        UI.updateCredits();
        
        if (enemy.type === 'asteroid') {
            let d = DROP_POOL.get();
            if (d) {
                let r = Math.random();
                if (r < 0.25) d.spawn(enemy.x, enemy.y, 'buff_maxhp');
                else if (r < 0.50) d.spawn(enemy.x, enemy.y, 'buff_dmg');
                else if (r < 0.75) d.spawn(enemy.x, enemy.y, 'buff_spd');
                else d.spawn(enemy.x, enemy.y, 'buff_shot');
            }
        } else if (Math.random() < (GAME.comboTier >= 3 ? 0.30 : 0.15)) { 
            let d = DROP_POOL.get(); 
            if (d) d.spawn(enemy.x, enemy.y);
        }
    },
    
    checkDrop(drop, p) {
        let dist = Math.hypot(drop.x - p.x, drop.y - p.y);
        if(dist < drop.radius + p.radius) {
            drop.active = false;
            let pIdx = p.isP2 ? 1 : 0;
            if(drop.type === 'hp') { 
                p.hp = Math.min(p.hp + 30, p.maxHp); 
                UI.updateHP(p.hp, p.maxHp, p.isP2); 
                if (GAME.isCoop) {
                    let partner = p.isP2 ? GAME.p1 : GAME.p2;
                    if (partner && partner.active && partner.state === 'ALIVE') {
                        partner.hp = Math.min(partner.hp + 12, partner.maxHp);
                        UI.updateHP(partner.hp, partner.maxHp, partner.isP2);
                    }
                }
            }
            else if(drop.type === 'credits') { 
                if(Array.isArray(SAVE.data.credits)) {
                    SAVE.data.credits[pIdx] += 100;
                    if (GAME.isCoop) {
                        SAVE.data.credits[pIdx === 1 ? 0 : 1] += 50;
                    }
                } else {
                    SAVE.data.credits += 100;
                }
                UI.updateCredits(); 
            }
            else if(drop.type === 'shield') { p.shieldTimer = 10; }
            else if(drop.type === 'special') { p.special = Math.min(p.special + 50, 100); UI.updateSpecial(p.special, p.isP2); }
            else if(drop.type === 'buff_maxhp') { p.maxHp += 20; p.hp += 20; UI.updateHP(p.hp, p.maxHp, p.isP2); UI.showTransmission("Poder Absorvido: MAX HP UP!"); }
            else if(drop.type === 'buff_dmg') { p.stats.dmg += 5; UI.showTransmission("Poder Absorvido: DANO UP!"); }
            else if(drop.type === 'buff_spd') { p.stats.spd += 25; UI.showTransmission("Poder Absorvido: VELOCIDADE UP!"); }
            else if(drop.type === 'buff_shot') { p.extraShots = (p.extraShots || 0) + 1; UI.showTransmission("Poder Absorvido: MULTI-TIRO!"); }
            else if(drop.type === 'orb_dash') { p.orbDash = 10; UI.showTransmission("DASH INFINITO (10s)"); }
            else if(drop.type === 'orb_weapon') { p.orbWeapon = 15; UI.showTransmission("RAILGUN MASSIVO (15s)"); }
            else if(drop.type === 'orb_overdrive') { p.orbOverdrive = 10; GAME.combo+=10; UI.showTransmission("OVERDRIVE ATIVADO!"); }
            else if(drop.type === 'orb_parity') { p.orbParity = 15; UI.showTransmission("JANELA DE PARRY EXTENDIDA!"); }
            else if(drop.type === 'orb_rare') { p.orbDash=6; p.orbOverdrive=6; p.orbWeapon=6; p.shieldTimer=6; UI.showTransmission("OVERDRIVE TOTAL (6s)!"); GAME.combo+=15; GAME.triggerFlash('#ff0', 0.8); GAME.shake = 30; EFFECTS.triggerGlitch(); }
        }
    },

    handleEnemyBump(enemy, p) {
        let bumpDmg = enemy.type === 'heavy' || enemy.type === 'asteroid' ? 18 : 12;
        p.takeDamage(bumpDmg); 
        enemy.hp -= 50; 
        EFFECTS.explosion(p.x, p.y, '#f00'); 
        GAME.shake = 10;
        if(enemy.hp <= 0) { 
            this.killEnemy(enemy, p, p.isP2);
        }
    },

    checkProjPlayer(proj, p) {
        let dist = Math.hypot(proj.x - p.x, proj.y - p.y);
        let pw = p.parryWindow;
        if (p.orbParity > 0) pw += 0.3; 

        if (pw > 0 && dist < (proj.radius + p.radius + 15)) {
            proj.isPlayer = true; proj.isParried = true; proj.color = p.isP2 ? '#0f0' : '#0ff'; 
            proj.ownerIndex = p.isP2 ? 1 : 0;
            proj.speedScale = 60;
            proj.vx *= -3; proj.vy *= -3; proj.hitTargets.clear(); 
            
            GAME.timeScale = 0.2; GAME.slowMoTimer = 0.5; GAME.shake = 30; EFFECTS.triggerParryFlash();
            if (typeof navigator !== 'undefined' && navigator.vibrate && typeof SAVE !== 'undefined' && SAVE.data?.settings?.haptics) {
                navigator.vibrate([25, 20, 45]);
            }
            p.special = Math.min(p.special + 20, 100); 
            
            // Recompensa de cura por parry com cooldown interno (impede curar 100% em uma rajada de tiros)
            let now = GAME.time;
            if (now - (p.lastParryHealTime || 0) >= 0.8) {
                p.lastParryHealTime = now;
                let healPercent = p.cls === 'tank' ? 0.12 : 0.06;
                let healAmt = Math.min(20, Math.ceil(p.maxHp * healPercent));
                p.hp = Math.min(p.maxHp, p.hp + healAmt);
            }
            
            UI.updateSpecial(p.special, p.isP2); UI.updateHP(p.hp, p.maxHp, p.isP2);
            GAME.combo += 2; GAME.comboTimer = GAME.maxComboTimer;
            return;
        }

        if(p.iFrames > 0 || p.shieldTimer > 0) return; 

        let coreRadius = 3; 
        if(dist < (proj.radius + coreRadius)) { 
            let enemyDmg = (proj.damage !== undefined && proj.damage !== null) ? proj.damage : 10;
            p.takeDamage(enemyDmg); 
            proj.active = false; 
        } 
        else if(dist < (proj.radius + p.radius) * 2.5) { UI.addGraze(); }
    }
};
