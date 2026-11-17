/* Life OS – Abgleich mit dem Kevin-Vault in Google Drive (+ Gmail)
   Daten: Kevin-Vault/Life OS/life-os.json  ·  lesbare Notizen daneben  ·  Eingang.md wird eingesammelt */
(function () {
  'use strict';
  const CFG = Object.assign({
    clientId: '',
    vault: 'Kevin-Vault',
    folder: 'Life OS',
    file: 'life-os.json',
    inbox: 'Eingang.md',
    scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email',
    mailEveryMin: 20
  }, window.LOS_CONFIG || {});

  /* ---------- Speicher im Gerät ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('los-' + k); return v == null ? d : JSON.parse(v) } catch (e) { return d } },
    set(k, v) { try { localStorage.setItem('los-' + k, JSON.stringify(v)) } catch (e) { } },
    del(k) { try { localStorage.removeItem('los-' + k) } catch (e) { } }
  };
  const J = JSON.stringify;
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined && k[0] !== '_').sort().map(k => J(k) + ':' + stable(v[k])).join(',') + '}';
    return J(v === undefined ? null : v);
  }
  const eq = (a, b) => stable(a) === stable(b);
  function clean(v) {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) if (k[0] !== '_' && v[k] !== undefined) o[k] = clean(v[k]); return o }
    return v;
  }
  const copy = v => v == null ? v : JSON.parse(J(v));

  /* ---------- Zusammenführen (3-Wege) ---------- */
  function keyOf(x) {
    if (typeof x === 'string' || typeof x === 'number') return 's' + x;
    if (!x || typeof x !== 'object') return null;
    if (x.id != null) return 'i' + x.id;
    if (x.at) return 'a' + x.at;
    if (x.t != null) return 't' + x.t + '|' + (x.d || '');
    return null;
  }
  function keyed(a) { if (!Array.isArray(a)) return false; const s = new Set(); for (const x of a) { const k = keyOf(x); if (k == null || s.has(k)) return false; s.add(k) } return true }
  function maxId(v, m = 0) {
    if (Array.isArray(v)) { for (const x of v) m = maxId(x, m) }
    else if (v && typeof v === 'object') { if (typeof v.id === 'number' && v.id > m) m = v.id; for (const k of Object.keys(v)) if (v[k] && typeof v[k] === 'object') m = maxId(v[k], m) }
    return m;
  }
  function merge3(base, local, remote) {
    const ctx = { next: Math.max(maxId(base), maxId(local), maxId(remote)) + 1 };
    const out = m3(base, local, remote, '', ctx);
    if (out && typeof out === 'object') out.next = Math.max(out.next || 0, ctx.next, maxId(out) + 1);
    return out;
  }
  function m3(b, l, r, key, ctx) {
    if (eq(l, r)) return l;
    if (b !== undefined && eq(b, l)) return r;
    if (b !== undefined && eq(b, r)) return l;
    if (key === 'next' && typeof l === 'number' && typeof r === 'number') return Math.max(l, r);
    if (keyed(l) && keyed(r)) {
      const bb = keyed(b) ? b : [];
      const B = new Map(bb.map(x => [keyOf(x), x])), L = new Map(l.map(x => [keyOf(x), x])), R = new Map(r.map(x => [keyOf(x), x]));
      const res = [];
      for (const x of r) {
        const k = keyOf(x), bi = B.get(k), li = L.get(k);
        if (li !== undefined) {
          if (bi === undefined && !eq(li, x) && k[0] === 'i') { res.push(x); res.push(Object.assign(copy(li), { id: ctx.next++ })) } // beide neu, gleiche Nummer
          else res.push(m3(bi, li, x, '', ctx));
        } else if (bi === undefined || !eq(bi, x)) res.push(x); // lokal nicht gelöscht oder drüben geändert
      }
      // nur lokal vorhandene an ihrer Stelle einfügen
      let prev = null;
      for (const x of l) {
        const k = keyOf(x);
        if (R.has(k)) { prev = k; continue }
        const bi = B.get(k);
        if (bi !== undefined && eq(bi, x)) continue; // drüben gelöscht
        let pos = 0;
        if (prev != null) { const i = res.findIndex(y => keyOf(y) === prev); pos = i + 1 }
        res.splice(pos, 0, x); prev = k;
      }
      return res;
    }
    if (l && r && typeof l === 'object' && typeof r === 'object' && !Array.isArray(l) && !Array.isArray(r)) {
      const bo = (b && typeof b === 'object' && !Array.isArray(b)) ? b : {};
      const o = {};
      for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) {
        const bv = bo[k], lv = l[k], rv = r[k];
        if (lv === undefined) { if (bv !== undefined && eq(bv, rv)) continue; o[k] = rv; continue }
        if (rv === undefined) { if (bv !== undefined && eq(bv, lv)) continue; o[k] = lv; continue }
        o[k] = m3(bv, lv, rv, k, ctx);
      }
      return o;
    }
    return l; // echter Konflikt bei einem Einzelwert: das Gerät gewinnt
  }

  /* ---------- Google-Login ---------- */
  let tok = LS.get('tok', null);
  const hasTok = () => !!(tok && tok.exp > Date.now() + 60000);
  /* Anmeldung per Weiterleitung (kein Popup): nötig fürs Mac-Widget, klappt überall außer im iPhone-Home-Bildschirm-Modus */
  const IOS_APP = /iP(hone|ad|od)/.test(navigator.userAgent) && navigator.standalone === true;
  const RURI = location.origin + location.pathname.replace(/index\.html$/, '');
  function saveEmail() {
    if (!tok) return;
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + tok.t } })
      .then(r => r.ok ? r.json() : null).then(u => { if (u && u.email) LS.set('email', u.email) }).catch(() => { });
  }
  (function backFromGoogle() {
    const raw = location.hash || '';
    if (raw.indexOf('access_token=') < 0 && raw.indexOf('error=') < 0) return;
    const h = new URLSearchParams(raw.slice(1)), ok = !!h.get('state') && h.get('state') === LS.get('ost', null);
    LS.del('ost');
    if (ok && h.get('access_token')) {
      tok = { t: h.get('access_token'), exp: Date.now() + (+h.get('expires_in') || 3600) * 1000 }; LS.set('tok', tok); LS.del('sfail'); saveEmail();
    } else LS.set('sfail', Date.now());
    const back = LS.get('ohash', ''); LS.del('ohash');
    history.replaceState(null, '', location.pathname + location.search + (back || ''));
  })();
  function redirectLogin(silent) {
    const st = Math.random().toString(36).slice(2) + Date.now().toString(36); LS.set('ost', st);
    LS.set('ohash', /^#[a-z]+$/.test(location.hash) ? location.hash : '');
    const p = new URLSearchParams({ client_id: CFG.clientId, redirect_uri: RURI, response_type: 'token', scope: CFG.scopes, include_granted_scopes: 'true', state: st });
    const em = LS.get('email', ''); if (em) p.set('login_hint', em);
    if (silent) p.set('prompt', 'none'); else if (!em) p.set('prompt', 'consent');
    location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + p.toString());
  }
  /* Beim Start still neu anmelden, wenn die Stunde abgelaufen ist (ohne Fenster, nur kurze Weiterleitung) */
  function trySilent() {
    if (IOS_APP || !CFG.clientId || hasTok() || !navigator.onLine) return false;
    if (!tok && !LS.get('email', '')) return false;               // noch nie verbunden → normaler Start
    if (Date.now() - LS.get('sfail', 0) < 10 * 60000) return false; // gerade erst fehlgeschlagen → nicht im Kreis drehen
    redirectLogin(true); return true;
  }
  function gis() {
    return new Promise(res => {
      if (window.google && google.accounts && google.accounts.oauth2) return res(true);
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s);
    });
  }
  async function login() {
    if (!CFG.clientId) throw new Error('Noch keine Google-Client-ID eingetragen (config.js)');
    if (!IOS_APP) { LS.del('sfail'); redirectLogin(false); return new Promise(() => { }) }
    if (!(await gis()) || !window.google) throw new Error('Google-Login gerade nicht erreichbar');
    return new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: CFG.clientId, scope: CFG.scopes, login_hint: LS.get('email', '') || undefined,
        callback: r => {
          if (r.error) return rej(new Error(r.error_description || r.error));
          tok = { t: r.access_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 }; LS.set('tok', tok); saveEmail(); res(tok);
        },
        error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? 'Anmeldefenster geschlossen' : 'Anmeldung abgebrochen'))
      });
      tc.requestAccessToken({ prompt: LS.get('email', '') ? '' : 'consent' });
    });
  }
  function logout() { if (tok && window.google && google.accounts) try { google.accounts.oauth2.revoke(tok.t) } catch (e) { } tok = null; LS.del('tok'); setStatus('login') }
  class AuthErr extends Error { constructor() { super('Google-Verbindung abgelaufen'); this.auth = true } }
  async function api(url, opt = {}) {
    if (!hasTok()) throw new AuthErr();
    opt.headers = Object.assign({ Authorization: 'Bearer ' + tok.t }, opt.headers || {});
    const r = await fetch(url, opt);
    if (r.status === 401) { tok = null; LS.del('tok'); throw new AuthErr() }
    if (!r.ok) { let m = r.status + ''; try { const j = await r.json(); m = (j.error && j.error.message) || m } catch (e) { } const e = new Error(m); e.status = r.status; throw e }
    return r;
  }

  /* ---------- Google Drive ---------- */
  const DA = 'https://www.googleapis.com/drive/v3/files', DU = 'https://www.googleapis.com/upload/drive/v3/files';
  const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  async function find(q, fields) {
    const r = await api(DA + '?pageSize=50&spaces=drive&q=' + encodeURIComponent(q) + '&fields=' + encodeURIComponent('files(' + (fields || 'id,name,modifiedTime') + ')'));
    return (await r.json()).files || [];
  }
  async function mkFolder(name, parent) {
    const r = await api(DA + '?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: J({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] }) });
    return (await r.json()).id;
  }
  async function mkFile(name, parent, text, mime) {
    const b = 'losb' + Math.random().toString(36).slice(2);
    const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${J({ name, parents: [parent], mimeType: mime })}\r\n--${b}\r\nContent-Type: ${mime}; charset=UTF-8\r\n\r\n${text}\r\n--${b}--`;
    const r = await api(DU + '?uploadType=multipart&fields=id,modifiedTime', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body });
    return r.json();
  }
  async function putFile(id, text, mime) {
    const r = await api(DU + '/' + id + '?uploadType=media&fields=id,modifiedTime', { method: 'PATCH', headers: { 'Content-Type': mime + '; charset=UTF-8' }, body: text });
    return r.json();
  }
  const meta = async id => (await api(DA + '/' + id + '?fields=id,modifiedTime,trashed')).json();
  const download = async id => (await api(DA + '/' + id + '?alt=media')).text();

  async function ids() {
    const m = LS.get('ids', {});
    if (!m.vault) {
      let f = await find(`name='${esc(CFG.vault)}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`, 'id,name,parents,capabilities(canAddChildren)');
      if (!f.length) f = await find(`name='${esc(CFG.vault)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, 'id,name,parents,capabilities(canAddChildren)');
      const ok = f.filter(x => x.capabilities && x.capabilities.canAddChildren);
      if (!ok.length) { const e = new Error(f.length ? 'VAULT_BACKUP' : 'VAULT_MISSING'); e.code = e.message; throw e }
      m.vault = ok[0].id;
    }
    if (!m.folder) {
      const f = await find(`name='${esc(CFG.folder)}' and mimeType='application/vnd.google-apps.folder' and '${m.vault}' in parents and trashed=false`);
      m.folder = f.length ? f[0].id : await mkFolder(CFG.folder, m.vault);
    }
    if (!m.file) {
      const f = await find(`name='${esc(CFG.file)}' and '${m.folder}' in parents and trashed=false`);
      m.file = f.length ? f[0].id : null;
    }
    LS.set('ids', m);
    return m;
  }

  /* ---------- Notizen für Obsidian ---------- */
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h };
  const bodyOf = s => s.replace(/\(Stand [^)]*\)/, ''); // Zeitstempel zählt nicht als Änderung
  async function writeNotes(m) {
    if (!LOS.hooks || !LOS.hooks.markdown) return;
    const files = LOS.hooks.markdown(), H = LS.get('mdh', {}), I = LS.get('mdid', {});
    for (const [name, text] of Object.entries(files)) {
      const h = hash(bodyOf(text));
      if (H[name] === h && I[name]) continue;
      try {
        if (!I[name]) { const f = await find(`name='${esc(name)}' and '${m.folder}' in parents and trashed=false`); I[name] = f.length ? f[0].id : null }
        if (I[name]) await putFile(I[name], text, 'text/markdown'); else I[name] = (await mkFile(name, m.folder, text, 'text/markdown')).id;
        H[name] = h;
      } catch (e) { if (e.status === 404) delete I[name]; else throw e }
    }
    LS.set('mdh', H); LS.set('mdid', I);
  }
  const INBOX_TPL = `---\ntags: [life-os]\n---\n# 📥 Eingang\n\n> Schreib hier einfach Zeilen mit „- “ davor (To-dos, Termine, Ideen – z. B. „- Idee: Track mit Hypnox“ oder „- Gig Rostock am 21.11.“). Die Life-OS-App holt sie beim nächsten Abgleich ab, sortiert sie ein und leert diese Liste wieder.\n\n`;
  async function inbox(m) {
    let id = LS.get('inboxId', null), mt = LS.get('inboxMod', null);
    if (!id) { const f = await find(`name='${esc(CFG.inbox)}' and '${m.folder}' in parents and trashed=false`); id = f.length ? f[0].id : null }
    if (!id) { const f = await mkFile(CFG.inbox, m.folder, INBOX_TPL, 'text/markdown'); LS.set('inboxId', f.id); LS.set('inboxMod', f.modifiedTime); return 0 }
    let me; try { me = await meta(id) } catch (e) { if (e.status === 404) { LS.del('inboxId'); return 0 } throw e }
    if (me.trashed) { LS.del('inboxId'); return 0 }
    LS.set('inboxId', id);
    if (me.modifiedTime === mt) return 0;
    const txt = await download(id);
    const lines = txt.split(/\r?\n/).map(s => (s.match(/^\s*[-*+]\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/) || [])[1]).filter(Boolean);
    if (lines.length && LOS.hooks && LOS.hooks.capture) {
      lines.forEach(t => LOS.hooks.capture(t));
      logEntry('Aus Obsidian-Eingang übernommen: ' + lines.join(' · '));
      const f = await putFile(id, INBOX_TPL, 'text/markdown'); LS.set('inboxMod', f.modifiedTime);
      return lines.length;
    }
    LS.set('inboxMod', me.modifiedTime); return 0;
  }
  function logEntry(text) {
    const D = LOS.data; if (!D) return; D.log = D.log || [];
    const n = new Date(), p = x => String(x).padStart(2, '0');
    const at = n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()) + 'T' + p(n.getHours()) + ':' + p(n.getMinutes());
    if (D.log[0] && D.log[0].at.slice(0, 13) === at.slice(0, 13) && D.log[0].app) D.log[0].items.push(text);
    else D.log.unshift({ at, app: true, items: [text] });
    D.log = D.log.slice(0, 60);
  }

  /* ---------- Gmail ---------- */
  const GM = 'https://gmail.googleapis.com/gmail/v1/users/me';
  async function gmailMarkRead(ths) { for (const id of ths) await api(GM + '/threads/' + id + '/modify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: J({ removeLabelIds: ['UNREAD'] }) }) }
  function queueRead(ths) { const q = LS.get('readq', []); LS.set('readq', [...new Set([...q, ...ths])]) }
  async function flushRead() { const q = LS.get('readq', []); if (!q.length) return; await gmailMarkRead(q); LS.set('readq', []) }
  async function pullMails(force) {
    if (!force && Date.now() - LS.get('gmt', 0) < CFG.mailEveryMin * 60000) return false;
    LS.set('gmt', Date.now());
    const D = LOS.data; D.mails = D.mails || []; let changed = false;
    const q = 'is:unread is:important in:inbox newer_than:7d -category:promotions -category:social -category:forums';
    const list = await (await api(GM + '/threads?maxResults=15&q=' + encodeURIComponent(q))).json();
    const known = new Set(D.mails.flatMap(m => m.th || []));
    const p = x => String(x).padStart(2, '0');
    for (const t of (list.threads || []).reverse()) {
      if (known.has(t.id)) continue;
      const th = await (await api(GM + '/threads/' + t.id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject')).json();
      const msg = th.messages[th.messages.length - 1], H = n => ((msg.payload.headers || []).find(h => h.name === n) || {}).value || '';
      const d = new Date(+msg.internalDate);
      const from = (H('From').replace(/<[^>]*>/, '').replace(/"/g, '').trim()) || H('From');
      D.next = Math.max(D.next || 0, maxId(D) + 1);
      D.mails.unshift({ id: D.next++, d: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), from, t: H('Subject') || '(ohne Betreff)', note: '', hot: false, th: [t.id], done: false, auto: true });
      changed = true;
    }
    // in Gmail schon gelesen → hier abhaken
    for (const m of D.mails.filter(m => !m.done && m.th && m.th.length).slice(0, 12)) {
      let th = null; try { th = await (await api(GM + '/threads/' + m.th[0] + '?format=minimal')).json() } catch (e) { if (e.auth) throw e }
      if (th && th.messages && !th.messages.some(x => (x.labelIds || []).includes('UNREAD'))) {
        m.done = true; const n = new Date(); m.at = n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()); changed = true;
      }
    }
    if (D.mails.length > 80) D.mails = D.mails.filter(m => !m.done).concat(D.mails.filter(m => m.done).slice(0, 40));
    return changed;
  }

  /* ---------- Abgleich ---------- */
  let state = 'idle', detail = '', syncing = false, again = false, tmr = null, pending = null;
  function setStatus(s, d) { state = s; detail = d || ''; try { document.body.dataset.st = s } catch (e) { } const b = document.getElementById('cld'); if (b) b.innerHTML = badge(); const p = document.getElementById('losp'); if (p) LOS.panel(true) }
  function badge() {
    const t = LS.get('last', 0), hm = t ? new Date(t).toTimeString().slice(0, 5) : '';
    return ({ ok: '☁ ✓ ' + hm, sync: '☁ …', login: '☁ Verbinden', offline: '☁ Offline', err: '☁ ⚠', vault: '☁ ⚠ Vault', nocfg: '☁ Einrichten', idle: '☁' })[state] || '☁';
  }
  function apply(next) {
    const D = LOS.data;
    if (LOS.hooks && LOS.hooks.busy && LOS.hooks.busy()) { pending = next; return false }
    for (const k of Object.keys(D)) if (!(k in next)) delete D[k];
    Object.assign(D, copy(next)); LS.set('data', clean(D));
    if (LOS.hooks && LOS.hooks.render) LOS.hooks.render();
    return true;
  }
  setInterval(() => { if (pending && !(LOS.hooks && LOS.hooks.busy && LOS.hooks.busy())) { const n = pending; pending = null; apply(n) } }, 1000);

  async function sync(opts = {}) {
    if (!CFG.clientId) return setStatus('nocfg');
    if (!navigator.onLine) return setStatus('offline');
    if (!hasTok()) return setStatus('login');
    if (syncing) { again = true; return }
    syncing = true; setStatus('sync');
    try {
      const m = await ids();
      const snap = clean(LOS.data || {}), base = LS.get('base', null);
      let remote = null, rmod = LS.get('rmod', null);
      if (m.file) {
        let me; try { me = await meta(m.file) } catch (e) { if (e.status === 404) { m.file = null; LS.set('ids', m) } else throw e }
        if (me && me.trashed) { m.file = null; LS.set('ids', m) }
        if (m.file && (me.modifiedTime !== rmod || !base)) { remote = JSON.parse(await download(m.file)); rmod = me.modifiedTime }
      }
      let merged;
      if (!LOS.data) merged = remote;                                         // neues Gerät: nur holen
      else if (remote) merged = base ? merge3(base, snap, remote) : remote;    // drüben geändert: zusammenführen
      else merged = snap;
      if (!merged) { setStatus('err', 'Im Vault liegt noch keine life-os.json'); return }
      const ref = remote || base;
      if (!m.file) { const f = await mkFile(CFG.file, m.folder, J(merged, null, 1), 'application/json'); m.file = f.id; LS.set('ids', m); rmod = f.modifiedTime }
      else if (!ref || !eq(merged, ref)) { const f = await putFile(m.file, J(merged, null, 1), 'application/json'); rmod = f.modifiedTime }
      LS.set('rmod', rmod); LS.set('base', merged);
      if (!LOS.data) { LOS.data = copy(merged); LS.set('data', merged) }
      else if (!eq(merged, snap)) {
        const now = clean(LOS.data);
        apply(eq(now, snap) ? merged : merge3(snap, now, merged)); // während des Abgleichs Getipptes bleibt erhalten
        if (!eq(now, snap)) again = true;
      }
      if (LOS.started) {
        let ch = false;
        try { await flushRead() } catch (e) { }
        try { ch = (await inbox(m)) > 0 || ch } catch (e) { console.warn('Eingang', e) }
        try { ch = (await pullMails(opts.mails)) || ch } catch (e) { console.warn('Gmail', e) }
        if (ch) { LS.set('data', clean(LOS.data)); if (LOS.hooks && LOS.hooks.render && !(LOS.hooks.busy && LOS.hooks.busy())) LOS.hooks.render(); again = true }
        try { await writeNotes(m) } catch (e) { console.warn('Notizen', e) }
      }
      LS.set('last', Date.now()); setStatus('ok');
    } catch (e) {
      if (e.auth) setStatus('login');
      else if (e.code === 'VAULT_MISSING' || e.code === 'VAULT_BACKUP') { LS.del('ids'); setStatus('vault', e.code) }
      else setStatus(navigator.onLine ? 'err' : 'offline', e.message || String(e));
    } finally {
      syncing = false;
      if (again) { again = false; clearTimeout(tmr); tmr = setTimeout(() => sync(), 1500) }
    }
  }
  function changed() {
    if (LOS.data) LS.set('data', clean(LOS.data));
    clearTimeout(tmr); tmr = setTimeout(() => sync(), 2500);
    if (state === 'ok') setStatus('ok');
  }

  /* ---------- Panel (☁) ---------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  function panel(refresh) {
    const H = LOS.hooks; if (!H || !H.sheet) return;
    if (refresh && !document.getElementById('losp')) return;
    const t = LS.get('last', 0), when = t ? new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'noch nie';
    const txt = ({
      ok: 'Verbunden mit deinem Vault in Google Drive.',
      sync: 'Gleiche gerade mit dem Vault ab …',
      login: 'Nicht verbunden. Tipp auf „Mit Google verbinden“ – deine Eingaben bleiben solange sicher auf dem Gerät und werden danach übertragen.',
      offline: 'Offline. Alles wird auf dem Gerät gespeichert und beim nächsten Netz automatisch übertragen.',
      err: 'Fehler beim Abgleich: ' + detail,
      vault: detail === 'VAULT_BACKUP' ? 'Der Kevin-Vault liegt noch unter „Computer“ (Backup) – dort darf die App nicht schreiben. Bitte den Vault nach „Meine Ablage“ verschieben.' : 'Kein Ordner „Kevin-Vault“ in deiner Google-Drive-Ablage gefunden.',
      nocfg: 'Die App ist noch nicht mit Google eingerichtet (Client-ID fehlt in config.js).',
      idle: ''
    })[state] || '';
    H.sheet(`<div id="losp"><div class="row"><b style="font-size:18px">☁ Vault &amp; App</b><button class="x" id="lcl">✕</button></div>
      <p style="margin:6px 0 12px;color:var(--mu);font-size:13.5px;line-height:1.5">${txt}</p>
      <div style="font-family:var(--mono);font-size:11.5px;color:var(--mu);margin-bottom:12px">Letzter Abgleich: ${when}<br>Ablage: Meine Ablage › ${CFG.vault} › ${CFG.folder}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${hasTok() ? `<button class="btn" id="lsy">↻ Jetzt abgleichen</button><button class="btn g" id="lml">✉ Mails holen</button>` : `<button class="btn" id="lli">Mit Google verbinden</button>`}
        ${installEvt && !standalone ? `<button class="btn g" id="lin">⬇ App installieren</button>` : ''}
        ${hasTok() ? `<button class="btn g" id="llo" style="margin-left:auto">Abmelden</button>` : ''}
      </div>
      ${!standalone && isIOS ? `<p style="margin-top:12px;font-size:12.5px;color:var(--mu)">Aufs iPhone holen: in Safari unten auf <b>Teilen</b> → <b>Zum Home-Bildschirm</b>.</p>` : ''}
      ${!standalone && !isIOS && !installEvt ? `<p style="margin-top:12px;font-size:12.5px;color:var(--mu)">Installieren: im Browser-Menü (⋮) auf <b>App installieren</b> bzw. <b>Zum Startbildschirm hinzufügen</b>.</p>` : ''}
      <p style="margin-top:12px;font-size:12px;color:var(--mu)">Alles, was du hier einträgst, landet automatisch im Vault: <code>life-os.json</code> (Daten) plus lesbare Notizen für Obsidian. Was du in Obsidian unter <b>Life OS › Eingang</b> schreibst, holt die App ab.</p></div>`);
    const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f };
    on('lcl', H.close);
    on('lli', async () => { try { await login(); await sync({ mails: true }); panel(true) } catch (e) { setStatus('login'); alert(e.message) } });
    on('lsy', () => sync({ mails: true }));
    on('lml', () => sync({ mails: true }));
    on('lin', async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; panel(true) });
    on('llo', () => { logout(); panel(true) });
  }

  /* ---------- Start ---------- */
  window.addEventListener('online', () => sync());
  window.addEventListener('offline', () => setStatus('offline'));
  let day = new Date().toDateString();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (new Date().toDateString() !== day) { location.reload(); return }
    sync();
  });
  setInterval(() => { if (document.visibilityState === 'visible') sync() }, 90000);

  window.LOS = {
    cfg: CFG, data: LS.get('data', null), hooks: null, started: false,
    changed, sync, login, trySilent, logout, badge, panel, gmailMarkRead, queueRead, setStatus,
    _merge3: merge3, _eq: eq, hasTok
  };
})();
