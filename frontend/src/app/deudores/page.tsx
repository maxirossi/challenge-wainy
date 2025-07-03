"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useEffect, useState } from 'react'

interface Deudor {
  [key: string]: any
}

interface ApiResponse {
  data: Deudor[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export default function DeudoresPage() {
  const [deudores, setDeudores] = useState<Deudor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(20)

  useEffect(() => {
    const fetchDeudores = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`http://localhost:8000/api/deudores/list?page=${page}&per_page=${perPage}`)
        if (!res.ok) throw new Error('Error al obtener los deudores')
        const json: ApiResponse = await res.json()
        setDeudores(json.data)
        setLastPage(json.last_page || 1)
        setTotal(json.total || 0)
        setPerPage(json.per_page || 20)
        if (json.current_page && json.current_page !== page) {
          setPage(json.current_page)
        }
      } catch (err: any) {
        setError(err.message || 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchDeudores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage])

  // Obtener todas las columnas presentes en los datos
  const columns = deudores.length > 0 ? Object.keys(deudores[0]) : []

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Listado de Deudores</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-500">Cargando...</td>
                </tr>
              ) : deudores.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-500">No hay registros</td>
                </tr>
              ) : (
                deudores.map((deudor, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {String(deudor[col])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >Anterior</button>
          <span className="text-sm text-gray-600">
            Página {page} de {lastPage} &mdash; Total: {total}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage || loading}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >Siguiente</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
