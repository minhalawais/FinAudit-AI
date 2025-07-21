import type React from "react"
import { File, Trash2, Eye } from "lucide-react"
import type { UploadedFile } from "../../types/documentUpload.ts"

interface FileListProps {
  files: UploadedFile[]
  onPreview: (file: UploadedFile) => void
  onDelete: (fileId: string) => void
}

const FileList: React.FC<FileListProps> = ({ files, onPreview, onDelete }) => {
  if (files.length === 0) {
    return null // Or you can return a message like "No files uploaded"
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-navy-blue mb-4">Uploaded Files</h2>
      <ul className="space-y-4">
        {files.map((file) => (
          <li
            key={file.id}
            className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center">
              <File className="text-soft-gold mr-3" size={24} />
              <div>
                <p className="font-medium text-dark-text">{file.file.name}</p>
                <p className="text-sm text-muted-text">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPreview(file)}
                className="p-2 text-slate-gray hover:text-navy-blue transition-colors duration-200 rounded-full hover:bg-hover-state"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={() => onDelete(file.id)}
                className="p-2 text-slate-gray hover:text-error-red transition-colors duration-200 rounded-full hover:bg-hover-state"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileList