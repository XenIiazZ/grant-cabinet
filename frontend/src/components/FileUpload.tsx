import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Upload, File, Download, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

interface FileInfo {
  id: number;
  filename: string;
  original_filename?: string;
  file_size: number;
  created_at: string;
}

interface FileUploadProps {
  applicationId: number;
  onUploadComplete?: () => void;
}

export function FileUpload({ applicationId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Загружаем список файлов
  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.files.getApplicationFiles(applicationId);
      setFiles(response.data);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadFiles();
    }
  }, [applicationId]);

  // Загрузка файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 10 MB');
      return;
    }

    // Проверка типа
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Недопустимый тип файла. Разрешены: PDF, JPEG, PNG, DOC, DOCX');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Имитация прогресса
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.files.uploadFile(applicationId, file);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      toast.success('Файл успешно загружен');
      await loadFiles();
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      toast.error(error.response?.data?.detail || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (event.target) event.target.value = '';
    }
  };

  // Скачивание файла
  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await apiService.files.getFile(fileId);
      const { download_url } = response.data;
      
      window.open(download_url, '_blank');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      toast.error('Не удалось скачать файл');
    }
  };

  // Удаление файла
  const handleDelete = async (fileId: number) => {
    if (!confirm('Удалить этот файл?')) return;
    
    try {
      await apiService.files.deleteFile(fileId);
      toast.success('Файл удален');
      await loadFiles();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Не удалось удалить файл');
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500 mt-2">Загрузка файлов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Кнопка загрузки */}
      <div>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          id={`file-upload-${applicationId}`}
          disabled={uploading}
        />
        <label htmlFor={`file-upload-${applicationId}`}>
          <Button
            asChild
            disabled={uploading}
            variant="outline"
            className="w-full cursor-pointer"
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Загрузка...' : 'Загрузить файл'}
            </span>
          </Button>
        </label>
        
        {uploading && (
          <div className="mt-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1 text-center">{uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Список файлов */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Прикрепленные файлы:</h4>
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.original_filename || file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file.id, file.original_filename || file.filename)}
                  title="Скачать"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}