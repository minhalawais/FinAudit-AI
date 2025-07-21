export const formatFileType = (fileType: string): string => {
  const fileTypeMap: { [key: string]: string } = {
    "application/pdf": "PDF",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
    "application/vnd.ms-excel": "Excel",
    "text/csv": "CSV",
  }

  return fileTypeMap[fileType] || "Unknown"
}

export const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  if (bytes === 0) return "0 Bytes"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i]
}

