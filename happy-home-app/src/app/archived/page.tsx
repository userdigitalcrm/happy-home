"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import PropertyForm from '@/components/PropertyForm'

interface User {
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
}

interface Category {
  id: string
  name: string
}

interface District {
  id: string
  name: string
}

interface Property {
  id: string
  category?: Category
  district?: District
  price?: number
  status: string
  createdAt: string
  updatedAt: string
  categoryId?: string
  districtId?: string
  buildingId?: string
  apartment?: string | null
  floor?: number | null
  totalArea?: number | null
  livingArea?: number | null
  kitchenArea?: number | null
  rooms?: number | null
  ceilingHeight?: number | null
  balcony?: string | null
  loggia?: boolean
  renovation?: 'NONE' | 'COSMETIC' | 'MAJOR' | 'DESIGNER'
  layout?: string | null
  totalFloors?: number | null
  condition?: string | null
  yearBuilt?: number | null
  phone?: string | null
  source?: string | null
  pricePerSqm?: number | null
  currency?: string
  isArchived?: boolean
  description?: string | null
  notes?: string | null
  createdById?: string
  assignedToId?: string | null
  building?: any
  photos?: any[]
}

export default function ArchivedPropertiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [phoneSearch, setPhoneSearch] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (!(session?.user as unknown as User)?.role || !['ADMIN', 'MANAGER'].includes(((session?.user as unknown as User).role))) {
        router.push('/dashboard')
      } else {
        loadProperties()
        loadCategories()
        loadDistricts()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, page])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      searchParams.set('page', page.toString())
      searchParams.set('limit', '50')
      searchParams.set('includeArchived', 'true')
      if (phoneSearch.trim()) searchParams.set('phone', phoneSearch.trim())
      if (addressSearch.trim()) searchParams.set('street', addressSearch.trim())

      const response = await fetch(`/api/properties?${searchParams.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
        setTotalPages(data.totalPages)
      } else {
        throw new Error('Failed to load properties')
      }
    } catch (err) {
      console.error(err)
      setError('Ошибка загрузки архивных объектов')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/districts')
      const data = await response.json()
      if (response.ok) {
        setDistricts(data || [])
      }
    } catch (err) {
      console.error('Error loading districts:', err)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/${id}/restore`, {
        method: "POST"
      })
      
      if (response.ok) {
        loadProperties()
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Restore error details:", errorData);
        throw new Error(`Failed to restore property: ${errorData.error || response.status}`)
      }
    } catch (err) {
      console.error("Restore error:", err)
      alert(`Не удалось восстановить объект: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`)
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setShowForm(true)
  }

  return (
    <div className="p-4 max-w-[95vw] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Архив объектов</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>На дашборд</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Телефон"
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Адрес (улица)"
          value={addressSearch}
          onChange={(e) => setAddressSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => { setPage(1); loadProperties(); }}>Применить</Button>
        <Button size="sm" variant="outline" onClick={() => { setPhoneSearch(''); setAddressSearch(''); setPage(1); loadProperties(); }}>Сброс</Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left">Категория</th>
                <th className="p-3 text-left">Район</th>
                <th className="p-3 text-left">Цена</th>
                <th className="p-3 text-left">Статус</th>
                <th className="p-3 text-left">Создано</th>
                <th className="p-3 text-left">Изменено</th>
                <th className="p-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Нет архивных объектов
                  </td>
                </tr>
              ) : (
                properties.map(prop => (
                  <tr key={prop.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{prop.category?.name || '-'}</td>
                    <td className="p-3">{prop.district?.name || '-'}</td>
                    <td className="p-3">{prop.price ? prop.price.toLocaleString('ru-RU') : '-'}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{prop.status}</Badge>
                    </td>
                    <td className="p-3">{new Date(prop.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3">{new Date(prop.updatedAt).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => handleRestore(prop.id)}>
                        Восстановить
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Назад
          </Button>
          <span>Страница {page} из {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Вперед
          </Button>
        </div>
      )}
    </div>
  )
}