import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">О платформе</h3>
            <p className="text-sm text-muted-foreground">
              Грантовый кабинет — платформа для подачи заявок на получение грантов 
              и отслеживания их статуса.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Часто задаваемые вопросы
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Инструкции по подаче заявок
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Техническая поддержка
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@grants.ru</li>
              <li>Телефон: +7 (495) 123-45-67</li>
              <li>Адрес: г. Москва, ул. Грантовая, 1</li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2025 Грантовый кабинет. Все права защищены.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Пользовательское соглашение
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}