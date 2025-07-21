import React, { useState } from 'react';
import { Download, Share2, Trash2, Link, Mail, Check, AlertTriangle } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  url?: string;
}

interface DocumentActionsProps {
  document: Document;
  onDelete?: (id: string) => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(document.url || window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleDelete = () => {
    if (showDeleteConfirm && onDelete) {
      onDelete(document.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Shared Document: ${document.name}`);
    const body = encodeURIComponent(`Check out this document: ${document.url || window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative">
      <div className="flex justify-end space-x-3">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-xl 
                   hover:opacity-90 transition-all duration-200 flex items-center shadow-sm
                   hover:shadow-md active:transform active:scale-95"
        >
          <Download size={18} className="mr-2" />
          Download
        </button>

        {/* Share Button */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gradient-to-r from-soft-gold to-[#D97706] text-white rounded-xl
                     hover:opacity-90 transition-all duration-200 flex items-center shadow-sm
                     hover:shadow-md active:transform active:scale-95"
          >
            <Share2 size={18} className="mr-2" />
            Share
          </button>

          {/* Share Menu Dropdown */}
          {showShareMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-secondary-bg shadow-lg border border-light-border 
                          animate-fadeIn z-10">
              <div className="py-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2 text-left flex items-center text-dark-text hover:bg-primary-bg
                           transition-colors duration-200"
                >
                  {copySuccess ? (
                    <>
                      <Check size={18} className="mr-2 text-success-green" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link size={18} className="mr-2" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleShareEmail}
                  className="w-full px-4 py-2 text-left flex items-center text-dark-text hover:bg-primary-bg
                           transition-colors duration-200"
                >
                  <Mail size={18} className="mr-2" />
                  Share via Email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center shadow-sm
                    hover:shadow-md active:transform active:scale-95
                    ${showDeleteConfirm 
                      ? 'bg-error-red text-white' 
                      : 'bg-white border border-error-red text-error-red hover:bg-error-red hover:text-white'
                    }`}
        >
          {showDeleteConfirm ? (
            <>
              <AlertTriangle size={18} className="mr-2" />
              Confirm
            </>
          ) : (
            <>
              <Trash2 size={18} className="mr-2" />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentActions;