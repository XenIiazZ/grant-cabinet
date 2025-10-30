import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, DollarSign, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

  const categories = [...new Set(grants.map(grant => grant.category))];

  const filteredGrants = grants.filter(grant => {
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         grant.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || grant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Фильтры */}
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
      </div>

      {/* Результаты поиска */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Доступные гранты</h2>
        <Badge variant="outline">
          {filteredGrants.length} {filteredGrants.length === 1 ? 'грант' : 'грантов'}
        </Badge>
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrants.map(grant => (
          <Card key={grant.id} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge className={getStatusColor(grant.status)}>
                  {getStatusText(grant.status)}
                </Badge>
                <Badge variant="outline">{grant.category}</Badge>
              </div>
              <CardTitle className="text-lg">{grant.title}</CardTitle>
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

      {filteredGrants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            По вашему запросу ничего не найдено
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              onSearchChange('');
              onCategoryChange('all');
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
}