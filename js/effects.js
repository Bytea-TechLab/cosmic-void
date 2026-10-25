class Particle {
  constructor() {
    this.active = false;
  }
  spawn(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.active = true;
    this.size = Math.random() * 4 + 2;
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= dt * 60;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    let alpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

const IMPACT_CONTROLLER = {
  lastGlobalFlash: 0,
  minFlashInterval: 0.35, // Cooldown de 350ms para prevenir clarões repetitivos em cascata
  maxAllowedAlpha: 0.50,  // Teto estrito: nunca cega o jogador em 1.0 ou 1.2
  vignetteAlpha: 0,
  vignetteColor: "#00ffff",

  triggerFlash(color = "#fff", intensity = 0.5, priority = "COMBAT") {
    let settingsMult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.flashIntensity !== undefined) 
      ? SAVE.data.settings.flashIntensity : 1.0;
    if (settingsMult <= 0) return;

    let now = (typeof GAME !== 'undefined' && GAME.time) ? GAME.time : Date.now() / 1000;

    // Se estiver em cooldown e não for de prioridade NARRATIVE
    if (now - this.lastGlobalFlash < this.minFlashInterval && priority !== "NARRATIVE") {
      this.triggerVignette(color, intensity * 0.5);
      return;
    }

    this.lastGlobalFlash = now;
    let clampedAlpha = Math.min(intensity, this.maxAllowedAlpha) * settingsMult;
    if (typeof GAME !== 'undefined') {
      GAME.flashColor = color;
      GAME.flashAlpha = clampedAlpha;
    }
  },

  triggerVignette(color, intensity) {
    let settingsMult = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.flashIntensity !== undefined) 
      ? SAVE.data.settings.flashIntensity : 1.0;
    if (settingsMult <= 0) return;
    this.vignetteColor = color;
    this.vignetteAlpha = Math.min(0.35, intensity) * settingsMult;
  },

  update(dt) {
    if (this.vignetteAlpha > 0) {
      this.vignetteAlpha = Math.max(0, this.vignetteAlpha - dt * 3.5);
    }
  },

  draw(ctx) {
    if (this.vignetteAlpha > 0 && ctx && typeof GAME !== 'undefined' && GAME.w && GAME.h) {
      ctx.save();
      let grad = ctx.createRadialGradient(
        GAME.w / 2, GAME.h / 2, Math.min(GAME.w, GAME.h) * 0.3,
        GAME.w / 2, GAME.h / 2, Math.max(GAME.w, GAME.h) * 0.75
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, this.vignetteColor);
      ctx.globalAlpha = this.vignetteAlpha;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME.w, GAME.h);
      ctx.restore();
    }
  }
};

const EFFECTS = {
  pool: null,
  impactController: IMPACT_CONTROLLER,
  init() {
    this.pool = new Pool(() => new Particle(), 1500);
  },
  explosion(x, y, color, isMassive = false) {
    let density = (typeof SAVE !== 'undefined' && SAVE.data?.settings?.particleDensity !== undefined) ? SAVE.data.settings.particleDensity : 1.0;
    // Degradação dinâmica de partículas sob poderes surreais do vilão para manter 60 FPS estáveis
    let villainPowerActive = (typeof VILLAIN !== 'undefined' && VILLAIN.active && (VILLAIN.powers?.arena?.active || VILLAIN.powers?.gravity?.active || VILLAIN.powers?.timeDilation?.active || VILLAIN.powers?.destiny?.active));
    if (villainPowerActive) {
      density *= 0.55;
    }
    let amount = Math.round((isMassive ? 60 : 25) * density);
    for (let i = 0; i < amount; i++) {
      let p = this.pool.get();
      if (p) {
        let speed = isMassive ? 25 : 15;
        p.spawn(
          x,
          y,
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed,
          color,
          40 + Math.random() * 30,
        );
      }
    }
  },
  update(dt, ctx) {
    this.pool.updateAll(dt);
    IMPACT_CONTROLLER.update(dt);
  },
  triggerParryFlash() {
    this.impactController.triggerFlash("#0ff", 0.3, "COMBAT");
    if (typeof GAME !== 'undefined') GAME.shake = 30;
  },

  // Efeito glitch rápido (30ms) sem travar renderização
  triggerGlitch() {
    if (typeof GAME !== 'undefined') {
      GAME.isGlitching = true;
      setTimeout(() => {
        GAME.isGlitching = false;
      }, 30);
    }
  },
};

if (typeof window !== 'undefined') {
  window.IMPACT_CONTROLLER = IMPACT_CONTROLLER;
}
