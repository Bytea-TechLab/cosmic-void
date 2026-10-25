const UI = {
  updateHP(hp, max, isP2) {
    let bar = document.getElementById(isP2 ? "hp-bar-p2" : "hp-bar-p1");
    let text = document.getElementById(isP2 ? "hp-text-p2" : "hp-text-p1");
    let cont = document.getElementById(
      isP2 ? "hp-container-p2" : "hp-container-p1",
    );
    if (bar)
      bar.style.width = Math.max(0, Math.min(100, (hp / max) * 100)) + "%";
    if (text) text.innerText = Math.ceil(Math.max(0, hp)) + " / " + max;
    if (cont) cont.style.width = max * 2 + "px";
  },
  updateSpecial(sp, isP2) {
    let bar = document.getElementById(isP2 ? "sp-bar-p2" : "sp-bar-p1");
    if (bar) bar.style.width = sp + "%";
    if (!isP2) {
      let specBtn = document.getElementById("touch-spec-btn");
      if (specBtn) {
        if (sp >= 100) {
          specBtn.classList.add("ready");
        } else {
          specBtn.classList.remove("ready");
        }
      }
    }
  },
  updateSector(s) {
    let el = document.getElementById("sector-display");
    if (el) el.innerText = s;
  },
  updateCredits() {
    let c1 = document.getElementById("hud-credits-p1");
    let c2 = document.getElementById("hud-credits-p2");
    let creds = Array.isArray(SAVE.data.credits)
      ? SAVE.data.credits
      : [SAVE.data.credits || 0, 0];

    if (c1) c1.innerText = creds[0];
    if (c2) c2.innerText = creds[1];
  },
  showBossWarning(name) {
    let bw = document.getElementById("boss-warning");
    let bt = document.getElementById("boss-title-text");
    if (bt) bt.innerText = "WARNING: " + name + " DETECTED";
    if (bw) {
      bw.style.display = "block";
      setTimeout(() => (bw.style.display = "none"), 3000);
    }
  },
  toggleBossUI(show, name) {
    let ui = document.getElementById("boss-ui");
    let nm = document.getElementById("boss-name-ui");
    if (ui) ui.style.display = show ? "block" : "none";
    if (name && nm) nm.innerText = name;
    if (show && name) this.updateBossHP(BOSS.hp, BOSS.maxHp);
  },
  updateBossHP(hp, max) {
    let bar = document.getElementById("boss-hp-bar");
    if (bar) bar.style.width = Math.max(0, (hp / max) * 100) + "%";
  },
  addGraze() {},
  toggleControls() {
    let menu = document.getElementById("controls-menu");
    if (menu)
      menu.style.display = menu.style.display === "none" ? "block" : "none";
  },

  toggleUpgrades() {
    let u = document.getElementById("upgrades");
    if (!u) return;

    if (u.style.display === "none" || u.style.display === "") {
      u.style.display = "block";
      this.renderUpgradeMenu();
    } else {
      u.style.display = "none";
    }
  },

  renderUpgradeMenu() {
    let u = document.getElementById("upgrades");
    if (!u) return;

    let creds = Array.isArray(SAVE.data.credits)
      ? SAVE.data.credits
      : [SAVE.data.credits || 0, 0];

    const caps = {
      assault: { dmg: 10, spd: 10, hp: 10 },
      scout: { dmg: 8, spd: 15, hp: 5 },
      tank: { dmg: 12, spd: 5, hp: 15 },
      ranger: { dmg: 15, spd: 8, hp: 8 },
    };
    const specCosts = [500, 1000, 2500, 5000, 10000];

    const classNames = { assault: 'ASSAULT MK-IV', scout: 'SCOUT VIPER', tank: 'TANK TITAN', ranger: 'RANGER BALLISTA' };
    let html = `
      <div style="border-bottom: 2px solid #0ff; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="margin:0; letter-spacing: 4px; color: #0ff;">TERMINAL TÁTICO HOLOGRÁFICO</h2>
        <span style="font-size: 11px; color: #88a;">SISTEMA MILITAR DE MANUTENÇÃO E ARMAS // PROTOCOLO VOID-2.0</span>
      </div>
      <div style="display: flex; gap: 25px; text-align: center; justify-content: center;">`;

    for (let i = 0; i < 2; i++) {
      let p = i === 0 ? GAME.p1 : GAME.p2;
      if (i === 1 && !p) continue;

      let skills = Array.isArray(SAVE.data.skills)
        ? SAVE.data.skills[i]
        : SAVE.data.skills;
      let c = caps[p.cls] || caps.assault;

      let dLvl = skills.damage || 0;
      let sLvl = skills.mobility || 0;
      let hLvl = skills.defense || 0;
      let spLvl = skills.specialty || 0;

      let dCost = 200 + dLvl * 150;
      let sCost = 150 + sLvl * 100;
      let hCost = 250 + hLvl * 150;
      let spCost = spLvl < 5 ? specCosts[spLvl] : "MAX";

      let dTxt = dLvl < c.dmg ? `+ Dano (${dCost}C)` : `Dano MAX`;
      let sTxt = sLvl < c.spd ? `+ Veloc. (${sCost}C)` : `Veloc. MAX`;
      let hTxt = hLvl < c.hp ? `+ Defesa / HP (${hCost}C)` : `Defesa MAX`;
      let spTxt =
        spLvl < 5
          ? `Especial Estágio ${spLvl + 1}/5 (${spCost}C)`
          : `Especial MAX`;

      let colColor = i === 0 ? "#0ff" : "#0f0";

      html += `
            <div style="border: 1px solid ${colColor}; padding: 15px;">
                <h3 style="color:${colColor}; margin: 0 0 5px 0;">${classNames[p.cls] || p.cls.toUpperCase()}</h3>
                <span style="font-size: 10px; color: #779; display: block; margin-bottom: 10px;">PILOTO ${i + 1} // SISTEMA ATIVO</span>
                <p>Créditos: ${creds[i]}C</p>
                <button onclick="UI.buyUpgrade('dmg', ${i})" ${dLvl >= c.dmg ? "disabled" : ""}>${dTxt}</button><br>
                <button onclick="UI.buyUpgrade('spd', ${i})" ${sLvl >= c.spd ? "disabled" : ""}>${sTxt}</button><br>
                <button onclick="UI.buyUpgrade('hp', ${i})" ${hLvl >= c.hp ? "disabled" : ""}>${hTxt}</button><br>
                <button onclick="UI.buyUpgrade('spec', ${i})" ${spLvl >= 5 ? "disabled" : ""} style="border-color:#f0f; color:#f0f; margin-top:10px;">${spTxt}</button>
            </div>`;
    }

    html += `</div><p><br><button onclick="UI.toggleUpgrades()">[ FECHAR ]</button></p>`;
    u.innerHTML = html;
  },

  togglePause() {
    if (GAME.state !== "PLAYING") return;
    GAME.paused = !GAME.paused;
    let pm = document.getElementById("pause-menu");
    if (pm) pm.style.display = GAME.paused ? "block" : "none";
  },
  showGameOver() {
    if (typeof GAME !== 'undefined' && typeof GAME.isAnyPlayerAlive === 'function' && GAME.isAnyPlayerAlive()) {
      return; // Ainda há um piloto vivo em combate
    }
    if (typeof QUICKRUN !== 'undefined' && QUICKRUN.active) {
      QUICKRUN.finishRun(false);
      return;
    }
    if (typeof BLACKOUT !== 'undefined' && BLACKOUT.active) {
      BLACKOUT.finishRun(false);
      return;
    }
    if (typeof BOSSRUSH !== 'undefined' && BOSSRUSH.active) {
      BOSSRUSH.finishRun(false);
      return;
    }
    GAME.state = "GAMEOVER";
    let go = document.getElementById("game-over");
    let hud = document.getElementById("hud");
    if (go) go.style.display = "block";
    if (hud) hud.style.display = "none";
    SAVE.save();
  },

  triggerFinalSequence() {
    let hud = document.getElementById("hud");
    if (hud) hud.style.display = "none";
    GAME.state = "FAKE_CREDITS";

    let sl = document.getElementById("signal-lost");
    if (sl) {
      sl.style.display = "block";
      sl.style.background = "black";

      // 1. SIGNAL LOST (Súbito e seco)
      sl.innerHTML = `<h2 class='glitch' style='position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#fff; font-size:3rem; letter-spacing: 15px;'>SIGNAL LOST.</h2>`;

      // 2. FAKE CREDITS (Rola mais rápido para causar falsa segurança)
      setTimeout(() => {
        sl.innerHTML = `
                <div style="position:absolute; top:100%; left:50%; transform:translateX(-50%); color:#888; text-align:center; font-family: 'Courier New', monospace; animation: rollUp 6s linear forwards;">
                    <h2>COSMIC VOID</h2><br><br>
                    <p>Desenvolvido por: Bytea TechLab</p>
                    <p>Lead Developer: Mateus Mendes</p>
                    <br><br><br><p>Thanks for playing.</p>
                </div>
                <style>@keyframes rollUp { to { top: 35%; } }</style>
                `;
      }, 3000);

      // 3. OVERRIDE (O terror e o plot twist)
      setTimeout(() => {
        GAME.shake = 60;
        EFFECTS.triggerGlitch();
        sl.innerHTML = `<h2 class='glitch' style='position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#f00; font-size:4.5rem; font-weight:900;'>SYSTEM OVERRIDE</h2>`;
      }, 9000);

      // 4. MENSAGEM CLARA PARA O JOGADOR (Impossível de ser ignorada)
      setTimeout(() => {
        GAME.shake = 0;
        sl.innerHTML = `
                <div style='position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; color:#0ff; font-family: "Courier New", monospace; width: 100%;'>
                    <h2 style='letter-spacing:5px; margin-bottom: 20px;'>UNKNOWN LIFEFORM DETECTED IN SECTOR 17</h2>
                    <p style='color:#fff; font-size:1.2rem; animation: pulse 1.5s infinite alternate;'>The Void is not empty.</p>
                    <br><br><br>
                    <p style='color:#f0f; font-weight:bold; font-size: 1.5rem;'>>>> DO NOT START A NEW GAME <<<</p>
                    <p style='color:#fff; font-size: 1.1rem; margin-top: 10px;'>SELECT <span style='color:#0f0; font-weight:bold;'>'CONTINUE'</span> ON THE MENU TO ENTER THE DEAD ZONE.</p>
                </div>
                <style>@keyframes pulse { from { opacity: 0.2; } to { opacity: 1; } }</style>
                `;
      }, 11500);

      // 5. RELOAD E SALVAMENTO (Espera 9 segundos para o jogador ler com calma)
      setTimeout(() => {
        SAVE.data.checkpoint.sector = 17;
        SAVE.save();
        location.reload();
      }, 21000);
    }
  },

  triggerTrueEnding() {
    let hud = document.getElementById("hud");
    if (hud) hud.style.display = "none";
    GAME.state = "EPILOGUE";

    let sl = document.getElementById("signal-lost");
    if (sl) {
      sl.style.display = "block";
      sl.style.background = "transparent";

      // O Silêncio final e melancólico
      sl.innerHTML = `<h2 style='position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#fff; font-style:italic; opacity: 0; animation: fadeIn 3s forwards;'>The silence is deafening.</h2>
            <style>@keyframes fadeIn { to { opacity: 1; } }</style>`;

      setTimeout(() => {
        sl.style.background = "black";
        sl.innerHTML = "";
      }, 5000);

      setTimeout(() => {
        GAME.watcherEyeOpen = 0.5;
        sl.style.background = "transparent";
      }, 7000);

      setTimeout(() => {
        sl.style.background = "black";
        sl.innerHTML = `
                <div style='position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;'>
                    <h2 style='color:#0ff; letter-spacing:15px; font-size:2.5rem; text-shadow: 0 0 20px #0ff;'>VOID CLEARED.</h2>
                    <p style='color:#aaa; font-family:"Courier New"; margin-top: 20px;'>TRUE ENDING ACHIEVED.</p>
                </div>`;
      }, 11000);

      setTimeout(() => {
        SAVE.data.checkpoint.sector = 1;
        SAVE.data.checkpoint.bossPhase = 0;
        SAVE.data.skills = [
          { damage: 0, mobility: 0, defense: 0, specialty: 0 },
          { damage: 0, mobility: 0, defense: 0, specialty: 0 },
        ];
        SAVE.save();
        location.reload();
      }, 20000);
    }
  },

  buyUpgrade(type, pIndex) {
    let p = pIndex === 0 ? GAME.p1 : GAME.p2;
    if (!p) return;

    const caps = {
      assault: { dmg: 10, spd: 10, hp: 10 },
      scout: { dmg: 8, spd: 15, hp: 5 },
      tank: { dmg: 12, spd: 5, hp: 15 },
      ranger: { dmg: 15, spd: 8, hp: 8 },
    };
    const specCosts = [500, 1000, 2500, 5000, 10000];
    let c = caps[p.cls] || caps.assault;

    let pSkills = Array.isArray(SAVE.data.skills)
      ? SAVE.data.skills[pIndex]
      : SAVE.data.skills;
    let dLvl = pSkills.damage || 0;
    let sLvl = pSkills.mobility || 0;
    let hLvl = pSkills.defense || 0;
    let spLvl = pSkills.specialty || 0;

    let cost = 0;
    if (type === "dmg" && dLvl < c.dmg) cost = 200 + dLvl * 150;
    else if (type === "spd" && sLvl < c.spd) cost = 150 + sLvl * 100;
    else if (type === "hp" && hLvl < c.hp) cost = 250 + hLvl * 150;
    else if (type === "spec" && spLvl < 5) cost = specCosts[spLvl];
    else return;

    let pCreds = Array.isArray(SAVE.data.credits)
      ? SAVE.data.credits[pIndex]
      : SAVE.data.credits;

    if (pCreds >= cost) {
      if (Array.isArray(SAVE.data.credits)) SAVE.data.credits[pIndex] -= cost;
      else SAVE.data.credits -= cost;

      if (type === "dmg") pSkills.damage = dLvl + 1;
      if (type === "spd") pSkills.mobility = sLvl + 1;
      if (type === "hp") pSkills.defense = hLvl + 1;
      if (type === "spec") pSkills.specialty = spLvl + 1;

      SAVE.save();
      this.updateCredits();

      if (pIndex === 0 && GAME.p1) GAME.p1.applyUpgrades();
      if (pIndex === 1 && GAME.p2) GAME.p2.applyUpgrades();

      this.renderUpgradeMenu();
    } else {
      alert("Créditos insuficientes!");
    }
  },

  showTransmission(msg) {
    let b = document.getElementById("transmission-box");
    if (b) {
      b.innerText = msg;
      b.style.display = "block";
      setTimeout(() => (b.style.transform = "translateX(0)"), 100);
      setTimeout(() => {
        b.style.transform = "translateX(-100%)";
        setTimeout(() => (b.style.display = "none"), 500);
      }, 4000);
    }
  },
  toggleSettings() {
    let m = document.getElementById("settings-menu");
    if (!m) return;
    let isHidden = m.style.display === "none" || !m.style.display;
    m.style.display = isHidden ? "block" : "none";
    if (isHidden && typeof SAVE !== "undefined" && SAVE.data?.settings) {
      let s = SAVE.data.settings;
      let optShake = document.getElementById("opt-shake");
      if (optShake) optShake.value = s.screenShake.toString();
      let optPart = document.getElementById("opt-particles");
      if (optPart) optPart.value = s.particleDensity.toString();
      let optFlash = document.getElementById("opt-flash");
      if (optFlash) optFlash.value = s.flashIntensity.toString();
      let optReducedMotion = document.getElementById("opt-reduced-motion");
      if (optReducedMotion) optReducedMotion.checked = !!s.reducedMotion;
      let optSlowMo = document.getElementById("opt-slowmo");
      if (optSlowMo) optSlowMo.checked = s.slowMotion !== undefined ? !!s.slowMotion : true;
      let optCrt = document.getElementById("opt-crt");
      if (optCrt) optCrt.checked = !!s.crtFilter;
      let optHaptics = document.getElementById("opt-haptics");
      if (optHaptics) optHaptics.checked = s.haptics !== undefined ? !!s.haptics : true;
      let optAutoFire = document.getElementById("opt-autofire");
      if (optAutoFire) optAutoFire.checked = !!s.autoFire;
      let optControls = document.getElementById("opt-controls");
      if (optControls) optControls.value = s.controlMode || 'auto';
      let optJoySens = document.getElementById("opt-joysens");
      if (optJoySens) optJoySens.value = (s.joySensitivity || 1.0).toString();
      let optGraphics = document.getElementById("opt-graphics");
      if (optGraphics) optGraphics.value = s.graphicProfile || 'high';
    }
  },

  toggleCredits() {
    let m = document.getElementById("credits-menu");
    if (!m) return;
    let isHidden = m.style.display === "none" || !m.style.display;
    m.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      let v = (typeof GAME !== 'undefined' && GAME.version) ? GAME.version : (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : "2.1.0");
      if (typeof document !== 'undefined') {
        document.querySelectorAll('.game-version-label').forEach(el => el.innerText = v);
      }
    }
  },

  updateSetting(key, val) {
    if (typeof SAVE === "undefined") return;
    if (!SAVE.data.settings) {
      SAVE.data.settings = SAVE.getDefault().settings;
    }
    SAVE.data.settings[key] = val;
    SAVE.save();

    if (key === "crtFilter") {
      let crtOverlay = document.getElementById("crt-overlay") || document.getElementById("crt-filter");
      if (crtOverlay) {
        crtOverlay.style.display = val ? "block" : "none";
      }
    } else if (key === "controlMode") {
      if (typeof INPUT !== "undefined" && INPUT.updateTouchHUDVisibility) {
        INPUT.updateTouchHUDVisibility();
      }
    } else if (key === "graphicProfile") {
      if (typeof GAME !== "undefined" && GAME.resize) {
        GAME.resize();
      }
    }
  },

  installPWA() {
    if (typeof window !== "undefined" && window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] Instalação aceita pelo usuário");
          let btn = document.getElementById("pwa-install-btn");
          if (btn) btn.style.display = "none";
        }
        window.deferredPrompt = null;
      });
    } else {
      alert("Para instalar este app:\n- No Android/Chrome: Toque nos 3 pontos verticais e selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.\n- No iOS/Safari: Toque no botão Compartilhar (quadrado com seta) e selecione 'Adicionar à Tela de Início'.");
    }
  },

  portraitDismissed: false,

  dismissPortraitWarning() {
    const pw = document.getElementById("portrait-warning");
    if (pw) {
      pw.style.display = "none";
      this.portraitDismissed = true;
    }
  },

  toggleCoopMobile() {
    let section = document.getElementById("coop-menu-section");
    let btn = document.getElementById("btn-toggle-coop-mobile");
    if (!section) return;
    if (section.style.display === "none" || section.style.display === "") {
      section.style.display = "block";
      if (btn) btn.innerText = "- OCULTAR MODO 2 JOGADORES";
    } else {
      section.style.display = "none";
      if (btn) btn.innerText = "+ MODO 2 JOGADORES (CO-OP LOCAL)";
    }
  },

  initMobileMenuUI() {
    let isMobile = (typeof INPUT !== "undefined" && typeof INPUT.isMobile === "function") ? INPUT.isMobile() : false;
    let section = document.getElementById("coop-menu-section");
    let btn = document.getElementById("btn-toggle-coop-mobile");
    if (isMobile) {
      if (section) section.style.display = "none";
      if (btn) btn.style.display = "inline-block";
    } else {
      if (section) section.style.display = "block";
      if (btn) btn.style.display = "none";
    }
  },

  currentModeTab: 'campaign',
  qrLength: 'standard',

  selectGameModeTab(mode, btn) {
    this.currentModeTab = mode;
    ['campaign', 'quickrun', 'blackout', 'bossrush'].forEach(m => {
      let panel = document.getElementById(`panel-${m}`);
      let tabBtn = document.getElementById(`tab-mode-${m}`);
      if (panel) panel.style.display = (m === mode) ? 'block' : 'none';
      if (tabBtn) {
        if (m === mode) {
          tabBtn.style.background = '#0ff';
          tabBtn.style.color = '#000';
        } else {
          tabBtn.style.background = 'rgba(0,0,0,0.5)';
          let c = m === 'quickrun' ? '#ffaa00' : (m === 'blackout' ? '#bf00ff' : (m === 'bossrush' ? '#ff0055' : '#0ff'));
          tabBtn.style.color = c;
          tabBtn.style.borderColor = c;
        }
      }
    });
  },

  selectQuickRunLength(lengthType, btn) {
    this.qrLength = lengthType;
    let btnStd = document.getElementById('btn-qr-standard');
    let btnShort = document.getElementById('btn-qr-short');
    if (btnStd) {
      btnStd.style.background = (lengthType === 'standard') ? '#ffaa00' : 'rgba(0,0,0,0.5)';
      btnStd.style.color = (lengthType === 'standard') ? '#000' : '#ffaa00';
    }
    if (btnShort) {
      btnShort.style.background = (lengthType === 'short') ? '#ffaa00' : 'rgba(0,0,0,0.5)';
      btnShort.style.color = (lengthType === 'short') ? '#000' : '#ffaa00';
    }
  },

  qrP1Class: 'assault',
  qrP2Class: 'scout',
  boP1Class: 'assault',
  boP2Class: 'scout',
  brP1Class: 'assault',
  brP2Class: 'scout',

  selectQRClass(playerIndex, cls, selectedButton) {
    if (playerIndex === 0) this.qrP1Class = cls;
    else this.qrP2Class = cls;
    let groupId = playerIndex === 0 ? 'qr-p1-class-select' : 'qr-p2-class-select';
    document.querySelectorAll(`#${groupId} button`).forEach(btn => {
      btn.style.background = 'rgba(0,0,0,0.5)';
      btn.style.color = playerIndex === 0 ? '#0ff' : '#ffaa00';
    });
    if (selectedButton) {
      selectedButton.style.background = playerIndex === 0 ? '#0ff' : '#ffaa00';
      selectedButton.style.color = '#000';
    }
  },

  selectBOClass(playerIndex, cls, selectedButton) {
    if (playerIndex === 0) this.boP1Class = cls;
    else this.boP2Class = cls;
    let groupId = playerIndex === 0 ? 'bo-p1-class-select' : 'bo-p2-class-select';
    document.querySelectorAll(`#${groupId} button`).forEach(btn => {
      btn.style.background = 'rgba(0,0,0,0.5)';
      btn.style.color = playerIndex === 0 ? '#0ff' : '#ffaa00';
    });
    if (selectedButton) {
      selectedButton.style.background = playerIndex === 0 ? '#0ff' : '#ffaa00';
      selectedButton.style.color = '#000';
    }
  },

  selectBRClass(playerIndex, cls, selectedButton) {
    if (playerIndex === 0) this.brP1Class = cls;
    else this.brP2Class = cls;
    let groupId = playerIndex === 0 ? 'br-p1-class-select' : 'br-p2-class-select';
    document.querySelectorAll(`#${groupId} button`).forEach(btn => {
      btn.style.background = 'rgba(0,0,0,0.5)';
      btn.style.color = playerIndex === 0 ? '#0ff' : '#ffaa00';
    });
    if (selectedButton) {
      selectedButton.style.background = playerIndex === 0 ? '#0ff' : '#ffaa00';
      selectedButton.style.color = '#000';
    }
  }
};
