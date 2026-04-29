import React, { useState } from 'react';
import { X, Camera, Bell, CheckCircle } from 'lucide-react';

/**
 * Barcode Scanning Coming Soon Modal
 * Placeholder for upcoming feature
 */
const BarcodeScanningModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    // TODO: Save to feature announcement list
    // await api.post('/feature-requests/barcode-scanning', { email });
    
    setSubmitted(true);
    
    // Auto-close after showing confirmation
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {!submitted ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Camera size={20} className="text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">Coming Soon</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                  <Camera size={48} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Barcode Scanning
                </h3>
                <p className="text-sm text-neutral-600">
                  We're working on making inventory management even faster.
                </p>
                <p className="text-sm text-neutral-600 mt-2">
                  Soon you'll be able to scan products directly with your camera.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Get Notified When It's Ready
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors font-medium flex items-center gap-2"
                    >
                      <Bell size={18} />
                      <span>Notify Me</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              You're on the list!
            </h3>
            <p className="text-sm text-neutral-600">
              We'll let you know as soon as barcode scanning is available!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanningModal;
