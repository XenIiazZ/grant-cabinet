import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Users, Award, FileText, Edit, Trash2, Plus, Ban, CheckCircle, Shield, RefreshCw, Eye, Calendar, DollarSign, XCircle, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/api";

// Интерфейсы для данных
interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'expert';
  is_active: boolean;
  applications_count?: number;
}

interface Grant {
  id: number;
  title: string;
  description: string;
  max_amount: string;
  deadline: string;
  category: string;
  status: 'открыт' | 'скоро_закрывается' | 'закрыт';
  applicants_count: number;
  created_at?: string;
}

interface Application {
  id: number;
  user_id: number;
  grant_id: number;
  project_title: string;
  project_description?: string;
  status: 'черновик' | 'на_рассмотрении' | 'одобрено' | 'отклонено' | 'требует_доработки';
  created_at: string;
  budget_justification?: string;
  feedback?: string;
  user_email?: string;
  user_full_name?: string;
  grant_title?: string;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Состояния для данных
  const [users, setUsers] = useState<User[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Состояния для диалогов
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [isViewApplicationOpen, setIsViewApplicationOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [applicationToUpdate, setApplicationToUpdate] = useState<{id: number, newStatus: string} | null>(null);
  
  // Форма для гранта
  const [grantForm, setGrantForm] = useState({
    title: "",
    description: "",
    max_amount: "",
    deadline: "",
    category: "",
    status: "открыт" as const
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    loadAllData();
  }, []);

  // Загрузка всех данных
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadGrants(),
        loadApplications()
      ]);
      toast.success("Данные загружены");
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка пользователей
  const loadUsers = async () => {
    try {
      console.log("Загрузка пользователей...");
      const response = await apiService.admin.getUsers();
      console.log("Пользователи загружены:", response.data);
      
      // Получаем все заявки для подсчета
      let applicationsData: Application[] = [];
      try {
        const appsResponse = await apiService.admin.getApplications();
        applicationsData = appsResponse.data || [];
      } catch (error) {
        console.error("Не удалось загрузить заявки для статистики");
      }
      
      // Добавляем количество заявок к каждому пользователю
      const usersWithCounts = response.data.map((user: any) => ({
        ...user,
        applications_count: applicationsData.filter((app: any) => app.user_id === user.id).length
      }));
      
      setUsers(usersWithCounts);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      throw error;
    }
  };

  // Загрузка грантов
  const loadGrants = async () => {
    try {
      console.log("Загрузка грантов...");
      const response = await apiService.grants.getAll();
      console.log("Гранты загружены:", response.data);
      setGrants(response.data || []);
    } catch (error) {
      console.error("Ошибка загрузки грантов:", error);
      throw error;
    }
  };

  // Загрузка заявок
  const loadApplications = async () => {
    try {
      console.log("Загрузка заявок...");
      const response = await apiService.admin.getApplications();
      console.log("Заявки загружены:", response.data);
      
      // Обогащаем заявки данными о пользователях и грантах
      const enrichedApps = await Promise.all((response.data || []).map(async (app: any) => {
        try {
          // Получаем данные пользователя
          const userResponse = await apiService.admin.getUsers();
          const user = userResponse.data.find((u: any) => u.id === app.user_id);
          
          // Получаем данные гранта
          const grantResponse = await apiService.grants.getById(app.grant_id);
          const grant = grantResponse.data;
          
          return {
            ...app,
            user_email: user?.email || `ID: ${app.user_id}`,
            user_full_name: user?.full_name || 'Неизвестно',
            grant_title: grant?.title || 'Неизвестный грант'
          };
        } catch (error) {
          return {
            ...app,
            user_email: `ID: ${app.user_id}`,
            user_full_name: 'Неизвестно',
            grant_title: 'Неизвестный грант'
          };
        }
      }));
      
      setApplications(enrichedApps);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
      throw error;
    }
  };

  // Обновление данных
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  // Управление пользователями
  const handleUserStatusChange = async (userId: number, currentStatus: boolean) => {
    try {
      await apiService.admin.toggleUserStatus(userId, !currentStatus);
      toast.success(`Пользователь ${!currentStatus ? 'разблокирован' : 'заблокирован'}`);
      await loadUsers();
    } catch (error) {
      toast.error("Ошибка при изменении статуса");
    }
  };

  const handleUserRoleChange = async (userId: number, newRole: 'user' | 'admin') => {
    try {
      await apiService.admin.changeUserRole(userId, newRole);
      toast.success('Роль пользователя обновлена');
      await loadUsers();
    } catch (error) {
      toast.error("Ошибка при изменении роли");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await apiService.admin.deleteUser(userId);
      toast.success('Пользователь удален');
      await loadUsers();
    } catch (error) {
      toast.error("Ошибка при удалении пользователя");
    }
  };

  // Управление грантами
  const handleCreateOrUpdateGrant = async () => {
    try {
      if (editingGrant) {
        await apiService.grants.update(editingGrant.id, grantForm);
        toast.success('Грант обновлен');
      } else {
        await apiService.grants.create(grantForm);
        toast.success('Грант создан');
      }
      setIsGrantDialogOpen(false);
      setEditingGrant(null);
      resetGrantForm();
      await loadGrants();
    } catch (error) {
      toast.error(editingGrant ? 'Ошибка при обновлении' : 'Ошибка при создании');
    }
  };

  const handleEditGrant = (grant: Grant) => {
    setEditingGrant(grant);
    setGrantForm({
      title: grant.title,
      description: grant.description,
      max_amount: grant.max_amount,
      deadline: grant.deadline.split('T')[0] || grant.deadline,
      category: grant.category,
      status: grant.status
    });
    setIsGrantDialogOpen(true);
  };

  const handleDeleteGrant = async (grantId: number) => {
    try {
      await apiService.grants.delete(grantId);
      toast.success('Грант удален');
      await loadGrants();
    } catch (error) {
      toast.error("Ошибка при удалении гранта");
    }
  };

  // Управление заявками - обновление статуса с обратной связью
  const handleApplicationStatusChange = async (applicationId: number, newStatus: string) => {
    // Если статус "отклонено" или "требует_доработки", запрашиваем обратную связь
    if (newStatus === 'отклонено' || newStatus === 'требует_доработки') {
      setApplicationToUpdate({id: applicationId, newStatus});
      setFeedbackText("");
      setIsFeedbackDialogOpen(true);
    } else {
      // Для других статусов просто обновляем
      await updateApplicationStatus(applicationId, newStatus, "");
    }
  };

  // Отправка статуса с обратной связью
  const submitStatusWithFeedback = async () => {
    if (!applicationToUpdate) return;
    
    try {
      await updateApplicationStatus(
        applicationToUpdate.id, 
        applicationToUpdate.newStatus, 
        feedbackText
      );
      setIsFeedbackDialogOpen(false);
      setApplicationToUpdate(null);
      setFeedbackText("");
    } catch (error) {
      toast.error("Ошибка при обновлении статуса");
    }
  };

  // Обновление статуса заявки
  const updateApplicationStatus = async (applicationId: number, newStatus: string, feedback: string) => {
    try {
      // Если есть обратная связь, обновляем и статус и фидбек
      if (feedback) {
        // Здесь должен быть эндпоинт для обновления с фидбеком
        // Пока используем обычный
        await apiService.applications.updateStatus(applicationId, newStatus);
        
        // Дополнительно обновляем фидбек если есть эндпоинт
        if (apiService.applications.updateFeedback) {
          await apiService.applications.updateFeedback(applicationId, feedback);
        } else {
          console.log("Нужен эндпоинт для обновления feedback");
        }
      } else {
        await apiService.applications.updateStatus(applicationId, newStatus);
      }
      
      toast.success(`Статус заявки обновлен на ${getStatusText(newStatus)}`);
      await loadApplications();
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
      throw error;
    }
  };

  // Просмотр деталей заявки
  const viewApplicationDetails = (app: Application) => {
    setSelectedApplication(app);
    setIsViewApplicationOpen(true);
  };

