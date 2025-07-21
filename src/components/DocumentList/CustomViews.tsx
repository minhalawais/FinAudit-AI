"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Save, List, X, Pin, Edit2, Trash2, Check, ChevronRight } from "lucide-react"
import axios from "axios"

interface SavedView {
  id: string
  name: string
  isPinned: boolean
  filters: any
  sortBy: string
}

interface CustomViewsProps {
  onSelectView: (filters: any, sortBy: string) => void
}

const CustomViews: React.FC<CustomViewsProps> = ({ onSelectView }) => {
  const [views, setViews] = useState<SavedView[]>([])
  const [newViewName, setNewViewName] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    fetchViews()
  }, [])

  const fetchViews = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/custom-views")
      setViews(response.data)
    } catch (error) {
      console.error("Error fetching custom views:", error)
    }
  }

  const handleSaveView = async () => {
    if (newViewName.trim()) {
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/custom-views", {
          name: newViewName.trim(),
          filters: {}, // You should pass the current filters here
          sortBy: "uploadDate", // You should pass the current sortBy here
        })
        setViews([...views, response.data])
        setNewViewName("")
      } catch (error) {
        console.error("Error saving custom view:", error)
      }
    }
  }

  const togglePin = async (id: string) => {
    try {
      const viewToUpdate = views.find((view) => view.id === id)
      if (viewToUpdate) {
        const response = await axios.put(`http://127.0.0.1:8000/api/custom-views/${id}`, {
          ...viewToUpdate,
          isPinned: !viewToUpdate.isPinned,
        })
        setViews(views.map((view) => (view.id === id ? response.data : view)))
      }
    } catch (error) {
      console.error("Error updating custom view:", error)
    }
  }

  const startEditing = (view: SavedView) => {
    setEditingId(view.id)
    setEditName(view.name)
  }

  const saveEdit = async () => {
    if (editName.trim() && editingId) {
      try {
        const viewToUpdate = views.find((view) => view.id === editingId)
        if (viewToUpdate) {
          const response = await axios.put(`http://127.0.0.1:8000/api/custom-views/${editingId}`, {
            ...viewToUpdate,
            name: editName.trim(),
          })
          setViews(views.map((view) => (view.id === editingId ? response.data : view)))
          setEditingId(null)
        }
      } catch (error) {
        console.error("Error updating custom view:", error)
      }
    }
  }

  const deleteView = async (id: string) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/custom-views/${id}`)
      setViews(views.filter((view) => view.id !== id))
    } catch (error) {
      console.error("Error deleting custom view:", error)
    }
  }

  const selectView = (view: SavedView) => {
    onSelectView(view.filters, view.sortBy)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center space-x-2"
      >
        <List size={18} />
        <span>Custom Views</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-secondary-bg rounded-lg shadow-card z-10 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-light-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-dark-text">Saved Views</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-gray hover:text-dark-text transition-colors duration-200 p-1 rounded-full hover:bg-hover-state"
            >
              <X size={18} />
            </button>
          </div>

          {/* Views List */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {views
              .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
              .map((view) => (
                <div
                  key={view.id}
                  className="group flex items-center justify-between p-2 hover:bg-hover-state rounded-md transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2 flex-grow" onClick={() => selectView(view)}>
                    <ChevronRight size={16} className="text-slate-gray" />
                    {editingId === view.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-grow p-1 border border-light-border rounded bg-primary-bg focus:outline-none focus:ring-1 focus:ring-navy-blue text-dark-text"
                        onKeyPress={(e) => e.key === "Enter" && saveEdit()}
                        autoFocus
                      />
                    ) : (
                      <span className="text-dark-text">{view.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {editingId === view.id ? (
                      <button
                        onClick={saveEdit}
                        className="p-1 text-success-green hover:bg-hover-state rounded transition-colors duration-200"
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => togglePin(view.id)}
                          className={`p-1 hover:bg-hover-state rounded transition-colors duration-200 ${
                            view.isPinned ? "text-soft-gold" : "text-slate-gray"
                          }`}
                        >
                          <Pin size={16} />
                        </button>
                        <button
                          onClick={() => startEditing(view)}
                          className="p-1 text-slate-gray hover:bg-hover-state rounded transition-colors duration-200"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!view.isPinned && (
                          <button
                            onClick={() => deleteView(view.id)}
                            className="p-1 text-slate-gray hover:text-error-red hover:bg-hover-state rounded transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* New View Input */}
          <div className="p-4 border-t border-light-border bg-primary-bg rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="New view name"
                className="flex-grow p-2 border border-light-border rounded-md bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 text-dark-text placeholder-muted-text"
                onKeyPress={(e) => e.key === "Enter" && handleSaveView()}
              />
              <button
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomViews

