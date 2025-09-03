import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Upload, Play, Settings, BarChart3, Activity, Clock, Zap } from 'lucide-react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [apiUrl, setApiUrl] = useState('https://football-analysis-csharp-api.onrender.com/api/analysis')
  const [analysisStatus, setAnalysisStatus] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResults(null)
      setAnalysisStatus(null)
    }
  }

  const uploadVideo = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo de vídeo.')
      return
    }

    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append('video', selectedFile)

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisStatus({ status: 'uploaded', analysisId: result.analysisId })
        pollAnalysisStatus(result.analysisId)
      } else {
        throw new Error('Erro no upload do vídeo')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro de conexão com o servidor. Verifique se a URL da API está correta.')
      setIsAnalyzing(false)
    }
  }

  const analyzeYouTube = async () => {
    if (!youtubeUrl) {
      alert('Por favor, insira uma URL do YouTube.')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch(`${apiUrl}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisStatus({ status: 'downloading', analysisId: result.analysis_id })
        pollAnalysisStatus(result.analysis_id)
      } else {
        throw new Error('Erro na análise do YouTube')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro de conexão com o servidor. Verifique se a URL da API está correta.')
      setIsAnalyzing(false)
    }
  }

  const pollAnalysisStatus = async (analysisId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/status/${analysisId}`)
        if (response.ok) {
          const status = await response.json()
          setAnalysisStatus(status)

          if (status.status === 'completed') {
            const resultsResponse = await fetch(`${apiUrl}/results/${analysisId}`)
            if (resultsResponse.ok) {
              const results = await resultsResponse.json()
              setAnalysisResults(results)
              setIsAnalyzing(false)
            }
          } else if (status.status === 'error') {
            alert(`Erro na análise: ${status.error}`)
            setIsAnalyzing(false)
          } else {
            setTimeout(checkStatus, 2000)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
        setIsAnalyzing(false)
      }
    }
    checkStatus()
  }

  const getStatusText = (status) => {
    switch (status?.status) {
      case 'uploaded': return 'Vídeo enviado'
      case 'downloading': return 'Baixando vídeo...'
      case 'processing': return 'Analisando vídeo...'
      case 'completed': return 'Análise concluída'
      case 'error': return 'Erro na análise'
      default: return 'Aguardando...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Análise de Futebol Feminino
          </h1>
          <p className="text-gray-600">
            Analise vídeos de atletas e obtenha métricas detalhadas de performance
          </p>
        </div>

        {/* Settings Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Configure a URL do backend para conectar com a API de análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-url">URL da API Backend</Label>
                  <Input
                    id="api-url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://seu-backend.onrender.com/api/analysis"
                  />
                </div>
                <Button onClick={() => setShowSettings(false)}>
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload de Vídeo
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo de vídeo para análise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-upload">Selecionar Vídeo</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  disabled={isAnalyzing}
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
              <Button
                onClick={uploadVideo}
                disabled={!selectedFile || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
              </Button>
            </CardContent>
          </Card>

          {/* YouTube Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Análise do YouTube
              </CardTitle>
              <CardDescription>
                Analise um vídeo diretamente do YouTube
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">URL do YouTube</Label>
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isAnalyzing}
                />
              </div>
              <Button
                onClick={analyzeYouTube}
                disabled={!youtubeUrl || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'Analisando...' : 'Analisar YouTube'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Section */}
        {analysisStatus && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Status da Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>{getStatusText(analysisStatus)}</span>
                {analysisStatus.progress && (
                  <span className="text-sm text-gray-600">
                    {analysisStatus.progress}%
                  </span>
                )}
              </div>
              {analysisStatus.progress && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisStatus.progress}%` }}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {analysisResults && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resultados da Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Distância Total</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisResults.metrics?.totalDistanceMeters?.toFixed(0)} m
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">Velocidade Média</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {analysisResults.metrics?.averageSpeedPixelsPerSec?.toFixed(1)} px/s
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold">Intensidade</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {analysisResults.metrics?.movementIntensity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {analysisResults.suggestions && analysisResults.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sugestões de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

