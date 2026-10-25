const INPUT = {
    keys: {},
    isTouch: false,
    touchJoy: {
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        curX: 0,
        curY: 0,
        dx: 0,
        dy: 0,
        radius: 55,
        deadZone: 0.08
    },
    touchButtons: {
        dash: false,
        shoot: false,
        special: false,
        synergy: false
    },
    // Alias para P1
    get touchJoyP1() { return this.touchJoy; },
    get touchButtonsP1() { return this.touchButtons; },

    // Controles Touch independentes para P2 (Co-op Local Móvel)
    touchJoyP2: {
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        curX: 0,
        curY: 0,
        dx: 0,
        dy: 0,
        radius: 55,
        deadZone: 0.08
    },
    touchButtonsP2: {
        dash: false,
        shoot: false,
        special: false,
        synergy: false
    },

    getGamepadState(playerIndex) {
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
        let gamepads = navigator.getGamepads();
        if (!gamepads) return null;
        
        let gp = null;
        if (playerIndex === 0) {
            gp = gamepads[0] || null;
        } else if (playerIndex === 1) {
            gp = gamepads[1] || (gamepads[0] && (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']) ? gamepads[0] : null);
        }
        if (!gp) return null;

        let deadzone = 0.22;
        let ax = gp.axes && gp.axes[0] !== undefined ? gp.axes[0] : 0;
        let ay = gp.axes && gp.axes[1] !== undefined ? gp.axes[1] : 0;
        if (Math.abs(ax) < deadzone) ax = 0;
        if (Math.abs(ay) < deadzone) ay = 0;

        // D-pad fallback
        if (gp.buttons && gp.buttons[14]?.pressed) ax = -1;
        if (gp.buttons && gp.buttons[15]?.pressed) ax = 1;
        if (gp.buttons && gp.buttons[12]?.pressed) ay = -1;
        if (gp.buttons && gp.buttons[13]?.pressed) ay = 1;

        let len = Math.hypot(ax, ay);
        if (len > 1.0) { ax /= len; ay /= len; }

        return {
            dx: ax,
            dy: ay,
            shoot: Boolean(gp.buttons && (gp.buttons[0]?.pressed || gp.buttons[7]?.pressed)),
            dash: Boolean(gp.buttons && (gp.buttons[1]?.pressed || gp.buttons[6]?.pressed)),
            special: Boolean(gp.buttons && (gp.buttons[2]?.pressed || gp.buttons[4]?.pressed)),
            synergy: Boolean(gp.buttons && (gp.buttons[3]?.pressed || gp.buttons[5]?.pressed))
        };
    },

    isMobile() {
        if (typeof window === 'undefined') return false;
        const hasTouch = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && ((navigator.maxTouchPoints || 0) > 0 || (navigator.msMaxTouchPoints || 0) > 0));
        const isCoarse = (typeof window.matchMedia === 'function') && window.matchMedia('(pointer: coarse)').matches;
        const isSmall = Math.min(window.innerWidth || 800, window.innerHeight || 600) <= 800;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
        return Boolean(hasTouch && (isCoarse || isSmall || isMobileUA));
    },

    resetInputs() {
        this.keys = {};
        this.touchButtons.dash = false;
        this.touchButtons.shoot = false;
        this.touchButtons.special = false;
        this.touchButtons.synergy = false;
        if (this.touchJoy) {
            this.touchJoy.active = false;
            this.touchJoy.id = null;
            this.touchJoy.dx = 0;
            this.touchJoy.dy = 0;
        }

        this.touchButtonsP2.dash = false;
        this.touchButtonsP2.shoot = false;
        this.touchButtonsP2.special = false;
        this.touchButtonsP2.synergy = false;
        if (this.touchJoyP2) {
            this.touchJoyP2.active = false;
            this.touchJoyP2.id = null;
            this.touchJoyP2.dx = 0;
            this.touchJoyP2.dy = 0;
        }

        if (typeof document !== 'undefined') {
            const joyBase = document.getElementById('joystick-base');
            if (joyBase) joyBase.style.display = 'none';
            const joyKnob = document.getElementById('joystick-knob');
            if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';

            const joyBase2 = document.getElementById('joystick-base-p2');
            if (joyBase2) joyBase2.style.display = 'none';
            const joyKnob2 = document.getElementById('joystick-knob-p2');
            if (joyKnob2) joyKnob2.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';
            
            ['touch-dash-btn', 'touch-fire-btn', 'touch-spec-btn', 'touch-syn-btn',
             'touch-dash-btn-p2', 'touch-fire-btn-p2', 'touch-spec-btn-p2', 'touch-syn-btn-p2'].forEach(id => {
                document.getElementById(id)?.classList.remove('active');
            });
        }
    },

    init() {
        this.isTouch = (typeof window !== 'undefined' && 'ontouchstart' in window) || (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0) || this.isMobile();

        // Teclado Desktop
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            
            // Inicialização de telas de Menu
            if(typeof GAME !== 'undefined' && GAME.state === 'MENU' && document.getElementById('controls-menu')?.style.display !== 'block') {
                if(e.code === 'KeyQ') GAME.start('assault', false, false);
                if(e.code === 'KeyE') GAME.start('scout', false, false);
                if(e.code === 'KeyR') GAME.start('tank', false, false);
                if(e.code === 'KeyF') GAME.start('ranger', false, false);
                if(e.code === 'Digit1') GAME.selectCoopClass(1, 'assault');
                if(e.code === 'Digit2') GAME.selectCoopClass(1, 'scout');
                if(e.code === 'Digit3') GAME.selectCoopClass(1, 'tank');
                if(e.code === 'Digit4') GAME.selectCoopClass(1, 'ranger');
                if(e.code === 'KeyT') GAME.startCoopFromMenu();
                if(e.code === 'KeyC') {
                    if (typeof GAME.continueGame === 'function') {
                        GAME.continueGame();
                    } else {
                        const checkpoint = (typeof SAVE !== 'undefined' && SAVE.data?.checkpoint) ? SAVE.data.checkpoint : {};
                        GAME.start(checkpoint.p1Class || 'assault', true, Boolean(checkpoint.p2Class), checkpoint.p2Class || 'scout');
                    }
                }
            }
            if(e.code === 'KeyP' && typeof UI !== 'undefined') UI.togglePause();
            if(e.code === 'KeyU' && typeof GAME !== 'undefined' && GAME.state === 'SANCTUARY' && typeof UI !== 'undefined') {
                e.preventDefault();
                UI.toggleUpgrades();
            }
            if(e.code === 'Enter' && typeof GAME !== 'undefined' && GAME.state === 'SANCTUARY' && document.getElementById('upgrades')?.style.display !== 'block') {
                e.preventDefault();
                if (typeof SANCTUARY !== 'undefined') SANCTUARY.launch();
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // Prevenção de ações presas ao perder o foco ou alternar aplicativos
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('blur', () => this.resetInputs());
            window.addEventListener('pointercancel', () => this.resetInputs());
        }
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.resetInputs();
            });
        }

        // Controles Touch & Pointer Events
        this.initTouchControls();
    },

    initTouchControls() {
        if (typeof document === 'undefined') return;

        const joyZone = document.getElementById('touch-joystick-zone');
        const joyBase = document.getElementById('joystick-base');
        const joyKnob = document.getElementById('joystick-knob');

        const btnDash = document.getElementById('touch-dash-btn');
        const btnFire = document.getElementById('touch-fire-btn');
        const btnSpec = document.getElementById('touch-spec-btn');
        const btnSyn = document.getElementById('touch-syn-btn');
        const btnPause = document.getElementById('touch-pause-btn');

        const btnDashP2 = document.getElementById('touch-dash-btn-p2');
        const btnFireP2 = document.getElementById('touch-fire-btn-p2');
        const btnSpecP2 = document.getElementById('touch-spec-btn-p2');
        const btnSynP2 = document.getElementById('touch-syn-btn-p2');

        const joyZoneP2 = document.getElementById('touch-joystick-zone-p2');
        const joyBaseP2 = document.getElementById('joystick-base-p2');
        const joyKnobP2 = document.getElementById('joystick-knob-p2');

        const canvas = document.getElementById('gameCanvas');

        // Previne comportamentos acidentais do navegador (seleção de texto, zoom, context menu)
        const preventTouchDefault = (el) => {
            if (!el || typeof el.addEventListener !== 'function') return;
            el.addEventListener('contextmenu', e => { if (e.preventDefault) e.preventDefault(); });
            el.addEventListener('touchstart', e => { if (e.preventDefault) e.preventDefault(); }, { passive: false });
            el.addEventListener('touchmove', e => { if (e.preventDefault) e.preventDefault(); }, { passive: false });
        };

        [joyZone, btnDash, btnFire, btnSpec, btnSyn, btnPause, 
         joyZoneP2, btnDashP2, btnFireP2, btnSpecP2, btnSynP2, canvas].forEach(preventTouchDefault);

        // Mapeamento dos botões de ação com suporte robusto a Pointer Events e Touch
        const setupButton = (el, targetButtons, actionKey, vibrateMs) => {
            if (!el) return;

            const onDown = (e) => {
                if (e.preventDefault) e.preventDefault();
                targetButtons[actionKey] = true;
                el.classList.add('active');
                if (el.setPointerCapture && e.pointerId !== undefined) {
                    try { el.setPointerCapture(e.pointerId); } catch(err){}
                }
                if (typeof navigator !== 'undefined' && navigator.vibrate && SAVE.data?.settings?.haptics) {
                    navigator.vibrate(vibrateMs || 15);
                }
            };

            const onUp = (e) => {
                if (e.preventDefault) e.preventDefault();
                targetButtons[actionKey] = false;
                el.classList.remove('active');
                if (el.releasePointerCapture && e.pointerId !== undefined) {
                    try { el.releasePointerCapture(e.pointerId); } catch(err){}
                }
            };

            // Pointer events primários
            el.addEventListener('pointerdown', onDown);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointercancel', onUp);

            // Fallback de Touch Events
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                targetButtons[actionKey] = true;
                el.classList.add('active');
                if (typeof navigator !== 'undefined' && navigator.vibrate && SAVE.data?.settings?.haptics) {
                    navigator.vibrate(vibrateMs || 15);
                }
            }, { passive: false });

            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                targetButtons[actionKey] = false;
                el.classList.remove('active');
            }, { passive: false });

            el.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                targetButtons[actionKey] = false;
                el.classList.remove('active');
            }, { passive: false });
        };

        // P1 Botões
        setupButton(btnDash, this.touchButtons, 'dash', 20);
        setupButton(btnFire, this.touchButtons, 'shoot', 10);
        setupButton(btnSpec, this.touchButtons, 'special', 25);
        setupButton(btnSyn, this.touchButtons, 'synergy', 30);

        // P2 Botões
        setupButton(btnDashP2, this.touchButtonsP2, 'dash', 20);
        setupButton(btnFireP2, this.touchButtonsP2, 'shoot', 10);
        setupButton(btnSpecP2, this.touchButtonsP2, 'special', 25);
        setupButton(btnSynP2, this.touchButtonsP2, 'synergy', 30);

        if (btnPause) {
            const onPause = (e) => {
                if (e.preventDefault) e.preventDefault();
                if (typeof UI !== 'undefined' && UI.togglePause) UI.togglePause();
            };
            btnPause.addEventListener('pointerdown', onPause);
            btnPause.addEventListener('touchstart', onPause, { passive: false });
        }

        // Lógica de Movimento: Joystick Dinâmico com Pointer Events
        const setupJoystick = (zone, base, knob, joyObj) => {
            if (!zone || !base || !knob || !joyObj) return;

            const handleJoyStart = (clientX, clientY, pointerId) => {
                if (joyObj.id !== null) return;
                joyObj.id = pointerId;
                joyObj.active = true;

                const rect = zone.getBoundingClientRect();
                const localX = clientX - rect.left;
                const localY = clientY - rect.top;

                joyObj.startX = localX;
                joyObj.startY = localY;
                joyObj.curX = localX;
                joyObj.curY = localY;
                joyObj.dx = 0;
                joyObj.dy = 0;

                base.style.display = 'block';
                base.style.left = `${localX}px`;
                base.style.top = `${localY}px`;
                knob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
            };

            const handleJoyMove = (clientX, clientY, pointerId) => {
                if (!joyObj.active || joyObj.id !== pointerId) return;

                const rect = zone.getBoundingClientRect();
                const localX = clientX - rect.left;
                const localY = clientY - rect.top;

                const rawDx = localX - joyObj.startX;
                const rawDy = localY - joyObj.startY;
                const dist = Math.hypot(rawDx, rawDy);
                const maxR = joyObj.radius;

                let clampedX = rawDx;
                let clampedY = rawDy;
                if (dist > maxR) {
                    clampedX = (rawDx / dist) * maxR;
                    clampedY = (rawDy / dist) * maxR;
                }

                knob.style.transform = `translate(-50%, -50%) translate(${clampedX}px, ${clampedY}px)`;

                const normDist = Math.min(dist / maxR, 1.0);
                if (normDist < joyObj.deadZone) {
                    joyObj.dx = 0;
                    joyObj.dy = 0;
                } else {
                    const sens = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.joySensitivity) || 1.0;
                    const scaledDist = Math.min(((normDist - joyObj.deadZone) / (1 - joyObj.deadZone)) * sens, 1.0);
                    joyObj.dx = (rawDx / dist) * scaledDist;
                    joyObj.dy = (rawDy / dist) * scaledDist;
                }
            };

            const handleJoyEnd = (pointerId) => {
                if (!joyObj.active || joyObj.id !== pointerId) return;
                joyObj.active = false;
                joyObj.id = null;
                joyObj.dx = 0;
                joyObj.dy = 0;
                base.style.display = 'none';
                knob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
            };

            zone.addEventListener('pointerdown', (e) => {
                if (e.preventDefault) e.preventDefault();
                handleJoyStart(e.clientX, e.clientY, e.pointerId);
                if (zone.setPointerCapture) {
                    try { zone.setPointerCapture(e.pointerId); } catch(err){}
                }
            });

            zone.addEventListener('pointermove', (e) => {
                if (e.preventDefault) e.preventDefault();
                handleJoyMove(e.clientX, e.clientY, e.pointerId);
            });

            const onJoyPointerUp = (e) => {
                if (e.preventDefault) e.preventDefault();
                handleJoyEnd(e.pointerId);
                if (zone.releasePointerCapture) {
                    try { zone.releasePointerCapture(e.pointerId); } catch(err){}
                }
            };

            zone.addEventListener('pointerup', onJoyPointerUp);
            zone.addEventListener('pointercancel', onJoyPointerUp);

            zone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (joyObj.id !== null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    handleJoyStart(t.clientX, t.clientY, t.identifier);
                    break;
                }
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (!joyObj.active || joyObj.id === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === joyObj.id) {
                        handleJoyMove(t.clientX, t.clientY, t.identifier);
                        break;
                    }
                }
            }, { passive: false });

            const onTouchEnd = (e) => {
                if (!joyObj.active || joyObj.id === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === joyObj.id) {
                        handleJoyEnd(t.identifier);
                        break;
                    }
                }
            };

            window.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchcancel', onTouchEnd);
        };

        // Joystick P1 & Joystick P2
        setupJoystick(joyZone, joyBase, joyKnob, this.touchJoy);
        setupJoystick(joyZoneP2, joyBaseP2, joyKnobP2, this.touchJoyP2);
    },

    updateTouchHUDVisibility() {
        if (typeof document === 'undefined') return;
        const mc = document.getElementById('mobile-controls');
        if (!mc) return;

        const mode = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.controlMode) || 'auto';
        const isGamePlaying = typeof GAME !== 'undefined' && GAME.state === 'PLAYING';
        let show = false;

        if (mode === 'hidden') {
            show = false;
        } else if (mode === 'always') {
            show = isGamePlaying;
        } else {
            show = (this.isTouch || this.isMobile()) && isGamePlaying;
        }

        mc.style.display = show ? 'block' : 'none';

        const isCoop = typeof GAME !== 'undefined' && GAME.isCoop;
        const p2Group = document.getElementById('touch-p2-group');
        if (p2Group) {
            p2Group.style.display = (show && isCoop) ? 'block' : 'none';
        }
        if (show && isCoop) {
            mc.classList.add('coop-touch-active');
        } else {
            mc.classList.remove('coop-touch-active');
        }
    }
};

INPUT.init();
