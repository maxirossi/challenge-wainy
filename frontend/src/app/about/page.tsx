"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Deudor {
  [key: string]: any
}

export default function BuscarCuitPage() {
  const [cuit, setCuit] = useState('')
  const [deudor, setDeudor] = useState<Deudor | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!cuit.trim()) {
      setError('Por favor ingresa un CUIT válido')
      return
    }

    setLoading(true)
    setError('')
    setDeudor(null)

    try {
      const response = await fetch(`http://localhost:8000/api/deudores/${cuit.trim()}`)
      const data = await response.json()

      if (data.success) {
        setDeudor(data.data)
      } else {
        setError(data.message || 'Deudor no encontrado')
      }
    } catch (err) {
      setError('Error al buscar el deudor')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Buscar por CUIT</h2>
          <p className="text-gray-600">Ingresa el CUIT del deudor para ver su información detallada</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda</CardTitle>
            <CardDescription>Ingresa el CUIT en formato XX-XXXXXXXX-X</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  type="text"
                  placeholder="20-12345678-9"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleSearch}
                  disabled={loading || !cuit.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {deudor && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado de la búsqueda</CardTitle>
              <CardDescription>Información del deudor encontrado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(deudor).map((key) => (
                        <th key={key} className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {Object.values(deudor).map((value, index) => (
                        <td key={index} className="border border-gray-200 px-4 py-2 text-sm text-gray-900">
                          {value === null ? '-' : String(value)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
