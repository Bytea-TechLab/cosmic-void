const SAVE = {
    data: {},
    getDefault() {
        const prefersReducedMotion = (typeof window !== 'undefined' && typeof window.matchMedia === 'function') 
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
            : false;

        return {
            credits: [0, 0], 
            highScore: 0,
            skills: [
                { damage: 0, mobility: 0, defense: 0, specialty: 0 },
                { damage: 0, mobility: 0, defense: 0, specialty: 0 }
            ],
            stats: { deaths: 0, bossesDefeated: 0 },
            settings: { 
                reducedMotion: prefersReducedMotion,
                slowMotion: !prefersReducedMotion,
                screenShake: prefersReducedMotion ? 0.0 : 1.0, 
                particleDensity: prefersReducedMotion ? 0.5 : 1.0, 
                flashIntensity: prefersReducedMotion ? 0.2 : 1.0, 
                crtFilter: true,
                haptics: true,
                autoFire: false,
                joySensitivity: 1.0,
                controlMode: 'auto',
                graphicProfile: 'high'
            },
            checkpoint: { sector: 1, p1Class: "assault", p2Class: null, score: 0, bossPhase: 0, villain: null }
        };
    },
    init() {
        try { 
            const d = localStorage.getItem('cosmic_void_v11_final'); 
            let parsed = d ? JSON.parse(d) : null;
            
            if(parsed && parsed.checkpoint) {
                // Garante que saves antigos não quebrem se não tiverem a tag bossPhase ou villain
                if(parsed.checkpoint.bossPhase === undefined) parsed.checkpoint.bossPhase = 0;
                if(parsed.checkpoint.villain === undefined) parsed.checkpoint.villain = null;
                const defSettings = this.getDefault().settings;
                parsed.settings = Object.assign({}, defSettings, parsed.settings || {});
                this.data = parsed;
            } else {
                this.data = this.getDefault();
            }
            if (typeof VILLAIN !== 'undefined') {
                VILLAIN.initFromSave();
            }
        } 
        catch (e) { this.data = this.getDefault(); }
    },
    save() {
        try { localStorage.setItem('cosmic_void_v11_final', JSON.stringify(this.data)); } catch (e) {}
    }
};
SAVE.init();
