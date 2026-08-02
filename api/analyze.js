const DIRECT_MEDIA = /\.(mp4|webm|mov|m4a|mp3|wav|ogg|opus)(?:$|\?)/i;
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?)/i;
const PLATFORM_MAP = [
  [/(^|\.)tiktok\.com$|(^|\.)vm\.tiktok\.com$/, 'TikTok'],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'YouTube'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)facebook\.com$|(^|\.)fb\.watch$/, 'Facebook'],
  [/(^|\.)x\.com$|(^|\.)twitter\.com$/, 'X / Twitter'],
  [/(^|\.)soundcloud\.com$/, 'SoundCloud'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'Pinterest'],
  [/(^|\.)reddit\.com$|(^|\.)redd\.it$/, 'Reddit'],
  [/(^|\.)vimeo\.com$/, 'Vimeo']
];

const platformOf = (hostname) => PLATFORM_MAP.find(([pattern]) => pattern.test(hostname))?.[1] || 'Media publik';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method tidak diizinkan.' });
  const body = request.body || {};
  if (!body.url || String(body.url).length > 2048) return response.status(400).json({ error: 'Masukkan URL yang valid.' });

  let source;
  try { source = new URL(String(body.url).trim()); }
  catch { return response.status(400).json({ error: 'Format URL tidak valid.' }); }

  if (!['http:', 'https:'].includes(source.protocol) || PRIVATE_HOST.test(source.hostname)) {
    return response.status(400).json({ error: 'URL tidak diizinkan.' });
  }

  const platform = platformOf(source.hostname);
  const mode = body.mode === 'audio' ? 'audio' : 'video';
  const quality = ['max', '1080', '720', '480', '360'].includes(body.quality) ? body.quality : '1080';

  if (DIRECT_MEDIA.test(source.pathname + source.search)) {
    const filename = decodeURIComponent(source.pathname.split('/').pop() || `ditz-media.${mode === 'audio' ? 'mp3' : 'mp4'}`);
    return response.status(200).json({ status: 'ready', platform, title: filename, filename, downloadUrl: source.toString(), mode, quality, direct: true });
  }

  const apiUrl = process.env.COBALT_API_URL?.replace(/\/$/, '');
  if (!apiUrl) {
    return response.status(503).json({
      status: 'needs-backend',
      platform,
      message: `${platform} terdeteksi. Sambungkan instance API downloader milik sendiri untuk mengaktifkan proses file.`,
      setup: 'Isi COBALT_API_URL dan opsional COBALT_API_KEY di Environment Variables Vercel.',
      mode,
      quality
    });
  }

  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'DiTzDownloader/1.0' };
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: source.toString(),
        downloadMode: mode === 'audio' ? 'audio' : 'auto',
        audioFormat: 'mp3',
        audioBitrate: '320',
        videoQuality: quality,
        filenameStyle: 'pretty',
        youtubeVideoContainer: 'mp4',
        youtubeVideoCodec: 'h264',
        tiktokFullAudio: mode === 'audio'
      }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await upstream.json();
    if (!upstream.ok || data.status === 'error') {
      return response.status(502).json({ error: 'Media tidak dapat diproses oleh server downloader.', detail: data.error?.code || 'upstream-error' });
    }
    return response.status(200).json({ ...data, platform, mode, quality });
  } catch {
    return response.status(504).json({ error: 'Server downloader tidak merespons.' });
  }
}
