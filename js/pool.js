class Pool {
    constructor(factory, size) {
        this.items = [];
        for(let i=0; i<size; i++) this.items.push(factory());
    }
    get() {
        return this.items.find(i => !i.active);
    }
    updateAll(dt) {
        this.items.forEach(i => { if(i.active) i.update(dt); });
    }
    drawAll(ctx) {
        this.items.forEach(i => { if(i.active) i.draw(ctx); });
    }
    clear() {
        this.items.forEach(i => i.active = false);
    }
}

// DECLARAÇÃO GLOBAL EXPLICITA - Impede o erro "Not Defined"
window.PROJ_POOL = null;
window.ENEMY_POOL = null;
window.DROP_POOL = null;