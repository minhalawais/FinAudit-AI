"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react"
import { Spreadsheet } from "react-spreadsheet"
import axios from "axios"

interface DocumentPreviewProps {
  documentId: string
  document: {
    id: number
    file_type: string
    name: string
  }
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId, document }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [documentContent, setDocumentContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const fetchDocumentContent = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/preview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        })
        const url = URL.createObjectURL(response.data)
        setDocumentContent(url)
      } catch (err) {
        console.error("Error fetching document preview:", err)
        setError("Failed to load document preview. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentContent()

    // Clean up object URL on unmount
    return () => {
      if (documentContent) {
        URL.revokeObjectURL(documentContent)
      }
    }
  }, [documentId])

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe && document.file_type === "application/pdf") {
      iframe.onload = () => {
        const pdfViewer = iframe.contentWindow as any
        if (pdfViewer && pdfViewer.PDFViewerApplication) {
          pdfViewer.PDFViewerApplication.initializedPromise.then(() => {
            const pdfDocument = pdfViewer.PDFViewerApplication.pdfDocument
            setNumPages(pdfDocument.numPages)
          })
        }
      }
    }
  }, [document.file_type, documentContent])

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = Math.min(Math.max(1, prevPageNumber + offset), numPages || 1)
      const iframe = iframeRef.current
      if (iframe && iframe.contentWindow) {
        const pdfViewer = (iframe.contentWindow as any).PDFViewerApplication
        if (pdfViewer) {
          pdfViewer.page = newPageNumber
        }
      }
      return newPageNumber
    })
  }

  const zoomIn = () => {
    setScale((prevScale) => {
      const newScale = Math.min(2, prevScale + 0.1)
      updatePdfViewerScale(newScale)
      return newScale
    })
  }

  const zoomOut = () => {
    setScale((prevScale) => {
      const newScale = Math.max(0.5, prevScale - 0.1)
      updatePdfViewerScale(newScale)
      return newScale
    })
  }

  const updatePdfViewerScale = (newScale: number) => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      const pdfViewer = (iframe.contentWindow as any).PDFViewerApplication
      if (pdfViewer) {
        pdfViewer.pdfViewer.currentScale = newScale
      }
    }
  }

  const rotateClockwise = () => {
    setRotation((prevRotation) => {
      const newRotation = (prevRotation + 90) % 360
      updatePdfViewerRotation(newRotation)
      return newRotation
    })
  }

  const rotateCounterClockwise = () => {
    setRotation((prevRotation) => {
      const newRotation = (prevRotation - 90 + 360) % 360
      updatePdfViewerRotation(newRotation)
      return newRotation
    })
  }

  const updatePdfViewerRotation = (newRotation: number) => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      const pdfViewer = (iframe.contentWindow as any).PDFViewerApplication
      if (pdfViewer) {
        pdfViewer.pdfViewer.pagesRotation = newRotation
      }
    }
  }

  const enterFullScreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    }
  }

  const handleDownload = async () => {
    try {
      setDownloadLoading(true)
      const token = localStorage.getItem("token")

      // Use the dedicated download endpoint
      const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"]
      let fileName = document.name
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1]
        }
      }

      // Create and trigger download - use window.document to avoid name collision
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = window.document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      window.document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        window.document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading document:", error)
      setError("Failed to download document. Please try again.")
    } finally {
      setDownloadLoading(false)
    }
  }

  const ToolbarButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
    onClick,
    disabled = false,
    children,
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 text-slate-gray hover:text-navy-blue hover:bg-hover-state rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-[600px]">
      <Loader2 className="w-12 h-12 animate-spin text-navy-blue" />
    </div>
  )

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-[600px] text-red-500">
      <FileText size={64} />
      <p className="mt-4 text-lg">{message}</p>
    </div>
  )

  const renderPreview = () => {
    if (loading) {
      return <LoadingSpinner />
    }

    if (error) {
      return <ErrorMessage message={error} />
    }

    switch (document.file_type) {
      case "application/pdf":
        return (
          <div className="w-full h-[600px] overflow-auto">
            <iframe
              ref={iframeRef}
              src={`${documentContent}#page=${pageNumber}&zoom=${scale}&rotation=${rotation}`}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title="PDF Viewer"
            />
          </div>
        )
      case "image/jpeg":
      case "image/png":
      case "image/gif":
        return (
          <div className="flex items-center justify-center h-[600px]">
            <img
              src={documentContent || "/placeholder.svg"}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        return (
          <div className="h-[600px] overflow-auto">
            <Spreadsheet
              data={[
                [{ value: "Example" }, { value: "Spreadsheet" }],
                [{ value: "Data" }, { value: "Preview" }],
              ]}
            />
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
            <FileText size={64} />
            <p className="mt-4 text-lg">Preview not available for this file type</p>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col items-center bg-primary-bg rounded-xl shadow-lg p-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Document Container */}
      <div className="w-full bg-secondary-bg rounded-xl shadow-card p-6 mb-6 border border-light-border">
        {renderPreview()}
      </div>

      {/* Controls Container */}
      {document.file_type === "application/pdf" && !loading && !error && (
        <div className="w-full bg-secondary-bg rounded-xl p-4 mb-6 border border-light-border shadow-card">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Zoom and Rotate Controls */}
            <div className="flex items-center space-x-2">
              <ToolbarButton onClick={zoomOut}>
                <ZoomOut size={20} />
              </ToolbarButton>
              <span className="px-3 py-1 bg-primary-bg rounded-md text-dark-text min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <ToolbarButton onClick={zoomIn}>
                <ZoomIn size={20} />
              </ToolbarButton>
              <div className="w-px h-6 bg-light-border mx-2" />
              <ToolbarButton onClick={rotateCounterClockwise}>
                <RotateCcw size={20} />
              </ToolbarButton>
              <ToolbarButton onClick={rotateClockwise}>
                <RotateCw size={20} />
              </ToolbarButton>
              <ToolbarButton onClick={enterFullScreen}>
                <Maximize size={20} />
              </ToolbarButton>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-4">
              <ToolbarButton onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                <ChevronLeft size={20} />
              </ToolbarButton>
              <span className="text-dark-text font-medium">
                Page <span className="text-navy-blue">{pageNumber}</span> of{" "}
                <span className="text-navy-blue">{numPages}</span>
              </span>
              <ToolbarButton onClick={() => changePage(1)} disabled={pageNumber >= (numPages || 1)}>
                <ChevronRight size={20} />
              </ToolbarButton>
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
      {!loading && !error && (
        <div className="w-full max-w-md">
          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center shadow-lg group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloadLoading ? (
              <Loader2 className="mr-2 animate-spin" size={20} />
            ) : (
              <Download
                className="mr-2 group-hover:transform group-hover:-translate-y-0.5 transition-transform"
                size={20}
              />
            )}
            {downloadLoading ? "Downloading..." : "Download Document"}
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentPreview
