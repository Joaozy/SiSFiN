'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Upload, X, Bot, Loader2, Square, Brain, User } from 'lucide-react'
import { useEnhancedChat } from '@/hooks/useEnhancedChat'
import { useImageUpload } from '@/hooks/useImageUpload'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AgenteAvancadoPage() {
  const [input, setInput] = useState('')
  const [imageAnalysis, setImageAnalysis] = useState<string[]>([])
  const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'analyzing' | 'thinking' | 'writing'>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')

  // ✨ Auto-scroll refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)

  const {
    messages,
    isLoading,
    isStreaming,
    isThinking,
    sendMessage,
    stopGeneration,
  } = useEnhancedChat()

  const {
    selectedImages,
    isUploading,
    addImages,
    removeImage,
    clearImages,
    uploadImages,
  } = useImageUpload()

  // ✨ AUTO-SCROLL: Scroll automático ao final quando chegam novas mensagens
  useEffect(() => {
    // Só fazer auto-scroll se o usuário NÃO fez scroll manual
    if (!userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, userHasScrolled])

  // ✨ DETECTAR SCROLL MANUAL: Se o usuário faz scroll, pausar auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      // Se o usuário está perto do final, reativar auto-scroll
      // Se está longe, significa que subiu a tela
      setUserHasScrolled(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // ✨ RESET AUTO-SCROLL: Quando envia uma nova mensagem, reativar auto-scroll
  useEffect(() => {
    if (isStreaming) {
      setUserHasScrolled(false)
    }
  }, [isStreaming])

  // 📋 CLIPBOARD PASTE: Ctrl+V para colar imagens
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Só processar imagens
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            // Renomear com timestamp para evitar duplicatas
            const renamedFile = new File(
              [file],
              `clipboard-${Date.now()}.${file.type.split('/')[1]}`,
              { type: file.type }
            )
            imageFiles.push(renamedFile)
          }
        }
      }

      // Se encontramos imagens, adicionar
      if (imageFiles.length > 0) {
        addImages(imageFiles)
        console.log(`✅ ${imageFiles.length} imagem(ns) colada(s) da área de transferência`)
      }
    }

    // Escutar o evento paste em toda a janela
    window.addEventListener('paste', handlePaste)

    // Cleanup
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [addImages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    addImages(Array.from(files))
  }

  const handleSend = async () => {
    if (!input.trim() && selectedImages.length === 0) return

    let analysis: string[] = []
    let imageUrls: string[] = []
    let ocrDataList: any[] = []

    // Se há imagens, subir e analisar com OCR
    if (selectedImages.length > 0) {
      // Estado: Enviando imagens
      setLoadingState('uploading')
      setLoadingMessage('📤 Enviando imagens...')

      const urls = await uploadImages()
      if (urls) {
        imageUrls = urls

        // Estado: Analisando com OCR
        setLoadingState('analyzing')
        setLoadingMessage('🔍 Analisando comprovante com IA...')

        // Analisar cada imagem com OCR
        for (const url of urls) {
          try {
            const ocrResponse = await fetch(url)
            const blob = await ocrResponse.blob()
            const formData = new FormData()
            formData.append('image', blob)

            const uploadResponse = await fetch('/api/upload-image', {
              method: 'POST',
              body: formData,
            })

            const data = await uploadResponse.json()
            if (data.analysis) {
              analysis.push(data.analysis)
            }
            if (data.data) {
              ocrDataList.push(data.data)
            }
          } catch (error) {
            console.error('Erro OCR:', error)
          }
        }

        setImageAnalysis(analysis)
      }

      clearImages()
    }

    // Estado: Pensando (antes de enviar ao chat)
    setLoadingState('thinking')
    setLoadingMessage('💭 Processando informações...')

    // VERIFICAÇÃO DE VALORES: Comparar valor declarado vs OCR
    if (ocrDataList.length > 0 && input.trim()) {
      // Extrair valor da mensagem do usuário (regex para encontrar números)
      const valorMatch = input.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/);

      if (valorMatch) {
        // Remove vírgulas se for formato 1,000.00 ou trata formato 1.000,00 (Brasil)
        let valorDeclarado = parseFloat(valorMatch[1].replace(',', ''));
        
        // Tentativa de suportar formato brasileiro (trocar vírgula decimal por ponto) se necessário
        if (isNaN(valorDeclarado) && valorMatch[1].includes(',')) {
           valorDeclarado = parseFloat(valorMatch[1].replace('.', '').replace(',', '.'));
        }

        const valorOCR = ocrDataList[0].valor || ocrDataList[0].monto;

        // Se houver diferença maior que R$ 50, perguntar
        if (valorOCR && Math.abs(valorDeclarado - valorOCR) > 50) {
          const confirmMessage = `⚠️ **VERIFICAÇÃO DE VALOR:**

Você disse: ${valorDeclarado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
O comprovante mostra: ${valorOCR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

Diferença: ${Math.abs(valorDeclarado - valorOCR).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

Qual valor está correto?
1️⃣ O que eu disse (${valorDeclarado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
2️⃣ O do comprovante (${valorOCR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`

          await sendMessage(confirmMessage, imageUrls)
          setInput('')
          setImageAnalysis([])
          return // Esperar confirmação do usuário
        }
      }
    }

    // Enviar mensagem com análise OCR como contexto
    let finalMessage = input.trim()

    // Se há análise OCR, adicionar como contexto
    if (analysis.length > 0) {
      const ocrContext = `\n\n📸 **ANÁLISE DE COMPROVANTES:**\n${analysis.join('\n\n')}`
      finalMessage = finalMessage ? finalMessage + ocrContext : ocrContext
    }

    // Se não há texto nem análise, não enviar (por segurança)
    if (!finalMessage.trim() && imageUrls.length === 0) {
      return
    }

    // Estado: Escrevendo (durante o streaming)
    setLoadingState('writing')
    setLoadingMessage('✍️ Escrevendo...')

    await sendMessage(finalMessage, imageUrls)

    // Resetar estados
    setInput('')
    setImageAnalysis([])
    setLoadingState('idle')
    setLoadingMessage('')
  }

  // Atualizar estado de carregamento quando muda isStreaming
  useEffect(() => {
    if (isStreaming) {
      setLoadingState('writing')
      setLoadingMessage('✍️ Escrevendo...')
    } else if (!isLoading) {
      setLoadingState('idle')
      setLoadingMessage('')
    }
  }, [isStreaming, isLoading])

  return (
    <main className="relative flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4">
      {/* Fundo animado com gradientes para glassmorphism */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-950 dark:to-black" />
      <div className="fixed -z-40 top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 dark:from-emerald-500/20 dark:to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="fixed -z-40 bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Chat Container com GLASSMORPHISM EXTREMO */}
      <div
        ref={chatContainerRef}
        className="flex-1 relative overflow-hidden bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-3xl shadow-2xl border-2 border-white/20 dark:border-white/10 overflow-y-auto p-4 space-y-4 mb-4"
      >
        {/* Múltiplas camadas de glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 via-transparent to-cyan-500/10 dark:from-emerald-500/5 dark:via-transparent dark:to-cyan-500/5 pointer-events-none" />

        {/* Círculos decorativos MAIORES e VISÍVEIS */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/40 to-cyan-400/40 dark:from-emerald-400/20 dark:to-cyan-400/20 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-400/30 to-pink-400/30 dark:from-purple-400/15 dark:to-pink-400/15 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Estado Vazio (Agora raramente aparecerá pois o hook inicia com mensagem) */}
        {messages.length === 0 && (
          <div className="relative text-center text-gray-500 dark:text-gray-400 mt-8 z-10">
            <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 dark:from-emerald-500/20 dark:to-cyan-500/20 backdrop-blur-2xl border-2 border-emerald-500/50 dark:border-emerald-500/30 mb-4 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 dark:to-transparent" />
              <Bot className="relative w-20 h-20 text-emerald-600 dark:text-emerald-400 animate-pulse mx-auto" />
            </div>
            <p className="text-2xl font-bold mb-3 text-gray-900 dark:text-white drop-shadow-lg">
              Olá! Sou seu assistente com OCR
            </p>
            <p className="text-base text-gray-600 dark:text-gray-300 drop-shadow-md">
              Envie fotos de comprovantes e eu ajudo a registrar despesas automaticamente
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up z-10`}
          >
            {/* Avatar do assistente (à esquerda) */}
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 dark:from-emerald-500/20 dark:to-cyan-500/20 backdrop-blur-xl border-2 border-emerald-500/50 dark:border-emerald-500/30 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}

            <div
              className={`max-w-[75%] p-4 rounded-2xl shadow-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white border-2 border-emerald-400/50 backdrop-blur-xl'
                  : 'bg-white/20 dark:bg-white/10 backdrop-blur-2xl text-gray-900 dark:text-white border-2 border-white/30 dark:border-white/20'
              }`}
            >
              {/* Mostrar imagens se existirem */}
              {msg.images && msg.images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {msg.images.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Imagem ${idx + 1}`}
                      className="max-w-full h-32 rounded-lg border-2 border-white/30 object-cover"
                    />
                  ))}
                </div>
              )}
              {/* Renderização de Markdown para respostas do assistente */}
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none relative z-10">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap relative z-10">{msg.content}</p>
              )}

              {/* ✨ Indicador de PENSANDO vs ESCREVENDO (Dentro do balão) */}
              {msg.isThinking && (
                <div className="mt-3 flex items-center gap-2 text-sm opacity-90 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 backdrop-blur-xl rounded-lg p-2 border border-purple-400/30 dark:border-purple-400/20 animate-pulse">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-700 dark:text-purple-300">Pensando...</span>
                </div>
              )}

              {msg.isStreaming && !msg.isThinking && (
                <div className="mt-2 flex items-center gap-2 text-sm opacity-70 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Escrevendo...
                </div>
              )}
            </div>

            {/* Avatar do usuário (à direita) */}
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-2 border-emerald-400/50 flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* ✨ Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Previews */}
      {selectedImages.length > 0 && (
        <div className="relative flex gap-3 mb-4 overflow-x-auto p-4 bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border-2 border-white/20 dark:border-white/10 shadow-xl">
          {selectedImages.map((img) => (
            <div key={img.id} className="relative group">
              <div className="relative overflow-hidden rounded-xl border-2 border-white/30 dark:border-white/20 shadow-lg">
                <img src={img.preview} alt={img.name} className="h-24 rounded-xl" />
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-1.5 hover:scale-110 hover:shadow-xl transition-all duration-200 border-2 border-white/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="relative flex gap-3 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-2xl shadow-2xl border-2 border-white/20 dark:border-white/10"
      >
        <label className="cursor-pointer group">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:to-cyan-500/10 backdrop-blur-xl rounded-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 border-2 border-emerald-500/30 dark:border-emerald-500/20">
            <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors" />
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva ou envie um comprovante..."
          disabled={isLoading || isUploading}
          className="flex-1 p-3 bg-white/20 dark:bg-white/10 backdrop-blur-xl border-2 border-white/30 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 disabled:opacity-50 transition-all shadow-lg"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={stopGeneration}
            className="p-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 border-2 border-red-400/50"
          >
            <Square className="w-6 h-6" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading || isUploading || (!input.trim() && selectedImages.length === 0)}
            className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:scale-110 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 border-2 border-emerald-400/50"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        )}
      </form>
    </main>
  )
}