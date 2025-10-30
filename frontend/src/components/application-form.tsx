import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";

interface ApplicationFormProps {
  grantTitle: string;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => void;
}

interface ApplicationFormData {
  projectTitle: string;
  organizationType: string;
  contactPerson: string;
  email: string;
  phone: string;
  requestedAmount: string;
  projectDescription: string;
  goals: string;
  timeline: string;
  budget: string;
}

export function ApplicationForm({ grantTitle, onClose, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationFormData>({
    projectTitle: '',
    organizationType: '',
    contactPerson: '',
    email: '',
    phone: '',
    requestedAmount: '',
    projectDescription: '',
    goals: '',
    timeline: '',
    budget: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Простая валидация
    if (!formData.projectTitle || !formData.contactPerson || !formData.email || !formData.projectDescription) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    onSubmit(formData);
    toast.success('Заявка успешно подана!');
    onClose();
  };

  const handleChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Подача заявки на грант</CardTitle>
        <CardDescription>
          Заявка на: {grantTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Название проекта *</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) => handleChange('projectTitle', e.target.value)}
                placeholder="Введите название проекта"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationType">Тип организации</Label>
              <Select onValueChange={(value) => handleChange('organizationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nko">НКО</SelectItem>
                  <SelectItem value="ip">ИП</SelectItem>
                  <SelectItem value="ooo">ООО</SelectItem>
                  <SelectItem value="physical">Физическое лицо</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Контактное лицо *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="ФИО"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (999) 999-99-99"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedAmount">Запрашиваемая сумма</Label>
            <Input
              id="requestedAmount"
              value={formData.requestedAmount}
              onChange={(e) => handleChange('requestedAmount', e.target.value)}
              placeholder="500 000 рублей"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">Описание проекта *</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleChange('projectDescription', e.target.value)}
              placeholder="Подробно опишите ваш проект..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Цели и задачи проекта</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
              placeholder="Опишите цели и задачи проекта..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Сроки реализации</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => handleChange('timeline', e.target.value)}
              placeholder="6 месяцев"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Бюджет проекта</Label>
            <Textarea
              id="budget"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              placeholder="Опишите основные статьи расходов..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Подать заявку
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}