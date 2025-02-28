import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, Send, Info } from 'lucide-react';
import { supabase } from '../supabase';
import axios from 'axios';

function CommunityPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [overviewPostId, setOverviewPostId] = useState(null);
  const [overviewContent, setOverviewContent] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    const fetchPostsAndUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session fetch error:', sessionError.message);
        setError('Failed to fetch user session');
        setLoading(false);
        return;
      }
      setUser(session?.user || null);

      try {
        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (postsError) throw postsError;

        setPosts(postsData);

        // Fetch user's liked posts if signed in
        if (session?.user) {
          const { data: likesData, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', session.user.id);
          if (likesError) throw likesError;

          const likedPostIds = new Set(likesData.map(like => like.post_id));
          setLikedPosts(likedPostIds);
        }
      } catch (err) {
        setError('Failed to load posts or likes');
        console.error('Fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPostsAndUser();
  }, []);

  const createPost = async () => {
    if (!user) {
      setError('Please sign in to post');
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      const userName = user.user_metadata?.full_name || user.email.split('@')[0] || user.id.slice(0, 8);
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{ 
          user_id: user.id, 
          title: newPostTitle, 
          content: newPostContent,
          user_name: userName 
        }])
        .select();
      if (error) throw error;
      setPosts([data[0], ...posts]);
      setNewPostTitle('');
      setNewPostContent('');
      setError(null);
    } catch (err) {
      setError('Failed to create post');
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      setError('Please sign in to like posts');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    const isLiked = likedPosts.has(postId);
    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
    const newLikedPosts = new Set(likedPosts);

    // Optimistic update
    setPosts(posts.map((p) =>
      p.id === postId ? { ...p, likes: newLikes } : p
    ));
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    try {
      if (isLiked) {
        // Unlike: Remove from post_likes
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (deleteError) throw deleteError;
      } else {
        // Like: Add to post_likes
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{ user_id: user.id, post_id: postId }]);
        if (insertError && insertError.code !== '23505') throw insertError; // Ignore duplicate key error (already liked)
      }

      // Update total likes in community_posts
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      if (updateError) throw updateError;

      console.log(`Post ${postId} likes updated to: ${newLikes} in backend`);
    } catch (err) {
      console.error('Error updating likes in backend:', err.message);
      setError(`Failed to update like: ${err.message}`);
      // Revert state on failure
      setPosts(posts);
      setLikedPosts(likedPosts);
    }
  };

  const handleAIOverview = async (postId, content) => {
    if (overviewPostId === postId) {
      setOverviewPostId(null);
      return;
    }

    setOverviewPostId(postId);
    setOverviewLoading(true);
    setOverviewContent('');

    try {
      const overview = await generateGeminiAIOverview(content);
      setOverviewContent(overview);
    } catch (err) {
      console.error('Error generating AI overview:', err);
      setOverviewContent('Failed to generate overview: ' + err.message);
    } finally {
      setOverviewLoading(false);
    }
  };

  const generateGeminiAIOverview = async (content) => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env');
    }

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `Provide a concise overview of this cybersecurity-related post: "${content}". Assess its potential accuracy and suggest where to find more information. Limit response to 150 words.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const overviewText = response.data.candidates[0].content.parts[0].text;
      return overviewText;
    } catch (err) {
      console.error('Gemini API error:', err.response?.data || err.message);
      return 'AI Overview: Unable to generate specific overview due to API error.';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card flex flex-col gap-8 items-center w-full bg-white p-8 rounded-lg shadow-md"
    >
      <MessageSquare size={40} className="text-[#00c4b4]" />
      <h2 className="text-3xl font-bold text-[#1f2a44]">Community Posts</h2>
      <p className="text-center text-[#6b7280] max-w-md">Discuss cybersecurity, share insights, and collaborate with others.</p>

      {loading ? (
        <p className="text-[#6b7280] animate-pulse">Loading posts...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full space-y-8">
          {/* Create Post Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-[#f5f7fa] rounded-md border border-[#e2e8f0]"
          >
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-4">Create a Post</h3>
            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="Post Title"
              className="input w-full p-3 border border-[#e2e8f0] rounded-md text-[#1f2a44] placeholder-[#6b7280] focus:border-[#00c4b4] focus:ring-2 focus:ring-[#00c4b4]/50 mb-4"
            />
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your thoughts on URLs, cybersecurity, etc..."
              className="input w-full p-3 border border-[#e2e8f0] rounded-md text-[#1f2a44] placeholder-[#6b7280] focus:border-[#00c4b4] focus:ring-2 focus:ring-[#00c4b4]/50"
              rows={4}
            />
            <button
              onClick={createPost}
              className="btn btn-primary mt-4 w-full bg-[#00c4b4] hover:bg-[#00a89a] text-white flex items-center justify-center gap-2 px-4 py-2 rounded"
            >
              <Send size={16} /> Post
            </button>
          </motion.div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-white rounded-md shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-[#1f2a44]">{post.title}</h4>
                <p className="text-sm text-[#6b7280] mt-2">{post.content}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-[#6b7280]">
                  <span>Posted by {post.user_name} on {new Date(post.created_at).toLocaleString()}</span>
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedPosts.has(post.id) ? 'text-[#00c4b4]' : 'text-[#6b7280] hover:text-[#00a89a]'
                    }`}
                  >
                    <ThumbsUp size={16} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                    {post.likes || 0} Likes
                  </button>
                  <button
                    onClick={() => handleAIOverview(post.id, post.content)}
                    className="flex items-center gap-1 text-[#6b7280] hover:text-[#00c4b4] transition-colors"
                  >
                    <Info size={16} /> AI Overview
                  </button>
                </div>
                {overviewPostId === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700"
                  >
                    {overviewLoading ? (
                      <p className="animate-pulse">Generating overview...</p>
                    ) : (
                      <p>{overviewContent}</p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

export default CommunityPosts;