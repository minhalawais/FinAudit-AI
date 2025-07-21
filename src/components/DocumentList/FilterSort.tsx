"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface FilterSortProps {
  onApply: (filters: any, sortBy: string) => void
  onClose: () => void
  initialFilters?: any
  initialSortBy?: string
}

const FilterSort: React.FC<FilterSortProps> = ({
  onApply,
  onClose,
  initialFilters = {},
  initialSortBy = "uploadDate",
}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [sortBy, setSortBy] = useState(initialSortBy)

  useEffect(() => {
    setFilters(initialFilters)
    setSortBy(initialSortBy)
  }, [initialFilters, initialSortBy])

  const handleApply = () => {
    onApply(filters, sortBy)
    onClose()
  }

  const inputStyles =
    "w-full p-2 border border-light-border rounded-md bg-primary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 text-dark-text placeholder-muted-text"
  const labelStyles = "block text-sm font-medium text-slate-gray mb-2"

  return (
    <div className="fixed inset-0 bg-dark-text/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-secondary-bg rounded-lg shadow-card w-full max-w-md m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-secondary-bg">Filter & Sort</h2>
            <button
              onClick={onClose}
              className="text-secondary-bg/80 hover:text-secondary-bg transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>Document Type</label>
              <select
                value={filters.type || ""}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={inputStyles}
              >
                <option value="">All Types</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
              </select>
            </div>

            <div>
              <label className={labelStyles}>Status</label>
              <select
                value={filters.status || ""}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={inputStyles}
              >
                <option value="">All Statuses</option>
                <option value="Processed">Processed</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Error">Error</option>
              </select>
            </div>

            <div>
              <label className={labelStyles}>Upload Date Range</label>
              <div className="flex space-x-3">
                <div className="w-1/2">
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={inputStyles}
                  />
                </div>
                <div className="w-1/2">
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className={inputStyles}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelStyles}>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputStyles}>
                <option value="uploadDate">Upload Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-primary-bg rounded-b-lg border-t border-light-border">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-gray hover:text-dark-text bg-secondary-bg border border-light-border rounded-md hover:bg-hover-state transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 transition-opacity duration-200 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterSort

