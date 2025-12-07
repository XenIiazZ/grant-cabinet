import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ArrowLeft, FileText, Calendar, DollarSign, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

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

interface ApplicationDetailsProps {
  application: Application;
  onBack: () => void;
}

export function ApplicationDetails({ application, onBack }: ApplicationDetailsProps) {
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'черновик':
        return 'bg-gray-100 text-gray-800';
      case 'на_проверке':
        return 'bg-yellow-100 text-yellow-800';
      case 'одобрена':
        return 'bg-green-100 text-green-800';
      case 'отклонена':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'черновик':
        return 'Черновик';
      case 'на_проверке':
        return 'На проверке';
      case 'одобрена':
        return 'Одобрена';
      case 'отклонена':
        return 'Отклонена';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Навигация */}
        <div>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к моим заявкам
          </Button>
        </div>

        {/* Заголовок */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl">{application.projectTitle}</h1>
            <Badge className={getStatusColor(application.status)}>
              {getStatusText(application.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Заявка #{application.id}
          </p>
        </div>

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о заявке</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Грант
                </div>
                <p className="font-medium">{application.grantTitle}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Дата подачи
                </div>
                <p className="font-medium">{application.submissionDate}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Запрашиваемая сумма
                </div>
                <p className="font-medium">{application.requestedAmount}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Статус
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {getStatusText(application.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Текст заявки */}
        {application.applicationText && (
          <Card>
            <CardHeader>
              <CardTitle>Текст заявки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{application.applicationText}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Результаты проверки ИИ */}
        {application.aiCheckResults && (
          <Card>
            <CardHeader>
              <CardTitle>Результаты автоматической проверки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <CriteriaItem
                  title="Релевантность проекта"
                  passed={application.aiCheckResults.relevance.passed}
                  comment={application.aiCheckResults.relevance.comment}
                />
                <Separator />
                <CriteriaItem
                  title="Ясность изложения"
                  passed={application.aiCheckResults.clarity.passed}
                  comment={application.aiCheckResults.clarity.comment}
                />
                <Separator />
                <CriteriaItem
                  title="Обоснованность бюджета"
                  passed={application.aiCheckResults.budget.passed}
                  comment={application.aiCheckResults.budget.comment}
                />
                <Separator />
                <CriteriaItem
                  title="Реалистичность плана"
                  passed={application.aiCheckResults.feasibility.passed}
                  comment={application.aiCheckResults.feasibility.comment}
                />
                <Separator />
                <CriteriaItem
                  title="Социальная значимость"
                  passed={application.aiCheckResults.impact.passed}
                  comment={application.aiCheckResults.impact.comment}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Обратная связь */}
        {application.feedback && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Комментарий экспертов:</strong>
              {application.feedback}
            </AlertDescription>
          </Alert>
        )}

        {/* Действия */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 sm:flex-none">
            Вернуться к списку
          </Button>
          {application.status === 'черновик' && (
            <Button className="flex-1 sm:flex-none">
              Редактировать заявку
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Вспомогательный компонент для отображения критериев
function CriteriaItem({ title, passed, comment }: { title: string; passed: boolean; comment: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium mb-1">{title}</div>
        <p className="text-sm text-muted-foreground">{comment}</p>
      </div>
    </div>
  );
}
