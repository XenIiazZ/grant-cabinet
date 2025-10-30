import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, FileText, Calendar, DollarSign, Plus, Filter } from "lucide-react";

interface Application {
  id: string;
  projectTitle: string;
  grantTitle: string;
  submissionDate: string;
  status: 'черновик' | 'на_проверке' | 'одобрена' | 'отклонена';
  requestedAmount: string;
  feedback?: string;
}

interface UserDashboardProps {
  applications: Application[];
  onViewApplication: (applicationId: string) => void;
  onCreateNewApplication?: () => void;
  userName: string;
}

export function UserDashboard({ applications, onViewApplication, onCreateNewApplication, userName }: UserDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
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

  // Фильтрация заявок
  const filteredApplications = applications.filter(app => {
    const statusMatch = statusFilter === "all" || app.status === statusFilter;
    const dateMatch = !dateFilter || app.submissionDate.includes(dateFilter);
    return statusMatch && dateMatch;
  });

  const stats = {
    total: applications.length,
    draft: applications.filter(app => app.status === 'черновик').length,
    pending: applications.filter(app => app.status === 'на_проверке').length,
    approved: applications.filter(app => app.status === 'одобрена').length,
    rejected: applications.filter(app => app.status === 'отклонена').length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Заголовок и кнопка создания */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl mb-2">Мои заявки</h1>
            <p className="text-muted-foreground">
              Управляйте своими заявками на гранты
            </p>
          </div>
          <Button onClick={onCreateNewApplication} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Создать новую заявку
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Всего заявок</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Черновики</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-600">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">На проверке</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Одобрена</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Отклонена</CardTitle>
              <FileText className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры и таблица заявок */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Мои заявки ({filteredApplications.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Статус</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="черновик">Черновик</SelectItem>
                      <SelectItem value="на_проверке">На проверке</SelectItem>
                      <SelectItem value="одобрена">Одобрена</SelectItem>
                      <SelectItem value="отклонена">Отклонена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-filter">Дата подачи</Label>
                  <Input
                    id="date-filter"
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    placeholder="Выберите месяц"
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0 
                    ? "У вас пока нет поданных заявок" 
                    : "Заявки с выбранными фильтрами не найдены"
                  }
                </p>
                {applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нажмите кнопку "Создать новую заявку" выше
                  </p>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFilter("");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID заявки</TableHead>
                      <TableHead>Название гранта</TableHead>
                      <TableHead>Дата подачи</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-mono text-sm">
                          #{application.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.projectTitle}</div>
                            <div className="text-sm text-muted-foreground">
                              {application.grantTitle}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{application.submissionDate}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(application.status)}>
                            {getStatusText(application.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{application.requestedAmount}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewApplication(application.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Подробнее
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Недавняя активность */}
        {applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Последние обновления</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .slice(0, 3)
                  .map((application) => (
                    <div key={application.id} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{application.projectTitle}</span>
                          <Badge className={getStatusColor(application.status)} variant="secondary">
                            {getStatusText(application.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {application.grantTitle} • {application.submissionDate}
                        </p>
                        {application.feedback && (
                          <p className="text-sm bg-muted p-2 rounded">
                            {application.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}