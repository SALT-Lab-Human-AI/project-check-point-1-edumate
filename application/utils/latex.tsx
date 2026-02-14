"use client"

declare global {
  interface Window {
    katex?: {
      renderToString: (latex: string, options: { displayMode: boolean; throwOnError: boolean }) => string
    }
  }
}

export function renderLatex(text: string) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$)/g)

  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2)
          try {
            if (typeof window !== "undefined" && window.katex) {
              const html = window.katex.renderToString(latex, {
                displayMode: true,
                throwOnError: false,
              })
              return <div key={i} dangerouslySetInnerHTML={{ __html: html }} className="my-4" />
            }
            // Fallback if KaTeX not loaded yet
            return (
              <div key={i} className="my-4 font-mono text-sm">
                {part}
              </div>
            )
          } catch (e) {
            return (
              <span key={i} className="text-red-600">
                {part}
              </span>
            )
          }
        }

        // Handle inline LaTeX
        const inlineParts = part.split(/(\$[^$]+?\$)/g)
        return (
          <span key={i}>
            {inlineParts.map((inline, j) => {
              if (inline.startsWith("$") && inline.endsWith("$") && !inline.startsWith("$$")) {
                const latex = inline.slice(1, -1)
                try {
                  if (typeof window !== "undefined" && window.katex) {
                    const html = window.katex.renderToString(latex, {
                      displayMode: false,
                      throwOnError: false,
                    })
                    return <span key={j} dangerouslySetInnerHTML={{ __html: html }} />
                  }
                  // Fallback if KaTeX not loaded yet
                  return (
                    <span key={j} className="font-mono text-sm">
                      {inline}
                    </span>
                  )
                } catch (e) {
                  return (
                    <span key={j} className="text-red-600">
                      {inline}
                    </span>
                  )
                }
              }
              // Convert markdown-style formatting
              return (
                <span key={j}>
                  {inline.split("\n").map((line, k) => (
                    <span key={k}>
                      {k > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </span>
              )
            })}
          </span>
        )
      })}
    </div>
  )
}
