// supabase-admin.js - Missing implementation file
class SupabaseAdmin {
constructor() {
// Initialize Supabase client with proper config
this.supabase = window.supabase.createClient(
window.SUPABASE_URL,
window.SUPABASE_ANON_KEY
);

```
    // Storage bucket name
    this.BUCKET_NAME = 'artworks'; // Change to your actual bucket name
}

// Check if artwork ID exists in database
async artworkExists(artworkId) {
    try {
        const { data, error } = await this.supabase
            .from('artworks')
            .select('id')
            .eq('id', artworkId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }
        
        return !!data;
    } catch (error) {
        console.error('Error checking artwork existence:', error);
        return false;
    }
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
        
        const { data, error } = await this.supabase
            .from('artworks')
            .upsert(artwork, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            })
            .select()
            .single();

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
            .from('artworks')
            .select('*')
            .order('dateAdded', { ascending: false });

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
            .from('artworks')
            .select('image')
            .eq('id', artworkId)
            .single();

        if (fetchError) {
            console.error('Error fetching artwork for deletion:', fetchError);
        }

        // Delete from database
        const { error: deleteError } = await this.supabase
            .from('artworks')
            .delete()
            .eq('id', artworkId);

        if (deleteError) {
            throw new Error(`Failed to delete from database: ${deleteError.message}`);
        }

        // If artwork has an image in storage, delete it
        if (artwork?.image && artwork.image.includes(this.BUCKET_NAME)) {
            try {
                const filename = artwork.image.split('/').pop();
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
```

}

// Initialize the admin instance
window.supabaseAdmin = new SupabaseAdmin();

// Updated saveArtwork function for admin.html
async function saveArtwork(event) {
event.preventDefault();

```
const editingId = document.getElementById('editingId').value;
const newId = document.getElementById('artworkId').value.trim();

// Validate artwork ID
if (!newId) {
    alert('Artwork ID is required!');
    return;
}

// Check for duplicate IDs
if ((!editingId || editingId !== newId) && artworks.some(a => a.id === newId)) {
    alert('Artwork ID already exists in local storage!');
    return;
}

// Check database for existing ID
if (window.supabaseAdmin && (!editingId || editingId !== newId)) {
    try {
        const exists = await window.supabaseAdmin.artworkExists(newId);
        if (exists) {
            alert('Artwork ID already exists in database!');
            return;
        }
    } catch (err) {
        console.error('ID check error:', err);
        alert('Error checking artwork ID. Please try again.');
        return;
    }
}

// Create artwork object
const artwork = {
    id: newId,
    title: document.getElementById('title').value || 'Untitled',
    description: document.getElementById('description').value || '',
    category: document.getElementById('category').value || 'latest',
    status: document.getElementById('status').value || 'available',
    price: document.getElementById('price').value || null,
    dimensions: document.getElementById('dimensions').value || '',
    medium: document.getElementById('medium').value || '',
    creationDate: document.getElementById('creationDate').value || new Date().toISOString().split('T')[0],
    edition: document.getElementById('edition').value || '',
    tags: document.getElementById('tags').value || '',
    notes: document.getElementById('notes').value || '',
    image: currentImageData, // Will be updated with storage URL
    dateAdded: editingId ? artworks.find(a => a.id === editingId)?.dateAdded : new Date().toISOString()
};

// Show loading state
const saveButton = document.getElementById('saveButton');
const originalText = saveButton.textContent;
saveButton.textContent = 'SAVING...';
saveButton.disabled = true;

try {
    // Upload image if present and is a data URL
    if (currentImageData && currentImageData.startsWith('data:') && window.supabaseAdmin) {
        console.log('Uploading image...');
        artwork.image = await window.supabaseAdmin.uploadImage(currentImageData, currentImageFilename);
        console.log('Image uploaded successfully:', artwork.image);
    }

    // Save to Supabase database
    if (window.supabaseAdmin) {
        console.log('Saving to database...');
        await window.supabaseAdmin.saveArtworkToDB(artwork);
        console.log('Saved to database successfully');
    }

    // Update local storage
    if (editingId) {
        const index = artworks.findIndex(a => a.id === editingId);
        if (index !== -1) {
            artworks[index] = artwork;
        } else {
            artworks.push(artwork);
        }
    } else {
        artworks.push(artwork);
    }

    saveToLocalStorage();
    await loadArtworks(); // Reload from database
    resetForm();
    alert(editingId ? 'Artwork updated successfully!' : 'Artwork saved successfully!');

} catch (err) {
    console.error('Save error:', err);
    alert(`Save failed: ${err.message || 'Unknown error occurred'}`);
} finally {
    // Restore button state
    saveButton.textContent = originalText;
    saveButton.disabled = false;
}
```

}

// Updated loadArtworks function to fetch from database
async function loadArtworks() {
try {
const listContainer = document.getElementById(‘artworkList’);
if (!listContainer) return;

```
    listContainer.innerHTML = '<p class="text-green-600 text-center py-4">Loading artworks...</p>';

    // Load from Supabase if available
    if (window.supabaseAdmin) {
        try {
            const dbArtworks = await window.supabaseAdmin.loadArtworks();
            if (dbArtworks.length > 0) {
                artworks = dbArtworks;
                saveToLocalStorage(); // Sync with local storage
            }
        } catch (err) {
            console.error('Error loading from database:', err);
            // Fall back to local storage
        }
    }

    if (artworks.length === 0) {
        listContainer.innerHTML = '<p class="text-green-600 text-center py-8">No artworks yet. Add your first piece!</p>';
        return;
    }

    listContainer.innerHTML = artworks.map(artwork => `
        <div class="artwork-card">
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center">
                    <span class="status-indicator status-${artwork.status || 'available'}"></span>
                    <strong>${artwork.id || 'Unknown'}</strong>
                </div>
                <div class="flex gap-2">
                    <button class="admin-button text-xs" onclick="editArtwork('${artwork.id}')">EDIT</button>
                    <button class="admin-button danger text-xs" onclick="deleteArtwork('${artwork.id}')">DELETE</button>
                </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div class="col-span-2">
                    <p class="text-sm mb-1"><strong>Title:</strong> ${artwork.title || 'Untitled'}</p>
                    <p class="text-xs text-green-400 mb-1"><strong>Category:</strong> ${artwork.category || 'latest'}</p>
                    <p class="text-xs text-green-400 mb-1"><strong>Price:</strong> ${artwork.price ? artwork.price + ' ETH' : 'Not set'}</p>
                    <p class="text-xs text-green-400 mb-1"><strong>Dimensions:</strong> ${artwork.dimensions || 'Not specified'}</p>
                    <p class="text-xs text-green-600"><strong>Created:</strong> ${artwork.creationDate || 'Unknown'}</p>
                </div>
                <div class="text-right">
                    ${artwork.image ? `<img src="${artwork.image}" class="image-preview ml-auto" alt="${artwork.title}">` : '<div class="w-16 h-16 border border-green-600 flex items-center justify-center text-xs">No Image</div>'}
                </div>
            </div>
        </div>
    `).join('');

} catch (error) {
    console.error('Load artworks error:', error);
    const listContainer = document.getElementById('artworkList');
    if (listContainer) {
        listContainer.innerHTML = '<p class="text-red-500 text-center py-8">Error loading artworks</p>';
    }
}
```

}

// Updated deleteArtwork function
async function deleteArtwork(id) {
if (!confirm(`Delete artwork ${id}? This cannot be undone.`)) {
return;
}

```
try {
    // Delete from Supabase if available
    if (window.supabaseAdmin) {
        await window.supabaseAdmin.deleteArtwork(id);
    }

    // Delete from local storage
    artworks = artworks.filter(a => a.id !== id);
    saveToLocalStorage();
    await loadArtworks();
    alert('Artwork deleted successfully!');
    
} catch (error) {
    console.error('Delete error:', error);
    alert(`Delete failed: ${error.message || 'Unknown error occurred'}`);
}
```

}
