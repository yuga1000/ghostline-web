// Supabase admin panel integration
// This script assumes that the Supabase JS SDK is loaded globally via CDN
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

(function(){
  const SUPABASE_URL = 'https://alqavrioetqfylwkqmak.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscWF2cmlvZXRxZnlsd2txbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTgyNDksImV4cCI6MjA2NTM5NDI0OX0.V7cQfoAat4LFC0zvye6B8W3ELNSA2kZE0D-If_fGfdc';

  // initialize Supabase client
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const form = document.getElementById('artworkForm');
  const imageInput = document.getElementById('imageInput');

  async function ensureBucket(name) {
    // tries to create the bucket if it doesn't exist
    // anonymous key might not have permission; ignore errors
    try {
      await supabase.storage.createBucket(name, { public: true });
    } catch (err) {
      // bucket may already exist or creation not allowed
      console.warn('createBucket error:', err.message);
    }
  }

  async function uploadImage(file) {
    const bucket = 'artworks';
    await ensureBucket(bucket);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }

  async function saveMetadata(url) {
    const { data, error } = await supabase.from('images').insert({ url }).select();
    if (error) throw error;
    return data[0];
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const file = imageInput.files[0];
    if (!file) {
      alert('Please choose an image to upload.');
      return;
    }
    try {
      const publicUrl = await uploadImage(file);
      await saveMetadata(publicUrl);
      alert('Image uploaded successfully!');
      form.reset();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image.');
    }
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
})();
