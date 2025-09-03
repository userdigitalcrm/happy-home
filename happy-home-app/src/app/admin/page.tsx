'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  _count: {
    createdProperties: number
    assignedProperties: number
  }
}

interface UserFormData {
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
  password: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'AGENT',
    password: ''
  })
  const [activeTab, setActiveTab] = useState<'users' | 'buildings'>('users')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
      } else {
        loadUsers()
      }
    }
  }, [status, session, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        throw new Error('Failed to load users')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setError('Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form data
    if (!formData.email || !formData.name || !formData.role) {
      setError('Все поля обязательны для заполнения')
      return
    }

    // When creating a new user, password is required
    if (!editingUser && !formData.password) {
      setError('Пароль обязателен для нового пользователя')
      return
    }

    try {
      const url = editingUser ? '/api/users' : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      // Prepare request data
      let requestData: any = { ...formData }
      
      // If editing user and password is empty, remove it from request data
      if (editingUser && !formData.password) {
        delete requestData.password
      }
      
      // If editing user, include the user ID
      if (editingUser) {
        requestData.id = editingUser.id
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

      setShowUserForm(false)
      setEditingUser(null)
      setFormData({ email: '', name: '', role: 'AGENT', password: '' })
      loadUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '' // Не отображаем пароль при редактировании
    })
    setShowUserForm(true)
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка изменения статуса')
      }

      loadUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'MANAGER': return 'default'
      case 'AGENT': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор'
      case 'MANAGER': return 'Менеджер'
      case 'AGENT': return 'Агент'
      default: return role
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
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
                Панель администратора
              </h1>
              <p className="text-sm text-gray-600">
                Управление пользователями и настройками системы
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                К объектам
              </Button>
              <Button onClick={() => setShowUserForm(true)}>
                + Добавить пользователя
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-4 border-b">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'users' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'buildings' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => router.push('/admin/buildings')}
          >
            Справочник зданий
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Активные</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Администраторы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Агенты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'AGENT').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Пользователи системы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Имя</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Роль</th>
                    <th className="text-left p-3">Статус</th>
                    <th className="text-left p-3">Создано объектов</th>
                    <th className="text-left p-3">Назначено объектов</th>
                    <th className="text-left p-3">Последний вход</th>
                    <th className="text-left p-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.isActive ? "default" : "outline"}>
                          {user.isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                      </td>
                      <td className="p-3">{user._count.createdProperties}</td>
                      <td className="p-3">{user._count.assignedProperties}</td>
                      <td className="p-3">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU')
                          : 'Никогда'
                        }
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            Редактировать
                          </Button>
                          {user.id !== session.user.id && (
                            <Button
                              size="sm"
                              variant={user.isActive ? "destructive" : "default"}
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.isActive ? "Заблокировать" : "Активировать"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-gray-500">
                        Пользователи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingUser ? 'Редактирование пользователя' : 'Добавление пользователя'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!!editingUser}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <select
                    id="role"
                    className="w-full p-2 border rounded-md"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      role: e.target.value as 'ADMIN' | 'MANAGER' | 'AGENT' 
                    }))}
                  >
                    <option value="AGENT">Агент</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>

                {/* Password field - show for both new and existing users */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    {...(!editingUser && { required: true })}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUserForm(false)
                      setEditingUser(null)
                      setFormData({ email: '', name: '', role: 'AGENT', password: '' })
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Сохранить' : 'Создать'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}