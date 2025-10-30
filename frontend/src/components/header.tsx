import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LogOut, User, Award } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  currentPage?: string;
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateHome?: () => void;
}

export function Header({ 
  isLoggedIn = false, 
  userName = "Пользователь",
  currentPage = "catalog",
  onLogin,
  onLogout,
  onNavigateToProfile,
  onNavigateHome
}: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип и навигация */}
          <div className="flex items-center gap-6">
            <button 
              onClick={onNavigateHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Грантовый кабинет</span>
            </button>
            
            {/* Навигационное меню */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-4">
                <Button 
                  variant={currentPage === 'catalog' ? 'default' : 'ghost'}
                  onClick={onNavigateHome}
                  size="sm"
                >
                  Каталог грантов
                </Button>
                <Button 
                  variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                  onClick={onNavigateToProfile}
                  size="sm"
                >
                  Мои заявки
                </Button>
              </nav>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Выпадающее меню пользователя */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline">{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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