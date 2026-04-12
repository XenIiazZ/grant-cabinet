import { useState, useEffect } from "react";
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
import { api } from './services/api';
import { SEO } from "./components/SEO";

// Типы для фронтенда
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

type Page = 'catalog' | 'application' | 'dashboard' | 'login' | 'register' | 'application-view' | 'admin-panel';

// Моковые данные
const mockGrants: FrontendGrant[] = [
  {
    id: "1",
    title: "Поддержка социальных проектов",
    organization: "Фонд президентских грантов",
    description: "Грант для некоммерческих организаций, реализующих социально значимые проекты в области образования, здравоохранения и социального обслуживания населения.",
    amount: "2 000 000 ₽",
    deadline: "15 марта 2025",
    category: "Социальная сфера",
    status: "открыт",
    applicants: 245
  },
  {
    id: "2", 
    title: "Развитие культурных инициатив",
    organization: "Министерство культуры РФ",
    description: "Финансирование проектов в области культуры и искусства, направленных на сохранение культурного наследия и развитие творческих индустрий.",
    amount: "5 000 000 ₽",
    deadline: "28 февраля 2025",
    category: "Культура",
    status: "скоро_закрывается",
    applicants: 89
  },
];


// Простой компонент Button для fallback
const Button = ({ 
  onClick, 
  variant = 'default', 
  children,
  className = '',
  disabled = false
}: { 
  onClick: () => void; 
  variant?: 'default' | 'outline'; 
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md ${
      variant === 'outline' 
        ? 'border border-gray-300 hover:bg-gray-50' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('catalog');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState<User | null>(null);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [selectedGrantTitle, setSelectedGrantTitle] = useState<string>("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [currentApplication, setCurrentApplication] = useState<FrontendApplication | null>(null);
  
  // Состояние для данных
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
  
  // Фильтры каталога
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Проверка авторизации при загрузке
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');  // <-- ИСПРАВЛЕНО: было 'token'
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
    
    // Загружаем гранты
    loadGrants();
  }, []);

  // Загружаем заявки при переходе на дашборд
  useEffect(() => {
    if (currentPage === 'dashboard' && isLoggedIn) {
      loadUserApplications();
    }
  }, [currentPage, isLoggedIn]);

  // Загружаем детали заявки
  useEffect(() => {
    if (selectedApplicationId && currentPage === 'application-view') {
      loadApplicationDetails(selectedApplicationId);
    }
  }, [selectedApplicationId, currentPage]);

  // Загружаем пользователей при переходе в админ-панель
  useEffect(() => {
    if (currentPage === 'admin-panel' && isLoggedIn && userRole === 'admin') {
      loadAllUsers();
      loadAllApplications();
    }
  }, [currentPage, isLoggedIn, userRole]);

  // Функция загрузки всех пользователей
const loadAllUsers = async () => {
  try {
    const response = await apiService.admin.getUsers();
    const usersWithApps = await Promise.all(response.data.map(async (user: any) => {
      // Для каждого пользователя получаем количество его заявок
      try {
        const apps = await apiService.applications.getMyApplications(); // Но это только для текущего пользователя
        return {
          ...user,
          applicationsCount: 0 // Пока 0, нужно отдельный эндпоинт
        };
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
    
    // Преобразуем данные для админ-панели
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
    
    // Демо заявка для тестирования
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

// Также добавьте вспомогательные функции для преобразования данных
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

  

  // Исправленная функция загрузки грантов
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

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.auth.login(email, password);
      const { access_token, refresh_token } = response.data;
      
      console.log('Сохраняем токены:', { access_token, refresh_token }); // Для отладки
      
      // Сохраняем оба токена с правильными именами
      localStorage.setItem('access_token', access_token);  // <-- ИСПРАВЛЕНО: было 'token'
      localStorage.setItem('refresh_token', refresh_token);
      
      // Получаем данные пользователя
      const userResponse = await apiService.auth.getMe();
      const user = userResponse.data;
      
      // Сохраняем данные пользователя
      localStorage.setItem('user', JSON.stringify(user));
      
      // Обновляем состояние
      setUserData(user);
      setUserName(user.full_name);
      setUserRole(user.role as 'user' | 'admin' | 'expert');
      setIsLoggedIn(true);
      
      // Переходим на соответствующую страницу
      if (user.role === 'admin') {
        setCurrentPage('admin-panel');
        toast.success('Вы вошли как администратор');
      } else {
        setCurrentPage('catalog');
        toast.success(`Добро пожаловать, ${user.full_name}!`);
      }
      
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      
      let errorMessage = 'Ошибка авторизации';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };

  // Исправленная функция регистрации
  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const response = await apiService.auth.register(email, password, fullName);
      const user = response.data;
      
      toast.success('Регистрация выполнена успешно! Теперь войдите в систему.');
      setCurrentPage('login');
      
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      
      let errorMessage = 'Ошибка регистрации';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    }
  };


  

const extractBudgetFromText = (text: string): string => {
  if (!text) return 'Не указан';
  // Ищем сумму в тексте (цифры с указанием рублей, тыс, млн)
  const budgetRegex = /(?:бюджет|сумма|финанс|расход|стоимост)[^\d]*(\d+[\s]*(?:[₽руб]|тыс|млн|миллион|тысяч))/i;
  const match = text.match(budgetRegex);
  if (match) return match[1];
  
  // Если не нашли по ключевым словам, ищем просто числа с валютой
  const amountRegex = /(\d+[\s]*(?:[₽руб]|тыс|млн))/i;
  const amountMatch = text.match(amountRegex);
  return amountMatch ? amountMatch[1] : 'Не указан';
};

const extractTimelineFromText = (text: string): string => {
  if (!text) return 'Не указаны';
  // Ищем сроки в тексте
  const timelineRegex = /(?:срок|период|время|длительност|реализаци)[^\d]*(\d+[\s]*(?:месяц|год|недел|дн|квартал|день|дней|месяцев|лет))/i;
  const match = text.match(timelineRegex);
  return match ? match[1] : 'Не указаны';
};

// ИСПРАВЛЕННАЯ функция handleSubmitApplication
const handleSubmitApplication = async (applicationText: string) => {
  try {
    // 1. Сначала проверяем, существует ли грант
    if (!selectedGrantId) {
      toast.error('Не выбран грант');
      return;
    }

    // 2. Получаем ML оценку
    const mlResponse = await apiService.ml.evaluate(applicationText, selectedGrantTitle);
    const mlEvaluation = mlResponse.data;
    
    // 3. Создаем заявку
    const applicationData = {
      grant_id: parseInt(selectedGrantId),
      project_title: `Заявка на "${selectedGrantTitle}"`,
      project_description: applicationText,
      budget_justification: extractBudgetFromText(applicationText), // Теперь функция определена
      timeline: extractTimelineFromText(applicationText), // Теперь функция определена
      ml_evaluation: mlEvaluation,
      status: "на_рассмотрении"
    };
    
    console.log('Отправка заявки:', applicationData); // Для отладки
    
    const appResponse = await apiService.applications.createApplication(applicationData);
    console.log('Ответ сервера:', appResponse.data); // Для отладки
    
    // После успешного создания, перезагружаем список заявок
    await loadUserApplications();
    
    toast.success('Заявка успешно отправлена!');
    setCurrentPage('dashboard');
    
  } catch (error: any) {
    console.error('Ошибка создания заявки:', error);
    
    // Более подробная ошибка
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else {
      toast.error('Ошибка создания заявки');
    }
  }
};

  const handleApplyToGrant = (grantId: string, grantTitle: string) => {
  if (!isLoggedIn) {
    setCurrentPage('login');
    toast.warning('Для подачи заявки необходимо войти в систему');
    return;
  }
  setSelectedGrantId(grantId);
  setSelectedGrantTitle(grantTitle);
  setCurrentPage('application');
};

  const handleViewApplication = (applicationId: string) => {
  setSelectedApplicationId(applicationId);
  setCurrentPage('application-view');
};
  // Выход из системы
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Пытаемся отозвать токен на сервере
        await apiService.auth.logout(refreshToken).catch(() => {});
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.clear();  // Очищаем все
      setIsLoggedIn(false);
      setUserName("");
      setUserData(null);
      setUserRole('user');
      setApplications([]);
      setUsers([]);
      setCurrentPage('catalog');
      toast.success('Выход выполнен');
    }
  };


  const handleNavigateToAdmin = () => {
  if (isLoggedIn && userRole === 'admin') {
    setCurrentPage('admin-panel');
    loadAllUsers();
    loadAllApplications();
  }
};

  const handleNavigateToProfile = () => {
    if (isLoggedIn) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
  };

  const handleNavigateHome = () => {
    setCurrentPage('catalog');
  };

  const handleSwitchToLogin = () => setCurrentPage('login');
  const handleSwitchToRegister = () => setCurrentPage('register');

  const handleBackFromApplication = () => {
    setCurrentPage('catalog');
    setSelectedGrantId(null);
    setSelectedGrantTitle("");
  };

  const handleBackToDashboard = () => {
    setCurrentApplication(null);
    setSelectedApplicationId(null);
    setCurrentPage('dashboard');
  };

  const handleCreateNewApplication = () => setCurrentPage('catalog');
    // ... (остальные функции остаются без изменений)


  const handleRefreshData = async () => {
  if (userRole === 'admin') {
    await Promise.all([
      loadAllUsers(),
      loadAllApplications(),
      loadGrants()
    ]);
  }
};
  
  const renderCurrentPage = () => {
    switch (currentPage) {
      
      case 'catalog':
        return (
          <>
            <SEO 
              title="Каталог грантов"
              description="Найдите грант для вашего проекта. Финансирование социальных, культурных, образовательных и других инициатив."
              url="/"
            />
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
      
      case 'application':
        return (
          <SimpleApplicationForm
            grantTitle={selectedGrantTitle}
            onBack={handleBackFromApplication}
            onSubmit={handleSubmitApplication}
          />
        );
      
      case 'dashboard':
        return (
          <UserDashboard
            applications={applications}
            onViewApplication={handleViewApplication}
            onCreateNewApplication={handleCreateNewApplication}
            userName={userName}
          />
        );
      
      case 'application-view':
        if (!currentApplication) {
          return (
            <div className="container mx-auto px-4 py-8">
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p>Загрузка деталей заявки...</p>
                <Button onClick={handleBackToDashboard} className="mt-4">
                  Вернуться к списку
                </Button>
              </div>
            </div>
          );
        }
        
        return (
          <ApplicationDetails
            application={currentApplication}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'admin-panel':
        return (
          <AdminPanel
            users={users}
            grants={grants}
            applications={applications} // Теперь сюда будут приходить все заявки
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
                  loadAllApplications(); // Загружаем все заявки заново
                }
              } catch (error) {
                toast.error('Ошибка при обновлении заявки');
              }
            }}
            onRefreshData={() => {
              loadGrants();
              loadAllApplications(); // Используем новую функцию
              loadAllUsers();
            }}
          />
        );

      case 'login':
        return (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={handleSwitchToRegister}
          />
        );
      
      case 'register':
        return (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={handleSwitchToRegister}
          />
        );
      
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl mb-4">Страница не найдена</h1>
              <Button onClick={() => setCurrentPage('catalog')}>
                На главную
              </Button>
            </div>
          </div>
        );
    }
  };
  
  const showHeaderAndFooter = currentPage !== 'login' && currentPage !== 'register';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeaderAndFooter && (
        <Header
          isLoggedIn={isLoggedIn}
          userName={userName}
          userRole={userRole}
          currentPage={currentPage}
          onLogin={() => setCurrentPage('login')}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateHome={handleNavigateHome}
          onNavigateToAdmin={handleNavigateToAdmin}
        />
      )}
      
      <main className="flex-1">
        {loading && currentPage === 'dashboard' && applications.length === 0 ? (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Загрузка ваших заявок...</p>
            </div>
          </div>
        ) : (
          renderCurrentPage()
        )}
      </main>
      
      {showHeaderAndFooter && <Footer />}
      <Toaster />
    </div>
  );
}