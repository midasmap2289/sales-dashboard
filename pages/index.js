import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SalesDashboard from '../components/SalesDashboard';

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the magic login link.');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-80 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-center">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              className="border rounded w-full p-2 text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
          {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
        </div>
      </div>
    );
  }

  return <SalesDashboard session={session} onSignOut={handleSignOut} />;
}
