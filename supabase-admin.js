(function(){
  const SUPABASE_URL = window.SUPABASE_URL || '';
  const SUPABASE_KEY = window.SUPABASE_ANON_KEY || '';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const BUCKET = 'images';

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

  async function uploadImage(dataUrl) {
    const ext = dataUrl.substring(5).split(';')[0].split('/')[1];
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = dataUrlToBlob(dataUrl);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, { contentType: blob.type });
    if (error) {
      throw new Error('Image upload failed: ' + error.message);
    }
    const { data: urlData, error: urlError } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);
    if (urlError) {
      throw new Error('URL fetch failed: ' + urlError.message);
    }
    return urlData.publicUrl;
  }

  async function saveArtworkToDB(artwork) {
    const { error } = await supabase.from('artworks').upsert(artwork, { onConflict: 'id' });
    if (error) throw error;
  }

  async function artworkExists(id) {
    const { data, error } = await supabase.from('artworks').select('id').eq('id', id);
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  }

  window.supabaseAdmin = { uploadImage, saveArtworkToDB, artworkExists };
})();
