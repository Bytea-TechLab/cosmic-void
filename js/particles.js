class Particle {
    constructor() { this.active = false; }
    spawn(x, y, vx, vy, color, life, size=2, friction=0.95) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.life = life; this.maxLife = life;
        this.size = size; this.friction = friction; this.active = true;
    }
    update(dt) {
        this.x += this.vx * dt * 60; this.y += this.vy * dt * 60;
        this.vx *= this.friction; this.vy *= this.friction;
        this.life -= dt * 60;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) { ctx.globalAlpha = Math.max(0, this.life / this.maxLife); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}
