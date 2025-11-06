"use client"

import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Copy, Save } from "lucide-react"
import { MathRenderer } from "@/components/math-renderer"

interface StructuredSolution {
  understandTheProblem: string
  strategy: string
  stepByStepSolution: string
  verifyTheAnswer: string
  alternateMethods: string
}

interface StructuredSolutionDisplayProps {
  solution: string
}

function parseStructuredSolution(solution: string): StructuredSolution {
  const sections = {
    understandTheProblem: "",
    strategy: "",
    stepByStepSolution: "",
    verifyTheAnswer: "",
    alternateMethods: ""
  }

  const lines = solution.split('\n')
  let currentSection = ""
  let content: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check for section headers
    if (trimmedLine.includes('### Understand the Problem') || trimmedLine.includes('Understand the Problem')) {
      if (currentSection && content.length > 0) {
        sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
      }
      currentSection = "understandTheProblem"
      content = []
    } else if (trimmedLine.includes('### Strategy') || trimmedLine.includes('Strategy')) {
      if (currentSection && content.length > 0) {
        sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
      }
      currentSection = "strategy"
      content = []
    } else if (trimmedLine.includes('### Step-by-Step Solution') || trimmedLine.includes('Step-by-Step Solution')) {
      if (currentSection && content.length > 0) {
        sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
      }
      currentSection = "stepByStepSolution"
      content = []
    } else if (trimmedLine.includes('### Verify the Answer') || trimmedLine.includes('Verify the Answer')) {
      if (currentSection && content.length > 0) {
        sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
      }
      currentSection = "verifyTheAnswer"
      content = []
    } else if (trimmedLine.includes('### Alternate Methods') || trimmedLine.includes('Alternate Methods')) {
      if (currentSection && content.length > 0) {
        sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
      }
      currentSection = "alternateMethods"
      content = []
    } else if (currentSection && !trimmedLine.startsWith('###')) {
      content.push(line)
    }
  }

  // Add the last section
  if (currentSection && content.length > 0) {
    sections[currentSection as keyof StructuredSolution] = content.join('\n').trim()
  }

  return sections
}

export function StructuredSolutionDisplay({ solution }: StructuredSolutionDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['understandTheProblem', 'strategy']))
  
  const parsedSolution = parseStructuredSolution(solution)
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const sections = [
    {
      key: 'understandTheProblem',
      title: 'Understand the Problem',
      content: parsedSolution.understandTheProblem,
      description: 'What we know and what we need to find'
    },
    {
      key: 'strategy',
      title: 'Strategy',
      content: parsedSolution.strategy,
      description: 'Our approach to solving this problem'
    },
    {
      key: 'stepByStepSolution',
      title: 'Step-by-Step Solution',
      content: parsedSolution.stepByStepSolution,
      description: 'Detailed solution with clear explanations'
    },
    {
      key: 'verifyTheAnswer',
      title: 'Verify the Answer',
      content: parsedSolution.verifyTheAnswer,
      description: 'How to check that our answer is correct'
    },
    {
      key: 'alternateMethods',
      title: 'Alternate Methods',
      content: parsedSolution.alternateMethods,
      description: 'Other ways to approach this problem'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header with Copy and Save buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Solution</h2>
          <p className="text-gray-600 mt-1">Step-by-step guided solution</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <Copy className="w-4 h-4 mr-2 inline" />
            Copy
          </button>
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <Save className="w-4 h-4 mr-2 inline" />
            Save
          </button>
        </div>
      </div>

      {/* Solution Sections */}
      {sections.map((section) => (
        <Card key={section.key} className="overflow-hidden border border-gray-200">
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
              {expandedSections.has(section.key) ? (
                <ChevronUp className="w-5 h-5 text-gray-600 ml-4" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 ml-4" />
              )}
            </div>
          </button>
          
          {expandedSections.has(section.key) && section.content && (
            <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
              <div className="pt-4 text-gray-800 leading-relaxed">
                <div className="prose prose-sm max-w-none">
                  <MathRenderer>{section.content}</MathRenderer>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
