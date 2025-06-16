(function(){
  const SUPABASE_URL = window.SUPABASE_URL || '';
  const SUPABASE_KEY = window.SUPABASE_ANON_KEY || '';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  async function ensureBucket(name) {
    try { await supabase.storage.createBucket(name, { public: true }); }
    catch (err) { console.warn('createBucket error:', err.message); }
  }

  function dataUrlToBlob(dataUrl) {
    const [meta, base64] = dataUrl.split(',');
    const contentType = meta.split(':')[1].split(';')[0];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: contentType });
  }

  async function uploadArtworkImage(id, dataUrl) {
    const bucket = 'artworks';
    await ensureBucket(bucket);
    const extMatch = dataUrl.substring(5).split(';')[0].split('/')[1];
    const fileName = `${id}.${extMatch}`;
    const blob = dataUrlToBlob(dataUrl);
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, blob, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }

  async function saveArtworkToDB(artwork) {
    const { error } = await supabase.from('artworks').insert([artwork]);
    if (error) throw error;
  }

  window.supabaseAdmin = { uploadArtworkImage, saveArtworkToDB };
})();
