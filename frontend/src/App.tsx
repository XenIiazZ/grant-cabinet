import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { GrantCatalog } from "./components/grant-catalog";
import { SimpleApplicationForm } from "./components/simple-application-form";
import { UserDashboard } from "./components/user-dashboard";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import { Toaster } from "./components/ui/sonner";
import { ApplicationDetails } from "./components/application-details";
import { toast } from "sonner";
import { apiService, type Grant, type Application, type User, type MLEvaluation } from "./services/api";
import { AdminPanel } from "./components/admin-panel";
import { SEO } from "./components/SEO";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Типы
interface FrontendGrant {
  id: string;
  title: string;
  organization: string;
  description: string;
  amount: string;
  deadline: string;
  category: string;
  status: 'открыт' | 'скоро_закрывается' | 'закрыт';
  applicants: number;
}

interface FrontendApplication {
  id: string;
  projectTitle: string;
  grantTitle: string;
  submissionDate: string;
  status: 'черновик' | 'на_проверке' | 'одобрена' | 'отклонена';
  requestedAmount: string;
  feedback?: string;
  applicationText?: string;
  aiCheckResults?: any;
  ml_evaluation?: MLEvaluation;
}

// Компонент-обёртка для доступа к хукам
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Состояния (все, что были в вашем App)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState<User | null>(null);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [selectedGrantTitle, setSelectedGrantTitle] = useState<string>("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [currentApplication, setCurrentApplication] = useState<FrontendApplication | null>(null);
  const [grants, setGrants] = useState<FrontendGrant[]>([]);
  const [applications, setApplications] = useState<FrontendApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'expert'>('user');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ========== ВСЕ ВАШИ ФУНКЦИИ (скопированы из вашего исходного App.tsx) ==========
  const loadAllUsers = async () => {
    try {
      const response = await apiService.admin.getUsers();
      const usersWithApps = await Promise.all(response.data.map(async (user: any) => {
        try {
          const apps = await apiService.applications.getMyApplications();
          return { ...user, applicationsCount: 0 };
        } catch {
          return { ...user, applicationsCount: 0 };
        }
      }));
      setUsers(usersWithApps);
      console.log('Загруженные пользователи:', response.data);
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    }
  };

  const loadAllApplications = async () => {
    try {
      setLoading(true);
      console.log('Загрузка всех заявок для админ-панели...');
      const response = await apiService.admin.getApplications();
      console.log('Ответ от API (заявки):', response.data);
      const formattedApps = response.data.map((app: any) => ({
        id: app.id.toString(),
        user_id: app.user_id,
        user_email: app.user_email || `ID: ${app.user_id}`,
        project_title: app.project_title || app.project_description?.slice(0, 50) + '...' || 'Заявка',
        grant_title: app.grant_title || 'Неизвестный грант',
        created_at: app.created_at,
        status: app.status,
        budget_justification: app.budget_justification
      }));
      console.log('Преобразованные заявки:', formattedApps);
      setApplications(formattedApps);
    } catch (error) {
      console.error('Ошибка загрузки всех заявок:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.applications.getMyApplications();
      const backendApplications = response.data;
      const formattedApplications: FrontendApplication[] = backendApplications.map(app => ({
        id: `APP${app.id.toString().padStart(3, '0')}`,
        projectTitle: app.project_title,
        grantTitle: app.grant_title || 'Неизвестный грант',
        submissionDate: new Date(app.created_at).toLocaleDateString('ru-RU'),
        status: mapBackendStatus(app.status),
        requestedAmount: app.budget_justification || 'Не указано',
        feedback: app.feedback,
        applicationText: app.project_description,
        aiCheckResults: transformMlEvaluation(app.ml_evaluation),
        ml_evaluation: app.ml_evaluation
      }));
      console.log('Загруженные заявки:', formattedApplications);
      setApplications(formattedApplications);
    } catch (error: any) {
      console.error('Ошибка загрузки заявок:', error);
      const demoApplication: FrontendApplication = {
        id: "APP001",
        projectTitle: "Демо заявка",
        grantTitle: "Поддержка социальных проектов",
        submissionDate: new Date().toLocaleDateString('ru-RU'),
        status: 'на_проверке',
        requestedAmount: "500 000 ₽",
        feedback: "Демо заявка для тестирования",
        applicationText: "Текст демо заявки",
        ml_evaluation: {
          overall_score: 0.75,
          overall_label: "Рекомендовано",
          summary: "Хорошая заявка",
          recommendation: "Рекомендуется к рассмотрению",
          criteria_evaluations: [],
          priority_recommendations: ["Добавить больше деталей"],
          word_count: 150
        }
      };
      setApplications([demoApplication]);
      toast.warning('Используются демонстрационные данные');
    } finally {
      setLoading(false);
    }
  };

  const mapBackendStatus = (backendStatus: string): FrontendApplication['status'] => {
    switch (backendStatus) {
      case 'на_рассмотрении': return 'на_проверке';
      case 'одобрено': return 'одобрена';
      case 'отклонено': return 'отклонена';
      case 'требует_доработки': return 'на_проверке';
      default: return 'черновик';
    }
  };

  const transformMlEvaluation = (mlData?: MLEvaluation) => {
    if (!mlData) return undefined;
    return {
      relevance: {
        passed: mlData.overall_score >= 0.7,
        comment: `Общая оценка: ${Math.round(mlData.overall_score * 100)}%`
      },
      clarity: {
        passed: mlData.criteria_evaluations?.some(c => 
          c.criterion_name.includes('Описание') && c.label === 'Соответствует'
        ) || false,
        comment: mlData.criteria_evaluations?.find(c => 
          c.criterion_name.includes('Описание')
        )?.explanation || 'Ясность изложения проверена'
      },
      budget: {
        passed: mlData.criteria_evaluations?.some(c => 
          c.criterion_name.includes('Бюджет') && c.label === 'Соответствует'
        ) || false,
        comment: mlData.criteria_evaluations?.find(c => 
          c.criterion_name.includes('Бюджет')
        )?.explanation || 'Бюджетная часть проверена'
      },
      feasibility: {
        passed: mlData.criteria_evaluations?.some(c => 
          c.criterion_name.includes('Сроки') && c.label === 'Соответствует'
        ) || false,
        comment: mlData.criteria_evaluations?.find(c => 
          c.criterion_name.includes('Сроки')
        )?.explanation || 'Реалистичность плана оценена'
      },
      impact: {
        passed: mlData.criteria_evaluations?.some(c => 
          c.criterion_name.includes('Социальная') && c.label === 'Соответствует'
        ) || false,
        comment: mlData.criteria_evaluations?.find(c => 
          c.criterion_name.includes('Социальная')
        )?.explanation || 'Социальная значимость проверена'
      }
    };
  };

  const loadApplicationDetails = async (applicationId: string) => {
    try {
      const numericId = parseInt(applicationId.replace('APP', ''));
      const response = await apiService.applications.getApplicationById(numericId);
      const app = response.data;
      const fullApplication: FrontendApplication = {
        id: `APP${app.id.toString().padStart(3, '0')}`,
        projectTitle: app.project_title,
        grantTitle: app.grant_title || selectedGrantTitle || 'Неизвестный грант',
        submissionDate: new Date(app.created_at).toLocaleDateString('ru-RU'),
        status: mapBackendStatus(app.status),
        requestedAmount: app.budget_justification || 'Не указано',
        feedback: app.feedback,
        applicationText: app.project_description,
        aiCheckResults: transformMlEvaluation(app.ml_evaluation),
        ml_evaluation: app.ml_evaluation
      };
      setCurrentApplication(fullApplication);
    } catch (error) {
      console.error('Ошибка загрузки деталей заявки:', error);
      toast.error('Не удалось загрузить детали заявки');
    }
  };

  const loadGrants = async () => {
    try {
      setLoading(true);
      const response = await apiService.grants.getAll();
      const backendData = Array.isArray(response.data) ? response.data : [];
      const formattedGrants: FrontendGrant[] = backendData.map((grant: any) => ({
        id: grant.id.toString(),
        title: grant.title,
        organization: 'Грантовый кабинет',
        description: grant.description,
        amount: grant.max_amount || 'Не указано',
        deadline: grant.deadline ? new Date(grant.deadline).toLocaleDateString('ru-RU') : 'Не указан',
        category: grant.category || 'Общая категория',
        status: grant.status as any,
        applicants: grant.applicants_count || 0
      }));
      setGrants(formattedGrants.length > 0 ? formattedGrants : []);
    } catch (error) {
      console.error('Ошибка загрузки грантов:', error);
      setGrants([]);
    } finally {
      setLoading(false);
    }
  };

  const extractBudgetFromText = (text: string): string => {
    if (!text) return 'Не указан';
    const budgetRegex = /(?:бюджет|сумма|финанс|расход|стоимост)[^\d]*(\d+[\s]*(?:[₽руб]|тыс|млн|миллион|тысяч))/i;
    const match = text.match(budgetRegex);
    if (match) return match[1];
    const amountRegex = /(\d+[\s]*(?:[₽руб]|тыс|млн))/i;
    const amountMatch = text.match(amountRegex);
    return amountMatch ? amountMatch[1] : 'Не указан';
  };

  const extractTimelineFromText = (text: string): string => {
    if (!text) return 'Не указаны';
    const timelineRegex = /(?:срок|период|время|длительност|реализаци)[^\d]*(\d+[\s]*(?:месяц|год|недел|дн|квартал|день|дней|месяцев|лет))/i;
    const match = text.match(timelineRegex);
    return match ? match[1] : 'Не указаны';
  };

  // ========== Обработчики ==========
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.auth.login(email, password);
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      const userResponse = await apiService.auth.getMe();
      const user = userResponse.data;
      localStorage.setItem('user', JSON.stringify(user));
      setUserData(user);
      setUserName(user.full_name);
      setUserRole(user.role as any);
      setIsLoggedIn(true);
      if (user.role === 'admin') {
        navigate('/admin');
        toast.success('Вы вошли как администратор');
      } else {
        navigate('/');
        toast.success(`Добро пожаловать, ${user.full_name}!`);
      }
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      toast.error(error.response?.data?.detail || 'Ошибка авторизации');
    }
  };

  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      await apiService.auth.register(email, password, fullName);
      toast.success('Регистрация выполнена успешно! Теперь войдите.');
      navigate('/login');
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      toast.error(error.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await apiService.auth.logout(refreshToken).catch(() => {});
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.clear();
      setIsLoggedIn(false);
      setUserName("");
      setUserData(null);
      setUserRole('user');
      setApplications([]);
      setUsers([]);
      navigate('/');
      toast.success('Выход выполнен');
    }
  };

  const handleApplyToGrant = (grantId: string, grantTitle: string) => {
    if (!isLoggedIn) {
      toast.warning('Для подачи заявки необходимо войти');
      navigate('/login');
      return;
    }
    setSelectedGrantId(grantId);
    setSelectedGrantTitle(grantTitle);
    navigate(`/apply/${grantId}`);
  };

  const handleSubmitApplication = async (applicationText: string) => {
    if (!selectedGrantId) {
      toast.error('Не выбран грант');
      return;
    }
    try {
      const mlResponse = await apiService.ml.evaluate(applicationText, selectedGrantTitle);
      const mlEvaluation = mlResponse.data;
      const applicationData = {
        grant_id: parseInt(selectedGrantId),
        project_title: `Заявка на "${selectedGrantTitle}"`,
        project_description: applicationText,
        budget_justification: extractBudgetFromText(applicationText),
        timeline: extractTimelineFromText(applicationText),
        ml_evaluation: mlEvaluation,
        status: "на_рассмотрении"
      };
      await apiService.applications.createApplication(applicationData);
      await loadUserApplications();
      toast.success('Заявка успешно отправлена!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Ошибка создания заявки:', error);
      toast.error(error.response?.data?.detail || 'Ошибка создания заявки');
    }
  };

  const handleViewApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    navigate(`/application/${applicationId}`);
  };

  // Эффекты (аналогично вашим, но с проверкой пути)
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (accessToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setUserName(user.full_name || user.email);
        setUserData(user);
        setUserRole(user.role || 'user');
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        handleLogout();
      }
    }
    loadGrants();
  }, []);

  useEffect(() => {
    if (location.pathname === '/dashboard' && isLoggedIn) {
      loadUserApplications();
    }
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    if (selectedApplicationId && location.pathname.startsWith('/application/')) {
      loadApplicationDetails(selectedApplicationId);
    }
  }, [selectedApplicationId, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/admin' && isLoggedIn && userRole === 'admin') {
      loadAllUsers();
      loadAllApplications();
    }
  }, [location.pathname, isLoggedIn, userRole]);

  // Страницы
  const CatalogPage = () => (
    <>
      <SEO title="Каталог грантов" description="Найдите грант для вашего проекта..." url="/" />
      <div className="container mx-auto px-4 py-8">
        <GrantCatalog
          grants={grants}
          onApplyToGrant={handleApplyToGrant}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          minAmount={minAmount}
          onMinAmountChange={setMinAmount}
          maxAmount={maxAmount}
          onMaxAmountChange={setMaxAmount}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>
    </>
  );

  const ApplicationPage = () => (
    <SimpleApplicationForm
      grantTitle={selectedGrantTitle}
      onBack={() => navigate('/')}
      onSubmit={handleSubmitApplication}
    />
  );

  const DashboardPage = () => (
    <UserDashboard
      applications={applications}
      onViewApplication={handleViewApplication}
      onCreateNewApplication={() => navigate('/')}
      userName={userName}
    />
  );

  const ApplicationViewPage = () => {
    if (!currentApplication) return <div className="text-center py-12">Загрузка...</div>;
    return <ApplicationDetails application={currentApplication} onBack={() => navigate('/dashboard')} />;
  };

  const AdminPage = () => (
    <AdminPanel
      users={users}
      grants={grants}
      applications={applications}
      onUpdateUser={async (id, updates) => {
        try {
          if (updates.status) {
            const isActive = updates.status === 'active';
            await apiService.admin.toggleUserStatus(Number(id), isActive);
            toast.success('Статус пользователя обновлен');
            loadAllUsers();
          }
          if (updates.role) {
            await apiService.admin.changeUserRole(Number(id), updates.role as 'user' | 'admin');
            toast.success('Роль пользователя обновлена');
            loadAllUsers();
          }
        } catch (error) {
          toast.error('Ошибка при обновлении пользователя');
        }
      }}
      onDeleteUser={async (id) => {
        try {
          await apiService.admin.deleteUser(Number(id));
          toast.success('Пользователь удален');
          loadAllUsers();
        } catch (error) {
          toast.error('Ошибка при удалении пользователя');
        }
      }}
      onCreateGrant={async (grantData) => {
        try {
          await apiService.grants.create(grantData);
          toast.success('Грант создан');
          loadGrants();
        } catch (error) {
          toast.error('Ошибка при создании гранта');
        }
      }}
      onUpdateGrant={async (id, updates) => {
        try {
          await apiService.grants.update(Number(id), updates);
          toast.success('Грант обновлен');
          loadGrants();
        } catch (error) {
          toast.error('Ошибка при обновлении гранта');
        }
      }}
      onDeleteGrant={async (id) => {
        try {
          await apiService.grants.delete(Number(id));
          toast.success('Грант удален');
          loadGrants();
        } catch (error) {
          toast.error('Ошибка при удалении гранта');
        }
      }}
      onUpdateApplication={async (id, updates) => {
        try {
          if (updates.status) {
            await apiService.applications.updateStatus(Number(id), updates.status);
            toast.success('Статус заявки обновлен');
            loadAllApplications();
          }
        } catch (error) {
          toast.error('Ошибка при обновлении заявки');
        }
      }}
      onRefreshData={() => {
        loadGrants();
        loadAllApplications();
        loadAllUsers();
      }}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        userRole={userRole}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
        onNavigateToProfile={() => navigate('/dashboard')}
        onNavigateHome={() => navigate('/')}
        onNavigateToAdmin={() => navigate('/admin')}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/" /> : <LoginForm onLogin={handleLogin} onSwitchToRegister={() => navigate('/register')} />
          } />
          <Route path="/register" element={
            isLoggedIn ? <Navigate to="/" /> : <RegisterForm onRegister={handleRegister} onSwitchToLogin={() => navigate('/login')} />
          } />
          <Route path="/apply/:grantId" element={
            <ProtectedRoute isAllowed={isLoggedIn} redirectPath="/login">
              <ApplicationPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute isAllowed={isLoggedIn} redirectPath="/login">
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/application/:id" element={
            <ProtectedRoute isAllowed={isLoggedIn} redirectPath="/login">
              <ApplicationViewPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute isAllowed={isLoggedIn} requiredRole="admin" userRole={userRole} redirectPath="/">
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<div className="text-center py-12">404 – Страница не найдена</div>} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

// Главный компонент с BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}


