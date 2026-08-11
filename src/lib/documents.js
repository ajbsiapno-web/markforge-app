import { supabase, isSupabaseConfigured } from './supabase';

// Fetch a single document by ID (or title fallback for shared links)
export async function fetchDocumentById(docId, optionalTitle = null) {
  if (!docId && !optionalTitle) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      if (docId && !docId.startsWith('local_')) {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      }

      if (optionalTitle) {
        const cleanTitle = optionalTitle.trim().replace(/(\.md|\.txt|\.markdown)$/i, '');
        if (cleanTitle) {
          // 1. Try exact/substring match
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .ilike('title', `%${cleanTitle}%`)
            .limit(1);

          if (!error && data && data.length > 0) {
            return data[0];
          }

          // 2. Try word token matching (e.g. 'Job Order' -> matches 'job_order_...')
          const words = cleanTitle.split(/[\s_-]+/).filter((w) => w.length > 2);
          if (words.length > 0) {
            const orConditions = words.map((w) => `title.ilike.%${w}%`).join(',');
            const { data: wordData, error: wordErr } = await supabase
              .from('documents')
              .select('*')
              .or(orConditions)
              .limit(1);

            if (!wordErr && wordData && wordData.length > 0) {
              return wordData[0];
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch document error:', err.message);
    }
  }

  // Fallback to searching local storage across guest and user documents
  try {
    const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('markforge_docs_'));
    for (const key of allKeys) {
      const docs = JSON.parse(localStorage.getItem(key) || '[]');
      if (docId) {
        const found = docs.find((d) => d.id === docId);
        if (found) return found;
      }
      if (optionalTitle) {
        const found = docs.find((d) => d.title?.toLowerCase() === optionalTitle.toLowerCase());
        if (found) return found;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

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

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. If valid UUID cloud document exists, update it
      if (currentDocId && !currentDocId.startsWith('local_') && !currentDocId.startsWith('doc_')) {
        const updatePayload = { title: docTitle, content, updated_at: now };
        let query = supabase.from('documents').update(updatePayload).eq('id', currentDocId);
        if (user?.id) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.select().single();
        if (!error && data) {
          return { success: true, doc: data };
        }
      }

      // 2. Otherwise (new doc or local_ draft), insert a new cloud document in Supabase!
      const insertPayload = {
        title: docTitle,
        content,
        is_public: true,
        updated_at: now,
      };
      if (user?.id) {
        insertPayload.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([insertPayload])
        .select()
        .single();

      if (!error && data) {
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
