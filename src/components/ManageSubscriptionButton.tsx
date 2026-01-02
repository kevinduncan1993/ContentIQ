'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="block w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-6 py-3 text-center text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading...
        </>
      ) : (
        'Manage Subscription'
      )}
    </button>
  );
}
