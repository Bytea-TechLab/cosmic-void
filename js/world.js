class BackgroundStar {
    constructor(x, y, speed, size) {
        this.x = x; this.y = y; this.speed = speed; this.size = size;
        this.alpha = Math.random();
    }
    update(dt) {
        this.y += this.speed * dt * 350; // Velocidade do espaço absurdamente maior
        if (this.y > GAME.h) {
            this.y = 0;
            this.x = Math.random() * GAME.w;
        }
    }
    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

const WORLD = {
    stars: [], bgY: 0,
    init() {
        for (let i = 0; i < 150; i++) {
            this.stars.push(new BackgroundStar(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                0.5 + Math.random() * 2,
                Math.random() * 2.5
            ));
        }
    },
    update(dt) {
        this.stars.forEach(s => s.update(dt));
        if(GAME.state === 'LAUNCHING' || GAME.state === 'DOCKING') this.bgY += 2500 * dt; 
    },
    draw(ctx) {
        if (typeof window !== 'undefined' && window.RENDERER2D) {
            window.RENDERER2D.drawEnhancedSpace(ctx, this.stars, this.bgY);
            return;
        }

        ctx.fillStyle = (GAME.state === 'SANCTUARY' || GAME.state === 'LAUNCHING' || GAME.state === 'DOCKING') ? '#050508' : '#010103';
        ctx.fillRect(0, 0, GAME.w, GAME.h);
        this.stars.forEach(s => s.draw(ctx));
        
        if(GAME.state === 'SANCTUARY' || GAME.state === 'LAUNCHING' || GAME.state === 'DOCKING') {
            ctx.fillStyle = '#111'; ctx.fillRect(GAME.w/2 - 200, 0, 400, GAME.h); 
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(GAME.w/2 - 200, 0, 400, GAME.h);
            for(let i = -200; i < GAME.h; i += 150) {
                ctx.fillStyle = '#222'; ctx.fillRect(GAME.w/2 - 180, i + (this.bgY % 150), 360, 50);
            }
        }
    }
};