  const resetGrantForm = () => {
    setGrantForm({
      title: "",
      description: "",
      max_amount: "",
      deadline: "",
      category: "",
      status: "открыт"
    });
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return 'Не указана';
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'черновик': 'bg-gray-100 text-gray-800',
      'на_рассмотрении': 'bg-yellow-100 text-yellow-800',
      'одобрено': 'bg-green-100 text-green-800',
      'отклонено': 'bg-red-100 text-red-800',
      'требует_доработки': 'bg-orange-100 text-orange-800',
      'открыт': 'bg-green-100 text-green-800',
      'скоро_закрывается': 'bg-yellow-100 text-yellow-800',
      'закрыт': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'черновик': 'Черновик',
      'на_рассмотрении': 'На проверке',
      'одобрено': 'Одобрено',
      'отклонено': 'Отклонено',
      'требует_доработки': 'Требует доработки',
      'открыт': 'Открыт',
      'скоро_закрывается': 'Скоро закрывается',
      'закрыт': 'Закрыт',
    };
    return texts[status] || status;
  };

  // Получение иконки статуса
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'одобрено': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'отклонено': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'на_рассмотрении': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'требует_доработки': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  // Статистика
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalGrants: grants.length,
    openGrants: grants.filter(g => g.status === 'открыт').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'на_рассмотрении').length,
    approvedApplications: applications.filter(a => a.status === 'одобрено').length,
    rejectedApplications: applications.filter(a => a.status === 'отклонено').length,
  };

  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Панель администратора</h1>
            </div>
            <p className="text-muted-foreground">
              Управление пользователями, грантами и заявками
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Обновление...' : 'Обновить данные'}
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} активных
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего грантов</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGrants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openGrants} открытых
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заявок</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingApplications} на проверке
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Одобрено / Отклонено</CardTitle>
              <div className="flex gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-green-600">{stats.approvedApplications}</span>
                <span className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                одобрено / отклонено
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Навигация по вкладкам (видимые кнопки) */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <p className="font-semibold mb-3 text-blue-800">📋 Выберите раздел:</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setActiveTab("users")}
              variant={activeTab === "users" ? "default" : "outline"}
              size="lg"
              className="flex-1 min-w-[120px]"
            >
              👥 Пользователи ({users.length})
            </Button>
            <Button
              onClick={() => setActiveTab("grants")}
              variant={activeTab === "grants" ? "default" : "outline"}
              size="lg"
              className="flex-1 min-w-[120px]"
            >
              🏆 Гранты ({grants.length})
            </Button>
            <Button
              onClick={() => setActiveTab("applications")}
              variant={activeTab === "applications" ? "default" : "outline"}
              size="lg"
              className="flex-1 min-w-[120px] bg-yellow-100 hover:bg-yellow-200"
            >
              📝 Заявки ({applications.length})
            </Button>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Текущий раздел: <span className="font-bold">
              {activeTab === "users" ? "Пользователи" : 
               activeTab === "grants" ? "Гранты" : "Заявки"}
            </span>
          </p>
        </div>

        {/* Контент вкладок */}
        <div className="mt-6">
          {/* Вкладка пользователей */}
          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>
                  Просмотр и управление пользователями системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Имя</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Заявок</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">#{user.id}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleUserRoleChange(user.id, value as 'user' | 'admin')}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Пользователь</SelectItem>
                                <SelectItem value="admin">Админ</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.is_active ? 'Активен' : 'Заблокирован'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.applications_count || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserStatusChange(user.id, user.is_active)}
                              >
                                {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Это действие нельзя отменить. Пользователь {user.full_name} будет 
                                      удален из системы вместе со всеми заявками.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Вкладка грантов */}
          {activeTab === "grants" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Управление грантами</CardTitle>
                    <CardDescription>
                      Создание, редактирование и удаление грантов
                    </CardDescription>
                  </div>
                  <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingGrant(null); resetGrantForm(); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать грант
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingGrant ? 'Редактировать грант' : 'Создать новый грант'}
                        </DialogTitle>
                        <DialogDescription>
                          Заполните информацию о гранте
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Название гранта</Label>
                          <Input
                            id="title"
                            value={grantForm.title}
                            onChange={(e) => setGrantForm({ ...grantForm, title: e.target.value })}
                            placeholder="Например: Поддержка социальных проектов"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Описание</Label>
                          <Textarea
                            id="description"
                            value={grantForm.description}
                            onChange={(e) => setGrantForm({ ...grantForm, description: e.target.value })}
                            placeholder="Подробное описание гранта..."
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Максимальная сумма</Label>
                            <Input
                              id="amount"
                              value={grantForm.max_amount}
                              onChange={(e) => setGrantForm({ ...grantForm, max_amount: e.target.value })}
                              placeholder="Например: 2 000 000 ₽"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deadline">Дедлайн</Label>
                            <Input
                              id="deadline"
                              type="date"
                              value={grantForm.deadline}
                              onChange={(e) => setGrantForm({ ...grantForm, deadline: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="category">Категория</Label>
                            <Input
                              id="category"
                              value={grantForm.category}
                              onChange={(e) => setGrantForm({ ...grantForm, category: e.target.value })}
                              placeholder="Например: Социальная сфера"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="status">Статус</Label>
                            <Select
                              value={grantForm.status}
                              onValueChange={(value) => setGrantForm({ ...grantForm, status: value as Grant['status'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="открыт">Открыт</SelectItem>
                                <SelectItem value="скоро_закрывается">Скоро закрывается</SelectItem>
                                <SelectItem value="закрыт">Закрыт</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button onClick={handleCreateOrUpdateGrant}>
                          {editingGrant ? 'Сохранить' : 'Создать'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Дедлайн</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Заявок</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grants.map((grant) => (
                        <TableRow key={grant.id}>
                          <TableCell className="font-mono">#{grant.id}</TableCell>
                          <TableCell className="font-medium">{grant.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{grant.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {grant.max_amount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(grant.deadline)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(grant.status)}>
                              {getStatusText(grant.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{grant.applicants_count || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditGrant(grant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить грант?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Это действие нельзя отменить. Грант "{grant.title}" будет 
                                      удален вместе со всеми связанными заявками.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteGrant(grant.id)}>
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Вкладка заявок */}
          {activeTab === "applications" && (
            <Card>
              <CardHeader>
                <CardTitle>Управление заявками</CardTitle>
                <CardDescription>
                  Просмотр и изменение статуса всех заявок
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Проект</TableHead>
                        <TableHead>Грант</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-mono">#{app.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{app.user_full_name || 'Неизвестно'}</div>
                              <div className="text-sm text-muted-foreground">{app.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="font-medium">{app.project_title}</div>
                            {app.project_description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {app.project_description.substring(0, 50)}...
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{app.grant_title}</TableCell>
                          <TableCell>{formatDate(app.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(app.status)}
                              <Select
                                value={app.status}
                                onValueChange={(value) => handleApplicationStatusChange(app.id, value)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(app.status)}
                                      <span>{getStatusText(app.status)}</span>
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="на_рассмотрении">На проверке</SelectItem>
                                  <SelectItem value="одобрено">Одобрено</SelectItem>
                                  <SelectItem value="отклонено">Отклонено</SelectItem>
                                  <SelectItem value="требует_доработки">Требует доработки</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            {app.feedback ? (
                              <div className="relative group">
                                <MessageSquare className="h-4 w-4 text-blue-500 cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48">
                                  {app.feedback}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewApplicationDetails(app)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Детали
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Диалог просмотра заявки */}
      <Dialog open={isViewApplicationOpen} onOpenChange={setIsViewApplicationOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали заявки #{selectedApplication?.id}</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Информация о пользователе</h3>
                  <p><span className="text-muted-foreground">Email:</span> {selectedApplication.user_email}</p>
                  <p><span className="text-muted-foreground">Имя:</span> {selectedApplication.user_full_name}</p>
                  <p><span className="text-muted-foreground">ID:</span> {selectedApplication.user_id}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Информация о заявке</h3>
                  <p><span className="text-muted-foreground">Статус:</span> 
                    <Badge className={`ml-2 ${getStatusColor(selectedApplication.status)}`}>
                      {getStatusText(selectedApplication.status)}
                    </Badge>
                  </p>
                  <p><span className="text-muted-foreground">Грант:</span> {selectedApplication.grant_title}</p>
                  <p><span className="text-muted-foreground">Дата подачи:</span> {formatDate(selectedApplication.created_at)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Название проекта</h3>
                <p className="text-muted-foreground">{selectedApplication.project_title}</p>
              </div>

              {selectedApplication.project_description && (
                <div>
                  <h3 className="font-semibold mb-2">Описание проекта</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedApplication.project_description}
                  </p>
                </div>
              )}

              {selectedApplication.budget_justification && (
                <div>
                  <h3 className="font-semibold mb-2">Бюджетное обоснование</h3>
                  <p className="text-muted-foreground">{selectedApplication.budget_justification}</p>
                </div>
              )}

              {selectedApplication.feedback && (
                <div>
                  <h3 className="font-semibold mb-2">Обратная связь от администратора</h3>
                  <p className="text-muted-foreground bg-yellow-50 p-3 rounded-md">
                    {selectedApplication.feedback}
                  </p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewApplicationOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог для обратной связи */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {applicationToUpdate?.newStatus === 'отклонено' ? 'Отклонение заявки' : 'Запрос на доработку'}
            </DialogTitle>
            <DialogDescription>
              {applicationToUpdate?.newStatus === 'отклонено' 
                ? 'Укажите причину отклонения заявки' 
                : 'Опишите, что нужно доработать в заявке'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Комментарий для пользователя</Label>
              <Textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Напишите подробный комментарий..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitStatusWithFeedback}>
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}