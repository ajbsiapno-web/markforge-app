import { supabase, isSupabaseConfigured } from './supabase';

/* ===================================================================
   DOCUMENT COMMENTS API
   =================================================================== */

// Fetch comments for a document
export async function fetchDocumentComments(docId) {
  if (!docId) return [];

  if (isSupabaseConfigured && supabase && !docId.startsWith('local_')) {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase fetch comments error, fallback local:', err.message);
    }
  }

  return getLocalComments(docId);
}

// Add a new comment to a document
export async function addDocumentComment(docId, user, text) {
  if (!docId || !text.trim()) return null;

  const now = new Date().toISOString();
  const authorName = user?.name || 'Guest Writer';
  const authorAvatar = user?.avatar || 'G';
  const authorEmail = user?.email || 'guest@markforge.io';

  if (isSupabaseConfigured && supabase && !docId.startsWith('local_')) {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert([
          {
            document_id: docId,
            user_id: user?.id,
            author_name: authorName,
            author_avatar: authorAvatar,
            author_email: authorEmail,
            content: text.trim(),
            created_at: now,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase add comment error, local fallback:', err.message);
    }
  }

  // Local storage fallback
  const comments = getLocalComments(docId);
  const newComment = {
    id: `comment_${Date.now()}`,
    document_id: docId,
    user_id: user?.id || 'guest',
    author_name: authorName,
    author_avatar: authorAvatar,
    author_email: authorEmail,
    content: text.trim(),
    created_at: now,
  };
  comments.push(newComment);
  saveLocalComments(docId, comments);
  return newComment;
}

// Delete comment
export async function deleteDocumentComment(docId, commentId) {
  if (isSupabaseConfigured && supabase && !commentId.startsWith('comment_')) {
    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete comment error:', err.message);
    }
  }

  const comments = getLocalComments(docId).filter((c) => c.id !== commentId);
  saveLocalComments(docId, comments);
  return true;
}

/* ===================================================================
   DOCUMENT SHARING API
   =================================================================== */

// Fetch shares for a document
export async function fetchDocumentShares(docId) {
  if (!docId) return [];

  if (isSupabaseConfigured && supabase && !docId.startsWith('local_')) {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', docId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Supabase fetch shares error, fallback local:', err.message);
    }
  }

  return getLocalShares(docId);
}

// Share document with a user email
export async function shareDocumentWithUser(docId, email, permission = 'view') {
  if (!docId || !email.trim()) return null;

  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase && !docId.startsWith('local_')) {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .insert([
          {
            document_id: docId,
            shared_with_email: email.trim(),
            permission, // 'view' | 'edit'
            created_at: now,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase share error, local fallback:', err.message);
    }
  }

  // Local storage fallback
  const shares = getLocalShares(docId);
  const newShare = {
    id: `share_${Date.now()}`,
    document_id: docId,
    shared_with_email: email.trim(),
    permission,
    created_at: now,
  };
  shares.push(newShare);
  saveLocalShares(docId, shares);
  return newShare;
}

// Remove user access share
export async function removeDocumentShare(docId, shareId) {
  if (isSupabaseConfigured && supabase && !shareId.startsWith('share_')) {
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete share error:', err.message);
    }
  }

  const shares = getLocalShares(docId).filter((s) => s.id !== shareId);
  saveLocalShares(docId, shares);
  return true;
}

/* ===================================================================
   LOCAL STORAGE HELPERS
   =================================================================== */

function getLocalComments(docId) {
  try {
    const saved = localStorage.getItem(`markforge_comments_${docId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocalComments(docId, comments) {
  try {
    localStorage.setItem(`markforge_comments_${docId}`, JSON.stringify(comments));
  } catch (e) {
    console.error(e);
  }
}

function getLocalShares(docId) {
  try {
    const saved = localStorage.getItem(`markforge_shares_${docId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocalShares(docId, shares) {
  try {
    localStorage.setItem(`markforge_shares_${docId}`, JSON.stringify(shares));
  } catch (e) {
    console.error(e);
  }
}
