const SANCTUARY = {
    startDocking() {
        GAME.state = 'DOCKING';
        document.getElementById('hud').style.display = 'none';
        
        setTimeout(() => { this.enter(); }, 3000);
    },
    enter() { 
        GAME.state = 'SANCTUARY'; WORLD.bgY = 0; 
        document.getElementById('sanctuary').style.display = 'block'; 
        SAVE.save(); 
    },
    launch() { 
        document.getElementById('sanctuary').style.display = 'none'; 
        document.getElementById('upgrades').style.display = 'none'; 
        GAME.state = 'LAUNCHING'; 
        
        // REPARA 25% DA VIDA MÁXIMA PARA OS SOBREVIVENTES
        if(GAME.p1) { GAME.p1.hp = Math.min(GAME.p1.maxHp, GAME.p1.hp + (GAME.p1.maxHp * 0.25)); }
        if(GAME.p2) { GAME.p2.hp = Math.min(GAME.p2.maxHp, GAME.p2.hp + (GAME.p2.maxHp * 0.25)); }

        if(GAME.p1) { GAME.p1.x = GAME.w/2 - 50; GAME.p1.y = GAME.h - 50; }
        if(GAME.p2) { GAME.p2.x = GAME.w/2 + 50; GAME.p2.y = GAME.h - 50; }
        
        setTimeout(() => {
            SAVE.data.checkpoint.sector++; 
            SAVE.data.checkpoint.bossPhase = 0; // Garantia dupla de limpeza
            SAVE.save(); 
            
            document.getElementById('hud').style.display = 'block'; 
            // Atualiza o visual da HUD para refletir o conserto da nave
            if(GAME.p1) UI.updateHP(GAME.p1.hp, GAME.p1.maxHp, false);
            if(GAME.p2) UI.updateHP(GAME.p2.hp, GAME.p2.maxHp, true);
            
            GAME.state = 'PLAYING'; PACING.reset(); UI.updateSector(SAVE.data.checkpoint.sector); 
        }, 2000);
    }
};