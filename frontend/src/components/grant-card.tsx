import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, DollarSign } from "lucide-react";

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

interface GrantCardProps {
  grant: Grant;
  onApply: (grantId: string) => void;
}

export function GrantCard({ grant, onApply }: GrantCardProps) {
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

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
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
        <p className="text-sm mb-4">{grant.description}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>до {grant.amount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Срок подачи: {grant.deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-purple-600" />
            <span>{grant.applicants} заявок</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onApply(grant.id)}
          disabled={grant.status === 'закрыт'}
          className="w-full"
        >
          {grant.status === 'закрыт' ? 'Прием заявок закрыт' : 'Подать заявку'}
        </Button>
      </CardFooter>
    </Card>
  );
}