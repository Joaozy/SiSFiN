import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  isStreaming?: boolean
  isThinking?: boolean
}

export function useEnhancedChat() {
  // 1. MUDANÇA: A mensagem já nasce aqui. Zero delay de rede.
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Olá! Eu sou o FinChat, seu especialista em finanças. Pode me contar sobre seus gastos e ganhos que eu registro tudo para você. Vamos começar?',
      isStreaming: false,
      isThinking: false
    }
  ])
  
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      images: images && images.length > 0 ? images : undefined,
    }
    
    // Adiciona msg do usuário e seta loading IMEDIATAMENTE
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const assistantMsgId = (Date.now() + 1).toString()
    
    // Adiciona placeholder do assistente
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true, // Começa piscando
      isThinking: false
    }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Sessão expirada. Faça login novamente.")

      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          // Enviamos apenas o histórico relevante, sem a mensagem de boas-vindas se não quiser sobrecarregar,
          // mas enviá-la ajuda a IA a ter contexto. Vamos enviar as últimas 10.
          messages: [...messages, userMsg].slice(-10), 
          images,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || response.statusText)
      }

      setIsStreaming(true)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error("Sem resposta da IA")

      let buffer = '' 
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6)
              if (jsonStr === '[DONE]') continue
              
              const data = JSON.parse(jsonStr)

              // Atualiza estado de "Pensando" (ferramentas)
              if (data.thinking !== undefined) {
                setIsThinking(data.thinking)
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, isThinking: data.thinking } : m
                ))
              }

              // Atualiza texto
              if (data.chunk) {
                fullContent += data.chunk
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: fullContent, isThinking: false } : m
                ))
              }
            } catch (e) {
               // Ignora JSON quebrado
            }
          }
        }
      }

    } catch (error: any) {
      console.error("Erro Chat:", error)
      const msgErro = error.message.includes('402') 
        ? '⚠️ Saldo insuficiente na IA (Erro 402).'
        : `❌ Erro: ${error.message}`

      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: msgErro } : m
      ))
    } finally {
      // 2. MUDANÇA CRÍTICA: FORÇAR PARADA DOS EFEITOS VISUAIS
      // Isso garante que o "Escrevendo..." suma, não importa o que aconteceu.
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId 
          ? { ...m, isStreaming: false, isThinking: false } 
          : m
      ))
      setIsLoading(false)
      setIsStreaming(false)
      setIsThinking(false)
      abortControllerRef.current = null
    }
  }, [messages])

  const clearMessages = useCallback(() => { 
    // Resetar volta para a mensagem de boas-vindas padrão
    setMessages([{
      id: 'welcome-reset',
      role: 'assistant',
      content: 'Olá! Eu sou o FinChat, seu especialista em finanças. Pode me contar sobre seus gastos e ganhos que eu registro tudo para você. Vamos começar?',
      isStreaming: false,
      isThinking: false
    }]) 
  }, [])

  return { messages, isLoading, isStreaming, isThinking, sendMessage, stopGeneration, clearMessages }
}