class Projectile {
    constructor() { this.active = false; this.hitTargets = new Set(); }
    spawn(x, y, vx, vy, isPlayer, type, color, ownerIndex = null, damageMult = 1, critChance = 0, critMult = 1.5, rawDmg = null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.isPlayer = isPlayer; this.type = type; this.color = color;
        this.ownerIndex = ownerIndex;
        this.damageMult = damageMult;
        this.speedScale = isPlayer ? 60 : 42;
        this.active = true; this.isParried = false; this.hitTargets.clear();
        this.critChance = critChance;
        this.critMult = critMult;
        
        if (!isPlayer) {
            if (rawDmg !== null && rawDmg !== undefined) this.damage = rawDmg;
            else if (type === 'normal') this.damage = 10;
            else if (type === 'plasma') this.damage = 14;
            else if (type === 'shotgun') this.damage = 8;
            else if (type === 'railgun') this.damage = 20;
            else if (type === 'bfg') this.damage = 26;
            else this.damage = 10;
        } else {
            this.damage = null;
        }
        
        if(type === 'normal') this.radius = 4;
        else if(type === 'plasma') this.radius = 8;
        else if(type === 'shotgun') this.radius = 5;
        else if(type === 'railgun') this.radius = 6;
        else if(type === 'bfg') this.radius = 25; 
        else this.radius = 4;

        if (isPlayer && (GAME.p1?.orbOverdrive > 0 || GAME.p2?.orbOverdrive > 0)) {
            this.radius *= 1.5;
        }
    }
    update(dt) {
        if(!this.active) return;
        this.x += this.vx * dt * this.speedScale; this.y += this.vy * dt * this.speedScale;
        
        if(this.type === 'bfg' || this.type === 'plasma' || this.isParried) {
            if(Math.random() < 0.5) EFFECTS.pool.get()?.spawn(this.x, this.y, 0, 0, this.color, 15);
        }

        if(this.x < -100 || this.x > GAME.w + 100 || this.y < -100 || this.y > GAME.h + 100) {
            this.active = false;
        }
    }
    draw(ctx) {
        if(!this.active) return;
        
        if (typeof window !== 'undefined' && window.RENDERER2D) {
            window.RENDERER2D.drawProjectile(ctx, this);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.type === 'railgun') {
            ctx.rotate(Math.atan2(this.vy, this.vx));
            // Núcleo do tiro
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.radius*2, -this.radius/2, this.radius*4, this.radius);
            // Fake Glow (Substitui o shadowBlur com zero perda de FPS)
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(-this.radius*3, -this.radius, this.radius*6, this.radius*2);
            
        } else if (this.type === 'bfg') {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, this.radius/2, 0, Math.PI*2); ctx.fill();
            
        } else {
            // Núcleo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI*2); ctx.fill();
            // Fake Glow
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
    }
}

// INICIALIZADO DIRETAMENTE: Fim do bug das balas invisíveis e armas travadas!
window.PROJ_POOL = new Pool(() => new Projectile(), 2000);
