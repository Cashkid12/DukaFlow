import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const TestOnboarding = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Test page loaded');
    addLog(`isLoaded: ${isLoaded}`);
    addLog(`isSignedIn: ${isSignedIn}`);
    
    if (isLoaded) {
      if (isSignedIn) {
        addLog(`✅ User is signed in: ${user?.fullName || user?.emailAddresses?.[0]?.emailAddress}`);
        addLog('Redirecting to /onboarding in 3 seconds...');
        setTimeout(() => {
          addLog('🚀 Navigating to /onboarding...');
          navigate('/onboarding');
        }, 3000);
      } else {
        addLog('❌ User is NOT signed in');
        addLog('Redirecting to /sign-up in 3 seconds...');
        setTimeout(() => {
          navigate('/sign-up');
        }, 3000);
      }
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Onboarding Flow Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <p><strong>Loaded:</strong> {isLoaded ? '✅ Yes' : '⏳ Loading...'}</p>
            <p><strong>Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user?.fullName || 'None'}</p>
            <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'None'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-neutral-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-3 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B]"
          >
            Go to Onboarding
          </button>
          <button
            onClick={() => navigate('/sign-up')}
            className="px-6 py-3 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Go to Sign Up
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestOnboarding;
