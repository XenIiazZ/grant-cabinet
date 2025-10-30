import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface CheckResult {
  criterion: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

interface ApplicationCheckerProps {
  results: CheckResult[];
}

export function ApplicationChecker({ results }: ApplicationCheckerProps) {
  if (results.length === 0) {
    return null;
  }

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: CheckResult['status']) => {
    switch (status) {
      case 'passed':
        return 'Соответствует';
      case 'failed':
        return 'Не соответствует';
      case 'warning':
        return 'Требует внимания';
    }
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Результаты проверки
          <div className="flex gap-2">
            {passedCount > 0 && (
              <Badge className="bg-green-100 text-green-800">
                ✓ {passedCount}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                ⚠ {warningCount}
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                ✗ {failedCount}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="mt-0.5">
                {getStatusIcon(result.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{result.criterion}</span>
                  <Badge className={getStatusColor(result.status)} variant="secondary">
                    {getStatusText(result.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            </div>
          ))}
          
          {failedCount === 0 && warningCount === 0 && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                Заявка готова к отправке!
              </p>
              <p className="text-green-700 text-sm">
                Все критерии соблюдены
              </p>
            </div>
          )}
          
          {failedCount > 0 && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-medium">
                Требуется доработка
              </p>
              <p className="text-red-700 text-sm">
                Устраните найденные ошибки перед отправкой
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}