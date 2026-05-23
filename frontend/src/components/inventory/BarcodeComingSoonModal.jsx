import React, { useState } from 'react';
import { Scan, X } from 'lucide-react';

/**
 * Barcode "Coming Soon" modal.
 * Shows feature preview and email notification form.
 */
const BarcodeComingSoonModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    // TODO: POST /api/notifications/subscribe
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[20px] p-8 max-w-[440px] w-full shadow-xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-24 h-24 sm:w-24 sm:h-24 w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
            <Scan size={64} className="text-neutral-300 sm:block hidden" />
            <Scan size={48} className="text-neutral-300 sm:hidden" />
          </div>

          {/* Title */}
          <h2 className="text-[22px] sm:text-[22px] text-lg font-bold text-[#1E293B] mt-5">
            Barcode Scanning — Coming Soon!
          </h2>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-[15px] text-sm text-[#64748B] mt-3 text-center leading-relaxed max-w-[380px]">
            We're working hard to bring you barcode scanning. Soon you'll be able to scan
            products directly with your phone camera for instant look-up and faster inventory
            management.
          </p>

          {/* Feature preview */}
          <div className="flex flex-col gap-2 mt-5 w-full text-left">
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <span className="text-base">📷</span>
              <span>Point your camera at any barcode</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <span className="text-base">⚡</span>
              <span>Instantly find or add products</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <span className="text-base">✅</span>
              <span>Works with all standard barcodes</span>
            </div>
          </div>

          {subscribed ? (
            <div className="mt-5 w-full py-3 px-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              ✅ You're on the list! We'll notify you when barcode scanning is ready.
            </div>
          ) : (
            <form onSubmit={handleNotify} className="w-full mt-5">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 border border-[#CBD5E1] rounded-[10px] text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
                required
              />
              <button
                type="submit"
                className="w-full h-11 mt-2.5 bg-[#312E81] text-white rounded-[10px] hover:bg-[#1E1B4B] transition-colors text-sm font-semibold"
              >
                Notify Me
              </button>
            </form>
          )}

          {/* Close link */}
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors font-medium"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeComingSoonModal;
