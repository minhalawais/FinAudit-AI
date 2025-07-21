import type React from "react"
import type { UploadedFile } from "../../types/documentUpload.ts"

interface UploadProgressProps {
  files: UploadedFile[]
}

const UploadProgress: React.FC<UploadProgressProps> = ({ files }) => {
  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0) / files.length

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-navy-blue mb-4">Upload Progress</h2>
      <div className="bg-light-border rounded-full h-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-soft-gold to-warning-orange h-full transition-all duration-300 ease-out"
          style={{ width: `${totalProgress}%` }}
        ></div>
      </div>
      <p className="text-right mt-2 text-sm text-slate-gray">{Math.round(totalProgress)}% Complete</p>
      <ul className="mt-4 space-y-2">
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between">
            <span className="text-dark-text truncate flex-1 mr-4">{file.file.name}</span>
            <span className="text-sm text-slate-gray bg-hover-state px-2 py-1 rounded-full">{file.progress}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UploadProgress

