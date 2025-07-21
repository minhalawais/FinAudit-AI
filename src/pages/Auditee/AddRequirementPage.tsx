'use client'

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/button.tsx'
import { Input } from '../../components/ui/input.tsx'
import { Textarea } from '../../components/ui/textarea.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.tsx'
import { Switch } from '../../components/ui/switch.tsx'
import { Label } from '../../components/ui/label.tsx'
import { Alert, AlertDescription } from '../../components/ui/alert.tsx'
import { useAxios } from '../../hooks/useAxios.ts'
import { FileText, Calendar, AlertTriangle, CheckCircle, ArrowLeft, Plus, Minus, Save, AlertCircle } from 'lucide-react'

interface RequiredField {
  name: string
  required: boolean
}

interface ValidationRule {
  type: string
  value: string
}

const AddRequirementPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const navigate = useNavigate()
  const { request, loading, error } = useAxios()
  
  const [formData, setFormData] = useState({
    document_type: '',
    description: '',
    deadline: '',
    is_mandatory: true,
    auto_escalate: false,
    compliance_framework: 'SOX',
    ai_priority_score: 5.0,
    risk_level: 'medium'
  })

  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([
    { name: 'document_date', required: true },
    { name: 'prepared_by', required: true }
  ])

  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    { type: 'file_types', value: 'pdf,xlsx' },
    { type: 'max_file_size', value: '10MB' }
  ])

  const [success, setSuccess] = useState('')

  const documentTypes = [
    'Financial Statements',
    'General Ledger',
    'Bank Statements',
    'Accounts Receivable Aging',
    'Accounts Payable Aging',
    'Inventory Reports',
    'Fixed Asset Register',
    'Trial Balance',
    'Cash Flow Statement',
    'Internal Control Documentation',
    'Management Letter',
    'Board Minutes',
    'Audit Committee Minutes',
    'Tax Returns',
    'Payroll Records',
    'Expense Reports',
    'Revenue Recognition Documentation',
    'Contract Agreements',
    'Insurance Policies',
    'Legal Documents',
    'Other'
  ]

  const complianceFrameworks = [
    'SOX', 'GAAP', 'IFRS', 'PCAOB', 'SEC', 'COSO', 'ISO 27001', 'Custom'
  ]

  const riskLevels = [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
    { value: 'critical', label: 'Critical Risk' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRequiredField = () => {
    setRequiredFields(prev => [...prev, { name: '', required: true }])
  }

  const removeRequiredField = (index: number) => {
    setRequiredFields(prev => prev.filter((_, i) => i !== index))
  }

  const updateRequiredField = (index: number, field: string, value: any) => {
    setRequiredFields(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addValidationRule = () => {
    setValidationRules(prev => [...prev, { type: '', value: '' }])
  }

  const removeValidationRule = (index: number) => {
    setValidationRules(prev => prev.filter((_, i) => i !== index))
  }

  const updateValidationRule = (index: number, field: string, value: string) => {
    setValidationRules(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    // Validate required fields
    if (!formData.document_type || !formData.description) {
      return
    }

    // Prepare required fields object
    const requiredFieldsObj: Record<string, boolean> = {}
    requiredFields.forEach(field => {
      if (field.name) {
        requiredFieldsObj[field.name] = field.required
      }
    })

    // Prepare validation rules object
    const validationRulesObj: Record<string, any> = {}
    validationRules.forEach(rule => {
      if (rule.type && rule.value) {
        if (rule.type === 'file_types') {
          validationRulesObj[rule.type] = rule.value.split(',').map(s => s.trim())
        } else {
          validationRulesObj[rule.type] = rule.value
        }
      }
    })

    const payload = {
      audit_id: parseInt(auditId!),
      document_type: formData.document_type,
      description: formData.description,
      deadline: formData.deadline || null,
      is_mandatory: formData.is_mandatory,
      auto_escalate: formData.auto_escalate,
      compliance_framework: formData.compliance_framework,
      ai_priority_score: formData.ai_priority_score,
      risk_level: formData.risk_level,
      required_fields: requiredFieldsObj,
      validation_rules: validationRulesObj
    }

    try {
      await request({
        url: '/api/audits/requirements',
        method: 'POST',
        data: payload
      })
      
      setSuccess('Requirement created successfully!')
      setTimeout(() => {
        navigate(`/audits/${auditId}/requirements`)
      }, 2000)
    } catch (err) {
      console.error('Error creating requirement:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/audits/${auditId}/requirements`)}
            className="border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requirements
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Document Requirement</h1>
            <p className="text-gray-600 mt-1">Create a new document requirement for this audit</p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select 
                    value={formData.document_type} 
                    onValueChange={(value) => handleInputChange('document_type', value)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_framework">Compliance Framework</Label>
                  <Select 
                    value={formData.compliance_framework} 
                    onValueChange={(value) => handleInputChange('compliance_framework', value)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {complianceFrameworks.map(framework => (
                        <SelectItem key={framework} value={framework}>{framework}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of what this document should contain..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="border-gray-200 focus:border-blue-500 min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk_level">Risk Level</Label>
                  <Select 
                    value={formData.risk_level} 
                    onValueChange={(value) => handleInputChange('risk_level', value)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_priority_score">AI Priority Score</Label>
                  <Input
                    id="ai_priority_score"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.ai_priority_score}
                    onChange={(e) => handleInputChange('ai_priority_score', parseFloat(e.target.value))}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Requirement Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="is_mandatory" className="text-sm font-medium">
                    Mandatory Requirement
                  </Label>
                  <p className="text-xs text-gray-600">
                    This document must be submitted to complete the audit
                  </p>
                </div>
                <Switch
                  id="is_mandatory"
                  checked={formData.is_mandatory}
                  onCheckedChange={(checked) => handleInputChange('is_mandatory', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="auto_escalate" className="text-sm font-medium">
                    Auto-Escalation
                  </Label>
                  <p className="text-xs text-gray-600">
                    Automatically escalate if deadline is missed
                  </p>
                </div>
                <Switch
                  id="auto_escalate"
                  checked={formData.auto_escalate}
                  onCheckedChange={(checked) => handleInputChange('auto_escalate', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Fields */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Required Fields
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRequiredField}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredFields.map((field, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="Field name (e.g., document_date, prepared_by)"
                      value={field.name}
                      onChange={(e) => updateRequiredField(index, 'name', e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => updateRequiredField(index, 'required', checked)}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRequiredField(index)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Validation Rules
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addValidationRule}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Select
                      value={rule.type}
                      onValueChange={(value) => updateValidationRule(index, 'type', value)}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="file_types">File Types</SelectItem>
                        <SelectItem value="max_file_size">Max File Size</SelectItem>
                        <SelectItem value="min_file_size">Min File Size</SelectItem>
                        <SelectItem value="required_signatures">Required Signatures</SelectItem>
                        <SelectItem value="date_range">Date Range</SelectItem>
                        <SelectItem value="custom">Custom Rule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Rule value (e.g., pdf,xlsx or 10MB)"
                      value={rule.value}
                      onChange={(e) => updateValidationRule(index, 'value', e.target.value)}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeValidationRule(index)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/audits/${auditId}/requirements`)}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Requirement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRequirementPage
