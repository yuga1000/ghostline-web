// supabase-admin.js - Complete implementation
class SupabaseAdmin {
    constructor() {
        // Initialize Supabase client with proper config
        this.supabase = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );

        // Storage bucket name
        this.BUCKET_NAME = 'images';
    }

    // Upload image to Supabase Storage
    async uploadImage(imageDataUrl, filename) {
        try {
            // Convert data URL to File object
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            // Generate unique filename to avoid conflicts
            const timestamp = Date.now();
            const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFilename = `${timestamp}_${cleanFilename}`;
            
            console.log('Uploading image:', uniqueFilename);
            
            // Upload to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(this.BUCKET_NAME)
                .upload(uniqueFilename, blob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Storage upload error:', error);
                throw new Error(`Upload failed: ${error.message}`);
            }

            console.log('Upload successful:', data);

            // Get public URL for the uploaded image
            const { data: publicUrlData } = this.supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(uniqueFilename);

            return publicUrlData.publicUrl;
            
        } catch (error) {
            console.error('Image upload error:', error);
            throw new Error(`Image upload failed: ${error.message}`);
        }
    }

    // Save artwork to database
    async saveArtworkToDB(artwork) {
        try {
            console.log('Saving artwork to database:', artwork);

            let query;
            if (artwork.id) {
                const { id, ...updateData } = artwork;
                query = this.supabase
                    .from('images')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();
            } else {
                const insertData = { ...artwork };
                delete insertData.id;
                query = this.supabase
                    .from('images')
                    .insert(insertData)
                    .select()
                    .single();
            }

            const { data, error } = await query;

            if (error) {
                console.error('Database save error:', error);
                throw new Error(`Database save failed: ${error.message}`);
            }

            console.log('Database save successful:', data);
            return data;

        } catch (error) {
            console.error('Save to DB error:', error);
            throw new Error(`Failed to save artwork: ${error.message}`);
        }
    }

    // Load all artworks from database
    async loadArtworks() {
        try {
            const { data, error } = await this.supabase
                .from('images')
                .select('*')
                .order('date_added', { ascending: false });

            if (error) {
                console.error('Load artworks error:', error);
                throw new Error(`Failed to load artworks: ${error.message}`);
            }

            return data || [];
            
        } catch (error) {
            console.error('Load artworks error:', error);
            return [];
        }
    }

    // Delete artwork from database and storage
    async deleteArtwork(artworkId) {
        try {
            // First, get the artwork to find the image URL
            const { data: artwork, error: fetchError } = await this.supabase
                .from('images')
                .select('url')
                .eq('id', artworkId)
                .single();

            if (fetchError) {
                console.error('Error fetching artwork for deletion:', fetchError);
            }

            // Delete from database
            const { error: deleteError } = await this.supabase
                .from('images')
                .delete()
                .eq('id', artworkId);

            if (deleteError) {
                throw new Error(`Failed to delete from database: ${deleteError.message}`);
            }

            // If artwork has an image in storage, delete it
            if (artwork?.url && artwork.url.includes(this.BUCKET_NAME)) {
                try {
                    const filename = artwork.url.split('/').pop();
                    const { error: storageError } = await this.supabase.storage
                        .from(this.BUCKET_NAME)
                        .remove([filename]);
                    
                    if (storageError) {
                        console.warn('Failed to delete image from storage:', storageError);
                    }
                } catch (storageErr) {
                    console.warn('Storage deletion error:', storageErr);
                }
            }

            return true;
            
        } catch (error) {
            console.error('Delete artwork error:', error);
            throw new Error(`Failed to delete artwork: ${error.message}`);
        }
    }
}

// Initialize the admin instance
window.supabaseAdmin = new SupabaseAdmin();
