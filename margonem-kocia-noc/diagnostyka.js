// Diagnostyka motywu Margonem – Kocia Noc.
// Wklej całość do konsoli (F12 → Console) w grze, na nowym interfejsie, z otwartym
// jednym oknem (np. ekwipunkiem) i najechanym przedmiotem (tooltip widoczny).
// Wynik trafia do schowka — wklej go w rozmowie. Skrypt niczego nie zmienia w grze.
(() => {
  const out = {};
  const cls = (el) => (el && typeof el.className === 'string' ? el.className.trim() : '');
  const path = (el, n = 4) => {
    const p = [];
    for (let e = el; e && e !== document.body && p.length < n; e = e.parentElement) {
      p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (cls(e) ? '.' + cls(e).split(/\s+/).slice(0, 3).join('.') : ''));
    }
    return p.join(' > ');
  };

  out.motyw = {
    klasaHtml: document.documentElement.className,
    stylMotywu: !!document.getElementById('mkn-theme-style'),
    przelacznik: !!document.getElementById('mkn-toggle'),
    Engine: typeof window.Engine,
    url: location.host
  };

  // Które selektory motywu trafiają i ile elementów.
  const test = ['.game-window-positioner', '.interface-layer', '.game-layer', '.c-window', '.border-window',
    '.header-label', '.content', '.close-button', '.button', '.button .label', '.hp-indicator', '.mp-indicator',
    '.exp-indicator', '.chat-tpl', '.new-chat-window', '.new-chat-message', '.tip-wrapper', '.tip-wrapper .item-name',
    '#GAME_CANVAS', '#centerbox', '#base'];
  out.selektory = Object.fromEntries(test.map((s) => [s, document.querySelectorAll(s).length]));

  // Najczęstsze klasy w UI (pomijając canvas).
  const counts = {};
  document.querySelectorAll('body *').forEach((el) => {
    if (el.tagName === 'CANVAS') return;
    cls(el).split(/\s+/).forEach((c) => { if (c && !c.startsWith('mkn')) counts[c] = (counts[c] || 0) + 1; });
  });
  out.klasy = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 250).map(([c, n]) => c + ':' + n).join(' ');

  // Elementy z grafikami w tle — to one najczęściej "przykrywają" kolory motywu.
  const bg = {};
  document.querySelectorAll('body *').forEach((el) => {
    const s = getComputedStyle(el);
    const img = s.backgroundImage;
    if (img && img !== 'none' && img.includes('url(') && !img.includes('data:image/svg')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const key = path(el, 3);
      if (!bg[key]) bg[key] = { img: img.slice(0, 160), pos: s.backgroundPosition, size: Math.round(r.width) + 'x' + Math.round(r.height), n: 0 };
      bg[key].n++;
    }
    if (s.borderImageSource && s.borderImageSource !== 'none') {
      bg['[border-image] ' + path(el, 3)] = { img: s.borderImageSource.slice(0, 160) };
    }
  });
  out.grafikiTla = Object.entries(bg).sort((a, b) => (b[1].n || 0) - (a[1].n || 0)).slice(0, 120);

  // Arkusze stylów gry.
  out.arkusze = [...document.styleSheets].map((s) => s.href || ('<inline ' + (s.ownerNode && s.ownerNode.id || '') + '>')).slice(0, 40);

  // Struktura pierwszego okna i tooltipa (skrócona).
  const snap = (el) => el ? el.outerHTML.replace(/\s(style|src)="[^"]{60,}"/g, ' $1="…"').slice(0, 2500) : null;
  out.okno = snap(document.querySelector('.c-window, .border-window, [class*="window" i]'));
  out.tooltip = snap(document.querySelector('.tip-wrapper, [class*="tip" i]'));
  out.czat = snap(document.querySelector('.chat-tpl, .new-chat-window, [class*="chat" i]'))?.slice(0, 1500);
  const hp = [...document.querySelectorAll('[class*="hp" i], [class*="health" i], [class*="life" i]')].slice(0, 6);
  out.paskiHP = hp.map((e) => path(e, 4));

  const text = JSON.stringify(out, null, 1);
  try { copy(text); console.log('%cSkopiowano do schowka (' + text.length + ' znaków). Wklej w rozmowie.', 'color:#b79cf0;font-weight:bold'); }
  catch { console.log(text); }
  return out;
})();
