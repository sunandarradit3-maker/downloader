const clean = (value = '') => String(value).replace(/[<>]/g, '').trim().slice(0, 80);

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method tidak diizinkan.' });
  const query = clean(request.query.q);
  if (query.length < 2) return response.status(400).json({ error: 'Masukkan minimal 2 karakter.' });

  const endpoint = new URL('https://itunes.apple.com/search');
  endpoint.searchParams.set('term', query);
  endpoint.searchParams.set('entity', 'song');
  endpoint.searchParams.set('limit', '12');
  endpoint.searchParams.set('country', 'ID');
  endpoint.searchParams.set('lang', 'id_id');

  try {
    const upstream = await fetch(endpoint, { headers: { 'User-Agent': 'DiTzDownloader/1.0' } });
    if (!upstream.ok) throw new Error('provider');
    const data = await upstream.json();
    const tracks = (data.results || []).map((track) => ({
      id: String(track.trackId || crypto.randomUUID()),
      title: String(track.trackName || 'Tanpa judul'),
      artist: String(track.artistName || 'Artis tidak diketahui'),
      album: String(track.collectionName || 'Single'),
      artwork: String(track.artworkUrl100 || '').replace('100x100', '300x300'),
      previewUrl: String(track.previewUrl || ''),
      duration: Number(track.trackTimeMillis || 0),
      storeUrl: String(track.trackViewUrl || ''),
      explicit: String(track.trackExplicitness || 'notExplicit') !== 'notExplicit'
    })).filter((track) => track.previewUrl);

    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response.status(200).json({ tracks, legalNotice: 'Audio adalah cuplikan resmi sekitar 30 detik.' });
  } catch {
    return response.status(502).json({ error: 'Pencarian musik sedang tidak tersedia.' });
  }
}
