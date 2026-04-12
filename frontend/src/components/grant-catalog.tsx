import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, DollarSign, Search, Filter, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState, useEffect } from "react";
import { apiService } from "../services/api";

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
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  minAmount?: string;
  onMinAmountChange?: (amount: string) => void;
  maxAmount?: string;
  onMaxAmountChange?: (amount: string) => void;
  sortBy?: string;
  onSortByChange?: (sortBy: string) => void;
  sortOrder?: 'asc' | 'desc';
  onSortOrderChange?: (order: 'asc' | 'desc') => void;
}

export function GrantCatalog({ 
  grants, 
  onApplyToGrant, 
  searchQuery, 
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus = "all",
  onStatusChange = () => {},
  minAmount = "",
  onMinAmountChange = () => {},
  maxAmount = "",
  onMaxAmountChange = () => {},
  sortBy = "title",
  onSortByChange = () => {},
  sortOrder = "asc",
  onSortOrderChange = () => {}
}: GrantCatalogProps) {
  // Расширенные фильтры
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Валюта
  const [currency, setCurrency] = useState<"RUB" | "USD" | "EUR">("RUB");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Загрузка курсов валют
  // Вместо currency используйте всегда "RUB" как базу
  const loadExchangeRates = async () => {
    setRatesLoading(true);
    try {
      // Запрашиваем курсы относительно RUB
      const response = await apiService.currency.getRates("RUB");
      // response.data.rates = { USD: 0.013, EUR: 0.011, RUB: 1.0 }
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error("Ошибка загрузки курсов:", error);
      setExchangeRates({ USD: 0.013, EUR: 0.011, RUB: 1.0 });
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeRates();
  }, [currency]);

  // Парсинг суммы из строки (например "2 000 000 ₽" -> 2000000)
  const parseAmount = (amountStr: string): number => {
    const match = amountStr.match(/(\d+(?:\s\d+)*)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/\s/g, ''));
  };

  // Конвертация суммы в выбранную валюту
  // Конвертация суммы в выбранную валюту
  
  const convertAmount = (amountRUB: string): string => {
    if (currency === "RUB" || !exchangeRates) return amountRUB;
    
    const numeric = parseAmount(amountRUB);
    // Курс уже правильный: exchangeRates["USD"] = 0.013 (сколько долларов за 1 рубль)
    const converted = numeric * (exchangeRates[currency] || 1);
    
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(converted);
  };

  const getStatusColor = (status: Grant['status']) => {
    switch (status) {
      case 'открыт': return 'bg-green-100 text-green-800';
      case 'скоро_закрывается': return 'bg-yellow-100 text-yellow-800';
      case 'закрыт': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Grant['status']) => {
    switch (status) {
      case 'открыт': return 'Открыт';
      case 'скоро_закрывается': return 'Скоро закрывается';
      case 'закрыт': return 'Закрыт';
    }
  };

  const categories = [...new Set(grants.map(grant => grant.category))];
  const statuses = [
    { value: "all", label: "Все статусы" },
    { value: "открыт", label: "Открыт" },
    { value: "скоро_закрывается", label: "Скоро закрывается" },
    { value: "закрыт", label: "Закрыт" }
  ];

  // Фильтрация
  const filteredGrants = grants.filter(grant => {
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         grant.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || selectedCategory === '' || grant.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || grant.status === selectedStatus;
    const grantAmount = parseAmount(grant.amount);
    const matchesMinAmount = !minAmount || grantAmount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || grantAmount <= parseFloat(maxAmount);
    return matchesSearch && matchesCategory && matchesStatus && matchesMinAmount && matchesMaxAmount;
  });

  // Сортировка
  const sortedGrants = [...filteredGrants].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortBy) {
      case 'title': aValue = a.title; bValue = b.title; break;
      case 'deadline': aValue = new Date(a.deadline).getTime(); bValue = new Date(b.deadline).getTime(); break;
      case 'amount': aValue = parseAmount(a.amount); bValue = parseAmount(b.amount); break;
      case 'applicants': aValue = a.applicants; bValue = b.applicants; break;
      default: aValue = a.title; bValue = b.title;
    }
    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    else return aValue < bValue ? 1 : -1;
  });

  const resetFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onStatusChange("all");
    onMinAmountChange('');
    onMaxAmountChange('');
    onSortByChange('title');
    onSortOrderChange('asc');
  };

  const hasActiveFilters = searchQuery || 
    (selectedCategory !== 'all' && selectedCategory !== '') || 
    selectedStatus !== "all" || minAmount || maxAmount;

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
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Переключатель валют */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Валюта:</span>
          <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RUB">₽ RUB</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">€ EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Статус</label>
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Сумма от (₽)</label>
              <Input
                type="number"
                placeholder="Минимальная сумма"
                value={minAmount}
                onChange={(e) => onMinAmountChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Сумма до (₽)</label>
              <Input
                type="number"
                placeholder="Максимальная сумма"
                value={maxAmount}
                onChange={(e) => onMaxAmountChange(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Сортировать по</label>
              <Select value={sortBy} onValueChange={onSortByChange}>
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
              <label className="text-sm font-medium text-gray-700 block mb-2">Порядок</label>
              <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v as 'asc' | 'desc')}>
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
        <Badge variant="outline">{sortedGrants.length} {sortedGrants.length === 1 ? 'грант' : 'грантов'}</Badge>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-600">
            <X className="h-4 w-4 mr-1" /> Сбросить все фильтры
          </Button>
        </div>
      )}

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGrants.map(grant => (
          <Card key={grant.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge className={getStatusColor(grant.status)}>{getStatusText(grant.status)}</Badge>
                <Badge variant="outline">{grant.category}</Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{grant.title}</CardTitle>
              <CardDescription className="text-muted-foreground">{grant.organization}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm mb-4 line-clamp-3">{grant.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>до {convertAmount(grant.amount)}</span>
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
          <p className="text-muted-foreground mb-4">По вашему запросу ничего не найдено</p>
          <Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button>
        </div>
      )}
    </div>
  );
}