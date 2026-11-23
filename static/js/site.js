(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* Menu mobile */
  const menuBtn = $('#menu-btn'), nav = $('#nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });

  /* Profil éditeur / R&D */
  function setWho(who) {
    $$('.seg button[data-who]').forEach(b => b.setAttribute('aria-pressed', b.dataset.who === who));
    $$('[data-who-txt]').forEach(el => { el.hidden = el.dataset.whoTxt !== who; });
    store.set('xilab-who', who);
  }
  if ($('.seg button[data-who]')) {
    $$('.seg button[data-who]').forEach(b => b.addEventListener('click', () => setWho(b.dataset.who)));
    const w = store.get('xilab-who'); if (w === 'ed' || w === 'rd') setWho(w);
  }

  /* Briques de la chaîne */
  const chain = $('#chain');
  if (chain) {
    chain.addEventListener('click', e => {
      const b = e.target.closest('.brick'); if (!b) return;
      $$('.brick', chain).forEach(x => x.setAttribute('aria-selected', x === b));
      $$('.detail[id^="detail-"]').forEach(p => { p.hidden = p.id !== 'detail-' + b.dataset.id; if (!p.hidden) { p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade'); } });
    });
    const t = $('#ia-toggle'); if (t) t.addEventListener('change', () => chain.classList.toggle('ia-on', t.checked));
  }

  /* Filtres génériques */
  function filters(btnSel, attr, items, match, empty) {
    const btns = $$(btnSel); if (!btns.length) return null;
    const apply = (f) => {
      btns.forEach(b => b.setAttribute('aria-pressed', b.getAttribute(attr) === f));
      let n = 0; items().forEach(el => { const ok = f === 'all' || match(el, f); el.hidden = !ok; if (ok) n++; });
      if (empty) empty.hidden = n > 0;
    };
    btns.forEach(b => b.addEventListener('click', () => apply(b.getAttribute(attr))));
    return apply;
  }
  const casApply = filters('[data-f]:not(article)', 'data-f', () => $$('#cases .case'), (el, f) => el.dataset.f.split(' ').includes(f), $('#cases-empty'));
  if (casApply) { const m = location.hash.match(/^#f-(\w+)$/); if (m) casApply(m[1]); }
  filters('[data-r]:not(.pub)', 'data-r', () => $$('#pubs .pub'), (el, f) => el.dataset.r === f);
  filters('[data-vl]', 'data-vl', () => $$('#vl-list .vl-case'), (el, f) => f === 'ko' ? el.dataset.ko === 'true' : el.dataset.cat === f);

  /* Copier */
  function copyText(text, el, btn, done) {
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { btn.textContent = done; }, sel); else sel();
  }
  $$('.copy').forEach(b => b.addEventListener('click', () => { const el = document.getElementById(b.dataset.t); copyText(el.textContent, el, b, 'Copié'); }));
  const cb = $('#copy-boiler'); if (cb) cb.addEventListener('click', () => { const el = $('#boiler'); copyText(el.innerText, el, cb, 'Texte copié'); });

  /* Formulaire de contact : envoi par Web3Forms (clé dans hugo.toml), sinon ouverture de la messagerie */
  const form = $('#cform');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault(); const err = $('#c-err'), ok = $('#c-ok'), btn = form.querySelector('button[type=submit]');
      const nom = $('#c-name').value.trim(), m = $('#c-mail').value.trim(), msg = $('#c-msg').value.trim(), type = $('#c-type').value, sujet = $('#c-topic').value;
      let t = ''; if (!nom) t = 'Indiquez votre nom et votre société.'; else if (!/^\S+@\S+\.\S+$/.test(m)) t = 'Indiquez une adresse e-mail valide.'; else if (!msg) t = 'Décrivez votre demande en quelques lignes.';
      err.textContent = t; err.hidden = !t; ok.hidden = true;
      if (t) return;
      if (form.querySelector('[name=botcheck]').checked) return; // robot
      const objet = 'Demande depuis xilab.tech' + (sujet ? ' : ' + sujet : '');
      const key = form.dataset.key;
      if (!key) { // pas de clé : on prépare l'e-mail dans la messagerie du visiteur
        const corps = msg + '\n\n' + nom + (type ? ' (' + type + ')' : '') + '\n' + m;
        location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(objet) + '&body=' + encodeURIComponent(corps);
        return;
      }
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Envoi…';
      try {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: key, subject: objet, from_name: 'Site xilab.tech', replyto: m, name: nom, email: m, 'Vous êtes': type || 'Non précisé', Sujet: sujet || 'Non précisé', message: msg, botcheck: false }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.success) throw new Error(j.message || r.status);
        form.reset(); ok.textContent = 'Merci, votre message est bien envoyé. Nous revenons vers vous rapidement.'; ok.hidden = false;
      } catch (x) {
        err.textContent = "L'envoi n'a pas abouti. Écrivez-nous directement à " + form.dataset.to + '.'; err.hidden = false;
      } finally { btn.disabled = false; btn.textContent = label; }
    });
    $$('#cform input, #cform textarea').forEach(i => i.addEventListener('input', () => { $('#c-err').hidden = true; }));
  }

  /* Maillage animé du hero */
  const c = $('#mesh');
  if (c) {
    const x = c.getContext('2d'); let W, H, pts = [];
    const red = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    function init() { const r = c.getBoundingClientRect(); W = r.width; H = r.height; if (!W) return; c.width = W * devicePixelRatio; c.height = H * devicePixelRatio; x.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const n = Math.round(W * H / 5200); pts = []; for (let i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15 }); }
    function draw() { if (W) { x.clearRect(0, 0, W, H); const lc = css('--mesh'), nc = css('--mesh-node'), R = 120;
      for (const p of pts) { if (!red) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; } p.w = Math.min(1, Math.max(0, (p.x - W * .45) / (W * .55))); }
      x.lineWidth = .7; x.strokeStyle = lc;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy; if (d < R * R) { x.globalAlpha = (1 - Math.sqrt(d) / R) * Math.min(a.w, b.w); x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
      x.fillStyle = nc; for (const p of pts) { x.globalAlpha = p.w; x.beginPath(); x.arc(p.x, p.y, 1.6, 0, 6.3); x.fill(); } x.globalAlpha = 1; }
      if (!red) requestAnimationFrame(draw); }
    init(); draw(); addEventListener('resize', () => { init(); if (red) draw(); });
  }
})();
