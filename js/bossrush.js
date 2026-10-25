// ============================================================================
// COSMIC VOID — BOSS RUSH MODE (Desafio de Chefes Consecutivos)
// Modo independente de combate direto contra grandes máquinas de guerra e anomalias
// ============================================================================

const BOSSRUSH = {
  active: false,
  bossIndex: 0,
  cls: 'assault',
  isCoop: false,
  p2Class: 'scout',
  startTime: 0,
  elapsedTime: 0,
  totalDamageTaken: 0,
  score: 0,

  ROSTER: [
    { type: 'gatekeeper', title: 'THE GATEKEEPER', desc: 'Fortaleza Orbital Móvel' },
    { type: 'dread_fleet', title: 'THE DREAD FLEET', desc: 'Formação de Batalha Devastadora' },
    { type: 'leviathan', title: 'THE LEVIATHAN', desc: 'Monólito Gravitacional de Guerra' },
    { type: 'blackout_signal', title: 'THE BLACKOUT SIGNAL', desc: 'Anomalia Transdimensional do Sombra' },
    { type: 'observer_apex', title: 'OBSERVER APEX', desc: 'Olho Cósmico do Vazio' },
    { type: 'absolute_core', title: 'THE ABSOLUTE CORE', desc: 'Singularidade Quântica Final' }
  ],

  start(cls = 'assault', isCoop = true, p2Class = 'scout') {
    this.active = true;
    this.bossIndex = 0;
    this.cls = cls;
    this.isCoop = isCoop;
    this.p2Class = p2Class;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.totalDamageTaken = 0;
    this.score = 0;

    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'block';

    GAME.isCoop = isCoop;
    GAME.mode = isCoop ? '2P' : '1P';
    GAME.state = 'PLAYING';
    GAME.timeScale = 1.0;
    GAME.slowMoTimer = 0;
    GAME.combo = 0;
    GAME.comboTimer = 0;

    // Instanciar caças com blindagem reparada e posições sem sobreposição
    let screenW = GAME.w || (typeof window !== 'undefined' ? window.innerWidth : 800);
    GAME.p1 = new Player(cls, false);
    if (isCoop) {
      GAME.p2 = new Player(p2Class, true);
      GAME.p1.x = screenW * 0.35;
      GAME.p2.x = screenW * 0.65;
    } else {
      GAME.p2 = null;
      GAME.p1.x = screenW * 0.50;
    }

    if (typeof UI !== 'undefined') {
      UI.updateHP(GAME.p1.hp, GAME.p1.maxHp, false);
      UI.updateSpecial(0, false);
      const p2Cont = document.getElementById('p2-hp-container');
      if (p2Cont) p2Cont.style.display = isCoop ? 'block' : 'none';
      if (isCoop && GAME.p2) {
        UI.updateHP(GAME.p2.hp, GAME.p2.maxHp, true);
        UI.updateSpecial(0, true);
      }
    }

    if (typeof INPUT !== 'undefined' && INPUT.updateTouchHUDVisibility) {
      INPUT.updateTouchHUDVisibility();
    }

    this.loadCurrentBoss();
  },

  loadCurrentBoss() {
    if (this.bossIndex >= this.ROSTER.length) {
      this.finishRun(true);
      return;
    }

    const bossData = this.ROSTER[this.bossIndex];
    if (typeof UI !== 'undefined' && UI.updateSector) {
      UI.updateSector(`BOSS RUSH ${this.bossIndex + 1}/${this.ROSTER.length}`);
    }

    // Curar 30% de HP entre chefes
    if (GAME.p1) {
      GAME.p1.hp = Math.min(GAME.p1.maxHp, GAME.p1.hp + Math.round(GAME.p1.maxHp * 0.30));
      if (typeof UI !== 'undefined') UI.updateHP(GAME.p1.hp, GAME.p1.maxHp, false);
    }
    if (GAME.p2) {
      GAME.p2.hp = Math.min(GAME.p2.maxHp, GAME.p2.hp + Math.round(GAME.p2.maxHp * 0.30));
      if (typeof UI !== 'undefined') UI.updateHP(GAME.p2.hp, GAME.p2.maxHp, true);
    }

    PACING.phases = [
      { type: 'INTRO', time: 2, text: bossData.title },
      { type: 'BOSS_WAIT', bossType: bossData.type }
    ];
    PACING.phaseIdx = 0;
    PACING.startPhase();
  },

  onBossDefeated() {
    if (typeof GAME !== 'undefined' && typeof GAME.restoreFallenPilotsAfterSector === 'function') {
      GAME.restoreFallenPilotsAfterSector();
    }
    this.bossIndex++;
    if (this.bossIndex >= this.ROSTER.length) {
      this.finishRun(true);
    } else {
      this.loadCurrentBoss();
    }
  },

  finishRun(victory = true) {
    if (!victory && typeof GAME !== 'undefined' && typeof GAME.isAnyPlayerAlive === 'function' && GAME.isAnyPlayerAlive()) {
      return; // O parceiro ainda está vivo no Boss Rush
    }
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.score = (this.bossIndex * 5000) + Math.max(0, 10000 - this.elapsedTime * 15);
    GAME.state = 'BOSSRUSH_SUMMARY';
    this.renderSummaryModal(victory);
  },

  renderSummaryModal(victory) {
    let modal = document.getElementById('bossrush-summary-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bossrush-summary-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(8, 8, 18, 0.98)';
      modal.style.border = victory ? '2px solid #ffea00' : '2px solid #ff0044';
      modal.style.boxShadow = victory ? '0 0 35px rgba(255, 234, 0, 0.35)' : '0 0 35px rgba(255, 0, 68, 0.35)';
      modal.style.padding = '30px';
      modal.style.zIndex = '2100';
      modal.style.textAlign = 'center';
      modal.style.minWidth = '330px';
      modal.style.maxWidth = '92vw';
      modal.style.pointerEvents = 'auto';
      document.body.appendChild(modal);
    }

    modal.style.display = 'block';
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = this.elapsedTime % 60;
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    let rank = 'C';
    if (victory && this.elapsedTime < 360) rank = 'S+';
    else if (victory && this.elapsedTime < 500) rank = 'S';
    else if (victory) rank = 'A';
    else if (this.bossIndex >= 3) rank = 'B';

    modal.innerHTML = `
      <div style="border-bottom: 1px solid #1a3040; padding-bottom: 10px; margin-bottom: 15px;">
        <span style="font-size: 11px; letter-spacing: 4px; color: ${victory ? '#ffea00' : '#ff0044'};">
          ${victory ? 'CONFRONTO COMPLETO DE CHEFES' : 'FALHA DE COMBATE'}
        </span>
        <h2 style="color: #fff; margin: 6px 0; letter-spacing: 3px;">
          ${victory ? 'BOSS RUSH VENCIDO' : 'DESTRUIDO EM COMBATE'}
        </h2>
      </div>

      <div style="text-align: left; background: rgba(15, 20, 35, 0.7); border: 1px solid #203050; padding: 15px; margin: 15px 0; font-size: 13px; line-height: 1.8;">
        <div><b>CHEFES DERROTADOS:</b> ${this.bossIndex} / ${this.ROSTER.length}</div>
        <div><b>TEMPO DE COMBATE:</b> ${timeFormatted}</div>
        <div><b>CLASSIFICAÇÃO TÁTICA:</b> <span style="color:#00ffcc; font-size: 18px; font-weight:bold;">${rank}</span></div>
        <div style="color: #ffea00; font-size: 16px; margin-top: 6px;"><b>PONTUAÇÃO DE DESAFIO:</b> ${this.score} PTS</div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="BOSSRUSH.retry()" style="border-color: #ffea00; color: #ffea00; font-weight: bold; min-height: 42px; padding: 0 16px;">REVANCHE IMEDIATA</button>
        <button onclick="BOSSRUSH.exitToMenu()" style="border-color: #88aabb; color: #88aabb; min-height: 42px; padding: 0 16px;">MENU PRINCIPAL</button>
      </div>
    `;
  },

  retry() {
    const summary = document.getElementById('bossrush-summary-modal');
    if (summary) summary.style.display = 'none';
    this.start(this.cls, this.isCoop, this.p2Class);
  },

  exitToMenu() {
    this.active = false;
    const summary = document.getElementById('bossrush-summary-modal');
    if (summary) summary.style.display = 'none';

    GAME.state = 'MENU';
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'block';
  }
};

if (typeof window !== 'undefined') {
  window.BOSSRUSH = BOSSRUSH;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BOSSRUSH };
}
