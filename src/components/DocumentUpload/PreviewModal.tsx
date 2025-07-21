import type React from "react"
import { X } from "lucide-react"
import type { UploadedFile } from "../../types/documentUpload.ts"

interface PreviewModalProps {
  file: UploadedFile
  onClose: () => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-navy-blue to-slate-gray text-white">
          <h2 className="text-2xl font-semibold">{file.file.name}</h2>
          <button onClick={onClose} className="text-white hover:text-soft-gold transition-colors duration-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          <div className="bg-hover-state rounded-lg p-4 mb-6">
            {file.file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file.file) || "/placeholder.svg"}
                alt={file.file.name}
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-gray">Preview not available for this file type.</p>
                <p className="text-sm text-muted-text mt-2">File type: {file.file.type}</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-navy-blue mb-4">Metadata</h3>
            <ul className="space-y-2 bg-white rounded-lg shadow-sm p-4">
              {Object.entries(file.metadata).map(([key, value]) => (
                <li key={key} className="flex border-b border-light-border last:border-b-0 py-2">
                  <span className="font-medium text-slate-gray w-1/3">{key}:</span>
                  <span className="text-dark-text">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal

