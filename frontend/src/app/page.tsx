'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface UploadResponse {
  message: string
  processedLines: number
  s3Key: string
  importacionId: string
  cantidadErrores: number
  tamanoArchivo: number
  tiempoProcesamiento: number
}

export default function HomePage() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = async () => {
    const file = selectedFile

    if (!file) {
      setError('Por favor selecciona un archivo.')
      return
    }

    if (!file.name.endsWith('.txt')) {
      setError('Solo se permiten archivos .txt')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setProgress(0)
      setIsUploading(true)
      setIsProcessing(false)
      setError('')
      setUploadResult(null)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', 'http://localhost:3000/upload')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total)
          setProgress(percent)
        }
      }

      xhr.upload.onloadend = () => {
        setIsUploading(false)
        setIsProcessing(true)
      }

      xhr.onload = () => {
        setIsProcessing(false)
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response: UploadResponse = JSON.parse(xhr.responseText)
            setUploadResult(response)
            setProgress(100)
          } catch (err) {
            setError('Error al procesar la respuesta del servidor.')
          }
        } else if (xhr.status === 204) {
          setError('El archivo fue recibido pero el servidor no devolvió información.')
        } else {
          setError(`Error del servidor: ${xhr.status}`)
        }
      }

      xhr.onerror = () => {
        setIsUploading(false)
        setIsProcessing(false)
        setError('Error de conexión. Verifica que el servidor esté funcionando.')
      }

      xhr.send(formData)
    } catch (err) {
      setIsUploading(false)
      setIsProcessing(false)
      setError('Error inesperado durante la subida.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(2)}s`
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Importador de Archivos BCRA</h1>
          <p className="text-gray-600">
            Sube archivos de texto (.txt) con datos de deudores para procesarlos y almacenarlos en la base de datos.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Archivo
            </CardTitle>
            <CardDescription>
              Selecciona un archivo .txt con datos de deudores del BCRA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-sm font-medium">
                Archivo de texto (.txt)
              </Label>
              <Input
                id="file"
                type="file"
                accept=".txt"
                ref={fileInputRef}
                className="mt-1"
                disabled={isUploading}
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir Archivo
                </>
              )}
            </button>

            {isUploading && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo archivo...</span>
              </div>
            )}

            {isProcessing && !uploadResult && !error && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando archivo... por favor espera</span>
              </div>
            )}

            {progress > 0 && progress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progreso de subida</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {uploadResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Archivo Procesado Exitosamente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Líneas Procesadas</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.processedLines}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{uploadResult.cantidadErrores}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Tamaño del Archivo</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatFileSize(uploadResult.tamanoArchivo)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Tiempo de Procesamiento</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatTime(uploadResult.tiempoProcesamiento)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">ID de Importación</p>
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {uploadResult.importacionId}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Clave S3</p>
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {uploadResult.s3Key}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="text-center">
                <p className="text-green-700 font-medium">
                  ✅ {uploadResult.message}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Los datos han sido enviados a la cola SQS para procesamiento en segundo plano.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
