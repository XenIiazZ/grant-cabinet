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
import axios from "axios";

// Типы
interface Grant {
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

interface Application {
  id: string;
  projectTitle: string;
  grantTitle: string;
  submissionDate: string;
  status: 'черновик' | 'на_проверке' | 'одобрена' | 'отклонена';
  requestedAmount: string;
  feedback?: string;
  applicationText?: string;
  aiCheckResults?: {
    relevance: { passed: boolean; comment: string };
    clarity: { passed: boolean; comment: string };
    budget: { passed: boolean; comment: string };
    feasibility: { passed: boolean; comment: string };
    impact: { passed: boolean; comment: string };
  };
}

interface User {
  id: number;
  email: string;
  full_name: string;
}

interface MLEvaluation {
  overall_score: number;
  overall_label: string;
  summary: string;
  recommendation: string;
  criteria_evaluations: Array<{
    criterion_name: string;
    score: number;
    label: string;
    explanation: string;
    recommendation: string;
  }>;
  priority_recommendations: string[];
  word_count: number;
}

type Page = 'catalog' | 'application' | 'dashboard' | 'login' | 'register' | 'application-view';

// Настройка API
const API_URL = 'http://localhost:8000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Моковые данные на случай если бэкенд недоступен
const mockGrants: Grant[] = [
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
  {
    id: "3",
    title: "Инновации в образовании",
    organization: "Министерство просвещения РФ",
    description: "Поддержка образовательных проектов, внедряющих инновационные методы обучения и цифровые технологии в образовательный процесс.",
    amount: "3 000 000 ₽",
    deadline: "10 февраля 2025",
    category: "Образование",
    status: "закрыт",
    applicants: 156
  },
];

const mockApplications: Application[] = [
  {
    id: "APP001",
    projectTitle: "Цифровая школа для пожилых",
    grantTitle: "Поддержка социальных проектов",
    submissionDate: "15 января 2025",
    status: "на_проверке",
    requestedAmount: "800 000 ₽",
    applicationText: "Проект по созданию цифровой школы для обучения пожилых людей компьютерной грамотности...",
    aiCheckResults: {
      relevance: { passed: true, comment: "Проект соответствует теме гранта" },
      clarity: { passed: true, comment: "Текст заявки понятен" },
      budget: { passed: true, comment: "Бюджет обоснован" },
      feasibility: { passed: true, comment: "План реализации реалистичен" },
      impact: { passed: true, comment: "Высокая социальная значимость" }
    }
  },
  {
    id: "APP002",
    projectTitle: "Театральная студия для детей",
    grantTitle: "Развитие культурных инициатив", 
    submissionDate: "8 января 2025",
    status: "одобрена",
    requestedAmount: "1 200 000 ₽",
    feedback: "Проект соответствует всем требованиям и имеет высокую социальную значимость. Финансирование одобрено.",
    applicationText: "Создание театральной студии для детей из малообеспеченных семей...",
    aiCheckResults: {
      relevance: { passed: true, comment: "Проект соответствует теме гранта" },
      clarity: { passed: true, comment: "Текст заявки понятен" },
      budget: { passed: true, comment: "Бюджет обоснован" },
      feasibility: { passed: true, comment: "План реализации реалистичен" },
      impact: { passed: true, comment: "Высокая социальная значимость" }
    }
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('catalog');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState<User | null>(null);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [selectedGrantTitle, setSelectedGrantTitle] = useState<string>("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  
  // Состояние для данных
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Состояние для фильтров каталога
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Отладочные логи
  useEffect(() => {
    console.log('Current applications state:', applications);
    console.log('Current application details:', currentApplication);
    console.log('Selected application ID:', selectedApplicationId);
  }, [applications, currentApplication, selectedApplicationId]);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setUserName(user.full_name || user.email);
        setUserData(user);
        
        // Загружаем данные пользователя
        if (currentPage === 'dashboard') {
          loadUserApplications();
        }
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        handleLogout();
      }
    }
    
    // Загружаем гранты при первом рендере
    loadGrants();
  }, []);

  // Загружаем заявки при переходе на дашборд
  useEffect(() => {
    if (currentPage === 'dashboard' && isLoggedIn) {
      loadUserApplications();
    }
  }, [currentPage, isLoggedIn]);

  // Загружаем детали заявки при переходе на страницу просмотра
  useEffect(() => {
    if (selectedApplicationId && currentPage === 'application-view') {
      loadApplicationDetails(selectedApplicationId);
    }
  }, [selectedApplicationId, currentPage]);

  // Функции API
  const loadGrants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grants');
      // Преобразуем данные из бэкенда в формат для фронтенда
      const backendGrants = response.data;
      const formattedGrants = backendGrants.map((grant: any) => ({
        id: grant.id.toString(),
        title: grant.title,
        organization: 'Грантовый кабинет',
        description: grant.description,
        amount: grant.budget_justification || 'Не указано',
        deadline: grant.timeline || 'Не указано',
        category: 'Общая категория',
        status: 'открыт' as const,
        applicants: 0,
      }));
      setGrants(formattedGrants);
      console.log('Loaded grants:', formattedGrants);
    } catch (error) {
      console.error('Ошибка загрузки грантов:', error);
      // Используем моковые данные как fallback
      setGrants(mockGrants);
      toast.error('Используются демонстрационные данные');
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplications = async () => {
    console.log('Loading user applications...');
    try {
      setLoading(true);
      const response = await api.get('/grants/my');
      const userGrants = response.data;
      console.log('Raw user grants from API:', userGrants);
      
      // Преобразуем в формат для фронтенда
      const formattedApplications = userGrants.map((grant: any) => {
        // Определяем статус для фронтенда
        let status: Application['status'] = 'черновик';
        if (grant.status === 'pending') status = 'на_проверке';
        else if (grant.status === 'approved') status = 'одобрена';
        else if (grant.status === 'rejected') status = 'отклонена';
        
        // Определяем название проекта (используем grant.title как projectTitle)
        const projectTitle = grant.title || 'Без названия';
        
        return {
          id: `APP${grant.id.toString().padStart(3, '0')}`,
          projectTitle: projectTitle,
          grantTitle: selectedGrantTitle || 'Неизвестный грант',
          submissionDate: new Date(grant.created_at).toLocaleDateString('ru-RU'),
          status: status,
          requestedAmount: grant.budget_justification || 'Не указано',
          feedback: grant.ml_evaluation?.recommendation || 
                   (grant.ml_evaluation ? 'Оценка ИИ доступна' : undefined),
          applicationText: grant.description || '',
          aiCheckResults: grant.ml_evaluation ? {
            relevance: {
              passed: grant.ml_evaluation.overall_score >= 0.7,
              comment: `Релевантность: ${grant.ml_evaluation.overall_score >= 0.7 ? 'Высокая' : 'Средняя'}`
            },
            clarity: {
              passed: true,
              comment: 'Текст заявки понятен'
            },
            budget: {
              passed: !!grant.budget_justification,
              comment: grant.budget_justification ? 'Бюджет указан' : 'Бюджет не указан'
            },
            feasibility: {
              passed: grant.ml_evaluation.overall_score >= 0.5,
              comment: `Реалистичность: ${grant.ml_evaluation.overall_score >= 0.5 ? 'Достаточная' : 'Низкая'}`
            },
            impact: {
              passed: grant.ml_evaluation.overall_score >= 0.6,
              comment: `Социальная значимость: ${grant.ml_evaluation.overall_score >= 0.6 ? 'Высокая' : 'Может быть усилена'}`
            }
          } : undefined
        };
      });
      
      console.log('Formatted applications:', formattedApplications);
      setApplications(formattedApplications);
      
    } catch (error: any) {
      console.error('Ошибка загрузки заявок:', error);
      
      // Если нет заявок, показываем пустой список
      setApplications([]);
      
      // Если это не ошибка 404 (нет заявок), показываем toast
      if (error.response?.status !== 404) {
        toast.error('Используются демонстрационные данные');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Ответ от сервера:', response.data);
      
      const access_token = response.data.access_token;
      
      if (!access_token) {
        toast.error('Токен не получен');
        return;
      }
      
      // Создаем mock user из email
      const user = {
        email: email,
        full_name: email.split('@')[0],
        id: Date.now() // временный ID
      };
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUserName(user.full_name || email);
      setUserData(user);
      setIsLoggedIn(true);
      setCurrentPage('catalog');
      
      toast.success('Вход выполнен успешно!');
      
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      toast.error(error.response?.data?.detail || 'Ошибка входа');
    }
  };

  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, full_name: fullName });
      const { access_token, user } = response.data;
      
      // Сохраняем в localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUserName(fullName);
      setUserData(user);
      setIsLoggedIn(true);
      setCurrentPage('catalog');
      
      toast.success('Регистрация выполнена успешно');
      
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      toast.error(error.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName("");
    setUserData(null);
    setApplications([]);
    setCurrentPage('catalog');
    toast.success('Выход выполнен');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentPage('register');
  };

  const handleNavigateHome = () => {
    setCurrentPage('catalog');
  };

  const handleNavigateToProfile = () => {
    if (isLoggedIn) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
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

  const loadApplicationDetails = async (applicationId: string) => {
    console.log('Loading details for application:', applicationId);
    
    try {
      // Сначала пробуем найти в локальном списке
      const localApp = applications.find(app => app.id === applicationId);
      if (localApp) {
        console.log('Found in local applications:', localApp);
        setCurrentApplication(localApp);
        return;
      }
      
      // Если не нашли локально, загружаем с бэкенда
      const numericId = applicationId.replace('APP', '');
      console.log('Fetching from backend with ID:', numericId);
      
      const response = await api.get(`/grants/${numericId}`);
      const grantData = response.data;
      console.log('Backend grant data:', grantData);
      
      // Преобразуем данные бэкенда в формат приложения
      const fullApplication: Application = {
        id: `APP${grantData.id.toString().padStart(3, '0')}`,
        projectTitle: grantData.title || 'Без названия',
        grantTitle: selectedGrantTitle || grantData.title || 'Неизвестный грант',
        submissionDate: new Date(grantData.created_at).toLocaleDateString('ru-RU'),
        status: getStatusFromBackend(grantData.status),
        requestedAmount: grantData.budget_justification || 'Не указано',
        feedback: grantData.ml_evaluation?.recommendation || 
                 (grantData.ml_evaluation ? 'Оценка ИИ доступна' : undefined),
        applicationText: grantData.description || '',
        aiCheckResults: grantData.ml_evaluation ? createAiCheckResults(grantData) : undefined
      };
      
      console.log('Created full application:', fullApplication);
      setCurrentApplication(fullApplication);
      
    } catch (error) {
      console.error('Ошибка загрузки деталей заявки:', error);
      
      // Fallback на моковые данные
      const mockApp = mockApplications.find(app => app.id === applicationId);
      if (mockApp) {
        console.log('Using mock data for:', applicationId);
        setCurrentApplication(mockApp);
      } else {
        toast.error('Не удалось загрузить данные заявки');
      }
    }
  };

  // Вспомогательные функции
  const getStatusFromBackend = (backendStatus: string): Application['status'] => {
    const statusMap: Record<string, Application['status']> = {
      'pending': 'на_проверке',
      'approved': 'одобрена',
      'rejected': 'отклонена',
      'draft': 'черновик'
    };
    return statusMap[backendStatus] || 'на_проверке';
  };

  const createAiCheckResults = (grantData: any) => {
    if (!grantData.ml_evaluation) return undefined;
    
    const mlData = grantData.ml_evaluation;
    
    return {
      relevance: {
        passed: mlData.overall_score >= 0.7,
        comment: `Релевантность: ${Math.round(mlData.overall_score * 100)}%`
      },
      clarity: {
        passed: true,
        comment: 'Текст заявки понятен'
      },
      budget: {
        passed: !!grantData.budget_justification,
        comment: grantData.budget_justification ? 'Бюджет указан' : 'Бюджет не указан'
      },
      feasibility: {
        passed: mlData.overall_score >= 0.5,
        comment: `Реалистичность: ${Math.round(mlData.overall_score * 100)}%`
      },
      impact: {
        passed: mlData.overall_score >= 0.6,
        comment: `Социальная значимость: ${Math.round(mlData.overall_score * 100)}%`
      }
    };
  };

  const extractBudgetFromText = (text: string): string => {
    const budgetRegex = /(?:бюджет|сумма|финанс|расход|стоимост)[^\d]*(\d+[\s]*[₽руб]|\d+[\s]*(?:тыс|млн))/i;
    const match = text.match(budgetRegex);
    return match ? match[1] : 'Не указан';
  };

  const extractTimelineFromText = (text: string): string => {
    const timelineRegex = /(?:срок|период|время|длительност)[^\d]*(\d+[\s]*(?:месяц|год|недел|дн|квартал))/i;
    const match = text.match(timelineRegex);
    return match ? match[1] : 'Не указаны';
  };

  const handleSubmitApplication = async (applicationText: string) => {
    try {
      // 1. Создаем грант в бэкенде
      const grantData = {
        title: selectedGrantTitle || 'Новая заявка',
        description: applicationText,
        budget_justification: extractBudgetFromText(applicationText),
        timeline: extractTimelineFromText(applicationText),
        status: 'pending',
      };
      
      const grantResponse = await api.post('/grants', grantData);
      const createdGrant = grantResponse.data;
      
      // 2. Получаем ML оценку
      let mlEvaluation: MLEvaluation | null = null;
      try {
        const mlResponse = await api.post('/ai/evaluate', {
          application_text: applicationText,
          grant_title: selectedGrantTitle,
        });
        mlEvaluation = mlResponse.data;
        
        // 3. Обновляем грант с ML оценкой
        await api.put(`/grants/${createdGrant.id}`, {
          ml_evaluation: mlEvaluation,
        });
        
      } catch (mlError) {
        console.error('Ошибка ML оценки:', mlError);
        toast.warning('ML оценка не выполнена, но заявка сохранена');
      }
      
      // 4. Обновляем локальное состояние
      const newApplication: Application = {
        id: `APP${createdGrant.id.toString().padStart(3, '0')}`,
        projectTitle: createdGrant.title,
        grantTitle: selectedGrantTitle,
        submissionDate: new Date(createdGrant.created_at).toLocaleDateString('ru-RU'),
        status: 'на_проверке',
        requestedAmount: createdGrant.budget_justification || 'Не указано',
        feedback: mlEvaluation?.recommendation || 'Заявка успешно создана',
        applicationText: createdGrant.description,
        aiCheckResults: mlEvaluation ? {
          relevance: {
            passed: mlEvaluation.overall_score >= 0.7,
            comment: `Релевантность: ${Math.round(mlEvaluation.overall_score * 100)}%`
          },
          clarity: {
            passed: true,
            comment: 'Текст заявки понятен'
          },
          budget: {
            passed: !!createdGrant.budget_justification,
            comment: createdGrant.budget_justification ? 'Бюджет указан' : 'Бюджет не указан'
          },
          feasibility: {
            passed: mlEvaluation.overall_score >= 0.5,
            comment: `Реалистичность: ${Math.round(mlEvaluation.overall_score * 100)}%`
          },
          impact: {
            passed: mlEvaluation.overall_score >= 0.6,
            comment: `Социальная значимость: ${Math.round(mlEvaluation.overall_score * 100)}%`
          }
        } : undefined
      };
      
      setApplications(prev => [newApplication, ...prev]);
      
      toast.success('Заявка успешно создана!' + (mlEvaluation ? ' Оценка ИИ выполнена.' : ''));
      setCurrentPage('dashboard');
      
    } catch (error: any) {
      console.error('Ошибка создания заявки:', error);
      toast.error(error.response?.data?.detail || 'Ошибка создания заявки');
    }
  };

  const handleViewApplication = (applicationId: string) => {
    console.log('View application clicked:', applicationId);
    console.log('Available applications:', applications);
    
    // Находим заявку в локальном списке
    const foundApp = applications.find(app => {
      console.log('Comparing:', app.id, 'with', applicationId);
      return app.id === applicationId;
    });
    
    if (foundApp) {
      console.log('Found application in local list:', foundApp);
      setCurrentApplication(foundApp);
      setSelectedApplicationId(applicationId);
      setCurrentPage('application-view');
    } else {
      console.log('Application not found in local list, loading from backend...');
      setSelectedApplicationId(applicationId);
      setCurrentPage('application-view');
      // Детали загрузятся в useEffect
    }
  };

  const handleCreateNewApplication = () => {
    setCurrentPage('catalog');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'catalog':
        return (
          <GrantCatalog
            grants={loading && grants.length === 0 ? [] : grants}
            onApplyToGrant={handleApplyToGrant}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
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
                <p>Загрузка деталей заявки...</p>
                <Button 
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="mt-4"
                >
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
            onSwitchToLogin={handleSwitchToLogin}
          />
        );
      
      default:
        return null;
    }
  };

  const showHeaderAndFooter = currentPage !== 'login' && currentPage !== 'register';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeaderAndFooter && (
        <Header
          isLoggedIn={isLoggedIn}
          userName={userName}
          currentPage={currentPage}
          onLogin={() => setCurrentPage('login')}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateHome={handleNavigateHome}
        />
      )}
      
      <main className="flex-1">
        {currentPage === 'catalog' && showHeaderAndFooter ? (
          <div className="container mx-auto px-4 py-8">
            {loading && grants.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p>Загрузка грантов...</p>
              </div>
            ) : grants.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Гранты не найдены</p>
                <Button 
                  onClick={loadGrants} 
                  variant="outline" 
                  className="mt-4"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : (
              renderCurrentPage()
            )}
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

// Компонент Button для fallback
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
        : 'bg-primary text-primary-foreground hover:bg-primary/90'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);