const icons = {
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"/><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 5v14"/><path d="M15 5v14"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="m12 3-1.6 4.4L6 9l4.4 1.6L12 15l1.6-4.4L18 9l-4.4-1.6z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
};
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icons[el.dataset.icon] || ''; });

const state = { mode: 'video', currentAudio: null, playingId: null };
const tabs = document.querySelectorAll('[data-tab]');
const urlPanel = document.getElementById('url-panel');
const musicPanel = document.getElementById('music-panel');

tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((item) => item.classList.toggle('active', item === tab));
  const music = tab.dataset.tab === 'music';
  urlPanel.classList.toggle('hidden', music);
  musicPanel.classList.toggle('hidden', !music);
}));

document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('selected', item === button));
  state.mode = button.dataset.mode;
}));

const mediaUrl = document.getElementById('media-url');
const detect = document.getElementById('detect');
mediaUrl.addEventListener('input', () => {
  const value = mediaUrl.value.toLowerCase();
  detect.textContent = value.includes('tiktok') ? 'TikTok' : value.includes('youtu') ? 'YouTube' : value.includes('instagram') ? 'Instagram' : value.includes('facebook') || value.includes('fb.watch') ? 'Facebook' : value.includes('soundcloud') ? 'SoundCloud' : value.includes('twitter') || value.includes('x.com') ? 'X' : 'Auto Detect';
});

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));

urlPanel.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('process-btn');
  const result = document.getElementById('result');
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span> Memproses...';
  result.innerHTML = '';
  try {
    const response = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ url: mediaUrl.value, mode: state.mode, quality: document.getElementById('quality').value }) });
    const data = await response.json();
    const finalUrl = data.downloadUrl || data.url;
    const warning = data.error || data.status === 'needs-backend';
    result.innerHTML = `<div class="result ${warning ? 'warning' : 'success'}"><div class="result-icon">${data.error ? '!' : data.status === 'needs-backend' ? '⚙' : '✓'}</div><div class="result-copy"><b>${data.error ? 'Gagal diproses' : data.status === 'needs-backend' ? `${escapeHtml(data.platform)} berhasil dikenali` : 'File siap diunduh'}</b><span>${escapeHtml(data.error || data.message || data.filename || data.title || '')}</span>${data.setup ? `<small>${escapeHtml(data.setup)}</small>` : ''}</div>${finalUrl ? `<a class="download-mini" href="${escapeHtml(finalUrl)}" target="_blank" rel="noreferrer">${icons.download} Download</a>` : ''}</div>`;
  } catch {
    result.innerHTML = '<div class="result warning"><div class="result-icon">!</div><div class="result-copy"><b>Koneksi gagal</b><span>Coba lagi beberapa saat.</span></div></div>';
  } finally {
    button.disabled = false;
    button.innerHTML = `${icons.bolt} Proses Sekarang ${icons.arrow}`;
  }
});

const musicForm = document.getElementById('music-form');
const musicResults = document.getElementById('music-results');
const musicEmpty = document.getElementById('music-empty');
musicForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = document.getElementById('music-query').value.trim();
  if (query.length < 2) return;
  const button = musicForm.querySelector('button');
  button.disabled = true;
  button.innerHTML = '<span class="spinner dark"></span>';
  musicResults.innerHTML = '';
  musicEmpty.classList.add('hidden');
  try {
    const response = await fetch(`/api/music?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Pencarian gagal.');
    if (!data.tracks.length) throw new Error('Lagu tidak ditemukan.');
    musicResults.innerHTML = `<div class="track-list">${data.tracks.map(trackTemplate).join('')}</div>`;
    bindTracks();
  } catch (error) {
    musicResults.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Cari';
  }
});

function duration(ms) { const sec = Math.round(ms/1000); return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`; }
function trackTemplate(track) {
  return `<article class="track" data-id="${escapeHtml(track.id)}" data-preview="${escapeHtml(track.previewUrl)}"><button class="cover" type="button" aria-label="Putar ${escapeHtml(track.title)}"><img src="${escapeHtml(track.artwork)}" alt="" loading="lazy"><span>${icons.play}</span></button><div class="track-meta"><b>${escapeHtml(track.title)}</b><span>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</span></div><span class="duration">${duration(track.duration)}</span><a class="track-download" href="${escapeHtml(track.previewUrl)}" target="_blank" rel="noreferrer" download>${icons.download}</a></article>`;
}
function bindTracks() {
  document.querySelectorAll('.track .cover').forEach((button) => button.addEventListener('click', () => {
    const item = button.closest('.track');
    const id = item.dataset.id;
    if (state.playingId === id) {
      state.currentAudio?.pause(); state.playingId = null; button.querySelector('span').innerHTML = icons.play; return;
    }
    document.querySelectorAll('.track .cover span').forEach((el) => el.innerHTML = icons.play);
    state.currentAudio?.pause();
    state.currentAudio = new Audio(item.dataset.preview);
    state.currentAudio.play(); state.playingId = id; button.querySelector('span').innerHTML = icons.pause;
    state.currentAudio.onended = () => { state.playingId = null; button.querySelector('span').innerHTML = icons.play; };
  }));
}
