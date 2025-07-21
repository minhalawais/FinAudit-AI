"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LightbulbIcon,
  TrendingUpIcon,
  DollarSignIcon,
  LineChartIcon,
  ListIcon,
  KeyIcon,
  HashIcon,
  FileTextIcon,
  Loader2,
} from "lucide-react"
import axios from "axios"

interface AIAnalysis {
  [key: string]: any // Generic structure to handle any type of analysis
}

interface AIAnalysisPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ documentId, document }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAiAnalysis = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/ai-analysis`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setAiAnalysis(response.data.aiAnalysis || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching AI analysis:", err)
        setError("Failed to load AI analysis")
        setLoading(false)
      }
    }

    fetchAiAnalysis()
  }, [documentId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center space-x-2">
            <LightbulbIcon className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-navy-blue" />
          <p className="mt-4 text-slate-gray">Loading AI analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center space-x-2">
            <LightbulbIcon className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
        </div>
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Check if aiAnalysis is empty or undefined
  if (!aiAnalysis || aiAnalysis.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center space-x-2">
            <LightbulbIcon className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
        </div>
        <div className="p-6 text-center text-gray-500">No AI analysis available for this document.</div>
      </div>
    )
  }

  // Helper function to determine the appropriate icon for different section types
  const getSectionIcon = (key: string) => {
    const keyLower = key.toLowerCase()
    if (keyLower.includes("summary")) return FileTextIcon
    if (keyLower.includes("key") || keyLower.includes("attributes")) return KeyIcon
    if (keyLower.includes("limit")) return HashIcon
    if (keyLower.includes("potential") || keyLower.includes("application")) return ListIcon
    if (keyLower.includes("trend") || keyLower.includes("growth")) return TrendingUpIcon
    if (keyLower.includes("financial") || keyLower.includes("cost")) return DollarSignIcon
    if (keyLower.includes("chart") || keyLower.includes("data")) return LineChartIcon
    return LightbulbIcon
  }

  const SectionHeader = ({ title }: { title: string }) => {
    const Icon = getSectionIcon(title)
    return (
      <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white capitalize">{title}</h3>
        </div>
      </div>
    )
  }

  // Component for string key-value pairs
  const StringValue = ({ value }: { value: string }) => (
    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
      <p className="text-gray-800 whitespace-pre-line">{value}</p>
    </div>
  )

  // Component for list values
  const ListValue = ({ items }: { items: string[] }) => (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {items.map((item, idx) => (
          <li key={idx} className="p-3 flex items-center hover:bg-blue-50 transition-colors duration-200">
            <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mr-3"></span>
            <span className="text-gray-800">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  // Component for nested object values
  const ObjectValue = ({ data }: { data: { [key: string]: any } }) => (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value], idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="flex items-center mb-2">
            <KeyIcon className="h-4 w-4 text-indigo-600 mr-2" />
            <h4 className="text-gray-900 font-medium capitalize">{key}</h4>
          </div>
          <div className="ml-6 text-gray-800">
            {typeof value === "string" ? (
              value
            ) : (
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderAnalysisSection = (analysis: AIAnalysis) => {
    return Object.entries(analysis).map(([key, value]) => {
      // For nested objects
      if (typeof value === "object" && !Array.isArray(value)) {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <ObjectValue data={value} />
            </div>
          </div>
        )
      }
      // For arrays/lists
      else if (Array.isArray(value)) {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <ListValue items={value} />
            </div>
          </div>
        )
      }
      // For simple string values
      else {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <StringValue value={value.toString()} />
            </div>
          </div>
        )
      }
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {aiAnalysis.map((analysis, index) => (
        <div key={index} className="space-y-6">
          {renderAnalysisSection(analysis)}
        </div>
      ))}
    </div>
  )
}

export default AIAnalysisPanel
