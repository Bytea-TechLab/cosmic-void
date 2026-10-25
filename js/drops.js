class Drop {
    constructor() { this.active = false; }
    spawn(x, y, forceType=null) {
        this.x = x; this.y = y; this.active = true; this.radius = 8; this.timer = 0;
        
        if(forceType) {
            this.type = forceType;
            if(forceType === 'buff_maxhp') this.color = '#0f8'; 
            else if(forceType === 'buff_dmg') this.color = '#f50'; 
            else if(forceType === 'buff_spd') this.color = '#0ff'; 
            else if(forceType === 'buff_shot') this.color = '#fff'; 
            else if(forceType === 'orb_dash') this.color = '#00f'; 
            else if(forceType === 'orb_weapon') this.color = '#ff0'; 
            else if(forceType === 'orb_overdrive') this.color = '#f0f'; 
            else if(forceType === 'orb_parity') this.color = '#fff'; 
            else if(forceType === 'orb_rare') this.color = '#ffaa00'; 
        } else {
            let rand = Math.random();
            if(rand < 0.20) { this.type = 'hp'; this.color = '#f00'; } 
            else if(rand < 0.40) { this.type = 'credits'; this.color = '#ff0'; } 
            else if(rand < 0.50) { this.type = 'special'; this.color = '#f0f'; } 
            else if(rand < 0.60) { this.type = 'shield'; this.color = '#00f'; } 
            else if(rand < 0.70) { this.type = 'orb_dash'; this.color = '#00f'; } 
            else if(rand < 0.85) { this.type = 'orb_weapon'; this.color = '#ff0'; } 
            else if(rand < 0.96) { this.type = 'orb_overdrive'; this.color = '#f0f'; } 
            else { this.type = 'orb_rare'; this.color = '#ffaa00'; } 
        }
        
        if (this.type === 'orb_rare') this.radius = 16;
    }
    update(dt) {
        if(!this.active) return;
        this.timer += dt;

        let magnetRadius = 250; // Área de detecção da gravidade
        let target = null;
        let minDist = magnetRadius;

        // Escaneia quem está mais próximo (P1 ou P2)
        [GAME.p1, GAME.p2].forEach(p => {
            if (p && p.state === 'ALIVE') {
                let dist = Math.hypot(this.x - p.x, this.y - p.y);
                if (dist < minDist) {
                    minDist = dist;
                    target = p;
                }
            }
        });

        // Se encontrou um jogador no raio, é puxado
        if (target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            // Quanto mais perto da nave, mais forte e rápido o item voa
            let pullStrength = (magnetRadius - minDist) / magnetRadius; 
            let speed = 200 + (600 * pullStrength); 
            
            this.x += Math.cos(angle) * speed * dt;
            this.y += Math.sin(angle) * speed * dt;
        } else {
            // Comportamento normal de queda solta
            this.y += 200 * dt; 
            this.x += Math.sin(this.timer * 4) * 1.5;
        }

        if(this.y > GAME.h + 50) this.active = false;
    }
    draw(ctx) {
        if(!this.active) return;
        ctx.fillStyle = this.color;
        
        if (this.type === 'orb_rare' && Math.floor(GAME.time * 20) % 2 === 0) {
            ctx.fillStyle = '#fff';
        }
        
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        ctx.globalAlpha = 0.5 + Math.sin(this.timer * 10) * 0.5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 1.5 + (this.type.startsWith('orb') ? Math.sin(this.timer*20)*5 : 0), 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Inicializado Diretamente!
window.DROP_POOL = new Pool(() => new Drop(), 50);