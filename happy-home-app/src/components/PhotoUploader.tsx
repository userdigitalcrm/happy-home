'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, Plus, Maximize2, Trash2 } from 'lucide-react'
import NextImage from 'next/image'

// Определение типов для фотографий
export interface PropertyPhoto {
  id: string
  url: string
  propertyId: string
  filename: string
  caption: string | null
  isPrimary: boolean
  createdAt: Date
}

// Compatible interface for uploaded photos
export interface UploadedPhoto {
  url: string
  name: string
  size: number
  type: string
}

interface PhotoUploaderProps {
  photos: PropertyPhoto[]
  onChange: (photos: PropertyPhoto[]) => void
  maxPhotos?: number
}

const photosEqual = (a: PropertyPhoto[], b: PropertyPhoto[]) => {
  if (a.length !== b.length) return false;
  return a.every((photo, index) => photo.url === b[index].url);
};

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ 
  photos = [], 
  onChange, 
  maxPhotos = 20 
}) => {
  const [internalPhotos, setInternalPhotos] = useState<PropertyPhoto[]>(photos);
  const [uploadingPhotos, setUploadingPhotos] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);
  const lastSentRef = useRef<PropertyPhoto[]>(photos)
  
  // Инициализация
  useEffect(() => {
    console.log('PhotoUploader initialized with photos:', photos);
    console.log(`Initial photo count: ${photos.length}`);
    setInitializing(false);
  }, []);
  
  useEffect(() => {
    setInternalPhotos(current => {
      if (photosEqual(current, photos)) {
        console.log('Photos equal, skipping update');
        return current;
      }
      lastSentRef.current = [...photos]; // Создаем новый массив для сохранения
      console.log(`Updating photos from props: ${photos.length}`);
      return [...photos]; // Создаем новый массив для обновления состояния
    });
  }, [photos]);
  
  useEffect(() => {
    if (!photosEqual(internalPhotos, lastSentRef.current)) {
      console.log('Photos changed, calling onChange');
      // Используем глубокое сравнение для избежания бесконечных циклов
      const deepEqual = JSON.stringify(internalPhotos.map(p => p.url)) === 
                        JSON.stringify(lastSentRef.current.map(p => p.url));
      
      if (!deepEqual) {
        console.log(`Updating parent component: ${internalPhotos.length} photos`);
        lastSentRef.current = [...internalPhotos];
        onChange([...internalPhotos]);
      } else {
        console.log('Photos deep equal, skipping onChange');
      }
    } else {
      console.log('Photos equal, skipping onChange');
    }
  }, [internalPhotos, onChange]);
  
  // Обработка очереди загрузок
  useEffect(() => {
    const processQueue = async () => {
      if (uploadQueue.length > 0 && !processingQueue) {
        setProcessingQueue(true);
        console.log(`Начинаем обработку очереди загрузок: ${uploadQueue.length} файлов`);
        
        // Копируем очередь
        const currentQueue = [...uploadQueue];
        setUploadQueue([]);
        
        try {
          await uploadFilesSequentially(currentQueue);
        } catch (error) {
          console.error('Ошибка при обработке очереди загрузок:', error);
        } finally {
          setProcessingQueue(false);
        }
      }
    };
    
    processQueue();
  }, [uploadQueue, processingQueue]);
  
  // Обработчики для drag-and-drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Обработчик загрузки файлов через input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
    // Очищаем input для возможности повторной загрузки тех же файлов
    e.target.value = ''
  }

  // Общая функция обработки файлов (для input и drag-and-drop)
  const handleFiles = (files: File[]) => {
    setError("");
    console.log(`Начинаем обработку ${files.length} файлов, текущее количество: ${internalPhotos.length}`);
    
    // Проверяем вместимость
    const remaining = maxPhotos - internalPhotos.length;
    let filesToProcess = files;
    
    if (remaining <= 0) {
      setError(`Достигнуто максимальное количество фотографий (${maxPhotos})`);
      return;
    }
    
    if (files.length > remaining) {
      setError(`Можно загрузить только ${remaining} из ${files.length} выбранных файлов. Достигнут лимит в ${maxPhotos} фото.`);
      filesToProcess = files.slice(0, remaining);
    }
    
    // Проверка типа файла и размера
    const validFiles = filesToProcess.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setError(prev => prev ? `${prev}. Файл ${file.name}: недопустимый формат` : `Файл ${file.name}: допустимы только форматы JPEG, PNG и WebP`);
        return false;
      }
      
      if (!isValidSize) {
        setError(prev => prev ? `${prev}. Файл ${file.name}: превышен размер` : `Файл ${file.name}: размер не должен превышать 5MB`);
        return false;
      }
      
      return true;
    });
    
    console.log(`Прошли валидацию ${validFiles.length} файлов из ${filesToProcess.length}`);
    
    if (validFiles.length > 0) {
      setUploadingPhotos(prev => [...prev, ...validFiles]);
      
      // Добавляем файлы в очередь загрузки
      setUploadQueue(prev => [...prev, ...validFiles]);
    }
  };
  
  // Функция для последовательной загрузки файлов
  const uploadFilesSequentially = async (files: File[]) => {
    console.log(`Начинаем последовательную загрузку ${files.length} файлов`);
    
    for (const file of files) {
      try {
        await uploadFile(file);
      } catch (error) {
        console.error(`Ошибка при загрузке файла ${file.name}:`, error);
        setError(prev => prev ? `${prev}. Ошибка загрузки ${file.name}` : `Ошибка загрузки ${file.name}`);
      }
    }
    
    console.log('Последовательная загрузка файлов завершена');
  };
  
  // Функция загрузки файла на сервер
  const uploadFile = async (file: File) => {
    console.log(`Начинаем загрузку файла: ${file.name}, размер: ${file.size} байт`);
    setLoading(true);
    
    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);
      
      // Создаем уникальный ID для отслеживания прогресса
      const fileId = `file_${Date.now()}_${file.name}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      console.log(`Отправка запроса на загрузку: ${file.name}`);
      
      // Используем fetch вместо XMLHttpRequest для более надежной обработки
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log(`Получен ответ для ${file.name}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`Successfully uploaded file ${file.name}, URL: ${data.url.substring(0, 50)}...`);
          
          // Добавляем загруженное фото в список
          const newPhoto: PropertyPhoto = { 
            id: `photo_${Date.now()}`, 
            url: data.url, 
            propertyId: '', 
            filename: file.name, 
            caption: null, 
            isPrimary: false, 
            createdAt: new Date() 
          };
          setInternalPhotos(prev => {
            const newPhotos = [...prev, newPhoto];
            console.log(`File ${file.name} added to list, total photos: ${newPhotos.length}`);
            return newPhotos;
          });
          
          // Удаляем из списка загружаемых
          setUploadingPhotos(prev => prev.filter(f => f !== file));
        } catch (parseError) {
          console.error(`Error processing response for ${file.name}:`, parseError);
          let errorText = 'Некорректный ответ сервера';
          try {
            const textResponse = await response.text();
            errorText = `Некорректный ответ сервера: ${textResponse.substring(0, 100)}`;
            console.error('Response text:', textResponse);
          } catch (e) {
            console.error('Failed to get response text');
          }
          setError(errorText);
        }
      } else {
        console.error(`HTTP error for ${file.name}:`, response.status, response.statusText);
        let errorText = `Ошибка загрузки (${response.status})`;
        
        try {
          const textResponse = await response.text();
          console.error('Error text:', textResponse);
          
          try {
            const jsonError = JSON.parse(textResponse);
            errorText = jsonError.error || errorText;
          } catch (e) {
            // Если не JSON, используем текст как есть
            errorText = `${errorText}: ${textResponse.substring(0, 100)}`;
          }
        } catch (e) {
          console.error('Failed to get error text');
        }
        
        setError(errorText);
      }
    } catch (error) {
      console.error(`Исключение при загрузке ${file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Ошибка при загрузке фотографии: ${errorMessage}`);
    } finally {
      console.log(`Завершена обработка файла: ${file.name}`);
      setLoading(false);
    }
    
    return new Promise<void>((resolve) => {
      // Даем небольшую паузу между загрузками для уменьшения нагрузки
      setTimeout(() => {
        resolve();
      }, 200);
    });
  };
  
  // Удаление фотографии
  const handleRemovePhoto = (index: number) => {
    setInternalPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      setSelectedPhotos([]);
      return newPhotos;
    });
  };
  
  // Удаление выбранных фотографий
  const handleRemoveSelected = () => {
    setInternalPhotos(prev => {
      const newPhotos = prev.filter((_, index) => !selectedPhotos.includes(index));
      setSelectedPhotos([]);
      return newPhotos;
    });
  };
  
  // Выбор/отмена выбора фотографии
  const togglePhotoSelection = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotos(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };
  
  // Отмена загрузки фотографии
  const handleCancelUpload = (index: number) => {
    const newUploadingPhotos = [...uploadingPhotos];
    newUploadingPhotos.splice(index, 1);
    setUploadingPhotos(newUploadingPhotos);
  };
  
  // Открыть галерею с выбранной фотографией
  const openGallery = (index: number) => {
    if (internalPhotos && internalPhotos.length > 0) {
      setSelectedPhotoIndex(index);
      setGalleryOpen(true);
    }
  };
  
  // Навигация по галерее
  const navigateGallery = (direction: 'next' | 'prev') => {
    if (!internalPhotos || internalPhotos.length === 0) return;
    
    if (direction === 'next') {
      setSelectedPhotoIndex((prev) => (prev + 1) % internalPhotos.length);
    } else {
      setSelectedPhotoIndex((prev) => (prev - 1 + internalPhotos.length) % internalPhotos.length);
    }
  };

  return (
    <div className="mb-0">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <div className="flex flex-col md:flex-row gap-2 mb-0">
        {/* Левая панель с кнопками */}
        <div className="w-full md:w-1/5 flex flex-col gap-1">
          <div 
            className={`border border-dashed p-3 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors h-40 ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`text-center text-sm ${isDragging ? 'text-blue-500' : 'text-gray-500'}`}>
              Перетащите файлы
            </p>
            <p className="text-xs text-center text-gray-400">
              или нажмите для выбора
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={loading || processingQueue}
            />
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            JPEG, PNG, WebP | макс. 5MB | {internalPhotos.length}/{maxPhotos} фото
          </div>
          
          {uploadQueue.length > 0 && (
            <div className="text-xs text-blue-500 text-center">
              В очереди на загрузку: {uploadQueue.length}
            </div>
          )}

          {processingQueue && (
            <div className="text-xs text-green-500 text-center">
              Загрузка файлов...
            </div>
          )}
          
          {selectedPhotos.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRemoveSelected}
              className="mt-1 flex items-center gap-1 text-xs py-1 h-auto"
            >
              <Trash2 className="w-3 h-3" />
              Удалить ({selectedPhotos.length})
            </Button>
          )}
        </div>
        
        {/* Правая панель с фотографиями */}
        <div className="w-full md:w-4/5">
          {/* Превью загруженных фотографий */}
          <div className="mb-2 text-xs text-gray-500">
            Загружено: {internalPhotos.length} фото
          </div>
          {internalPhotos && internalPhotos.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 h-full">
              {internalPhotos.map((photo, index) => (
                <div 
                  key={`photo-${photo.url}-${index}`} 
                  className={`relative group ${
                    selectedPhotos.includes(index) ? 'ring-1 ring-blue-500' : ''
                  }`}
                >
                  <div 
                    className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer flex items-center justify-center"
                    onClick={() => openGallery(index)}
                  >
                    <NextImage 
                      src={photo.url} 
                      alt={photo.filename || `Фото ${index + 1}`} 
                      fill 
                      className="object-contain hover:opacity-90"
                    />
                    <div 
                      className="absolute top-1 left-1 h-4 w-4 rounded border bg-white flex items-center justify-center cursor-pointer z-10"
                      onClick={(e) => togglePhotoSelection(index, e)}
                    >
                      {selectedPhotos.includes(index) && (
                        <div className="h-2 w-2 bg-blue-500 rounded-sm"></div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePhoto(index)
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 z-10"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Фотографии в процессе загрузки */}
              {uploadingPhotos.map((file, index) => (
                <div 
                  key={`uploading-${file.name}-${index}`} 
                  className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center"
                >
                  <div className="h-full w-full flex flex-col items-center justify-center p-1">
                    <Upload className="w-4 h-4 text-gray-400 mb-1" />
                    <div className="text-xs text-center text-gray-500 truncate w-full mb-1">
                      {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${uploadProgress[`file_${Date.now()}_${file.name}`] || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelUpload(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className={`flex items-center justify-center h-40 border border-dashed rounded-lg ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <p className="text-gray-500 text-sm">Нет загруженных фотографий</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Модальное окно галереи */}
      {galleryOpen && photos && photos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <div className="relative h-[70vh]">
              <NextImage 
                src={photos[selectedPhotoIndex].url} 
                alt={photos[selectedPhotoIndex].filename || `Фото ${selectedPhotoIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>
            
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => setGalleryOpen(false)}
                className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => navigateGallery('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
                >
                  {'<'}
                </button>
                <button
                  onClick={() => navigateGallery('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
                >
                  {'>'}
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
                {selectedPhotoIndex + 1} / {photos.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUploader