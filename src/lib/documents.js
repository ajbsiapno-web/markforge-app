import { supabase, isSupabaseConfigured } from './supabase';

// Fetch user's documents from Supabase (or local storage fallback)
export async function fetchUserDocuments(user) {
  if (!user) return getLocalDocuments();

  if (isSupabaseConfigured && supabase && user.id) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local storage:', err.message);
      return getLocalDocuments(user.email);
    }
  }

  return getLocalDocuments(user.email);
}

// Save or update document in Supabase
export async function saveUserDocument(user, currentDocId, title, content) {
  const docTitle = title || 'Untitled.md';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase && user?.id) {
    try {
      if (currentDocId) {
        // Update existing document
        const { data, error } = await supabase
          .from('documents')
          .update({ title: docTitle, content, updated_at: now })
          .eq('id', currentDocId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, doc: data };
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('documents')
          .insert([
            {
              user_id: user.id,
              title: docTitle,
              content,
              updated_at: now,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return { success: true, doc: data };
      }
    } catch (err) {
      console.warn('Supabase save error, saving locally:', err.message);
    }
  }

  // Fallback Local Storage
  const localDocs = getLocalDocuments(user?.email);
  let docId = currentDocId || `local_${Date.now()}`;
  const existingIdx = localDocs.findIndex((d) => d.id === docId);

  const docObj = {
    id: docId,
    user_id: user?.id || 'guest',
    title: docTitle,
    content,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    localDocs[existingIdx] = docObj;
  } else {
    localDocs.unshift(docObj);
  }

  saveLocalDocuments(user?.email, localDocs);
  return { success: true, doc: docObj };
}

// Delete document from Supabase
export async function deleteUserDocument(user, docId) {
  if (isSupabaseConfigured && supabase && user?.id && !docId.startsWith('local_')) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete error:', err.message);
    }
  }

  // Also remove from local storage
  const localDocs = getLocalDocuments(user?.email).filter((d) => d.id !== docId);
  saveLocalDocuments(user?.email, localDocs);
  return { success: true };
}

// Helper: Local Storage documents fallback
function getLocalDocuments(userEmail = 'guest') {
  try {
    const key = `markforge_docs_${userEmail}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocalDocuments(userEmail = 'guest', docs = []) {
  try {
    const key = `markforge_docs_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(docs));
  } catch (e) {
    console.error(e);
  }
}
