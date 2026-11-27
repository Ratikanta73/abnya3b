const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ytId = v => (String(v || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || String(v || '').match(/^([\w-]{11})$/) || [])[1];

Promise.all([fetch('data/projects.json'), fetch('data/site.json')].map(p => p.then(r => r.json())))
  .then(([pdata, site]) => render(pdata.projects, site))
  .catch(() => { $('#pd').innerHTML = '<p>Could not load the project data. Run a local server in this folder (for example: python -m http.server).</p>'; });

function render(projects, site) {
  const ev = site.event;
  document.querySelectorAll('[data-register]').forEach(a => a.href = ev.registerUrl);
  $('#footLinks').innerHTML = `<a href="mailto:${esc(ev.email)}">${esc(ev.email)}</a><a href="${esc(ev.instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(ev.techxpressUrl)}" target="_blank" rel="noopener">SOA TechXpress</a>`;
  const id = new URLSearchParams(location.search).get('id');
  const p = projects.find(x => String(x.id) === id && x.revealed !== false);
  if (!p) { $('#pd').innerHTML = '<a class="back" href="index.html#projects">← Back to projects</a><h1>Project not found</h1>'; return; }
  document.title = `${p.title} · ABINYA 3.1`;
  const vid = ytId(p.video), fin = !!p.finalist;
  $('#pd').classList.toggle('fp', fin); document.body.classList.toggle('fin-page', fin);
  const team = (p.developers || []).map(m => `<div class="dev">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">` : `<div class="ini">${esc((m.name || '?')[0])}</div>`}<b>${esc(m.name)}</b><small>${esc(m.role)}</small></div>`).join('');
  $('#pd').innerHTML = `
    <a class="back" href="index.html#projects">← Back to projects</a>
    ${fin ? '<span class="seal">Finalist<i>✦</i>2026</span><p class="ribbon"><span>✦ SOA TechXpress 2026</span><b>Finalist</b></p>' : ''}
    <h1>${esc(p.title)}</h1>
    <p class="by">${esc(p.team)} · ${esc(p.institute)}</p>
    <p class="chips"><span class="chip">[ ${esc(p.category)} ]</span>${p.stall ? `<span class="chip">Stall ${esc(p.stall)}</span>` : ''}${p.finalist ? '<span class="chip gold">✦ TechXpress Finalist</span>' : ''}</p>
    <section><h2>About the Project</h2><p class="abt">${esc(p.about)}</p></section>
    <section><h2>Technologies Used</h2><div class="tags">${(p.technologies || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></section>
    <section><h2>Project Explanation Video</h2>${vid
      ? `<div class="vid" id="vid" role="button" tabindex="0" aria-label="Play video"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="Video thumbnail for ${esc(p.title)}"><span class="play">▶</span></div>`
      : '<div class="vid soon"><span>Video coming soon</span></div>'}</section>
    <section><h2>Project Gallery</h2><div class="gal" id="gal">${(p.gallery || []).map((g, i) => `<img src="${esc(g)}" alt="${esc(p.title)} gallery image ${i + 1}" loading="lazy">`).join('')}</div></section>
    <section><h2>Development Team</h2><div class="team">${team}</div></section>`;
  const v = $('#vid');
  if (v) { const play = () => { v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0" title="${esc(p.title)} explanation video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`; v.removeEventListener('click', play); }; v.addEventListener('click', play); v.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') play(); }); }
  $('#gal').addEventListener('click', e => { if (e.target.tagName === 'IMG') { $('#lightbox img').src = e.target.src; $('#lightbox').hidden = false; } });
  $('#lightbox').addEventListener('click', () => $('#lightbox').hidden = true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').hidden = true; });
}

// mobile / tablet menu (same as the home page)
const navEl = $('#nav'), menuBtn = $('#menuBtn');
const closeMenu = () => { navEl.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', navEl.classList.toggle('open')));
document.querySelectorAll('#nav nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
