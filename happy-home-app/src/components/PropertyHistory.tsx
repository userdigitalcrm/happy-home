'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Edit3, Archive, RotateCcw, DollarSign, UserCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface PropertyHistoryEntry {
  id: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  notes?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface PropertyHistoryProps {
  propertyId: string
  className?: string
}

export default function PropertyHistory({ propertyId, className }: PropertyHistoryProps) {
  const { data: session } = useSession()
  const [history, setHistory] = useState<PropertyHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // If user is an agent, don't show history
  if (session?.user?.role === 'AGENT') {
    return null
  }

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/history`)
      
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load history')
      }
    } catch (error: unknown) {
      console.error('Failed to load property history:', error)
      setError(error instanceof Error ? error.message : 'Ошибка загрузки истории')
    } finally {
      setLoading(false)
    }
  }, [propertyId]);

  useEffect(() => {
    loadHistory()
  }, [propertyId, loadHistory])

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATED': return 'default'
      case 'UPDATED': return 'secondary'
      case 'ARCHIVED': return 'destructive'
      case 'RESTORED': return 'default'
      case 'STATUS_CHANGED': return 'outline'
      case 'ASSIGNED': return 'secondary'
      case 'PRICE_CHANGED': return 'default'
      default: return 'outline'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'CREATED': return 'Создан'
      case 'UPDATED': return 'Обновлен'
      case 'ARCHIVED': return 'Архивирован'
      case 'RESTORED': return 'Восстановлен'
      case 'STATUS_CHANGED': return 'Статус изменен'
      case 'ASSIGNED': return 'Назначен'
      case 'PRICE_CHANGED': return 'Цена изменена'
      default: return action
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED': return <Calendar className="w-4 h-4" />
      case 'UPDATED': return <Edit3 className="w-4 h-4" />
      case 'ARCHIVED': return <Archive className="w-4 h-4" />
      case 'RESTORED': return <RotateCcw className="w-4 h-4" />
      case 'STATUS_CHANGED': return <UserCheck className="w-4 h-4" />
      case 'ASSIGNED': return <User className="w-4 h-4" />
      case 'PRICE_CHANGED': return <DollarSign className="w-4 h-4" />
      default: return <Edit3 className="w-4 h-4" />
    }
  }

  const getFieldDisplayName = (field?: string) => {
    if (!field) return null
    
    const fieldNames: { [key: string]: string } = {
      'status': 'Статус',
      'price': 'Цена',
      'pricePerSqm': 'Цена за м²',
      'assignedToId': 'Ответственный',
      'totalArea': 'Общая площадь',
      'livingArea': 'Жилая площадь',
      'kitchenArea': 'Площадь кухни',
      'rooms': 'Количество комнат',
      'floor': 'Этаж',
      'apartment': 'Квартира',
      'renovation': 'Ремонт',
      'description': 'Описание',
      'notes': 'Заметки',
      'buildingId': 'Здание',
      'categoryId': 'Категория',
      'districtId': 'Район',
      'yearBuilt': 'Год постройки',
      'wallMaterial': 'Материал стен',
      'totalFloors': 'Этажность',
      'layout': 'Планировка',
      'condition': 'Состояние',
      'ceilingHeight': 'Высота потолков',
      'balcony': 'Балкон',
      'loggia': 'Лоджия',
      'phone': 'Телефон',
      'currency': 'Валюта',
      'isArchived': 'Архивный'
    }

    return fieldNames[field] || field
  }

  // Format value for display
  const formatValue = (value: string | null | undefined, field?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    // Для поля ответственного агента
    if (field === 'assignedToId') {
      // Преобразование ID пользователей в человекочитаемые имена
      const userMap: { [key: string]: string } = {
        'cmf0mkkso01seyhcphdvxk6a': 'Агент', // ID агента
        'clqrxwc0a0000seyhvxf7kvv5': 'Администратор', // ID админа
        'clqrxwc0a0001seyhjwnq3fj8': 'Менеджер' // ID менеджера
      }
      return userMap[value] || value
    }

    // Special formatting for specific fields
    if (field === 'price' || field === 'pricePerSqm') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('ru-RU').format(numValue) + ' ₸'
      }
    }

    if (field === 'totalArea' || field === 'livingArea' || field === 'kitchenArea') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('ru-RU').format(numValue) + ' м²'
      }
    }

    if (field === 'rooms' || field === 'floor' || field === 'totalFloors' || field === 'yearBuilt') {
      return value
    }

    if (field === 'status') {
      const statusMap: { [key: string]: string } = {
        'ACTIVE': 'в продаже',
        'RESERVED': 'задаток',
        'SOLD': 'продана',
        'RENTED': 'снята с продажи',
        'SUSPENDED': 'приостановленно'
      }
      return statusMap[value] || value
    }

    if (field === 'renovation') {
      const renovationMap: { [key: string]: string } = {
        'NONE': 'Без ремонта',
        'COSMETIC': 'Косметический',
        'EURO': 'Евро',
        'DESIGNER': 'Дизайнерский',
        'NEEDS_REPAIR': 'Требует ремонта'
      }
      return renovationMap[value] || value
    }

    if (field === 'loggia' || field === 'isArchived') {
      return value === 'true' ? 'Да' : 'Нет'
    }

    return String(value)
  }

  let content: React.ReactNode;

  if (loading) {
    content = <div className="text-center py-4">Загрузка...</div>;
  } else if (error) {
    content = <div className="text-center py-4 text-red-600">{error}</div>;
  } else {
    content = (
      <>
        {history.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            История изменений пуста
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActionIcon(entry.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getActionBadgeVariant(entry.action)} className="text-xs">
                        {getActionText(entry.action)}
                      </Badge>
                      {entry.field && (
                        <span className="text-sm font-medium text-gray-700">
                          {getFieldDisplayName(entry.field)}
                        </span>
                      )}
                    </div>
                    
                    {(entry.oldValue || entry.newValue) && (
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-2">
                          {entry.oldValue && (
                            <span className="text-red-600">
                              <span className="line-through">
                                {formatValue(entry.oldValue, entry.field)}
                              </span>
                            </span>
                          )}
                          {entry.oldValue && entry.newValue && (
                            <span className="text-gray-400">→</span>
                          )}
                          {entry.newValue && (
                            <span className="text-green-600 font-medium">
                              {formatValue(entry.newValue, entry.field)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md mb-2">
                        {entry.notes}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span>
                        {entry.user.name ? 
                          (entry.user.name === 'admin' ? 'Администратор' : 
                           entry.user.name === 'manager' ? 'Менеджер' : 
                           entry.user.name === 'agent' ? 'Агент' : 
                           entry.user.name) 
                        : 'Пользователь'}
                      </span>
                      <span>•</span>
                      <span>{new Date(entry.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>История изменений</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}