import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogOut, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  userRole?: 'user' | 'admin' | 'expert';
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateHome?: () => void;
  onNavigateToAdmin?: () => void;
}

export function Header({ 
  isLoggedIn = false, 
  userName = "Пользователь",
  userRole = "user",
  onLogin,
  onLogout,
  onNavigateToProfile,
  onNavigateHome,
  onNavigateToAdmin
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип и навигация */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Грантовый кабинет</span>
            </button>
            
            {/* Навигационное меню */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-1">
                <Button 
                  variant={isActive('/') ? 'default' : 'ghost'}
                  onClick={() => navigate('/')}
                  size="sm"
                >
                  Каталог грантов
                </Button>
                <Button 
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  onClick={() => navigate('/dashboard')}
                  size="sm"
                >
                  Мои заявки
                </Button>
                {userRole === 'admin' && (
                  <Button 
                    variant={isActive('/admin') ? 'default' : 'ghost'}
                    onClick={() => navigate('/admin')}
                    size="sm"
                  >
                    Админ-панель
                  </Button>
                )}
              </nav>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <div className="hidden lg:flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{userName}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </Button>
              </>
            ) : (
              <Button onClick={onLogin}>
                Войти
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}