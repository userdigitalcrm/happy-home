'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'

interface District {
  id: string
  name: string
}

interface Building {
  id: string
  districtId: string
  street: string
  houseNumber: string
  fullAddress: string
  totalFloors: number | null
  yearBuilt: number | null
  wallMaterial: string | null
  layout: string | null
  hasElevator: boolean
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  district: District
  createdAt: string
}

export default function BuildingsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [formData, setFormData] = useState({
    districtId: '',
    street: '',
    houseNumber: '',
    yearBuilt: '',
    wallMaterial: '',
    totalFloors: '',
    layout: '',
    hasElevator: false
  })
  
  // States for form tag-based filters
  const [showFormDistrictSuggestions, setShowFormDistrictSuggestions] = useState(false)
  const [showFormWallMaterialSuggestions, setShowFormWallMaterialSuggestions] = useState(false)
  const [showFormLayoutSuggestions, setShowFormLayoutSuggestions] = useState(false)
  
  // Refs for form tag-based filters
  const formDistrictRef = useRef<HTMLDivElement>(null)
  const formWallMaterialRef = useRef<HTMLDivElement>(null)
  const formLayoutRef = useRef<HTMLDivElement>(null)
  
  // Параметры пагинации и фильтрации
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  })
  
  const [filters, setFilters] = useState({
    districtId: '',
    yearBuilt: '',
    wallMaterial: '',
    totalFloors: '',
    layout: '',
    search: ''
  })
  
  // States for tag-based filters
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false)
  const [showWallMaterialSuggestions, setShowWallMaterialSuggestions] = useState(false)
  const [showLayoutSuggestions, setShowLayoutSuggestions] = useState(false)
  
  // Refs for detecting clicks outside of filter fields
  const districtRef = useRef<HTMLDivElement>(null)
  const wallMaterialRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  
  // Material wall options
  const wallMaterialOptions = [
    "к", "п", "д", "м", "б", "ш", "н/с", "с/ш"
  ]
  
  // Layout options
  const layoutOptions = [
    "нов", "нвст", "ст", "ул", "лен", "омс", "гост", "общ", "дом", "кот", "бар", "сад"
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
        router.push('/dashboard')
      } else {
        loadDistricts()
      }
    }
  }, [status, session, router])

  // Debounced load when filters или пагинация меняются
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (status !== 'authenticated' || !(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER')) {
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      loadBuildings()
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [filters, pagination.page, pagination.limit, status, session])

  // Add click outside handler for tag suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictSuggestions(false)
      }
      if (wallMaterialRef.current && !wallMaterialRef.current.contains(event.target as Node)) {
        setShowWallMaterialSuggestions(false)
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target as Node)) {
        setShowLayoutSuggestions(false)
      }
      // Form tag fields
      if (formDistrictRef.current && !formDistrictRef.current.contains(event.target as Node)) {
        setShowFormDistrictSuggestions(false)
      }
      if (formWallMaterialRef.current && !formWallMaterialRef.current.contains(event.target as Node)) {
        setShowFormWallMaterialSuggestions(false)
      }
      if (formLayoutRef.current && !formLayoutRef.current.contains(event.target as Node)) {
        setShowFormLayoutSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/districts')
      if (response.ok) {
        const data = await response.json()
        setDistricts(data)
      }
    } catch (error) {
      console.error('Failed to load districts:', error)
    }
  }

  const loadBuildings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      })
      
      // Log the parameters for debugging
      console.log('Fetching with params:', params.toString())
      
      const response = await fetch(`/api/buildings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBuildings(data.buildings)
        setPagination(data.pagination)
      } else {
        throw new Error('Failed to load buildings')
      }
    } catch (error) {
      console.error('Failed to load buildings:', error)
      setError('Ошибка загрузки зданий')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    console.log(`Filter change: ${field} = ${value}`)
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    // При любом изменении фильтра сбрасываем страницу на первую
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const applyFilters = () => {
    console.log('Applying filters:', filters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const resetFilters = () => {
    setFilters({
      districtId: '',
      yearBuilt: '',
      wallMaterial: '',
      totalFloors: '',
      layout: '',
      search: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    console.log('Changing page to:', newPage)
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingBuilding ? '/api/buildings' : '/api/buildings'
      const method = editingBuilding ? 'PUT' : 'POST'
      const requestData = {
        ...(editingBuilding && { id: editingBuilding.id }),
        ...formData,
        ...(formData.yearBuilt && { yearBuilt: parseInt(formData.yearBuilt) }),
        ...(formData.totalFloors && { totalFloors: parseInt(formData.totalFloors) })
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка сохранения')
      }

      setShowForm(false)
      setEditingBuilding(null)
      setFormData({
        districtId: '',
        street: '',
        houseNumber: '',
        yearBuilt: '',
        wallMaterial: '',
        totalFloors: '',
        layout: '',
        hasElevator: false
      })
      loadBuildings()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEdit = (building: Building) => {
    setEditingBuilding(building)
    setFormData({
      districtId: building.districtId,
      street: building.street,
      houseNumber: building.houseNumber,
      yearBuilt: building.yearBuilt?.toString() || '',
      wallMaterial: building.wallMaterial || '',
      totalFloors: building.totalFloors?.toString() || '',
      layout: building.layout || '',
      hasElevator: building.hasElevator
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите деактивировать это здание?')) {
      return
    }

    try {
      const response = await fetch(`/api/buildings?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка деактивации')
      }

      loadBuildings()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getConfidenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'HIGH': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'destructive'
      default: return 'outline'
    }
  }

  const getConfidenceText = (level: string) => {
    switch (level) {
      case 'HIGH': return 'Высокая'
      case 'MEDIUM': return 'Средняя'
      case 'LOW': return 'Низкая'
      default: return level
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Справочник зданий
              </h1>
              <p className="text-sm text-gray-600">
                Управление адресами и характеристиками зданий
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin')}
              >
                Назад
              </Button>
              <Button onClick={() => {
                setShowForm(true);
                setEditingBuilding(null);
              }}>
                + Добавить здание
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="mb-4 w-full">
          <div className="flex flex-row flex-wrap items-end gap-3">
            <div className="flex-[2] min-w-[300px]">
              <Label htmlFor="search" className="text-xs font-medium">Поиск по адресу</Label>
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Улица, дом..."
                className="h-9"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="district" className="text-xs font-medium">Район</Label>
              <div className="relative" ref={districtRef}>
                <div 
                  className="w-full p-1.5 border rounded h-9 cursor-text flex flex-wrap gap-1"
                  onClick={() => setShowDistrictSuggestions(!showDistrictSuggestions)}
                >
                  {filters.districtId ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                      {districts.find(d => d.id === filters.districtId)?.name || 'Район'}
                      <button
                        type="button"
                        className="ml-1 text-blue-800 hover:text-blue-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFilterChange('districtId', '')
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Выберите район...</span>
                  )}
                </div>
                
                {showDistrictSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                    <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                      {districts.map((district) => (
                        <div
                          key={district.id}
                          className={`px-2 py-1 cursor-pointer text-xs rounded ${
                            filters.districtId === district.id
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('districtId', district.id);
                            setShowDistrictSuggestions(false);
                          }}
                        >
                          {district.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-[120px]">
              <Label htmlFor="yearBuilt" className="text-xs font-medium">Год постройки</Label>
              <Input
                id="yearBuilt"
                type="number"
                value={filters.yearBuilt}
                onChange={(e) => handleFilterChange('yearBuilt', e.target.value)}
                placeholder="Год"
                className="h-9"
              />
            </div>
            
            <div className="flex-1 min-w-[120px]">
              <Label htmlFor="wallMaterial" className="text-xs font-medium">Материал стен</Label>
              <div className="relative" ref={wallMaterialRef}>
                <div 
                  className="w-full p-1.5 border rounded h-9 cursor-text flex flex-wrap gap-1"
                  onClick={() => setShowWallMaterialSuggestions(!showWallMaterialSuggestions)}
                >
                  {filters.wallMaterial ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                      {filters.wallMaterial}
                      <button
                        type="button"
                        className="ml-1 text-blue-800 hover:text-blue-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFilterChange('wallMaterial', '')
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Материал...</span>
                  )}
                </div>
                
                {showWallMaterialSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                    <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                      {wallMaterialOptions.map((material) => (
                        <div
                          key={material}
                          className={`px-2 py-1 cursor-pointer text-xs rounded ${
                            filters.wallMaterial === material
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('wallMaterial', material);
                            setShowWallMaterialSuggestions(false);
                          }}
                        >
                          {material}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-[100px]">
              <Label htmlFor="totalFloors" className="text-xs font-medium">Этажность</Label>
              <Input
                id="totalFloors"
                type="number"
                value={filters.totalFloors}
                onChange={(e) => handleFilterChange('totalFloors', e.target.value)}
                placeholder="Этажей"
                className="h-9"
              />
            </div>
            
            <div className="flex-1 min-w-[120px]">
              <Label htmlFor="layout" className="text-xs font-medium">Планировка</Label>
              <div className="relative" ref={layoutRef}>
                <div 
                  className="w-full p-1.5 border rounded h-9 cursor-text flex flex-wrap gap-1"
                  onClick={() => setShowLayoutSuggestions(!showLayoutSuggestions)}
                >
                  {filters.layout ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                      {filters.layout}
                      <button
                        type="button"
                        className="ml-1 text-blue-800 hover:text-blue-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFilterChange('layout', '')
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Планировка...</span>
                  )}
                </div>
                
                {showLayoutSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                    <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                      {layoutOptions.map((layout) => (
                        <div
                          key={layout}
                          className={`px-2 py-1 cursor-pointer text-xs rounded ${
                            filters.layout === layout
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('layout', layout);
                            setShowLayoutSuggestions(false);
                          }}
                        >
                          {layout}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
                Сбросить
              </Button>
              <Button size="sm" onClick={applyFilters} className="h-9">
                Применить
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Building Form Modal */}
        {showForm && (
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>
                {editingBuilding ? 'Редактирование здания' : 'Добавление нового здания'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form-district">Район *</Label>
                    <div className="relative" ref={formDistrictRef}>
                      <div 
                        className="w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1"
                        onClick={() => setShowFormDistrictSuggestions(!showFormDistrictSuggestions)}
                      >
                        {formData.districtId ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                            {districts.find(d => d.id === formData.districtId)?.name || 'Район'}
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => ({ ...prev, districtId: '' }))
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Выберите район... *</span>
                        )}
                      </div>
                      
                      {showFormDistrictSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                          <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                            {districts.map((district) => (
                              <div
                                key={district.id}
                                className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                  formData.districtId === district.id
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, districtId: district.id }));
                                  setShowFormDistrictSuggestions(false);
                                }}
                              >
                                {district.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="form-street">Улица *</Label>
                    <Input
                      id="form-street"
                      value={formData.street}
                      onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Название улицы"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-houseNumber">Номер дома *</Label>
                    <Input
                      id="form-houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                      placeholder="Номер дома"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-yearBuilt">Год постройки</Label>
                    <Input
                      id="form-yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                      placeholder="Год постройки"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-wallMaterial">Материал стен</Label>
                    <div className="relative" ref={formWallMaterialRef}>
                      <div 
                        className="w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1"
                        onClick={() => setShowFormWallMaterialSuggestions(!showFormWallMaterialSuggestions)}
                      >
                        {formData.wallMaterial ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                            {formData.wallMaterial}
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => ({ ...prev, wallMaterial: '' }))
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Выберите материал...</span>
                        )}
                      </div>
                      
                      {showFormWallMaterialSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                          <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                            {wallMaterialOptions.map((material) => (
                              <div
                                key={material}
                                className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                  formData.wallMaterial === material
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, wallMaterial: material }));
                                  setShowFormWallMaterialSuggestions(false);
                                }}
                              >
                                {material}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="form-totalFloors">Этажность</Label>
                    <Input
                      id="form-totalFloors"
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalFloors: e.target.value }))}
                      placeholder="Количество этажей"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="form-layout">Планировка</Label>
                    <div className="relative" ref={formLayoutRef}>
                      <div 
                        className="w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1"
                        onClick={() => setShowFormLayoutSuggestions(!showFormLayoutSuggestions)}
                      >
                        {formData.layout ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                            {formData.layout}
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => ({ ...prev, layout: '' }))
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Выберите планировку...</span>
                        )}
                      </div>
                      
                      {showFormLayoutSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                          <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                            {layoutOptions.map((layout) => (
                              <div
                                key={layout}
                                className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                  formData.layout === layout
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, layout: layout }));
                                  setShowFormLayoutSuggestions(false);
                                }}
                              >
                                {layout}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="form-hasElevator"
                      checked={formData.hasElevator}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasElevator: e.target.checked }))}
                    />
                    <Label htmlFor="form-hasElevator">Наличие лифта</Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setEditingBuilding(null)
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingBuilding ? 'Сохранить' : 'Добавить'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Buildings Table */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Список зданий</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-4">Загрузка данных...</div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Адрес
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Район
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Год постройки
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Материал стен
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Этажность
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Планировка
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Достоверность
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {buildings.map((building) => (
                    <tr 
                      key={building.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEdit(building)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{building.fullAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{building.district.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{building.yearBuilt || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{building.wallMaterial || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{building.totalFloors || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{building.layout || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getConfidenceBadgeVariant(building.confidenceLevel)}>
                          {getConfidenceText(building.confidenceLevel)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(building);
                          }}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(building.id);
                          }}
                        >
                          Деактивировать
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {(() => {
                    const start = (pagination.page - 1) * pagination.limit + 1
                    const end = start + buildings.length - 1
                    return `Показано ${start}-${end} из ${pagination.total} зданий`
                  })()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Назад
                  </Button>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">
                      Страница {pagination.page} из {pagination.pages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}