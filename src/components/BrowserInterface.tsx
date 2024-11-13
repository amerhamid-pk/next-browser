// /src/components/BrowserInterface.tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw, Cookie, Shield, ChevronDown } from 'lucide-react'

interface CookieData {
  [key: string]: string
}

export default function BrowserInterface() {
  const [url, setUrl] = useState('https://lipsum.com/')
  const [history, setHistory] = useState<string[]>(['https://lipsum.com/'])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [key, setKey] = useState(0)
  const [cookies, setCookies] = useState<CookieData>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedCookies = localStorage.getItem('browserCookies')
    if (storedCookies) {
      setCookies(JSON.parse(storedCookies))
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('browserCookies', JSON.stringify(cookies))
  }, [cookies])

  const validateAndFormatUrl = (inputUrl: string) => {
    try {
      if (!/^https?:\/\//i.test(inputUrl)) {
        inputUrl = 'https://' + inputUrl
      }
      
      if (!/\.[a-z]{2,}$/i.test(inputUrl)) {
        inputUrl += '.com'
      }
      
      const urlObject = new URL(inputUrl)
      
      if (urlObject.protocol === 'http:') {
        urlObject.protocol = 'https:'
      }
      
      return urlObject.toString()
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  const navigate = useCallback((newUrl: string) => {
    try {
      const formattedUrl = validateAndFormatUrl(newUrl)
      setUrl(formattedUrl)
      setHistory(prev => [formattedUrl, ...prev.filter(u => u !== formattedUrl)].slice(0, 10))
      setCurrentIndex(0)
      setKey(prev => prev + 1)
      setError(null)
      setIsLoading(true)
      setIsDropdownOpen(false)
    } catch {
      setError('Please enter a valid URL')
    }
  }, [])

  const goBack = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUrl(history[currentIndex + 1])
      setKey(prev => prev + 1)
      setError(null)
      setIsLoading(true)
    }
  }, [currentIndex, history])

  const goForward = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setUrl(history[currentIndex - 1])
      setKey(prev => prev + 1)
      setError(null)
      setIsLoading(true)
    }
  }, [currentIndex, history])

  const refresh = useCallback(() => {
    setKey(prev => prev + 1)
    setError(null)
    setIsLoading(true)
  }, [])

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      <div className="flex items-center space-x-2 p-2 bg-muted/40 border-b">
        <button 
          onClick={goBack} 
          disabled={currentIndex >= history.length - 1} 
          className="p-1 disabled:opacity-50 hover:bg-muted rounded"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={goForward} 
          disabled={currentIndex <= 0} 
          className="p-1 disabled:opacity-50 hover:bg-muted rounded"
          aria-label="Go forward"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={refresh} 
          className="p-1 hover:bg-muted rounded" 
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <div className="flex-grow flex items-center gap-2 max-w-3xl relative" ref={dropdownRef}>
          <Shield className="w-4 h-4 text-green-500" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && navigate(url)}
            className="flex-grow p-2 pr-8 rounded-md bg-background border"
            placeholder="Enter URL (https:// and .com will be added automatically)"
            aria-label="URL input"
          />
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            aria-label="Toggle history dropdown"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item)}
                  className="block w-full text-left px-4 py-2 hover:bg-muted"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={() => setCookies({})} 
          className="p-1 hover:bg-muted rounded"
          aria-label="Clear cookies"
        >
          <Cookie className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-grow">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        )}
        {error ? (
          <div className="p-4 m-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : (
          <iframe 
            key={key} 
            src={url || 'about:blank'}  // Use 'about:blank' as a fallback
            className="w-full h-full border-none" 
            title="Web content"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('This website cannot be displayed in the browser (X-Frame-Options restriction)')
              setIsLoading(false)
            }}
          />
        )}
      </div>

      <div className="p-2 bg-muted/40 border-t text-sm text-muted-foreground">
        <p>Note: Some websites (like CNN) cannot be displayed due to security restrictions (X-Frame-Options).</p>
      </div>
    </div>
  )
}
