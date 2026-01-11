import { useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Recriamos o cliente aqui para garantir que ele leia o localStorage do navegador
// Isso evita problemas com importações cacheadas que perdem a sessão
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  isStreaming?: boolean
  isThinking?: boolean
}

interface UseEnhancedChatReturn {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  isThinking: boolean
  sendMessage: (message: string, images?: string[]) => Promise<void>
  stopGeneration: () => void
  clearMessages: () => void
}

export function useEnhancedChat(): UseEnhancedChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsLoading(false)
    setIsThinking(false)
  }, [])

  const sendMessage = useCallback(async (userMessage: string, images?: string[]) => {
    if (!userMessage.trim() && (!images || images.length === 0)) return

    // 1. Adiciona mensagem visualmente
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      images: images && images.length > 0 ? images : undefined,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    // 2. Cria placeholder do assistente
    const assistantMsgId = (Date.now() + 1).toString()
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      // 🕵️ DEBUG: Verificar Token antes de enviar
      console.log("🔍 [Front] Buscando sessão...")
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) console.error("❌ Erro de sessão:", sessionError)

      if (!session || !session.access_token) {
        console.error("❌ [Front] Sem sessão ativa!")
        throw new Error("Sessão não encontrada. Tente fazer login novamente.")
      }

      console.log("✅ [Front] Token encontrado:", session.access_token.substring(0, 10) + "...")

      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // AQUI ESTÁ O SEGREDO: Bearer Token explícito
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.slice(-10),
          images,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errText = await response.text()
        try {
            const errJson = JSON.parse(errText)
            throw new Error(errJson.error || response.statusText)
        } catch {
            throw new Error(errText || response.statusText)
        }
      }

      setIsStreaming(true)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (!reader) throw new Error("Sem resposta legível")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6)
              if (jsonStr === '[DONE]') continue
              const data = JSON.parse(jsonStr)

              if (data.thinking !== undefined) {
                setIsThinking(data.thinking)
                setMessages(prev =>
                  prev.map(msg => msg.id === assistantMsgId ? { ...msg, isThinking: data.thinking } : msg)
                )
              }

              if (data.chunk) {
                accumulatedContent += data.chunk
                setMessages(prev =>
                  prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: accumulatedContent, isThinking: false } : msg)
                )
              }
            } catch (e) { }
          }
        }
      }
    } catch (error: any) {
      console.error("🔥 Erro no envio:", error)
      const errorMessage = error.message.includes('Sessão') 
        ? 'Erro de autenticação. Recarregue a página.' 
        : `Erro: ${error.message}`

      setMessages(prev =>
        prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: `❌ ${errorMessage}`, isStreaming: false } : msg)
      )
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setIsThinking(false)
      abortControllerRef.current = null
    }
  }, [messages])

  const clearMessages = useCallback(() => { setMessages([]) }, [])

  return { messages, isLoading, isStreaming, isThinking, sendMessage, stopGeneration, clearMessages }
}