"use client"

import type React from "react"
import { useState, useEffect,useCallback,useMemo } from "react"
import { Grid, List, Filter, Plus, FileText } from "lucide-react"
import DocumentGrid from "../../components/DocumentList/DocumentGrid.tsx"
import DocumentListView from "../../components/DocumentList/DocumentListView.tsx"
import FilterSort from "../../components/DocumentList/FilterSort.tsx"
import BatchOperations from "../../components/DocumentList/BatchOperations.tsx"
import CustomViews from "../../components/DocumentList/CustomViews.tsx"
import Pagination from "../../components/DocumentList/Pagination.tsx"
import DocumentView from "./DocumentView.tsx"
import SearchBar from "../../components/DocumentList/SearchBar.tsx"
import axios from "axios"
import debounce from "lodash/debounce"
import { useNavigate } from "react-router-dom"

interface Document {
  id: string
  title: string
  file_type: string
  file_size: number
  created_at: string
  status: "Processed" | "Analyzing" | "Error"
  workflow_status: string
}

const DocumentList: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [filterSortOpen, setFilterSortOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState("uploadDate")

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

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Handle unauthorized access (e.g., redirect to login page)
          console.error("Unauthorized access")
        }
        return Promise.reject(error)
      },
    )

    return instance
  }, [getAuthToken])

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.get("http://127.0.0.1:8000/documents", {
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
      setFilteredDocuments(response.data.documents)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status !== 401) {
        setError("Failed to fetch documents. Please try again.")
        console.error("Error fetching documents:", err)
      }
    }
    setIsLoading(false)
  }, [currentPage, itemsPerPage, searchQuery, filters, sortBy, axiosInstance])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleOpenDocument = useCallback((id: string) => {
    console.log("Opening document:", id)
    setSelectedDocumentId(id)
  }, [])

  const handleCloseDocument = useCallback(() => {
    setSelectedDocumentId(null)
  }, [])

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query)
        setCurrentPage(1)
        fetchDocuments()
      }, 300),
    [fetchDocuments],
  )

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setCurrentPage(1)
      if (query.trim() === "") {
        fetchDocuments()
      } else {
        debouncedSearch(query)
      }
    },
    [fetchDocuments, debouncedSearch],
  )

  const handleFilterSort = (newFilters: any, newSortBy: string) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
    setCurrentPage(1)
    fetchDocuments()
  }

  const handleSelectView = (viewFilters: any, viewSortBy: string) => {
    setFilters(viewFilters)
    setSortBy(viewSortBy)
    setCurrentPage(1)
    fetchDocuments()
  }

  const handleBatchOperation = async (operation: string) => {
    try {
      await axiosInstance.post("http://127.0.0.1:8000/documents/batch", {
        operation,
        documentIds: selectedDocuments,
      })
      fetchDocuments()
      setSelectedDocuments([])
    } catch (err) {
      console.error(`Error performing batch operation ${operation}:`, err)
      setError(`Failed to perform ${operation} operation. Please try again.`)
    }
  }

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments((prev) => (prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-blue-600" />
            <h1 className="text-3xl font-semibold text-gray-900">Document List</h1>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
            <Plus size={20} />
            <span className="font-medium ">New Document</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} />

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              <button
                onClick={() => setFilterSortOpen(true)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all duration-300 text-gray-600 hover:text-gray-900"
              >
                <Filter size={18} />
                <span>Filter</span>
              </button>
            </div>

          </div>

          {/* Filter/Sort Panel */}
          {filterSortOpen && (
            <FilterSort
              onApply={handleFilterSort}
              onClose={() => setFilterSortOpen(false)}
              initialFilters={filters}
              initialSortBy={sortBy}
            />
          )}

          {/* Batch Operations */}
          {selectedDocuments.length > 0 && (
            <BatchOperations selectedCount={selectedDocuments.length} onOperation={handleBatchOperation} />
          )}

          {/* Error Message */}
          {error && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Document View */}
          {!isLoading && (
            <div className="mb-6">
              {viewMode === "grid" ? (
                <DocumentGrid
                  documents={filteredDocuments}
                  selectedDocuments={selectedDocuments}
                  onToggleSelection={toggleDocumentSelection}
                  onOpenDocument={handleOpenDocument}
                />
              ) : (
                <DocumentListView
                  documents={filteredDocuments}
                  selectedDocuments={selectedDocuments}
                  onToggleSelection={toggleDocumentSelection}
                  onOpenDocument={handleOpenDocument}
                />
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      </div>
      {selectedDocumentId && <DocumentView documentId={selectedDocumentId} onClose={handleCloseDocument} />}
    </div>
  )
}

export default DocumentList

