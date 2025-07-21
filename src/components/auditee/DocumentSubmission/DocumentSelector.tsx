"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Grid, List, FileText, Eye, Check } from "lucide-react"
import { Card, CardContent } from "../../ui/Card.tsx"
import { Button } from "../../ui/button.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Checkbox } from "../../ui/checkbox.tsx"
import axios from "axios"
import debounce from "lodash/debounce"

interface Document {
  id: string
  title: string
  file_type: string
  file_size: number
  created_at: string
  status: "Processed" | "Analyzing" | "Error"
  workflow_status: string
}

interface DocumentSelectorProps {
  onDocumentSelect: (documents: Document[]) => void
  onDocumentView: (documentId: string) => void
  selectedDocuments?: Document[]
  multiSelect?: boolean
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  onDocumentSelect,
  onDocumentView,
  selectedDocuments = [],
  multiSelect = false,
}) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState("uploadDate")
  const [localSelectedDocuments, setLocalSelectedDocuments] = useState<Document[]>(selectedDocuments)

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token")
  }, [])

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://127.0.0.1:8000",
      headers: {
        "Content-Type": "application/json",
      },
    })

    instance.interceptors.request.use(
      (config) => {
        const token = getAuthToken()
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    return instance
  }, [getAuthToken])

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await axiosInstance.get("/documents", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          ...filters,
          sortBy,
        },
      })
      setDocuments(response.data.documents)
      setTotalItems(response.data.total)
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
    setIsLoading(false)
  }, [currentPage, itemsPerPage, searchQuery, filters, sortBy, axiosInstance])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    setLocalSelectedDocuments(selectedDocuments)
  }, [selectedDocuments])

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query)
        setCurrentPage(1)
      }, 300),
    [],
  )

  const handleSearch = useCallback(
    (query: string) => {
      debouncedSearch(query)
    },
    [debouncedSearch],
  )

  const handleDocumentToggle = (document: Document) => {
    if (multiSelect) {
      const isSelected = localSelectedDocuments.some((d) => d.id === document.id)
      let newSelection: Document[]

      if (isSelected) {
        newSelection = localSelectedDocuments.filter((d) => d.id !== document.id)
      } else {
        newSelection = [...localSelectedDocuments, document]
      }

      setLocalSelectedDocuments(newSelection)
      onDocumentSelect(newSelection)
    } else {
      setLocalSelectedDocuments([document])
      onDocumentSelect([document])
    }
  }

  const isDocumentSelected = (document: Document) => {
    return localSelectedDocuments.some((d) => d.id === document.id)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("image")) return "🖼️"
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊"
    if (fileType.includes("csv")) return "📈"
    return "📄"
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex bg-[#F8FAFC] rounded-lg p-1 border border-[#E2E8F0]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white text-[#003366] shadow-sm border border-[#E2E8F0]"
                  : "text-[#64748B] hover:bg-white/50"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white text-[#003366] shadow-sm border border-[#E2E8F0]"
                  : "text-[#64748B] hover:bg-white/50"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {multiSelect && localSelectedDocuments.length > 0 && (
        <div className="p-4 bg-[#003366]/5 border border-[#003366]/20 rounded-xl">
          <p className="text-sm font-medium text-[#003366]">{localSelectedDocuments.length} document(s) selected</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
        </div>
      )}

      {/* Documents Grid/List */}
      {!isLoading && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((document) => {
                const isSelected = isDocumentSelected(document)
                return (
                  <Card
                    key={document.id}
                    className={`border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                      isSelected ? "ring-2 ring-[#003366] border-[#003366]" : "hover:border-[#003366]/30"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{getFileTypeIcon(document.file_type)}</div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDocumentView(document.id)
                            }}
                            className="h-8 w-8 p-0 hover:bg-[#F1F5F9]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {multiSelect ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleDocumentToggle(document)}
                              className="h-8 w-8"
                            />
                          ) : (
                            isSelected && (
                              <div className="h-8 w-8 bg-[#003366] rounded-md flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="space-y-3" onClick={() => handleDocumentToggle(document)}>
                        <h3 className="font-semibold text-[#1E293B] text-sm line-clamp-2">{document.title}</h3>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#64748B]">
                            <span>{formatFileSize(document.file_size)}</span>
                            <Badge
                              className={`text-xs ${
                                document.status === "Processed"
                                  ? "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
                                  : document.status === "Analyzing"
                                    ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                                    : "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
                              } border`}
                            >
                              {document.status}
                            </Badge>
                          </div>

                          <div className="text-xs text-[#94A3B8]">
                            {new Date(document.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => {
                const isSelected = isDocumentSelected(document)
                return (
                  <Card
                    key={document.id}
                    className={`border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                      isSelected ? "ring-2 ring-[#003366] border-[#003366]" : "hover:border-[#003366]/30"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4" onClick={() => handleDocumentToggle(document)}>
                        <div className="text-2xl">{getFileTypeIcon(document.file_type)}</div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#1E293B] text-sm truncate">{document.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-xs text-[#64748B]">
                            <span>{formatFileSize(document.file_size)}</span>
                            <span>{new Date(document.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge
                            className={`text-xs ${
                              document.status === "Processed"
                                ? "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
                                : document.status === "Analyzing"
                                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                                  : "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
                            } border`}
                          >
                            {document.status}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDocumentView(document.id)
                            }}
                            className="h-8 w-8 p-0 hover:bg-[#F1F5F9]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {multiSelect ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleDocumentToggle(document)}
                              className="h-8 w-8"
                            />
                          ) : (
                            isSelected && (
                              <div className="h-8 w-8 bg-[#003366] rounded-md flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-[#E2E8F0] hover:bg-[#F1F5F9]"
          >
            Previous
          </Button>

          <span className="text-sm text-[#64748B]">
            Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            className="border-[#E2E8F0] hover:bg-[#F1F5F9]"
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No documents found</h3>
          <p className="text-[#64748B]">
            {searchQuery ? "Try adjusting your search terms" : "Upload your first document to get started"}
          </p>
        </div>
      )}
    </div>
  )
}

export default DocumentSelector
