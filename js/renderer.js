// ============================================================================
// COSMIC VOID 2.0 — RENDER PIPELINE & SPRITE GENERATOR (Fase C: Protótipo Visual)
// Módulo de renderização de alta definição 2D com estética militar,
// painéis segmentados, exaustores com pós-combustão, projéteis com núcleo de plasma
// e fundo de espaço profundo com perspectiva simulada.
// ============================================================================

const RENDERER2D = {
    cache: {},

    // Inicializa o pipeline e pré-renderiza sprites em buffers offscreen
    init() {
        this.cache = {};
    },

    // Cria ou obtém um canvas offscreen em cache para renderização ultra-rápida sem alocação por frame
    getOrCreateCanvas(key, width, height, renderFn) {
        if (typeof document === 'undefined') return null; // Ambiente Node (testes)
        if (!this.cache[key]) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            renderFn(ctx, width, height);
            this.cache[key] = canvas;
        }
        return this.cache[key];
    },

    // ------------------------------------------------------------------------
    // 1. RENDER DA NAVE ASSAULT (Militar, placas segmentadas, exaustor, canhões duplos)
    // ------------------------------------------------------------------------
    drawAssaultShip(ctx, p, vY) {
        ctx.save();
        ctx.translate(p.x, vY);
        ctx.rotate(p.rotation + Math.PI / 2 + p.tilt);

        const isP2 = p.isP2;
        const primaryColor = isP2 ? '#ff00aa' : '#00e5ff';
        const darkPlateColor = '#182028';
        const midPlateColor = '#24303c';
        const lightPlateColor = '#3a4a58';
        const accentGlow = isP2 ? 'rgba(255, 0, 170, ' : 'rgba(0, 229, 255, ';

        // 1.1 Exaustor e Pós-combustão (Thrusters)
        const isAccelerating = (typeof INPUT !== 'undefined' && INPUT.keys && (INPUT.keys['KeyW'] || INPUT.keys['ArrowUp']));
        const isDashing = p.dashCooldown > (p.dashCdBase * 0.7);
        const flameLength = isDashing ? 38 : (isAccelerating ? 22 : 12);
        const flamePulse = Math.sin(p.hoverTimer * 12) * 2;
        const actualFlame = flameLength + flamePulse;

        // Chama de jato externa
        const thrusterGrad = ctx.createLinearGradient(0, 10, 0, 10 + actualFlame);
        thrusterGrad.addColorStop(0, '#ffffff');
        thrusterGrad.addColorStop(0.3, primaryColor);
        thrusterGrad.addColorStop(1, 'rgba(0,0,0,0)');

        // Jato Esquerdo e Direito
        [-6, 6].forEach(offsetX => {
            ctx.fillStyle = thrusterGrad;
            ctx.beginPath();
            ctx.moveTo(offsetX - 3, 10);
            ctx.lineTo(offsetX + 3, 10);
            ctx.lineTo(offsetX, 10 + actualFlame);
            ctx.closePath();
            ctx.fill();

            // Núcleo branco quente interno
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(offsetX - 1.5, 10);
            ctx.lineTo(offsetX + 1.5, 10);
            ctx.lineTo(offsetX, 10 + actualFlame * 0.5);
            ctx.closePath();
            ctx.fill();
        });

        // 1.2 Asas e Suportes de Armamento (Militar Angular)
        ctx.fillStyle = midPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -18);      // Bico da nave
        ctx.lineTo(7, -6);       // Fuselagem frontal
        ctx.lineTo(16, 4);       // Bordo da asa direita
        ctx.lineTo(16, 9);       // Ponta de canhão direito
        ctx.lineTo(9, 10);       // Bocal de motor direito
        ctx.lineTo(5, 7);        // Encaixe central
        ctx.lineTo(0, 8);        // Centro traseiro
        ctx.lineTo(-5, 7);       // Encaixe esquerdo
        ctx.lineTo(-9, 10);      // Bocal de motor esquerdo
        ctx.lineTo(-16, 9);      // Ponta de canhão esquerdo
        ctx.lineTo(-16, 4);      // Bordo da asa esquerda
        ctx.lineTo(-7, -6);      // Fuselagem frontal esquerda
        ctx.closePath();
        ctx.fill();

        // 1.3 Blindagem Segmentada (Placas Superiores / Armor Plating)
        ctx.fillStyle = darkPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(5, -4);
        ctx.lineTo(12, 5);
        ctx.lineTo(7, 7);
        ctx.lineTo(0, 5);
        ctx.lineTo(-7, 7);
        ctx.lineTo(-12, 5);
        ctx.lineTo(-5, -4);
        ctx.closePath();
        ctx.fill();

        // Linhas de painéis e costuras metálicas
        ctx.strokeStyle = lightPlateColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Linha dorsal
        ctx.moveTo(0, -15); ctx.lineTo(0, 5);
        // Costuras angulares
        ctx.moveTo(-5, -4); ctx.lineTo(-12, 5);
        ctx.moveTo(5, -4); ctx.lineTo(12, 5);
        ctx.stroke();

        // 1.4 Canhões Frontais Integrados
        ctx.fillStyle = '#11161b';
        ctx.fillRect(-15, 0, 2.5, 9);
        ctx.fillRect(12.5, 0, 2.5, 9);
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-14.5, 9, 1.5, 1.5);
        ctx.fillRect(13, 9, 1.5, 1.5);

        // 1.5 Cockpit / Sensor Militar e Núcleo Energético
        const isOverdrive = (p.specialActive > 0 || p.orbOverdrive > 0);
        const coreColor = isOverdrive ? '#ff00ff' : primaryColor;
        
        // Cúpula do Cockpit (visor hexagonal ciano/magenta)
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(3, -2);
        ctx.lineTo(2, 3);
        ctx.lineTo(-2, 3);
        ctx.lineTo(-3, -2);
        ctx.closePath();
        ctx.fill();

        // Reflexo de luz na cabine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 1.6 Escudo de Proteção Ativo / Aura de Invulnerabilidade
        if (p.shieldTimer > 0) {
            ctx.save();
            ctx.strokeStyle = accentGlow + '0.8)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = primaryColor;
            ctx.beginPath();
            ctx.arc(0, 0, 20 + Math.sin(p.hoverTimer * 8) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 1.B RENDER DA NAVE SCOUT (Agil, asas móveis tipo delta aberta, motor único supersônico)
    // ------------------------------------------------------------------------
    drawScoutShip(ctx, p, vY) {
        ctx.save();
        ctx.translate(p.x, vY);
        ctx.rotate(p.rotation + Math.PI / 2 + p.tilt);

        const isP2 = p.isP2;
        const primaryColor = isP2 ? '#ff00aa' : '#00e5ff';
        const darkPlateColor = '#14181e';
        const midPlateColor = '#202a34';
        const lightPlateColor = '#3a4e60';
        const accentGlow = isP2 ? 'rgba(255, 0, 170, ' : 'rgba(0, 229, 255, ';

        // Pós-combustão supersônica (Scout é a mais rápida do jogo)
        const isAccelerating = (typeof INPUT !== 'undefined' && INPUT.keys && (INPUT.keys['KeyW'] || INPUT.keys['ArrowUp']));
        const isDashing = p.dashCooldown > (p.dashCdBase * 0.7);
        const flameLength = isDashing ? 45 : (isAccelerating ? 26 : 14);
        const flamePulse = Math.sin(p.hoverTimer * 16) * 2;
        const actualFlame = flameLength + flamePulse;

        // Jato pontiagudo único
        const thrusterGrad = ctx.createLinearGradient(0, 9, 0, 9 + actualFlame);
        thrusterGrad.addColorStop(0, '#ffffff');
        thrusterGrad.addColorStop(0.25, primaryColor);
        thrusterGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = thrusterGrad;
        ctx.beginPath();
        ctx.moveTo(-4, 9);
        ctx.lineTo(4, 9);
        ctx.lineTo(0, 9 + actualFlame);
        ctx.closePath();
        ctx.fill();

        // Fuselagem esguia / Asas swept-forward (Scout Interceptor)
        ctx.fillStyle = midPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -20);     // Agulha frontal
        ctx.lineTo(4, -8);
        ctx.lineTo(18, 2);      // Ponta de asa direita
        ctx.lineTo(14, 8);      // Estabilizador direito
        ctx.lineTo(6, 6);
        ctx.lineTo(4, 9);       // Bocal de escape
        ctx.lineTo(-4, 9);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-14, 8);     // Estabilizador esquerdo
        ctx.lineTo(-18, 2);     // Ponta de asa esquerda
        ctx.lineTo(-4, -8);
        ctx.closePath();
        ctx.fill();

        // Placas dorsais finas
        ctx.fillStyle = darkPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(3, -6);
        ctx.lineTo(10, 3);
        ctx.lineTo(0, 4);
        ctx.lineTo(-10, 3);
        ctx.lineTo(-3, -6);
        ctx.closePath();
        ctx.fill();

        // Costuras e arestas reflexivas
        ctx.strokeStyle = lightPlateColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(0, 6);
        ctx.moveTo(-3, -6); ctx.lineTo(-15, 3);
        ctx.moveTo(3, -6); ctx.lineTo(15, 3);
        ctx.stroke();

        // Sensores laterais e cabine de mira rápida
        const isOverdrive = (p.specialActive > 0 || p.orbOverdrive > 0);
        ctx.fillStyle = isOverdrive ? '#ff00ff' : primaryColor;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(2, -4);
        ctx.lineTo(0, -1);
        ctx.lineTo(-2, -4);
        ctx.closePath();
        ctx.fill();

        // Escudo
        if (p.shieldTimer > 0) {
            ctx.save();
            ctx.strokeStyle = accentGlow + '0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + Math.sin(p.hoverTimer * 8) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 1.C RENDER DA NAVE TANK (Blindagem pesada, chassi hexagonal, canhões laterais quádruplos)
    // ------------------------------------------------------------------------
    drawTankShip(ctx, p, vY) {
        ctx.save();
        ctx.translate(p.x, vY);
        ctx.rotate(p.rotation + Math.PI / 2 + p.tilt);

        const isP2 = p.isP2;
        const primaryColor = isP2 ? '#ff00aa' : '#00e5ff';
        const darkPlateColor = '#161d22';
        const midPlateColor = '#26323c';
        const lightPlateColor = '#3c4c58';
        const accentGlow = isP2 ? 'rgba(255, 0, 170, ' : 'rgba(0, 229, 255, ';

        // Exaustores pesados (3 bocais de alta tração)
        const isAccelerating = (typeof INPUT !== 'undefined' && INPUT.keys && (INPUT.keys['KeyW'] || INPUT.keys['ArrowUp']));
        const isDashing = p.dashCooldown > (p.dashCdBase * 0.7);
        const flameLength = isDashing ? 32 : (isAccelerating ? 18 : 10);
        const actualFlame = flameLength + Math.sin(p.hoverTimer * 10) * 1.5;

        const thrusterGrad = ctx.createLinearGradient(0, 10, 0, 10 + actualFlame);
        thrusterGrad.addColorStop(0, '#ffffff');
        thrusterGrad.addColorStop(0.3, primaryColor);
        thrusterGrad.addColorStop(1, 'rgba(0,0,0,0)');

        [-8, 0, 8].forEach(offsetX => {
            ctx.fillStyle = thrusterGrad;
            ctx.beginPath();
            ctx.moveTo(offsetX - 2.5, 10);
            ctx.lineTo(offsetX + 2.5, 10);
            ctx.lineTo(offsetX, 10 + actualFlame * (offsetX === 0 ? 1.2 : 0.9));
            ctx.closePath();
            ctx.fill();
        });

        // Casco blindado pesado (Hexagonal / Fortaleza de Combate)
        ctx.fillStyle = midPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -14);       // Nariz reforçado
        ctx.lineTo(8, -8);
        ctx.lineTo(15, -4);      // Blindagem frontal lateral
        ctx.lineTo(18, 5);       // Módulo de dispersão lateral direito
        ctx.lineTo(13, 10);      // Chapa de motor direita
        ctx.lineTo(-13, 10);     // Chapa de motor esquerda
        ctx.lineTo(-18, 5);      // Módulo de dispersão lateral esquerdo
        ctx.lineTo(-15, -4);     // Blindagem frontal lateral esquerda
        ctx.lineTo(-8, -8);
        ctx.closePath();
        ctx.fill();

        // Placas balísticas reforçadas duplas
        ctx.fillStyle = darkPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(6, -6);
        ctx.lineTo(12, 4);
        ctx.lineTo(0, 7);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();

        // Canhões de escopeta de dispersão laterais (Shotgun Cannons)
        ctx.fillStyle = '#0f1418';
        [-17, -14, 12, 15].forEach(x => {
            ctx.fillRect(x, -6, 2, 8);
        });

        // Linhas de blindagem militar
        ctx.strokeStyle = lightPlateColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-15, -4); ctx.lineTo(15, -4);
        ctx.moveTo(-8, -8); ctx.lineTo(-13, 10);
        ctx.moveTo(8, -8); ctx.lineTo(13, 10);
        ctx.stroke();

        // Visor de combate do Tank (amplo e blindado)
        const isOverdrive = (p.specialActive > 0 || p.orbOverdrive > 0);
        ctx.fillStyle = isOverdrive ? '#ff00ff' : primaryColor;
        ctx.fillRect(-5, -3, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -2, 6, 2);

        // Escudo ou Fortificação Tática Ativa
        if (p.shieldTimer > 0) {
            ctx.save();
            ctx.strokeStyle = accentGlow + '0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22 + Math.sin(p.hoverTimer * 8) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 1.D RENDER DA NAVE RANGER (Precisão, canhão central massivo, estabilizadores)
    // ------------------------------------------------------------------------
    drawRangerShip(ctx, p, vY) {
        ctx.save();
        ctx.translate(p.x, vY);
        ctx.rotate(p.rotation + Math.PI / 2 + p.tilt);

        const isP2 = p.isP2;
        const primaryColor = isP2 ? '#ff00aa' : '#00e5ff';
        const darkPlateColor = '#141a20';
        const midPlateColor = '#222d36';
        const lightPlateColor = '#3a4a58';
        const accentGlow = isP2 ? 'rgba(255, 0, 170, ' : 'rgba(0, 229, 255, ';

        // Exaustores duplos laterais (estabilizados para compensar o recuo do railgun)
        const isAccelerating = (typeof INPUT !== 'undefined' && INPUT.keys && (INPUT.keys['KeyW'] || INPUT.keys['ArrowUp']));
        const isDashing = p.dashCooldown > (p.dashCdBase * 0.7);
        const flameLength = isDashing ? 36 : (isAccelerating ? 20 : 11);
        const actualFlame = flameLength + Math.sin(p.hoverTimer * 12) * 1.5;

        const thrusterGrad = ctx.createLinearGradient(0, 9, 0, 9 + actualFlame);
        thrusterGrad.addColorStop(0, '#ffffff');
        thrusterGrad.addColorStop(0.3, primaryColor);
        thrusterGrad.addColorStop(1, 'rgba(0,0,0,0)');

        [-9, 9].forEach(offsetX => {
            ctx.fillStyle = thrusterGrad;
            ctx.beginPath();
            ctx.moveTo(offsetX - 2.5, 9);
            ctx.lineTo(offsetX + 2.5, 9);
            ctx.lineTo(offsetX, 9 + actualFlame);
            ctx.closePath();
            ctx.fill();
        });

        // Canhão central de aceleração linear (Railgun Cannon que se projeta à frente)
        ctx.fillStyle = '#0a0d10';
        ctx.fillRect(-2.5, -24, 5, 26);
        // Bobinas magnéticas do canhão
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-3, -20, 6, 2);
        ctx.fillRect(-3, -14, 6, 2);
        ctx.fillRect(-3, -8, 6, 2);

        // Estrutura principal da nave com estabilizadores abertos
        ctx.fillStyle = midPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(6, -4);
        ctx.lineTo(15, 6);       // Estabilizador direito
        ctx.lineTo(13, 9);
        ctx.lineTo(7, 9);
        ctx.lineTo(3, 7);
        ctx.lineTo(-3, 7);
        ctx.lineTo(-7, 9);
        ctx.lineTo(-13, 9);
        ctx.lineTo(-15, 6);      // Estabilizador esquerdo
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fill();

        // Blindagem dorsal fina
        ctx.fillStyle = darkPlateColor;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(4, -2);
        ctx.lineTo(10, 5);
        ctx.lineTo(0, 5);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-4, -2);
        ctx.closePath();
        ctx.fill();

        // Lentes de mira / Mira telescópica óptica
        const isOverdrive = (p.specialActive > 0 || p.orbOverdrive > 0);
        ctx.fillStyle = isOverdrive ? '#ff00ff' : '#00ffff';
        ctx.beginPath();
        ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -6, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Escudo
        if (p.shieldTimer > 0) {
            ctx.save();
            ctx.strokeStyle = accentGlow + '0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 19 + Math.sin(p.hoverTimer * 8) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    },
    // ------------------------------------------------------------------------
    // 2.F RENDER DE MINIBOSSES DE SETOR (Anomalias Cósmicas e Máquinas de Guerra)
    // ------------------------------------------------------------------------
    drawMiniboss(ctx, mb) {
        ctx.save();
        const time = GAME.time || 0;
        const x = mb.x;
        const y = mb.y;
        const r = mb.radius;

        if (mb.type === 'miniboss_hangman') {
            // Anomalia Hangman (Setor 12): Núcleo mecânico pendular com anéis de contenção
            ctx.strokeStyle = '#445566';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, y - 70);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Anéis gravitacionais rotativos
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r + Math.sin(time * 4) * 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 0, 120, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, r * 1.4 + Math.cos(time * 3) * 8, 0, Math.PI * 2);
            ctx.stroke();

            // Núcleo mecânico blindado
            ctx.fillStyle = '#111822';
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (mb.type === 'miniboss_flailer') {
            // Flailer (Setor 3): Couraçado com espigões cinéticos giratórios
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 2);
            ctx.fillStyle = '#221508';
            ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 2;
            ctx.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);

            // Braços cinéticos externos
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(r * 0.7, -4, 18, 8);
            }
            ctx.restore();
        } else if (mb.type === 'miniboss_gravity') {
            // Gravity (Setor 6): Singularidade de dobra de pulso gravitacional
            ctx.fillStyle = '#120822';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#9933ff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Ondas de distorção gravitacional pulsantes
            const pulse = (time * 40) % 40;
            ctx.strokeStyle = `rgba(180, 50, 255, ${1 - pulse / 40})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r + pulse, 0, Math.PI * 2);
            ctx.stroke();
        } else if (mb.type === 'miniboss_knight') {
            // Knight (Setor 9): Cruzador rápido de investida com lança de plasma
            ctx.fillStyle = '#182028';
            ctx.beginPath();
            ctx.moveTo(x, y + r * 1.2);
            ctx.lineTo(x + r, y - r * 0.8);
            ctx.lineTo(x, y - r * 0.3);
            ctx.lineTo(x - r, y - r * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Lança frontal de energia
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y + r * 0.8, 4, 30);
        } else if (mb.type === 'miniboss_seraph') {
            // Seraph (Setor 15): Asas de luz biocibernéticas pulsantes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x, y - 24);
            ctx.lineTo(x - 14, y + 14);
            ctx.lineTo(x + 14, y + 14);
            ctx.closePath();
            ctx.fill();

            const spread = Math.abs(Math.sin(time * 3)) * 40;
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x - 60 - spread, y - 40);
            ctx.moveTo(x, y); ctx.lineTo(x + 60 + spread, y - 40);
            ctx.stroke();
        } else {
            // Renderizador geométrico reforçado para demais minibosses
            ctx.fillStyle = '#1c2430';
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            ctx.strokeStyle = mb.color || '#ff0055';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 2.G RENDER DE CHEFES PRINCIPAIS (The Gatekeeper, Leviathan, Core, Observer, Ascended)
    // ------------------------------------------------------------------------
    drawBossEncounter(ctx, boss) {
        ctx.save();
        const time = GAME.time || 0;
        const x = boss.x;
        const y = boss.y;
        const r = boss.radius;

        if (boss.type === 'gatekeeper') {
            // The Gatekeeper: Fortaleza modular com portais de defesa reforçada
            ctx.fillStyle = '#221508';
            ctx.fillRect(x - 36, y - 36, 72, 72);
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 36, y - 36, 72, 72);

            // Blindagem externa expansiva
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            const gatePulse = Math.sin(time * 8) * 6;
            ctx.strokeRect(x - 42 - gatePulse / 2, y - 42 - gatePulse / 2, 84 + gatePulse, 84 + gatePulse);

            // Núcleo energético laranja
            ctx.fillStyle = '#ff5500';
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();

            // Renderização das Torres de Railgun Destrutíveis
            if (boss.subsystems) {
                for (let i = 0; i < boss.subsystems.length; i++) {
                    const sub = boss.subsystems[i];
                    const sx = x + sub.offsetX;
                    const sy = y + sub.offsetY;

                    ctx.save();
                    if (sub.alive) {
                        ctx.fillStyle = '#1c1006';
                        ctx.fillRect(sx - 18, sy - 18, 36, 36);
                        ctx.strokeStyle = '#ff9900';
                        ctx.lineWidth = 2.5;
                        ctx.strokeRect(sx - 18, sy - 18, 36, 36);

                        // Cano de Railgun militar pesado
                        ctx.fillStyle = '#ff6600';
                        ctx.fillRect(sx - 4, sy + 6, 8, 20);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(sx - 2, sy + 18, 4, 8);

                        // Mini barra de HP do subsistema
                        const barW = 32;
                        const hpRatio = Math.max(0, sub.hp / sub.maxHp);
                        ctx.fillStyle = '#111';
                        ctx.fillRect(sx - barW / 2, sy - 26, barW, 4);
                        ctx.fillStyle = '#ff9900';
                        ctx.fillRect(sx - barW / 2, sy - 26, barW * hpRatio, 4);
                    } else {
                        // Torre destruída: carcaça em ruínas e metal derretido
                        ctx.fillStyle = '#0a0a0a';
                        ctx.fillRect(sx - 14, sy - 14, 28, 28);
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(sx - 14, sy - 14, 28, 28);

                        // Faíscas intermitentes
                        if (Math.sin(time * 20 + i) > 0.4) {
                            ctx.fillStyle = '#ffaa00';
                            ctx.beginPath();
                            ctx.arc(sx + Math.sin(time * 15) * 6, sy + Math.cos(time * 15) * 6, 2.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    ctx.restore();
                }
            }
        } else if (boss.type === 'leviathan') {
            // The Leviathan: Nave-mãe bioluminescente serpenteante
            ctx.fillStyle = '#1a0d2e';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#9900ff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Anéis duplos de contenção de plasma
            ctx.strokeStyle = 'rgba(200, 100, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r + 25, time * 1.5, time * 1.5 + Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, r + 15, -time * 2, -time * 2 + Math.PI);
            ctx.stroke();

            // Renderização dos Estabilizadores Gravitacionais Destrutíveis
            if (boss.subsystems) {
                for (let i = 0; i < boss.subsystems.length; i++) {
                    const sub = boss.subsystems[i];
                    const sx = x + sub.offsetX;
                    const sy = y + sub.offsetY;

                    ctx.save();
                    if (sub.alive) {
                        ctx.fillStyle = '#0f0518';
                        ctx.beginPath();
                        ctx.arc(sx, sy, sub.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#b033ff';
                        ctx.lineWidth = 2.5;
                        ctx.stroke();

                        // Vórtice gravitacional pulsante
                        ctx.strokeStyle = 'rgba(220, 120, 255, 0.8)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(sx, sy, sub.radius * 0.65, time * 4 * (i === 0 ? 1 : -1), time * 4 * (i === 0 ? 1 : -1) + Math.PI);
                        ctx.stroke();

                        // Mini barra de integridade do pod gravitacional
                        const barW = 34;
                        const hpRatio = Math.max(0, sub.hp / sub.maxHp);
                        ctx.fillStyle = '#111';
                        ctx.fillRect(sx - barW / 2, sy - sub.radius - 8, barW, 4);
                        ctx.fillStyle = '#b033ff';
                        ctx.fillRect(sx - barW / 2, sy - sub.radius - 8, barW * hpRatio, 4);
                    } else {
                        // Pod colapsado e estilhaçado
                        ctx.fillStyle = '#06020a';
                        ctx.beginPath();
                        ctx.arc(sx, sy, sub.radius * 0.7, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#281a33';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        } else if (boss.type === 'absolute_core') {
            // The Absolute Core: Hiper-esfera quântica de contenção com horizonte de eventos
            ctx.fillStyle = '#1e0508';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff0033';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Núcleo negro de colapso
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
            ctx.fill();

            // Singularidade pulsante interna
            const corePulse = r * 0.25 + Math.sin(time * 15) * 5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, Math.max(3, corePulse), 0, Math.PI * 2);
            ctx.fill();
        } else if (boss.type === 'observer_apex') {
            // Observer Apex: Olho cósmico transdimensional
            const isVuln = (boss.vulnerableTimer > 0);
            ctx.fillStyle = isVuln ? '#ffea00' : '#00e5ff';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Anel orbital de observação cósmica
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, r + 16 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
            ctx.stroke();

            // Íris e pupila cósmica
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (boss.type === 'dread_fleet') {
            // The Dread Fleet: Flagship de Guerra e Esquadrões de Batalha
            // Casco Principal do Cruzador
            ctx.fillStyle = '#1c1410';
            ctx.beginPath();
            ctx.moveTo(x, y + 55);         // Proa frontal
            ctx.lineTo(x + 50, y + 25);    // Asa estibordo
            ctx.lineTo(x + 40, y - 45);    // Traseira estibordo
            ctx.lineTo(x - 40, y - 45);    // Traseira bombordo
            ctx.lineTo(x - 50, y + 25);    // Asa bombordo
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Placas de Blindagem Grafite
            ctx.fillStyle = '#2d221c';
            ctx.beginPath();
            ctx.moveTo(x, y + 42);
            ctx.lineTo(x + 32, y + 16);
            ctx.lineTo(x + 25, y - 32);
            ctx.lineTo(x - 25, y - 32);
            ctx.lineTo(x - 32, y + 16);
            ctx.closePath();
            ctx.fill();

            // Ponte de Comando Central
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(x - 8, y - 10, 16, 20);

            // Escudo Ativo do Casco se o Gerador estiver Vivo
            let shieldCore = boss.subsystems ? boss.subsystems.find(s => s.id === 'shieldCore') : null;
            if (shieldCore && shieldCore.alive) {
                ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + Math.sin(time * 6) * 0.25})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, r + 15, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Exaustores de propulsão
            [-20, 20].forEach(ox => {
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(x + ox - 4, y - 48, 8, 5);
            });

            // Renderizar Subsistemas da Frota
            if (boss.subsystems) {
                for (let i = 0; i < boss.subsystems.length; i++) {
                    const sub = boss.subsystems[i];
                    const sx = x + sub.offsetX;
                    const sy = y + sub.offsetY;
                    ctx.save();
                    if (sub.alive) {
                        ctx.fillStyle = '#2a1a12';
                        ctx.beginPath();
                        ctx.arc(sx, sy, sub.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = sub.id === 'shieldCore' ? '#00e5ff' : '#ff5500';
                        ctx.lineWidth = 2.5;
                        ctx.stroke();

                        // Mini barra de HP
                        const barW = 32;
                        const ratio = Math.max(0, sub.hp / sub.maxHp);
                        ctx.fillStyle = '#111';
                        ctx.fillRect(sx - barW / 2, sy - sub.radius - 8, barW, 4);
                        ctx.fillStyle = sub.id === 'shieldCore' ? '#00e5ff' : '#ff5500';
                        ctx.fillRect(sx - barW / 2, sy - sub.radius - 8, barW * ratio, 4);
                    } else {
                        ctx.fillStyle = '#110a08';
                        ctx.beginPath();
                        ctx.arc(sx, sy, sub.radius * 0.7, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#3a2218';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        } else if (boss.type === 'blackout_signal') {
            // The Blackout Signal: Entidade Transdimensional
            const isVuln = (boss.vulnerableTimer > 0);
            
            // Distorção espacial externa pulsante
            ctx.strokeStyle = isVuln ? '#00ffff' : 'rgba(191, 0, 255, 0.6)';
            ctx.lineWidth = isVuln ? 4 : 2;
            ctx.beginPath();
            ctx.arc(x, y, r + 18 + Math.sin(time * 8) * 6, 0, Math.PI * 2);
            ctx.stroke();

            // Estrutura geométrica do sinal
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 1.5);
            ctx.strokeStyle = isVuln ? '#ffffff' : '#bf00ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(-25, -25, 50, 50);
            ctx.rotate(Math.PI / 4);
            ctx.strokeRect(-25, -25, 50, 50);
            ctx.restore();

            // Núcleo singular
            ctx.fillStyle = isVuln ? '#00ffff' : '#05020a';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Ponto de luz interno do sinal
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, isVuln ? 8 : 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawBasicEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Casco militar em formato de cunha de interceptação
        ctx.fillStyle = '#1a1012';
        ctx.beginPath();
        ctx.moveTo(0, 12);     // Bico voltado para o jogador (baixo)
        ctx.lineTo(-12, -8);   // Bordo esquerdo
        ctx.lineTo(-5, -6);    // Cavidade de escape esquerda
        ctx.lineTo(0, -3);     // Centro traseiro
        ctx.lineTo(5, -6);     // Cavidade de escape direita
        ctx.lineTo(12, -8);    // Bordo direito
        ctx.closePath();
        ctx.fill();

        // Blindagem frontal vermelha/âmbar
        ctx.fillStyle = '#3a1818';
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-8, -4);
        ctx.lineTo(8, -4);
        ctx.closePath();
        ctx.fill();

        // Contorno das placas
        ctx.strokeStyle = '#5c2222';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sensor / Olho óptico hostil central (brilho pulsante)
        const eyePulse = Math.sin((e.timer || 0) * 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 30, 30, ${eyePulse})`;
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Micro-exaustores vermelhos traseiros
        ctx.fillStyle = 'rgba(255, 60, 0, 0.7)';
        ctx.fillRect(-7, -9, 3, 3);
        ctx.fillRect(4, -9, 3, 3);

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 2.B RENDER DE INIMIGO WEAVER (Corveta Tática Sinusoidal / Dispersão)
    // ------------------------------------------------------------------------
    drawWeaverEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Casco militar em duplo delta assimétrico
        ctx.fillStyle = '#1c1810';
        ctx.beginPath();
        ctx.moveTo(0, 14);      // Ponta frontal
        ctx.lineTo(14, -2);     // Asa direita
        ctx.lineTo(8, -8);      // Estabilizador
        ctx.lineTo(0, -5);
        ctx.lineTo(-8, -8);     // Estabilizador esquerdo
        ctx.lineTo(-14, -2);    // Asa esquerda
        ctx.closePath();
        ctx.fill();

        // Placas de blindagem douradas/âmbar
        ctx.fillStyle = '#403010';
        ctx.beginPath();
        ctx.moveTo(0, 11);
        ctx.lineTo(8, -1);
        ctx.lineTo(-8, -1);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#705515';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Matriz de disparo triplo frontal
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-6, -2, 2, 4);
        ctx.fillRect(-1, 2, 2, 4);
        ctx.fillRect(4, -2, 2, 4);

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 2.C RENDER DE INIMIGO HUNTER (Interceptor Rápido de Investida)
    // ------------------------------------------------------------------------
    drawHunterEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        let angle = Math.atan2(e.vy, e.vx);
        ctx.rotate(angle - Math.PI / 2);

        const isCharging = e.state === 'charging';
        const hullColor = isCharging ? '#331200' : '#1e1410';
        const plateColor = isCharging ? '#662200' : '#3d1a0c';
        const glowColor = isCharging ? '#ff3300' : '#ff7700';

        // Casco afilado agressivo tipo dardo
        ctx.fillStyle = hullColor;
        ctx.beginPath();
        ctx.moveTo(0, 16);     // Bico pontiagudo de investida
        ctx.lineTo(10, -10);   // Asa dobrada
        ctx.lineTo(4, -6);
        ctx.lineTo(0, -9);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();

        // Blindagem angular de impacto frontal
        ctx.fillStyle = plateColor;
        ctx.beginPath();
        ctx.moveTo(0, 13);
        ctx.lineTo(6, -4);
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Trilha de calor / exaustor de investida
        if (isCharging) {
            ctx.fillStyle = '#ff5500';
            ctx.beginPath();
            ctx.moveTo(-3, -9);
            ctx.lineTo(3, -9);
            ctx.lineTo(0, -22);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 2.D RENDER DE INIMIGO HEAVY (Cruzador Blindado de Assalto)
    // ------------------------------------------------------------------------
    drawHeavyEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Casco pesado octogonal blindado
        ctx.fillStyle = '#161022';
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(16, 8);
        ctx.lineTo(20, -6);
        ctx.lineTo(12, -16);
        ctx.lineTo(-12, -16);
        ctx.lineTo(-20, -6);
        ctx.lineTo(-16, 8);
        ctx.closePath();
        ctx.fill();

        // Blindagem reforçada roxa/grafite
        ctx.fillStyle = '#2c1e44';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(12, 5);
        ctx.lineTo(15, -4);
        ctx.lineTo(8, -12);
        ctx.lineTo(-8, -12);
        ctx.lineTo(-15, -4);
        ctx.lineTo(-12, 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5a3d8a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Baterias laterais pesadas
        ctx.fillStyle = '#0d0814';
        ctx.fillRect(-18, -2, 4, 8);
        ctx.fillRect(14, -2, 4, 8);

        // Núcleo energético roxo pulsante
        ctx.fillStyle = '#9933ff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 2.E RENDER DE INIMIGO SNIPER (Fragata de Longo Alcance com Trilho Laser)
    // ------------------------------------------------------------------------
    drawSniperEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        let angle = e.aimAngle || Math.PI / 2;
        ctx.rotate(angle - Math.PI / 2);

        // Trilho do canhão longo
        ctx.fillStyle = '#081518';
        ctx.fillRect(-2, -8, 4, 26);

        // Casco esguio de precisão
        ctx.fillStyle = '#101c20';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(12, -8);
        ctx.lineTo(6, -12);
        ctx.lineTo(-6, -12);
        ctx.lineTo(-12, -8);
        ctx.closePath();
        ctx.fill();

        // Blindagem ciano-escuro
        ctx.fillStyle = '#1c343c';
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(8, -6);
        ctx.lineTo(-8, -6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Lente de precisão óptica
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 3. RENDER DE PROJÉTEIS REFINADOS (Feixes de Plasma com Núcleo e Rastro)
    // ------------------------------------------------------------------------
    drawProjectile(ctx, proj) {
        if (!proj.active) return;
        ctx.save();
        ctx.translate(proj.x, proj.y);

        if (proj.type === 'normal') {
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.rotate(angle);

            // Rastro de energia / alongamento cinemático
            const isPlayer = proj.isPlayer;
            const coreColor = '#ffffff';
            const glowColor = proj.color || (isPlayer ? '#00e5ff' : '#ff2222');

            // Aura de energia alongada
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.ellipse(0, 0, proj.radius * 2.8, proj.radius * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo brilhante
            ctx.fillStyle = coreColor;
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.ellipse(1, 0, proj.radius * 1.6, proj.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'railgun') {
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.rotate(angle);
            // Núcleo hiper-concentrado
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-proj.radius * 2.5, -proj.radius * 0.5, proj.radius * 5, proj.radius);
            // Fake Glow
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(-proj.radius * 3.5, -proj.radius * 1.2, proj.radius * 7, proj.radius * 2.4);
        } else if (proj.type === 'bfg') {
            ctx.fillStyle = proj.color;
            ctx.beginPath(); ctx.arc(0, 0, proj.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, proj.radius * 0.5, 0, Math.PI * 2); ctx.fill();
        } else {
            // Projétil padrão circular com gradiente de alta legibilidade
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, proj.radius * 0.65, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = 0.55;
            ctx.beginPath(); ctx.arc(0, 0, proj.radius * 1.5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 4. ARENA COM PROFUNDIDADE E PERSPECTIVA SIMULADA (Estrelas em 3 Camadas)
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // 3.B FROTA MILITAR DE FUNDO E ESTRUTURAS CINEMATOGRÁFICAS
    // ------------------------------------------------------------------------
    drawFleetAndStructures(ctx) {
        if (typeof GAME === 'undefined' || !GAME.w) return;
        const time = GAME.time || 0;
        const sector = (typeof SAVE !== 'undefined' && SAVE.data?.checkpoint?.sector) || 1;

        ctx.save();

        // 1. Nave Capital Aliada (Cruiser Dreadnought) flutuando no fundo à esquerda
        const cruiserY = (GAME.h * 0.25) + Math.sin(time * 0.3) * 15;
        const cruiserX = GAME.w * 0.12;

        ctx.fillStyle = '#0a0f16';
        ctx.beginPath();
        ctx.moveTo(cruiserX, cruiserY - 90);
        ctx.lineTo(cruiserX + 28, cruiserY - 20);
        ctx.lineTo(cruiserX + 22, cruiserY + 90);
        ctx.lineTo(cruiserX - 22, cruiserY + 90);
        ctx.lineTo(cruiserX - 28, cruiserY - 20);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#162230';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Janelas e luzes de navegação do cruzador aliado
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        for (let i = -60; i < 70; i += 18) {
            ctx.fillRect(cruiserX - 8, cruiserY + i, 16, 2.5);
        }

        // 2. Estação Orbital / Estrutura de Defesa ao fundo à direita
        const stationX = GAME.w * 0.88;
        const stationY = (GAME.h * 0.65) + Math.cos(time * 0.25) * 12;
        const stationRot = time * 0.08;

        ctx.save();
        ctx.translate(stationX, stationY);
        ctx.rotate(stationRot);

        // Anel orbital de defesa
        ctx.strokeStyle = '#121820';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();

        // Raios da estação
        ctx.strokeStyle = '#1a2430';
        ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
            const ang = (Math.PI / 2) * a;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * 75, Math.sin(ang) * 75);
            ctx.stroke();
        }

        // Núcleo de energia
        ctx.fillStyle = (sector >= 17) ? 'rgba(160, 0, 255, 0.5)' : 'rgba(0, 229, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
    },

    drawEnhancedSpace(ctx, stars, bgY) {
        // Fundo cósmico com gradiente de profundidade sutil (azul grafite escuro)
        const isSanctuary = (GAME.state === 'SANCTUARY' || GAME.state === 'LAUNCHING' || GAME.state === 'DOCKING');
        if (isSanctuary) {
            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, GAME.w, GAME.h);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME.h);
            bgGrad.addColorStop(0, '#020409');
            bgGrad.addColorStop(0.5, '#010204');
            bgGrad.addColorStop(1, '#000000');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, GAME.w, GAME.h);
        }

        // Frota aliada e estruturas espaciais em órbita de fundo
        if (!isSanctuary) {
            this.drawFleetAndStructures(ctx);
        }

        // Estrelas com velocidades de parallax estratificadas
        stars.forEach(s => {
            const alpha = s.alpha * 0.85 + 0.15;
            if (s.size > 2) {
                // Estrela próxima (rápida, brilhante e leve tom ciano)
                ctx.fillStyle = `rgba(180, 240, 255, ${alpha})`;
                ctx.fillRect(s.x, s.y, s.size, s.size * 1.8);
            } else if (s.size > 1.2) {
                // Estrela intermediária
                ctx.fillStyle = `rgba(220, 230, 255, ${alpha * 0.8})`;
                ctx.fillRect(s.x, s.y, s.size, s.size * 1.2);
            } else {
                // Estrela distante e estática de fundo
                ctx.fillStyle = `rgba(140, 160, 190, ${alpha * 0.5})`;
                ctx.fillRect(s.x, s.y, s.size, s.size);
            }
        });

        // Hangar do Santuário
        if (isSanctuary) {
            ctx.fillStyle = '#0a0d12';
            ctx.fillRect(GAME.w / 2 - 220, 0, 440, GAME.h);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(GAME.w / 2 - 220, 0, 440, GAME.h);

            // Guias de doca militares
            for (let i = -200; i < GAME.h; i += 150) {
                ctx.fillStyle = '#141c24';
                ctx.fillRect(GAME.w / 2 - 200, i + (bgY % 150), 400, 45);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
                ctx.fillRect(GAME.w / 2 - 200, i + (bgY % 150) + 40, 400, 3);
            }
        }
    },

    drawSynergyTelemetry(ctx, p1, p2) {
        if (!p1 || !p2 || p1.state !== 'ALIVE' || p2.state !== 'ALIVE') return;
        const time = GAME.time || 0;
        const isLinked = (GAME.linkStateTimer > 0);
        const isCombined = (p1.specialActive > 0 && p2.specialActive > 0);

        if (!isLinked && !isCombined) return;

        ctx.save();
        // Linha quântica de conexão tática
        ctx.strokeStyle = isCombined ? 'rgba(255, 0, 128, 0.7)' : 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = isCombined ? 3 : 1.5;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -time * 50;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Marcador central de telemetria de sinergia
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.fillStyle = isCombined ? 'rgba(255, 0, 128, 0.8)' : 'rgba(0, 229, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(midX, midY, 6 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
        ctx.fill();

        let synName = (typeof GAME.getSynergyName === 'function') ? GAME.getSynergyName(p1, p2) : "VOID RESONANCE";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = isCombined ? '#ff0080' : '#00e5ff';
        ctx.fillText(synName.toUpperCase(), midX, midY - 14);

        ctx.restore();
    }
};

// Integração global
if (typeof window !== 'undefined') {
    window.RENDERER2D = RENDERER2D;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RENDERER2D;
}
