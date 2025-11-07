"use client"

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface LaTeXProps {
  children: string
  display?: boolean
  className?: string
}

export function LaTeX({ children, display = false, className = "" }: LaTeXProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && children) {
      try {
        katex.render(children, ref.current, {
          displayMode: display,
          throwOnError: false,
          strict: false,
          trust: true,
          fleqn: false, // Don't left-align equations
        })
      } catch (error) {
        console.error('KaTeX rendering error:', error)
        // Fallback to plain text if LaTeX fails
        ref.current.innerHTML = children
      }
    }
  }, [children, display])

  return <div ref={ref} className={`${className} ${display ? 'text-center' : 'inline'}`} />
}

// Component for inline math
export function InlineMath({ children, className = "" }: { children: string; className?: string }) {
  return <LaTeX display={false} className={className}>{children}</LaTeX>
}

// Component for display math
export function DisplayMath({ children, className = "" }: { children: string; className?: string }) {
  return <LaTeX display={true} className={className}>{children}</LaTeX>
}

// Component that automatically detects and renders LaTeX
export function MathRenderer({ children, className = "" }: { children: string; className?: string }) {
  if (!children) return null

  // First, let's clean up common text issues that shouldn't be LaTeX
  let cleanedText = children
    // Fix simple variable names in text - strip $x$, $y$, $s$, $a$, $g$, etc. for all single letters
    // Note: This only matches single letters, so LaTeX commands like $\overline{6}$ are preserved
    .replace(/\$([a-zA-Z])\$/g, '$1')
    // Handle variable names with primes (e.g., $a'$ -> a', $x'$ -> x')
    .replace(/\$([a-zA-Z])'\$/g, "$1'")
    // Fix text that might be wrapped in LaTeX delimiters but shouldn't be
    .replace(/\$Simplifyingeachsidegives\$/g, 'Simplifying each side gives')
    .replace(/\$Simplifyinggives\$/g, 'Simplifying gives')
    .replace(/\$Thus\$/g, 'Thus')
    .replace(/\$Therefore\$/g, 'Therefore')
    .replace(/\$So\$/g, 'So')
    // Fix the unwrapped versions too
    .replace(/Simplifyingeachsidegives/g, 'Simplifying each side gives')
    .replace(/Simplifyinggives/g, 'Simplifying gives')
    .replace(/Thus/g, 'Thus')
    .replace(/Therefore/g, 'Therefore')
    .replace(/So/g, 'So')
    // Fix character-by-character text that shouldn't be LaTeX
    .replace(/\$T\s*h\s*i\s*s\s*s\s*i\s*m\s*p\s*l\s*i\s*f\s*i\s*e\s*s\s*t\s*o\$/g, 'This simplifies to')
    .replace(/\$T\s*h\s*e\s*n\s*s\s*i\s*m\s*p\s*l\s*i\s*f\s*y\s*t\s*h\s*e\s*f\s*r\s*a\s*c\s*t\s*i\s*o\s*n\s*t\s*o\s*g\s*e\s*t\$/g, 'Then simplify the fraction to get')
    .replace(/\$G\s*r\s*a\s*p\s*h\s*i\s*c\s*a\s*l\s*v\s*i\s*e\s*w\$/g, 'Graphical view')
    .replace(/\$P\s*l\s*o\s*t\s*t\s*h\s*e\s*l\s*i\s*n\s*e\$/g, 'Plot the line')
    .replace(/\$a\s*n\s*d\s*s\s*e\s*e\s*w\s*h\s*e\s*r\s*e\s*i\s*t\s*c\s*r\s*o\s*s\s*s\s*e\s*s\s*t\s*h\s*e\s*l\s*i\s*n\s*e\$/g, 'and see where it crosses the line')
    .replace(/\$T\s*h\s*e\s*i\s*n\s*t\s*e\s*r\s*s\s*e\s*c\s*t\s*i\s*o\s*n\s*o\s*c\s*c\s*u\s*r\s*s\s*a\s*t\$/g, 'The intersection occurs at')
    // Fix general character-by-character patterns (any text with spaces between letters)
    .replace(/\$([A-Za-z])(\s+[A-Za-z])+\$/g, (match) => {
      // Extract letters and join them without spaces
      const letters = match.replace(/\$|\s/g, '')
      return letters
    })
    // Fix patterns like "Thissimplifiestox = 5$" - remove trailing $ and fix spacing
    .replace(/([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)([a-zA-Z]+)\$/g, '$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15$16$17$18$19$20')
    // More specific fixes for common broken patterns
    .replace(/Thissimplifiesto/g, 'This simplifies to')
    .replace(/Thissimplifiestox/g, 'This simplifies to x')
    .replace(/Thensimplifythefractiontoget/g, 'Then simplify the fraction to get')
    .replace(/Graphicalview/g, 'Graphical view')
    .replace(/Plottheline/g, 'Plot the line')
    .replace(/andseewhereitcrossestheline/g, 'and see where it crosses the line')
    .replace(/Theintersectionoccursat/g, 'The intersection occurs at')
    // Fix the specific pattern from the user's issue
    .replace(/T\s*h\s*i\s*s\s*s\s*i\s*m\s*p\s*l\s*i\s*f\s*i\s*e\s*s\s*t\s*o/g, 'This simplifies to')
    .replace(/Thissimplifiestox\s*=\s*5\$/g, 'This simplifies to x = 5')
    // Fix "Perform the division" character-by-character pattern
    .replace(/P\s*e\s*r\s*f\s*o\s*r\s*m\s*t\s*h\s*e\s*d\s*i\s*v\s*i\s*s\s*i\s*o\s*n/g, 'Perform the division')
    .replace(/Performthedivision/g, 'Perform the division')
    // Fix "So," character-by-character pattern
    .replace(/S\s*o\s*,/g, 'So,')
    .replace(/So,/g, 'So,')
    // Fix "Simplifying each side gives" character-by-character pattern
    .replace(/S\s*i\s*m\s*p\s*l\s*i\s*f\s*y\s*i\s*n\s*g\s*e\s*a\s*c\s*h\s*s\s*i\s*d\s*e\s*g\s*i\s*v\s*e\s*s/g, 'Simplifying each side gives')
    .replace(/Simplifyingeachsidegives/g, 'Simplifying each side gives')
    .replace(/Simplifyingeachsidegivesx/g, 'Simplifying each side gives x')
    // Fix patterns like "4.Performthedivision.15 ÷ 3 = 5 So,x = 5$"
    .replace(/(\d+)\.Performthedivision\.(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)\s*So,\s*x\s*=\s*(\d+)\$/g, '$1. Perform the division. $\\frac{$2}{$3}$ = $4$\n\nSo, x = $5$')
    .replace(/(\d+)\.Performthedivision\.(\d+)\s*÷\s*(\d+)\s*=\s*(\d+)\s*So,\s*x\s*=\s*(\d+)/g, '$1. Perform the division. $\\frac{$2}{$3}$ = $4$\n\nSo, x = $5$')
    // Fix malformed fraction patterns like "3\n3x\n​\n =\frac{15}{3}"
    .replace(/(\d+)\s*\n\s*(\d+[a-zA-Z]*)\s*\n\s*​\s*\n\s*=\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, '$\\frac{$2}{$1}$ = $\\frac{$3}{$4}$')
    .replace(/(\d+[a-zA-Z]*)\s*\n\s*(\d+)\s*\n\s*=\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, '$\\frac{$1}{$2}$ = $\\frac{$3}{$4}$')
    // Fix the specific pattern: "3\n3x\n​\n =\frac{15}{3}\nS\ni\nm\np\nl\ni\nf\ny\ni\nn\ng\ne\na\nc\nh\ns\ni\nd\ne\ng\ni\nv\ne\ns\nSimplifyingeachsidegivesx = 5$"
    .replace(/(\d+)\s*\n\s*(\d+[a-zA-Z]*)\s*\n\s*​\s*\n\s*=\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\n\s*S\s*i\s*m\s*p\s*l\s*i\s*f\s*y\s*i\s*n\s*g\s*e\s*a\s*c\s*h\s*s\s*i\s*d\s*e\s*g\s*i\s*v\s*e\s*s\s*\n\s*Simplifyingeachsidegivesx\s*=\s*(\d+)\$/g, '$\\frac{$2}{$1}$ = $\\frac{$3}{$4}$\n\nSimplifying each side gives\nx = $5$')
    // Fix the specific pattern: "3\n3x\n​\n =\frac{15}{3}\nT\nh\ni\ns\ns\ni\nm\np\nl\ni\nf\ni\ne\ns\nt\no\nThissimplifiestox = 5$"
    .replace(/(\d+)\s*\n\s*(\d+[a-zA-Z]*)\s*\n\s*​\s*\n\s*=\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\n\s*T\s*h\s*i\s*s\s*s\s*i\s*m\s*p\s*l\s*i\s*f\s*i\s*e\s*s\s*t\s*o\s*\n\s*Thissimplifiestox\s*=\s*5\$/g, '$\\frac{$2}{$1}$ = $\\frac{$3}{$4}$\n\nThis simplifies to\nx = 5')
    // Fix standalone character-by-character text without $ delimiters
    .replace(/T\s*h\s*i\s*s\s*s\s*i\s*m\s*p\s*l\s*i\s*f\s*i\s*e\s*s\s*t\s*o\s*\n\s*Thissimplifiestox\s*=\s*5\$/g, 'This simplifies to\nx = 5')
    // Keep division symbols as they are (reverted from fraction conversion)
    // .replace(/(\w+)\s*÷\s*(\w+)/g, '$\\frac{$1}{$2}$')
    // .replace(/(\d+)\s*÷\s*(\d+)/g, '$\\frac{$1}{$2}$')
    // .replace(/(\w+)\s*÷\s*(\d+)/g, '$\\frac{$1}{$2}$')
    // .replace(/(\d+)\s*÷\s*(\w+)/g, '$\\frac{$1}{$2}$')
    // Fix broken fraction patterns that might already exist
    .replace(/\\frac\{(\d+)\}(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{(\w+)\}(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{(\d+)\}(\w+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{(\w+)\}(\w+)/g, '$\\frac{$1}{$2}$')
    // Fix more complex broken patterns like $\frac{15}${3}$
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    // Fix patterns like $\frac{15}${3}$ (with $ in the middle)
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    // Fix patterns like $\frac{y - 7}${3}$ 
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    // Fix patterns like \dfrac{15} followed by standalone 3
    .replace(/\\dfrac\{([^}]+)\}\s*\n?\s*(\d+)\s*\n?\s*(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\dfrac\{([^}]+)\}\s*(\d+)\s*(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\dfrac\{([^}]+)\}\s*(\d+)/g, '$\\frac{$1}{$2}$')
    // Fix patterns like \frac{15} followed by standalone 3
    .replace(/\\frac\{([^}]+)\}\s*\n?\s*(\d+)\s*\n?\s*(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\s*(\d+)\s*(\d+)/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\s*(\d+)/g, '$\\frac{$1}{$2}$')
    // Fix the specific pattern $\\dfrac{15}${3}$
    .replace(/\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    .replace(/\\dfrac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\\dfrac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    // Fix the specific pattern $\\frac{15}${3}$ (without dfrac)
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\$\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$')
    .replace(/\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$')
    // Fix patterns like $x = $\\frac{15}${3}$
    .replace(/\$x\s*=\s*\$\\frac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$x = \\frac{$1}{$2}$')
    .replace(/\$x\s*=\s*\$\\frac\{([^}]+)\}\$\{([^}]+)\}/g, '$x = \\frac{$1}{$2}$')
    // Fix patterns like $\\dfrac{3x}{3} = $\\dfrac{15}${3}$
    .replace(/\$\\dfrac\{([^}]+)\}\{([^}]+)\}\s*=\s*\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$ = $\\frac{$3}{$4}$')
    .replace(/\$\\dfrac\{([^}]+)\}\{([^}]+)\}\s*=\s*\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$ = $\\frac{$3}{$4}$')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}\s*=\s*\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}\$/g, '$\\frac{$1}{$2}$ = $\\frac{$3}{$4}$')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}\s*=\s*\$\\dfrac\{([^}]+)\}\$\{([^}]+)\}/g, '$\\frac{$1}{$2}$ = $\\frac{$3}{$4}$')
    // Fix arrow sequences with proper spacing
    .replace(/(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)/g, '$1 → $2 → $3 → $4 → $5 → $6')
    .replace(/(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)/g, '$1 → $2 → $3 → $4 → $5')
    .replace(/(\d+)\s*→\s*(\d+)\s*→\s*(\d+)\s*→\s*(\d+)/g, '$1 → $2 → $3 → $4')
    .replace(/(\d+)\s*→\s*(\d+)\s*→\s*(\d+)/g, '$1 → $2 → $3')
    .replace(/(\d+)\s*→\s*(\d+)/g, '$1 → $2')
    // Remove markdown bold formatting that shouldn't be LaTeX
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Fix common spacing issues
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')

  // First, fix specific concatenated text patterns BEFORE checking for LaTeX
  .replace(/\$(andamathbook|savingstoreacha|whichroundsto|saved\+|Acoupongiveshima|Weneedtofind|satisfyingthebalance|Friendsplitcheck)\$/gi, (match, word) => {
    // Unwrap and add proper spacing
    if (word === 'andamathbook') return 'and a math book'
    if (word === 'savingstoreacha') return 'savings to reach a'
    if (word === 'whichroundsto') return 'which rounds to'
    if (word === 'saved+') return 'saved +'
    return word
  })

  // Detect and unwrap plain text that's incorrectly wrapped in $...$ delimiters
  // If a $...$ block contains mostly plain text (not LaTeX commands), unwrap it
  .replace(/\$([^$]+)\$/g, (match, content) => {
    // Trim whitespace
    const trimmed = content.trim()
    
    // Check if content looks like plain text (not LaTeX)
    const hasLatexCommands = /\\[a-zA-Z]|\\[{}[\]]|\\[^a-zA-Z]|_\{|\^\{|frac|sqrt|sum|int|prod|lim|times|div|pm|leq|geq|neq|approx|infty/.test(trimmed)
    const hasMathSymbols = /[×÷±≤≥≠≈∞∑∏∫√]/.test(trimmed)
    const hasSubscripts = /_[a-zA-Z0-9]|\^[a-zA-Z0-9]/.test(trimmed)
    
    // Check for concatenated words (common pattern in the errors)
    const hasConcatenatedWords = /[a-z][A-Z]|[a-zA-Z]+\.[a-zA-Z]+|[a-zA-Z]+\d+[a-zA-Z]+/.test(trimmed)
    
    // If it's plain text (no LaTeX commands, no math symbols, and either has concatenated words OR is long text)
    const isPlainText = !hasLatexCommands && !hasMathSymbols && !hasSubscripts && 
                        (hasConcatenatedWords || 
                         (trimmed.length > 8 && /^[a-zA-Z0-9\s.,;:!?'"()+-]+$/.test(trimmed)))
    
    if (isPlainText) {
      // Unwrap - return the content without $ delimiters
      // Also fix spacing for concatenated words
      return trimmed
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase
        .replace(/([a-zA-Z]+)\.([A-Z][a-zA-Z]+)/g, '$1. $2')  // Add space after period before capital
        .replace(/([a-zA-Z]+)(\d+)([A-Z][a-zA-Z]+)/g, '$1 $2 $3')  // Add space around numbers
    }
    // Keep as LaTeX
    return match
  })

  // Fix concatenated words even if not wrapped in $ (as a fallback)
  .replace(/(andamathbook|savingstoreacha|whichroundsto)/gi, (match) => {
    if (match.toLowerCase() === 'andamathbook') return 'and a math book'
    if (match.toLowerCase() === 'savingstoreacha') return 'savings to reach a'
    if (match.toLowerCase() === 'whichroundsto') return 'which rounds to'
    return match
  })
  .replace(/(saved)\+(\d)/g, '$1 + $2')  // Fix "saved+8.00" -> "saved + 8.00"

  // Split by $$ for display math and $ for inline math
  // Use non-greedy matching and handle multi-line content
  const parts = cleanedText.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/)
  
  return (
    <div className={`${className} whitespace-pre-wrap`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math - center it and add spacing
          const math = part.slice(2, -2)
          return (
            <div key={index} className="my-4 flex justify-center">
              <DisplayMath>{math}</DisplayMath>
            </div>
          )
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math - keep it inline with proper spacing
          const math = part.slice(1, -1)
          return <InlineMath key={index} className="mx-1">{math}</InlineMath>
        } else {
          // Regular text - preserve spacing and line breaks
          return <span key={index} className="whitespace-pre-wrap">{part}</span>
        }
      })}
    </div>
  )
}
