import { useState } from "react";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { GrantCatalog } from "./components/grant-catalog";
import { SimpleApplicationForm } from "./components/simple-application-form";
import { UserDashboard } from "./components/user-dashboard";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import { Toaster } from "./components/ui/sonner";

// Моковые данные
const mockGrants = [
  {
    id: "1",
    title: "Поддержка социальных проектов",
    organization: "Фонд президентских грантов",
    description: "Грант для некоммерческих организаций, реализующих социально значимые проекты в области образования, здравоохранения и социального обслуживания населения.",
    amount: "2 000 000 ₽",
    deadline: "15 марта 2025",
    category: "Социальная сфера",
    status: "открыт" as const,
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
    status: "скоро_закрывается" as const,
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
    status: "закрыт" as const,
    applicants: 156
  },
  {
    id: "4",
    title: "Экологические инициативы",
    organization: "Росприроднадзор",
    description: "Грантовая поддержка проектов по охране окружающей среды, экологическому просвещению и устойчивому развитию территорий.",
    amount: "1 500 000 ₽",
    deadline: "20 апреля 2025",
    category: "Экология",
    status: "открыт" as const,
    applicants: 67
  },
  {
    id: "5",
    title: "Поддержка молодежных проектов",
    organization: "Росмолодёжь",
    description: "Финансирование инициатив молодых людей в возрасте от 18 до 35 лет в различных сферах деятельности.",
    amount: "800 000 ₽",
    deadline: "1 мая 2025",
    category: "Молодежная политика",
    status: "открыт" as const,
    applicants: 134
  },
  {
    id: "6",
    title: "Технологические стартапы",
    organization: "Фонд развития интернет-инициатив",
    description: "Поддержка технологических проектов и стартапов в области информационных технологий и цифровизации.",
    amount: "10 000 000 ₽",
    deadline: "15 мая 2025",
    category: "Технологии",
    status: "открыт" as const,
    applicants: 78
  }
];

const mockApplications = [
  {
    id: "APP001",
    projectTitle: "Цифровая школа для пожилых",
    grantTitle: "Поддержка социальных проектов",
    submissionDate: "15 января 2025",
    status: "на_проверке" as const,
    requestedAmount: "800 000 ₽"
  },
  {
    id: "APP002",
    projectTitle: "Театральная студия для детей",
    grantTitle: "Развитие культурных инициатив", 
    submissionDate: "8 января 2025",
    status: "одобрена" as const,
    requestedAmount: "1 200 000 ₽",
    feedback: "Проект соответствует всем требованиям и имеет высокую социальную значимость. Финансирование одобрено."
  },
  {
    id: "APP003",
    projectTitle: "Экологическое просвещение в школах",
    grantTitle: "Экологические инициативы",
    submissionDate: "22 декабря 2024",
    status: "черновик" as const,
    requestedAmount: "600 000 ₽",
    feedback: "Необходимо доработать раздел бюджета и предоставить более детальный план мероприятий с указанием конкретных результатов."
  },
  {
    id: "APP004",
    projectTitle: "Мобильное приложение для волонтеров",
    grantTitle: "Технологические стартапы",
    submissionDate: "10 декабря 2024", 
    status: "отклонена" as const,
    requestedAmount: "2 500 000 ₽",
    feedback: "Проект не соответствует критериям оценки. Недостаточно проработана бизнес-модель и план монетизации."
  }
];

type Page = 'catalog' | 'application' | 'dashboard' | 'login' | 'register';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('catalog');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [selectedGrantTitle, setSelectedGrantTitle] = useState<string>("");
  
  // Состояние для фильтров каталога
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleLogin = (email?: string, password?: string) => {
    if (email && password) {
      // В реальном приложении здесь будет запрос к серверу
      setUserName("Иван Петров"); // Заглушка для имени пользователя
      setIsLoggedIn(true);
      setCurrentPage('catalog');
    } else {
      // Если вызывается без параметров - переход к форме входа
      setCurrentPage('login');
    }
  };

  const handleRegister = (email: string, password: string, fullName: string) => {
    // В реальном приложении здесь будет запрос к серверу для регистрации
    setUserName(fullName);
    setIsLoggedIn(true);
    setCurrentPage('catalog');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setCurrentPage('catalog');
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
      handleLogin(); // Переход к форме авторизации
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

  const handleSubmitApplication = (applicationText: string) => {
    console.log('Application submitted:', {
      grantId: selectedGrantId,
      grantTitle: selectedGrantTitle,
      applicationText
    });
    // Здесь будет логика отправки заявки на сервер
    setCurrentPage('dashboard');
  };

  const handleViewApplication = (applicationId: string) => {
    console.log('View application:', applicationId);
    // Здесь будет логика просмотра деталей заявки
  };

  const handleCreateNewApplication = () => {
    setCurrentPage('catalog');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'catalog':
        return (
          <GrantCatalog
            grants={mockGrants}
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
            applications={mockApplications}
            onViewApplication={handleViewApplication}
            onCreateNewApplication={handleCreateNewApplication}
            userName={userName}
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
          onLogin={handleLogin}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateHome={handleNavigateHome}
        />
      )}
      
      <main className="flex-1">
        {currentPage === 'catalog' && showHeaderAndFooter ? (
          <div className="container mx-auto px-4 py-8">
            {renderCurrentPage()}
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