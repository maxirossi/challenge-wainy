"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Deudor {
  [key: string]: any
}

export default function TopDeudoresPage() {
  const [topCount, setTopCount] = useState(5)
  const [deudores, setDeudores] = useState<Deudor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!topCount || topCount < 1) {
      setError('Por favor ingresa un número válido mayor a 0')
      return
    }

    setLoading(true)
    setError('')
    setDeudores([])

    try {
      const response = await fetch(`http://localhost:8000/api/deudores/top/${topCount}`)
      const data = await response.json()

      if (data.success) {
        setDeudores(data.data)
      } else {
        setError(data.message || 'Error al obtener los deudores top')
      }
    } catch (err) {
      setError('Error al buscar los deudores top')
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
          <h2 className="text-2xl font-semibold mb-2">Deudores Top</h2>
          <p className="text-gray-600">Consulta los deudores con mayores montos de deuda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda</CardTitle>
            <CardDescription>Selecciona cuántos deudores top quieres ver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="topCount">Cantidad de deudores</Label>
                <Input
                  id="topCount"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="5"
                  value={topCount}
                  onChange={(e) => setTopCount(parseInt(e.target.value) || 5)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleSearch}
                  disabled={loading || !topCount || topCount < 1}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
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

        {deudores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>Top {deudores.length} deudores encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(deudores[0] || {}).map((key) => (
                        <th key={key} className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deudores.map((deudor, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(deudor).map((value, valueIndex) => (
                          <td key={valueIndex} className="border border-gray-200 px-4 py-2 text-sm text-gray-900">
                            {value === null ? '-' : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
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