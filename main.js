const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const state = { cat: 'All', q: '', final: false, projects: [] };

Promise.all([fetch('data/site.json'), fetch('data/projects.json')].map(p => p.then(r => r.json())))
  .then(([site, pdata]) => init(site, pdata))
  .catch(() => document.body.insertAdjacentHTML('afterbegin', '<p style="padding:100px 24px">Could not load the data files. Run a local server in this folder (for example: python -m http.server) instead of double-clicking index.html.</p>'));

function init(site, pdata) {
  const ev = site.event;
  document.querySelectorAll('[data-register]').forEach(a => a.href = ev.registerUrl);
  $('#dateLabel').textContent = ev.dateLabel;
  $('#txLink').href = ev.techxpressUrl;
  $('#stats').innerHTML = site.stats.map(s => `<div><b data-to="${s.value}">0</b><span>${esc(s.label)}</span></div>`).join('');
  $('#schedule').innerHTML = site.schedule.map(s => `<li><b>${esc(s.time)}</b>${esc(s.what)}</li>`).join('');

  state.projects = pdata.projects;
  $('#pills').innerHTML = ['All', ...pdata.categories].map(c => `<button class="pill${c === 'All' ? ' on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  $('#pills').addEventListener('click', e => {
    const b = e.target.closest('.pill'); if (!b) return;
    state.cat = b.dataset.c;
    document.querySelectorAll('.pill').forEach(p => p.classList.toggle('on', p === b));
    renderProjects();
  });
  $('#search').addEventListener('input', e => { state.q = e.target.value.toLowerCase(); renderProjects(); });
  $('#onlyFinal').addEventListener('change', e => { state.final = e.target.checked; renderProjects(); });
  renderProjects();

  $('#panelList').innerHTML = site.panels.map(p => `<article class="panel"><h3>${esc(p.topic)}</h3>
    <p class="mod">Moderator: ${esc(p.moderator.name)}, ${esc(p.moderator.role)}</p>
    <div class="people">${p.panellists.map(x => `<div class="person">${x.photo ? `<img class="av" src="${esc(x.photo)}" alt="${esc(x.name)}" loading="lazy">` : `<div class="av">${esc(x.name[0])}</div>`}<b>${esc(x.name)}</b><small>${esc(x.role)}</small><small>${esc(x.company)}</small></div>`).join('')}</div></article>`).join('');

  if (site.companies.length) { // stays hidden until logos are supplied
    $('#companies').hidden = false;
    const row = site.companies.map(c => `<img src="${esc(c.logo)}" alt="${esc(c.name)}" loading="lazy">`).join('');
    $('#logoRow').innerHTML = row + row;
  }

  const qItems = site.testimonials.map((t, i) => `<figure class="cmt${i % 3 === 1 ? ' alt' : ''}"><blockquote><p>“${esc(t.quote)}”</p></blockquote><figcaption><span class="av">${esc(t.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</span><span><b>${esc(t.name)}</b><small>${esc(t.org)}</small></span></figcaption></figure>`).join('');
  // infinite loop: three identical copies; the scroll position jumps back by one copy so it never ends
  $('#quotes').innerHTML = `<div class="qtrack">${qItems}${qItems.replace(/<figure /g, '<figure aria-hidden="true" ').repeat(2)}</div>`;
  document.fonts.ready.then(loopQuotes);

  $('#editionList').innerHTML = site.editions.map(e => `<article class="ed"><span>${esc(e.year)}</span><h3>${esc(e.name)}</h3><p>${esc(e.students)} students · ${esc(e.projects)} projects</p><a href="${esc(e.url)}" target="_blank" rel="noopener">Visit website ↗</a></article>`).join('');

  // $('#galleryGrid').innerHTML = site.gallery.map((g, i) => `<img src="${encodeURI(`https://www.abinya.in/gallery/${g}.webp`)}" alt="Abinya exhibition moment ${i + 1}" loading="lazy">`).join('');

  $('#galleryGrid').innerHTML = site.gallery.map((g, i) =>
  `<img src="${esc(g)}"
        alt="Abinya exhibition moment ${i + 1}"
        loading="lazy">`
).join('');


  $('#galleryGrid').addEventListener('click', e => { if (e.target.tagName === 'IMG') { $('#lightbox img').src = e.target.src; $('#lightbox').hidden = false; } });
  $('#lightbox').addEventListener('click', () => $('#lightbox').hidden = true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').hidden = true; });

  $('#facultyList').innerHTML = site.faculty.map(f => `<div class="fac"><img src="${esc(f.photo)}" alt="${esc(f.name)}" loading="lazy"><b>${esc(f.name)}</b><br><small>${esc(f.role)}</small></div>`).join('');

  const v = site.venue;
  $('#venueInfo').innerHTML = `<h3>Event venue</h3>
    <div class="row"><small>Address</small><p>${esc(v.address)}</p><a class="dir" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}" target="_blank" rel="noopener">Get directions ↗</a></div>
    <div class="row two"><small>Student contacts</small>${v.students.map(s => `<a class="ct" href="tel:${esc(s.phone.replace(/\s/g, ''))}"><span class="av">${esc(s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</span><span class="who"><b>${esc(s.name)}</b><em>${esc(s.phone)}</em></span><i>Call</i></a>`).join('')}</div>
    <div class="row two"><div><small>Faculty coordinator</small><a class="big" href="mailto:${esc(v.facultyEmail)}">${esc(v.facultyEmail)}</a></div><div><small>Follow</small><a class="big" href="${esc(ev.instagram)}" target="_blank" rel="noopener">Instagram ↗</a></div></div>
    <a class="yel" href="${esc(ev.registerUrl)}" target="_blank" rel="noopener">Register <i>→</i></a>`;
  $('#footLinks').innerHTML = `<a href="mailto:${esc(ev.email)}">${esc(ev.email)}</a><a href="${esc(ev.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(ev.techxpressUrl)}" target="_blank" rel="noopener">SOA TechXpress</a>`;

  countdown(new Date(ev.date));
  countUp();
  window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 30), { passive: true });
}

function renderProjects() {
  const list = state.projects.filter(p =>
    (state.cat === 'All' || p.category === state.cat) &&
    (!state.final || p.finalist) &&
    (!state.q || (p.title + p.team + p.institute + p.pitch).toLowerCase().includes(state.q)));
  $('#grid').innerHTML = list.map(p => {
    const soon = p.revealed === false;
    const tag = soon ? 'article' : 'a';
    return `<${tag} class="stamp card${p.finalist ? ' final' : ''}${soon ? ' soon' : ''}"${soon ? '' : ` href="project.html?id=${p.id}"`}>
      <div class="ph">${soon ? '<span>Revealing<br>5 December</span>' : `<img src="${esc(p.photo)}" alt="${esc(p.title)} by ${esc(p.team)}" loading="lazy">`}${p.finalist ? '<em class="fin">TechXpress Finalist</em>' : ''}</div>
      <h3>${soon ? 'Finalist to be revealed' : esc(p.title)}</h3>
      <p class="meta">${soon ? 'Details arrive on the night of 5th December' : esc(p.team) + ', ' + esc(p.institute)}</p>
      ${p.pitch ? `<p class="pitch">${esc(p.pitch)}</p>` : ''}
      <div class="cf"><span>[ ${esc(p.category)} ]</span>${p.stall ? `<b>${esc(p.stall)}</b>` : ''}</div></${tag}>`;
  }).join('');
  $('#empty').hidden = list.length > 0;
}

function countdown(target) {
  const el = $('#countdown');
  const tick = () => {
    let d = Math.max(0, target - Date.now()) / 1000;
    el.innerHTML = [['Days', 86400], ['Hours', 3600], ['Minutes', 60], ['Seconds', 1]].map(([l, s]) => { const n = Math.floor(d / s); d -= n * s; return `<div><b>${String(n).padStart(2, '0')}</b><span>${l}</span></div>`; }).join('');
  };
  tick(); setInterval(tick, 1000);
}

function countUp() {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, to = +el.dataset.to; let t0;
    const step = t => { t0 ??= t; const k = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); io.unobserve(el);
  }), { threshold: .5 });
  document.querySelectorAll('[data-to]').forEach(el => io.observe(el));
}

// mobile / tablet menu
const navEl = $('#nav'), menuBtn = $('#menuBtn');
const closeMenu = () => { navEl.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', navEl.classList.toggle('open')));
document.querySelectorAll('#nav nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// endless "kind words" row: drifts by itself, can be swiped, dragged or scrolled by hand, and never reaches an end
function loopQuotes() {
  const box = $('#quotes'), track = box.firstElementChild;
  if (!track) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const copy = () => track.scrollWidth / 3;
  let pos = copy(), hold = 0, dragging = false, startX = 0, startLeft = 0, last = performance.now();
  box.scrollLeft = pos;
  const pause = ms => { hold = performance.now() + ms; };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => box.addEventListener(ev, () => pause(2500), { passive: true }));
  box.addEventListener('mouseenter', () => pause(1e9));
  box.addEventListener('mouseleave', () => pause(600));
  box.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dragging = true; startX = e.clientX; startLeft = box.scrollLeft; box.setPointerCapture(e.pointerId); box.style.cursor = 'grabbing'; });
  box.addEventListener('pointermove', e => { if (dragging) box.scrollLeft = startLeft - (e.clientX - startX); });
  const stop = () => { dragging = false; box.style.cursor = ''; };
  box.addEventListener('pointerup', stop); box.addEventListener('pointercancel', stop);
  const tick = t => {
    const dt = Math.min(t - last, 50) / 1000; last = t;
    const w = copy(); let moved = false;
    if (Math.abs(box.scrollLeft - pos) > 2) pos = box.scrollLeft;
    if (!reduce && !dragging && t > hold) { pos += 45 * dt; moved = true; }
    if (pos < w * .5) { pos += w; moved = true; } else if (pos >= w * 1.5) { pos -= w; moved = true; }
    if (moved) box.scrollLeft = pos;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
