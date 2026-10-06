import React from 'react';
import { XIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PublishModal({ publishUrl, onClose }) {
  const handleCopyLink = () => {
    if (!publishUrl) return;
    navigator.clipboard.writeText(publishUrl);
    toast.success('Public link copied to clipboard');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200 w-full max-w-md p-6 mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 cursor-pointer">
          <XIcon size={16} />
        </button>
        
        <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Your website is live</h3>
            <p className="text-sm text-zinc-500">Anyone with this link can view your project without signing in.</p>
        </div>
        
        
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600">Published Link</label>
            <input 
              type="text" 
              readOnly 
              value={publishUrl} 
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 outline-none" 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleCopyLink} className="flex-1 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg transition-colors">
              Copy Link
            </button>
            <button onClick={() => window.open(publishUrl, '_blank')} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Open Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}