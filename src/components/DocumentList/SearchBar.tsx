"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Search, ArrowRight } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSearch(query.trim())
      if (query.trim()) {
        updateRecentSearches(query.trim())
      }
    },
    [query, onSearch],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value
      setQuery(newQuery)
      if (newQuery.trim() === "") {
        onSearch("")
      }
    },
    [onSearch],
  )

  const updateRecentSearches = (newQuery: string) => {
    const updatedSearches = [newQuery, ...recentSearches.filter((s) => s !== newQuery)].slice(0, 5)
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
  }

  return (
    <div className="mb-6 relative">
      <form onSubmit={handleSearch} className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search documents..."
          className="w-full pl-10 pr-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-blue transition-all duration-200"
          onFocus={() => setShowRecentSearches(true)}
          onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
        />
      </form>

      {showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-light-border rounded-lg shadow-lg">
          <ul>
            {recentSearches.map((search, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-hover-state cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setQuery(search)
                  onSearch(search)
                }}
              >
                <div className="flex items-center">
                  <Search size={16} className="text-slate-gray mr-2" />
                  <span>{search}</span>
                </div>
                <ArrowRight size={16} className="text-slate-gray" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchBar

