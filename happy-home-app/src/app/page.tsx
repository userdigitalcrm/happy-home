'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Перенаправление...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img 
              src="/logo.png" 
              alt="Счастливый Дом" 
              className="w-48 h-auto mx-auto mb-4"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Счастливый Дом
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Агентство недвижимости в Петропавловске
            <br />
            Система управления базой недвижимости
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              Добро пожаловать в систему учета и ведения базы данных недвижимости.
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 max-w-md mx-auto">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Табличный вид всех объектов
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Множественная фильтрация по каждому столбцу
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Ролевая модель доступа
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Автозаполнение адресов
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                История изменений
              </li>
            </ul>
          </div>
          
          <Button 
            className="w-full max-w-sm"
            onClick={() => router.push('/auth/signin')}
          >
            Войти в систему
          </Button>
          
          <div className="pt-4 border-t text-xs text-gray-500">
            <p>Для доступа к системе обратитесь к администратору</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
