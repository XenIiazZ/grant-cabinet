import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, DollarSign, Search, Filter, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface Grant {
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

interface GrantCatalogProps {
  grants: Grant[];
  onApplyToGrant: (grantId: string, grantTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function GrantCatalog({ 
  grants, 
  onApplyToGrant, 
  searchQuery, 
  onSearchChange,
  selectedCategory,
  onCategoryChange
}: GrantCatalogProps) {
  // Новые состояния для расширенных фильтров
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const getStatusColor = (status: Grant['status']) => {
    switch (status) {
      case 'открыт':
        return 'bg-green-100 text-green-800';
      case 'скоро_закрывается':
        return 'bg-yellow-100 text-yellow-800';
      case 'закрыт':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Grant['status']) => {
    switch (status) {
      case 'открыт':
        return 'Открыт';
      case 'скоро_закрывается':
        return 'Скоро закрывается';
      case 'закрыт':
        return 'Закрыт';
    }
  };

  // Функция для парсинга суммы из строки (например, "2 000 000 ₽" -> 2000000)
  const parseAmount = (amountStr: string): number => {
    const match = amountStr.match(/(\d+(?:\s\d+)*)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/\s/g, ''));
  };

  const categories = [...new Set(grants.map(grant => grant.category))];
  const statuses = ['открыт', 'скоро_закрывается', 'закрыт'];

  // Применяем все фильтры
  const filteredGrants = grants.filter(grant => {
    // Поиск по тексту
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         grant.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Фильтр по категории
    const matchesCategory = selectedCategory === 'all' || selectedCategory === '' || grant.category === selectedCategory;
    
    // Фильтр по статусу
    const matchesStatus = !selectedStatus || grant.status === selectedStatus;
    
    // Фильтр по сумме
    const grantAmount = parseAmount(grant.amount);
    const matchesMinAmount = !minAmount || grantAmount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || grantAmount <= parseFloat(maxAmount);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesMinAmount && matchesMaxAmount;
  });

  // Сортировка
  const sortedGrants = [...filteredGrants].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'deadline':
        aValue = new Date(a.deadline).getTime();
        bValue = new Date(b.deadline).getTime();
        break;
      case 'amount':
        aValue = parseAmount(a.amount);
        bValue = parseAmount(b.amount);
        break;
      case 'applicants':
        aValue = a.applicants;
        bValue = b.applicants;
        break;
      default:
        aValue = a.title;
        bValue = b.title;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const resetFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    setSelectedStatus('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('title');
    setSortOrder('asc');
  };

  const hasActiveFilters = searchQuery || 
    (selectedCategory !== 'all' && selectedCategory !== '') || 
    selectedStatus || minAmount || maxAmount;

  return (
    <div className="space-y-6">
      {/* Основные фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск грантов..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showAdvancedFilters ? 'Скрыть фильтры' : 'Расширенный фильтр'}
        </Button>
      </div>

      {/* Расширенные фильтры */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Фильтр по статусу */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Статус
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все статусы</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === 'открыт' ? 'Открыт' : 
                       status === 'скоро_закрывается' ? 'Скоро закрывается' : 'Закрыт'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Фильтр по сумме от */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Сумма от (₽)
              </label>
              <Input
                type="number"
                placeholder="Минимальная сумма"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            {/* Фильтр по сумме до */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Сумма до (₽)
              </label>
              <Input
                type="number"
                placeholder="Максимальная сумма"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Сортировка */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Сортировать по
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Названию</SelectItem>
                  <SelectItem value="deadline">Сроку подачи</SelectItem>
                  <SelectItem value="amount">Сумме гранта</SelectItem>
                  <SelectItem value="applicants">Количеству заявок</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Порядок
              </label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">По возрастанию</SelectItem>
                  <SelectItem value="desc">По убыванию</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Результаты поиска */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Доступные гранты</h2>
        <Badge variant="outline">
          {sortedGrants.length} {sortedGrants.length === 1 ? 'грант' : 'грантов'}
        </Badge>
      </div>

      {/* Кнопка сброса фильтров */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-600">
            <X className="h-4 w-4 mr-1" />
            Сбросить все фильтры
          </Button>
        </div>
      )}

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGrants.map(grant => (
          <Card key={grant.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge className={getStatusColor(grant.status)}>
                  {getStatusText(grant.status)}
                </Badge>
                <Badge variant="outline">{grant.category}</Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{grant.title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {grant.organization}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm mb-4 line-clamp-3">{grant.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>до {grant.amount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Срок: {grant.deadline}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>{grant.applicants} заявок</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => onApplyToGrant(grant.id, grant.title)}
                disabled={grant.status === 'закрыт'}
                className="w-full"
              >
                {grant.status === 'закрыт' ? 'Прием заявок закрыт' : 'Подать заявку'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {sortedGrants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            По вашему запросу ничего не найдено
          </p>
          <Button 
            variant="outline" 
            onClick={resetFilters}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
}