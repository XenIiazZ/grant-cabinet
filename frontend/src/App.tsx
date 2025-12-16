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

type Page = 'catalog' | 'application' | 'dashboard' | 'login' | 'register' | 'application-view';

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
  
  // Фильтры каталога
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Проверка авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setUserName(user.full_name || user.email);
        setUserData(user);
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

  // Функция загрузки грантов
  const loadGrants = async () => {
    try {
      setLoading(true);
      const response = await apiService.grants.getAll();
      const backendGrants = response.data;
      
      const formattedGrants: FrontendGrant[] = backendGrants.map(grant => ({
        id: grant.id.toString(),
        title: grant.title,
        organization: 'Грантовый кабинет',
        description: grant.description,
        amount: grant.max_amount || 'Не указано',
        deadline: grant.deadline ? new Date(grant.deadline).toLocaleDateString('ru-RU') : 'Не указан',
        category: grant.category || 'Общая категория',
        status: grant.status as 'открыт' | 'скоро_закрывается' | 'закрыт',
        applicants: grant.applicants_count || 0
      }));
      
      setGrants(formattedGrants);
    } catch (error) {
      console.error('Ошибка загрузки грантов:', error);
      setGrants(mockGrants);
      toast.error('Используются демонстрационные данные');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка заявок пользователя
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
      
      // Создаем демо заявку для тестирования
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

  // Преобразование статуса бэкенда во фронтенд
  const mapBackendStatus = (backendStatus: string): FrontendApplication['status'] => {
    switch (backendStatus) {
      case 'на_рассмотрении': return 'на_проверке';
      case 'одобрено': return 'одобрена';
      case 'отклонено': return 'отклонена';
      case 'требует_доработки': return 'на_проверке';
      default: return 'черновик';
    }
  };

  // Преобразование ML оценки
  const transformMlEvaluation = (mlData?: MLEvaluation) => {
    if (!mlData) return undefined;
    
    return {
      relevance: {
        passed: mlData.overall_score >= 0.7,
        comment: `Общая оценка: ${Math.round(mlData.overall_score * 100)}%`
      },
      clarity: {
        passed: mlData.criteria_evaluations.some(c => 
          c.criterion_name.includes('Описание') && c.label === 'Соответствует'
        ),
        comment: mlData.criteria_evaluations.find(c => 
          c.criterion_name.includes('Описание')
        )?.explanation || 'Ясность изложения проверена'
      },
      budget: {
        passed: mlData.criteria_evaluations.some(c => 
          c.criterion_name.includes('Бюджет') && c.label === 'Соответствует'
        ),
        comment: mlData.criteria_evaluations.find(c => 
          c.criterion_name.includes('Бюджет')
        )?.explanation || 'Бюджетная часть проверена'
      },
      feasibility: {
        passed: mlData.criteria_evaluations.some(c => 
          c.criterion_name.includes('Сроки') && c.label === 'Соответствует'
        ),
        comment: mlData.criteria_evaluations.find(c => 
          c.criterion_name.includes('Сроки')
        )?.explanation || 'Реалистичность плана оценена'
      },
      impact: {
        passed: mlData.criteria_evaluations.some(c => 
          c.criterion_name.includes('Социальная') && c.label === 'Соответствует'
        ),
        comment: mlData.criteria_evaluations.find(c => 
          c.criterion_name.includes('Социальная')
        )?.explanation || 'Социальная значимость проверена'
      }
    };
  };

  // Загрузка деталей заявки
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
      
      // Fallback: создаем демо заявку
      const demoApp: FrontendApplication = {
        id: applicationId,
        projectTitle: "Заявка на грант",
        grantTitle: selectedGrantTitle || "Неизвестный грант",
        submissionDate: new Date().toLocaleDateString('ru-RU'),
        status: 'на_проверке',
        requestedAmount: "500 000 ₽",
        feedback: "Заявка на рассмотрении",
        applicationText: "Текст заявки",
        ml_evaluation: {
          overall_score: 0.65,
          overall_label: "Требует доработки",
          summary: "Средняя оценка",
          recommendation: "Требуется доработка",
          criteria_evaluations: [],
          priority_recommendations: ["Уточнить бюджет", "Добавить сроки"],
          word_count: 120
        }
      };
      
      setCurrentApplication(demoApp);
      toast.warning('Загружены демо данные');
    }
  };

  // Обработка логина
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.auth.login(email, password);
      const { access_token } = response.data;
      
      // Создаем mock пользователя
      const user: User = {
        id: Date.now(),
        email: email,
        full_name: email.split('@')[0]
      };
      
      // Сохраняем в localStorage
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

  // Обработка регистрации
  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const response = await apiService.auth.register(email, password, fullName);
      const user = response.data;
      
      // Логинимся после регистрации
      const loginResponse = await apiService.auth.login(email, password);
      const { access_token } = loginResponse.data;
      
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

  // Выход из системы
  const handleLogout = () => {
    apiService.auth.logout();
    setIsLoggedIn(false);
    setUserName("");
    setUserData(null);
    setApplications([]);
    setCurrentPage('catalog');
    toast.success('Выход выполнен');
  };

  // Обработка подачи заявки
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

  // Отправка заявки с ML оценкой
  const handleSubmitApplication = async (applicationText: string) => {
    try {
      // 1. Получаем ML оценку
      const mlResponse = await apiService.ml.evaluate(applicationText, selectedGrantTitle);
      const mlEvaluation = mlResponse.data;
      
      // 2. Создаем заявку СРАЗУ со статусом "на_рассмотрении"
      const applicationData = {
        grant_id: parseInt(selectedGrantId || "1"),
        project_title: `Заявка на "${selectedGrantTitle}"`,
        project_description: applicationText,
        budget_justification: extractBudgetFromText(applicationText),
        timeline: extractTimelineFromText(applicationText),
        ml_evaluation: mlEvaluation,
        status: "на_рассмотрении"  // ← ДОБАВЬТЕ ЭТУ СТРОКУ!
      };
      
      const appResponse = await apiService.applications.createApplication(applicationData);
      const createdApp = appResponse.data;
      
      // 3. Преобразуем для фронтенда
      const newApplication: FrontendApplication = {
        id: `APP${createdApp.id.toString().padStart(3, '0')}`,
        projectTitle: createdApp.project_title,
        grantTitle: selectedGrantTitle,
        submissionDate: new Date(createdApp.created_at).toLocaleDateString('ru-RU'),
        status: 'на_проверке',  // Это фронтендный статус для "на_рассмотрении"
        requestedAmount: createdApp.budget_justification || 'Не указано',
        feedback: mlEvaluation.recommendation,
        applicationText: createdApp.project_description,
        aiCheckResults: transformMlEvaluation(mlEvaluation),
        ml_evaluation: mlEvaluation
      };
      
      // 4. Обновляем состояние
      setApplications(prev => [newApplication, ...prev]);
      
      toast.success('Заявка успешно отправлена на рассмотрение!');
      setCurrentPage('dashboard');
      
    } catch (error: any) {
      console.error('Ошибка создания заявки:', error);
      toast.error(error.response?.data?.detail || 'Ошибка создания заявки');
    }
  };
      
  //     // Fallback: создаем локальную заявку
  //     const fallbackApp: FrontendApplication = {
  //       id: `APP${Date.now().toString().slice(-6)}`,
  //       projectTitle: `Заявка на "${selectedGrantTitle}"`,
  //       grantTitle: selectedGrantTitle,
  //       submissionDate: new Date().toLocaleDateString('ru-RU'),
  //       status: 'на_проверке',
  //       requestedAmount: extractBudgetFromText(applicationText) || 'Не указано',
  //       feedback: 'Заявка сохранена локально',
  //       applicationText: applicationText,
  //       ml_evaluation: {
  //         overall_score: 0.7,
  //         overall_label: "Рекомендовано",
  //         summary: "Заявка проверена локально",
  //         recommendation: "Готова к рассмотрению",
  //         criteria_evaluations: [],
  //         priority_recommendations: [],
  //         word_count: applicationText.trim().split(/\s+/).length
  //       }
  //     };
      
  //     setApplications(prev => [fallbackApp, ...prev]);
  //     toast.warning('Заявка сохранена локально (ошибка сервера)');
  //     setCurrentPage('dashboard');
  //   }
  // };

  // Вспомогательные функции для извлечения данных из текста
  const extractBudgetFromText = (text: string): string => {
    if (!text) return 'Не указан';
    const budgetRegex = /(?:бюджет|сумма|финанс|расход|стоимост)[^\d]*(\d+[\s]*[₽руб]|\d+[\s]*(?:тыс|млн))/i;
    const match = text.match(budgetRegex);
    return match ? match[1] : 'Не указан';
  };

  const extractTimelineFromText = (text: string): string => {
    if (!text) return 'Не указаны';
    const timelineRegex = /(?:срок|период|время|длительност)[^\d]*(\d+[\s]*(?:месяц|год|недел|дн|квартал))/i;
    const match = text.match(timelineRegex);
    return match ? match[1] : 'Не указаны';
  };

  // Просмотр заявки
  const handleViewApplication = (applicationId: string) => {
    console.log('Просмотр заявки:', applicationId);
    setSelectedApplicationId(applicationId);
    setCurrentPage('application-view');
  };

  // Навигация
  const handleSwitchToLogin = () => setCurrentPage('login');
  const handleSwitchToRegister = () => setCurrentPage('register');
  const handleNavigateHome = () => setCurrentPage('catalog');
  const handleNavigateToProfile = () => {
    if (isLoggedIn) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
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
  const handleCreateNewApplication = () => setCurrentPage('catalog');

  // Рендеринг текущей страницы
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'catalog':
        return (
          <div className="container mx-auto px-4 py-8">
            <GrantCatalog
              grants={grants}
              onApplyToGrant={handleApplyToGrant}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
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
                <Button 
                  onClick={handleBackToDashboard}
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
          currentPage={currentPage}
          onLogin={() => setCurrentPage('login')}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateHome={handleNavigateHome}
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