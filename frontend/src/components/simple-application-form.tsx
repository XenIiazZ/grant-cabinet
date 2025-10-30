import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ApplicationChecker } from "./application-checker";
import { FileText, Send, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SimpleApplicationFormProps {
  grantTitle: string;
  onBack: () => void;
  onSubmit: (applicationText: string) => void;
}

interface CheckResult {
  criterion: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

export function SimpleApplicationForm({ grantTitle, onBack, onSubmit }: SimpleApplicationFormProps) {
  const [applicationText, setApplicationText] = useState("");
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Простая проверка заявки на основе содержания
  const checkApplication = () => {
    if (!applicationText.trim()) {
      toast.error("Заполните текст заявки");
      return;
    }

    setIsChecking(true);
    
    // Имитация проверки с задержкой
    setTimeout(() => {
      const results: CheckResult[] = [];
      const text = applicationText.toLowerCase();
      const wordCount = applicationText.trim().split(/\s+/).length;

      // Проверка длины
      if (wordCount >= 100) {
        results.push({
          criterion: "Объем заявки",
          status: "passed",
          message: `Заявка содержит ${wordCount} слов (требуется минимум 100)`
        });
      } else {
        results.push({
          criterion: "Объем заявки",
          status: "failed",
          message: `Заявка содержит ${wordCount} слов (требуется минимум 100)`
        });
      }

      // Проверка ключевых слов проекта
      const projectKeywords = ['проект', 'цель', 'задача', 'результат', 'мероприятие'];
      const hasProjectKeywords = projectKeywords.some(keyword => text.includes(keyword));
      
      if (hasProjectKeywords) {
        results.push({
          criterion: "Описание проекта",
          status: "passed",
          message: "Заявка содержит описание проекта с целями и задачами"
        });
      } else {
        results.push({
          criterion: "Описание проекта",
          status: "failed",
          message: "Добавьте описание проекта с указанием целей и задач"
        });
      }

      // Проверка бюджета
      const budgetKeywords = ['бюджет', 'сумма', 'рубл', 'затрат', 'расход', 'финансиров'];
      const hasBudget = budgetKeywords.some(keyword => text.includes(keyword));
      
      if (hasBudget) {
        results.push({
          criterion: "Бюджетное обоснование",
          status: "passed",
          message: "Заявка содержит информацию о бюджете"
        });
      } else {
        results.push({
          criterion: "Бюджетное обоснование",
          status: "warning",
          message: "Рекомендуется указать планируемые расходы"
        });
      }

      // Проверка сроков
      const timeKeywords = ['срок', 'месяц', 'год', 'этап', 'период', 'время'];
      const hasTimeline = timeKeywords.some(keyword => text.includes(keyword));
      
      if (hasTimeline) {
        results.push({
          criterion: "Сроки реализации",
          status: "passed",
          message: "Заявка содержит информацию о сроках"
        });
      } else {
        results.push({
          criterion: "Сроки реализации",
          status: "warning",
          message: "Рекомендуется указать сроки реализации проекта"
        });
      }

      // Проверка социальной значимости
      const socialKeywords = ['общество', 'социальн', 'польза', 'благотворительн', 'помощь'];
      const hasSocialImpact = socialKeywords.some(keyword => text.includes(keyword));
      
      if (hasSocialImpact) {
        results.push({
          criterion: "Социальная значимость",
          status: "passed",
          message: "Заявка демонстрирует социальную значимость проекта"
        });
      } else {
        results.push({
          criterion: "Социальная значимость",
          status: "warning",
          message: "Укажите социальную значимость и пользу проекта"
        });
      }

      setCheckResults(results);
      setIsChecking(false);
      
      toast.success("Проверка завершена");
    }, 2000);
  };

  const handleSubmit = () => {
    if (!applicationText.trim()) {
      toast.error("Заполните текст заявки");
      return;
    }

    const failedChecks = checkResults.filter(r => r.status === 'failed');
    if (failedChecks.length > 0) {
      toast.error("Устраните найденные ошибки перед отправкой");
      return;
    }

    onSubmit(applicationText);
    toast.success("Заявка успешно отправлена!");
  };

  const canSubmit = checkResults.length > 0 && checkResults.filter(r => r.status === 'failed').length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Назад к каталогу
          </Button>
          <h1 className="text-3xl mb-2">Подача заявки</h1>
          <p className="text-muted-foreground">
            Грант: <span className="font-medium">{grantTitle}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Форма заявки */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Текст заявки
                </CardTitle>
                <CardDescription>
                  Опишите ваш проект, его цели, задачи, планируемые результаты и бюджет
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationText">
                      Подробное описание проекта *
                    </Label>
                    <Textarea
                      id="applicationText"
                      value={applicationText}
                      onChange={(e) => setApplicationText(e.target.value)}
                      placeholder="Напишите подробное описание вашего проекта:
                      
• Актуальность и обоснование проекта
• Цели и задачи проекта  
• Описание планируемых мероприятий
• Ожидаемые результаты
• Бюджет проекта и обоснование расходов
• Сроки реализации
• Социальная значимость проекта"
                      rows={20}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Количество слов: {applicationText.trim() ? applicationText.trim().split(/\s+/).length : 0}
                    {applicationText.trim().split(/\s+/).length < 100 && 
                      " (минимум 100 слов)"
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Панель действий */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={checkApplication}
                  disabled={isChecking || !applicationText.trim()}
                  className="w-full"
                  variant="outline"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isChecking ? "Проверяется..." : "Проверить черновик"}
                </Button>

                <Button 
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить на рассмотрение
                </Button>
                
                {!canSubmit && checkResults.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Устраните найденные ошибки для отправки заявки
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Справка */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Требования к заявке</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Минимум 100 слов</li>
                  <li>• Четкие цели и задачи</li>
                  <li>• Обоснование бюджета</li>
                  <li>• Сроки реализации</li>
                  <li>• Социальная значимость</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Результаты проверки */}
        {checkResults.length > 0 && (
          <ApplicationChecker results={checkResults} />
        )}
      </div>
    </div>
  );
}