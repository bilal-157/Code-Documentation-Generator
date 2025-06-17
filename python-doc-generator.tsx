"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Code, Zap, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface DocumentationResponse {
  codeWithComments?: string
  documentation?: string
  complexity?: string
  improvedVersion?: string
}

export default function Component() {
  const [file, setFile] = useState<File | null>(null)
  const [codeInput, setCodeInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState<DocumentationResponse>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setCodeInput("")
    }
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const submitData = async () => {
    if (!file && !codeInput.trim()) {
      alert("Please provide code or upload a file.")
      return
    }

    setLoading(true)
    setResponses({})

    const formData = new FormData()

    if (file) {
      formData.append("file", file)
    } else if (codeInput.trim()) {
      const blob = new Blob([codeInput], { type: "text/plain" })
      formData.append("file", blob, "code.py")
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate-docs`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const text = await res.text()
      const data = JSON.parse(text)

      // Process the response data
      const processedData: DocumentationResponse = {}

      if (data[0]) {
        processedData.codeWithComments = data[0]
      }

      if (data[1]) {
        try {
          const jsonObj = JSON.parse(data[1].replace(/```json|```/g, ""))
          processedData.documentation = JSON.stringify(jsonObj, null, 2)
        } catch {
          processedData.documentation = data[1]
        }
      }

      if (data[2]) {
        const analysisText = data[2].toString();
        
        // Extract complexity (more robust matching)
        const complexityMatch = analysisText.match(/Time\s*complexity\s*:\s*(.*?)(?:\n\n|$)/i);
        processedData.complexity = complexityMatch?.[1]?.trim();
      
        // Extract improved version (more robust splitting)
        const improvedSplit = analysisText.split(/Improved\s*version\s*:/i);
        if (improvedSplit.length > 1) {
          processedData.improvedVersion = improvedSplit[1].trim().replace(/^[\s-]+|[\s-]+$/g, '');
        }
      }
      setResponses(processedData)
    } catch (err) {
      console.error("Error:", err)
      alert("An error occurred while processing your request.")
    } finally {
      setLoading(false)
    }
  }

  const ResponseCard = ({
    title,
    content,
    icon: Icon,
    gradient,
    sectionKey,
  }: {
    title: string
    content: string
    icon: any
    gradient: string
    sectionKey: string
  }) => (
    <Card
      className={`group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br ${gradient}`}
    >
      <Collapsible open={openSections[sectionKey]} onOpenChange={() => toggleSection(sectionKey)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-white/10 transition-colors duration-200 rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                  <Icon className="h-5 w-5" />
                </div>
                {title}
              </div>
              {openSections[sectionKey] ? (
                <ChevronDown className="h-5 w-5 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-5 w-5 transition-transform duration-200" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap text-gray-800">{content}</pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg">
            <Code className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Python Code Documentation Generator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your Python code into comprehensive documentation with AI-powered analysis, complexity evaluation,
            and optimization suggestions.
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Upload className="h-5 w-5" />
              Upload Your Code
            </CardTitle>
            <CardDescription className="text-emerald-50">
              Choose a file of code or paste your code directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                Upload Code File
              </Label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".py"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 transition-all duration-200"
                />
                {file && (
                  <Badge variant="secondary" className="mt-2">
                    <FileText className="h-3 w-3 mr-1" />
                    {file.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code-input" className="text-sm font-medium text-gray-700">
                Paste Your Code
              </Label>
              <Textarea
                id="code-input"
                placeholder="def hello_world():&#10;    print('Hello, World!')&#10;    return 'Hello, World!'"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value)
                  if (e.target.value.trim()) {
                    setFile(null)
                  }
                }}
                className="min-h-[150px] font-mono text-sm resize-none border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            <Button
              onClick={submitData}
              disabled={loading || (!file && !codeInput.trim())}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing your code...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Generate Documentation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {Object.keys(responses).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Generated Documentation</h2>

            <div className="grid gap-6">
              {responses.codeWithComments && (
                <ResponseCard
                  title="Code with Comments"
                  content={responses.codeWithComments}
                  icon={Code}
                  gradient="from-emerald-500 to-teal-600"
                  sectionKey="comments"
                />
              )}

              {responses.documentation && (
                <ResponseCard
                  title="Documentation (JSON)"
                  content={responses.documentation}
                  icon={FileText}
                  gradient="from-blue-500 to-indigo-600"
                  sectionKey="docs"
                />
              )}

              {responses.complexity && (
                <ResponseCard
                  title="Time Complexity Analysis"
                  content={responses.complexity}
                  icon={Zap}
                  gradient="from-orange-500 to-red-600"
                  sectionKey="complexity"
                />
              )}

              {responses.improvedVersion && (
                <ResponseCard
                  title="Improved Version"
                  content={responses.improvedVersion}
                  icon={Code}
                  gradient="from-purple-500 to-pink-600"
                  sectionKey="improved"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
