import React, { useState } from 'react';
import { Download, Share2, Trash2, X, Check } from 'lucide-react';

interface BatchOperationsProps {
  selectedCount: number;
  onOperation: (operation: string) => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({ selectedCount, onOperation }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [operationStatus, setOperationStatus] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleOperation = (operation: string) => {
    if (operation === 'delete' && !showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }

    setOperationStatus(operation);
    onOperation(operation);

    // Reset status after animation
    setTimeout(() => {
      setOperationStatus(null);
      setShowConfirmDelete(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
      <div className="bg-gradient-to-r from-navy-blue to-[#004D99] rounded-lg shadow-card p-4 flex items-center justify-between min-w-[500px]">
        {/* Selection Count */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center">
            <span className="text-white font-medium">{selectedCount}</span>
          </div>
          <span className="text-white font-medium">
            {selectedCount === 1 ? 'document' : 'documents'} selected
          </span>
        </div>

        {/* Operations */}
        <div className="flex items-center space-x-2">
          {/* Download Button */}
          <button
            onClick={() => handleOperation('download')}
            className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 flex items-center space-x-2
              ${operationStatus === 'download' ? 'bg-success-green hover:bg-success-green' : ''}`}
          >
            {operationStatus === 'download' ? (
              <Check size={18} className="animate-fadeIn" />
            ) : (
              <Download size={18} />
            )}
            <span>Download</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => handleOperation('share')}
            className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 flex items-center space-x-2
              ${operationStatus === 'share' ? 'bg-success-green hover:bg-success-green' : ''}`}
          >
            {operationStatus === 'share' ? (
              <Check size={18} className="animate-fadeIn" />
            ) : (
              <Share2 size={18} />
            )}
            <span>Share</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => handleOperation('delete')}
            className={`px-4 py-2 ${
              showConfirmDelete ? 'bg-error-red hover:bg-error-red/90' : 'bg-white/10 hover:bg-white/20'
            } text-white rounded-md transition-all duration-200 flex items-center space-x-2
              ${operationStatus === 'delete' ? 'bg-success-green hover:bg-success-green' : ''}`}
          >
            {operationStatus === 'delete' ? (
              <Check size={18} className="animate-fadeIn" />
            ) : (
              <Trash2 size={18} />
            )}
            <span>{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</span>
          </button>

          {/* Clear Selection Button */}
          <button
            onClick={() => onOperation('clear')}
            className="ml-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200"
            title="Clear selection"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchOperations;