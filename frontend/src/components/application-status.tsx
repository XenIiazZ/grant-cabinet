import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, FileText, Eye } from "lucide-react";

interface Application {
  id: string;
  projectTitle: string;
  grantTitle: string;
  submissionDate: string;
  status: 'на_рассмотрении' | 'одобрено' | 'отклонено' | 'требует_доработки';
  requestedAmount: string;
  feedback?: string;
}

interface ApplicationStatusProps {
  applications: Application[];
  onViewDetails: (applicationId: string) => void;
}

export function ApplicationStatus({ applications, onViewDetails }: ApplicationStatusProps) {
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'на_рассмотрении':
        return 'bg-yellow-100 text-yellow-800';
      case 'одобрено':
        return 'bg-green-100 text-green-800';
      case 'отклонено':
        return 'bg-red-100 text-red-800';
      case 'требует_доработки':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'на_рассмотрении':
        return 'На рассмотрении';
      case 'одобрено':
        return 'Одобрено';
      case 'отклонено':
        return 'Отклонено';
      case 'требует_доработки':
        return 'Требует доработки';
    }
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>У вас пока нет поданных заявок</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg">{application.projectTitle}</CardTitle>
                <CardDescription>{application.grantTitle}</CardDescription>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {getStatusText(application.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Подано: {application.submissionDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-green-600" />
                <span>Сумма: {application.requestedAmount}</span>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(application.id)}
                  className="w-full md:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Подробнее
                </Button>
              </div>
            </div>
            {application.feedback && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">Комментарий экспертов:</h4>
                <p className="text-sm text-muted-foreground">{application.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}