import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { MessageSquare, ThumbsUp, User, Trash2, Send, Clock, Plus, Tag, Search, X, Users, Loader2 } from 'lucide-react';

export default function Forum({ user, login }: { user: any, login: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { login(); return; }
    if (!newPost.title || !newPost.content) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'forumPosts'), {
        title: newPost.title,
        content: newPost.content,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous Aspirant',
        createdAt: serverTimestamp(),
        tags: newPost.tags.split(',').map(t => t.trim()).filter(t => t),
      });
      setShowNewPostModal(false);
      setNewPost({ title: '', content: '', tags: '' });
    } catch (error) {
      console.error('Post creation failed', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string, authorId: string) => {
    if (user?.uid !== authorId) return;
    if (confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, 'forumPosts', id));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif italic mb-2">Aspirant Community</h2>
          <p className="opacity-60">Discuss strategies, share notes, and connect with fellow CSS candidates.</p>
        </div>
        <button 
          onClick={() => user ? setShowNewPostModal(true) : login()}
          className="px-6 py-3 bg-[#141414] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg"
        >
          <Plus size={20} /> Create Post
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {posts.length === 0 ? (
            <div className="p-20 text-center bg-white border border-[#141414]/10 rounded-3xl">
              <MessageSquare size={40} className="mx-auto opacity-20 mb-4" />
              <p className="opacity-50 font-serif italic">No discussions yet. Be the first to start a conversation!</p>
            </div>
          ) : (
            posts.map(post => (
              <motion.div 
                key={post.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white border border-[#141414]/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#141414]">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{post.authorName}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-tighter mt-1 flex items-center gap-1">
                      <Clock size={10} /> {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  {user?.uid === post.authorId && (
                    <button 
                      onClick={() => deletePost(post.id, post.authorId)}
                      className="ml-auto p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <h4 className="text-xl font-serif font-bold mb-3 group-hover:text-blue-600 transition-colors">{post.title}</h4>
                <p className="text-sm opacity-70 leading-relaxed line-clamp-3 mb-6 whitespace-pre-wrap">{post.content}</p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                    <ThumbsUp size={14} /> Like
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                    <MessageSquare size={14} /> Discuss
                  </div>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    {post.tags?.map((tag: string) => (
                      <span key={tag} className="text-[10px] lowercase font-bold bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">#{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <aside className="space-y-8">
          <div className="p-6 bg-white border border-[#141414]/10 rounded-2xl">
            <h4 className="font-serif italic font-bold mb-4 flex items-center gap-2">
              <Tag size={18} className="opacity-40" /> Popular Tags
            </h4>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              {['IR-Strategy', 'English-Essay', 'Past-Papers', 'FPSC-Updates', 'GSA-Notes', 'Sociology-Help'].map(tag => (
                <span key={tag} className="px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-[#141414] hover:text-white transition-all">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-8 bg-blue-600 text-white rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-serif italic mb-2">Need a Study Buddy?</h4>
              <p className="text-xs opacity-80 leading-relaxed mb-6">Connect with fellow aspirants preparing for the same optional subjects as you.</p>
              <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl">
                Find Peer Groups
              </button>
            </div>
            <div className="absolute right-0 bottom-0 p-8 opacity-10">
              <Users size={80} />
            </div>
          </div>
        </aside>
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewPostModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button onClick={() => setShowNewPostModal(false)} className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
              <h3 className="text-3xl font-serif italic font-bold mb-8">Create Forum Topic</h3>
              <form onSubmit={handleCreatePost} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2 block ml-2">Topic Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Help needed with European History Paper 1"
                    value={newPost.title}
                    onChange={e => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-[#141414]/5 outline-none focus:border-[#141414]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2 block ml-2">Content</label>
                  <textarea 
                    rows={4}
                    placeholder="Share your question, notes, or experience..."
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-[#141414]/5 outline-none focus:border-[#141414]/20 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2 block ml-2">Tags (Comma separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={16} />
                    <input 
                      type="text" 
                      placeholder="e.g. English, Essay, PastPapers"
                      value={newPost.tags}
                      onChange={e => setNewPost({...newPost, tags: e.target.value})}
                      className="w-full pl-10 pr-6 py-4 bg-gray-50 rounded-2xl border border-[#141414]/5 outline-none focus:border-[#141414]/20 transition-all"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  Post Discussion
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
