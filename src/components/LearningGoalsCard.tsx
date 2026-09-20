import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLearningGoals } from "@/hooks/useLearningGoals";
import { Plus, Trash2, Clock } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function LearningGoalsCard() {
  const {
    goals,
    createGoal,
    deleteGoal,
    getCompletionPercentage,
    getDaysRemaining,
  } = useLearningGoals();
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);

  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    type: "daily_vocab",
    value: "10",
    period: "daily",
  });

  const handleCreateGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.value) return;

    const value = parseInt(newGoal.value, 10);
    if (isNaN(value) || value <= 0) return;

    const success = await createGoal(
      newGoal.type,
      newGoal.name,
      value,
      newGoal.period
    );

    if (success) {
      setNewGoal({ name: "", type: "daily_vocab", value: "10", period: "daily" });
      setIsOpen(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
  };

  const getGoalEmoji = (goalType: string): string => {
    const emojiMap: Record<string, string> = {
      daily_vocab: "📚",
      weekly_lessons: "📖",
      monthly_xp: "⭐",
      streak_days: "🔥",
    };
    return emojiMap[goalType] || "🎯";
  };

  if (goals.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <KloverIcon name="lightbulb-sprout" className="h-14 w-14 mx-auto" />
            <p className="font-medium text-foreground">{tr("No Learning Goals Yet", "لا توجد أهداف تعلّم بعد")}</p>
            <p className="text-sm text-muted-foreground">
              {tr("Create a goal to stay motivated and track progress", "أنشئ هدفًا لتبقى متحفزًا وتتابع تقدّمك")}
            </p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2">
                  <Plus className="h-4 w-4 me-2" />
                  {tr("Create Your First Goal", "أنشئ أول هدف لك")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tr("Create a Learning Goal", "إنشاء هدف تعلّم")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">{tr("Goal Name", "اسم الهدف")}</label>
                    <Input
                      placeholder={tr("e.g., Learn 50 new words", "مثال: تعلّم 50 كلمة جديدة")}
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{tr("Goal Type", "نوع الهدف")}</label>
                    <Select value={newGoal.type} onValueChange={(value) =>
                      setNewGoal({ ...newGoal, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_vocab">{tr("Daily Vocabulary", "مفردات يومية")}</SelectItem>
                        <SelectItem value="weekly_lessons">{tr("Weekly Lessons", "دروس أسبوعية")}</SelectItem>
                        <SelectItem value="monthly_xp">{tr("Monthly XP", "نقاط شهرية")}</SelectItem>
                        <SelectItem value="streak_days">{tr("Streak Days", "أيام متتالية")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{tr("Target Value", "القيمة المستهدفة")}</label>
                    <Input
                      type="number"
                      placeholder={tr("e.g., 50", "مثال: 50")}
                      value={newGoal.value}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, value: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{tr("Time Period", "المدة")}</label>
                    <Select value={newGoal.period} onValueChange={(value) =>
                      setNewGoal({ ...newGoal, period: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{tr("Daily", "يومي")}</SelectItem>
                        <SelectItem value="weekly">{tr("Weekly", "أسبوعي")}</SelectItem>
                        <SelectItem value="monthly">{tr("Monthly", "شهري")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">
                    {tr("Create Goal", "إنشاء الهدف")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <KloverIcon name="lightbulb-sprout" className="h-7 w-7" />
          {tr("Learning Goals", "أهداف التعلّم")}
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" aria-label={tr("Add goal", "إضافة هدف")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tr("Create a Learning Goal", "إنشاء هدف تعلّم")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">{tr("Goal Name", "اسم الهدف")}</label>
                <Input
                  placeholder={tr("e.g., Learn 50 new words", "مثال: تعلّم 50 كلمة جديدة")}
                  value={newGoal.name}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">{tr("Goal Type", "نوع الهدف")}</label>
                <Select value={newGoal.type} onValueChange={(value) =>
                  setNewGoal({ ...newGoal, type: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_vocab">{tr("Daily Vocabulary", "مفردات يومية")}</SelectItem>
                    <SelectItem value="weekly_lessons">{tr("Weekly Lessons", "دروس أسبوعية")}</SelectItem>
                    <SelectItem value="monthly_xp">{tr("Monthly XP", "نقاط شهرية")}</SelectItem>
                    <SelectItem value="streak_days">{tr("Streak Days", "أيام متتالية")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{tr("Target Value", "القيمة المستهدفة")}</label>
                <Input
                  type="number"
                  placeholder={tr("e.g., 50", "مثال: 50")}
                  value={newGoal.value}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, value: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">{tr("Time Period", "المدة")}</label>
                <Select value={newGoal.period} onValueChange={(value) =>
                  setNewGoal({ ...newGoal, period: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{tr("Daily", "يومي")}</SelectItem>
                    <SelectItem value="weekly">{tr("Weekly", "أسبوعي")}</SelectItem>
                    <SelectItem value="monthly">{tr("Monthly", "شهري")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateGoal} className="w-full">
                {tr("Create Goal", "إنشاء الهدف")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const percentage = getCompletionPercentage(goal);
          const daysRemaining = getDaysRemaining(goal);

          return (
            <div
              key={goal.id}
              className="p-3 rounded-lg border border-border bg-card space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getGoalEmoji(goal.goal_type)}</span>
                    <p className="font-medium text-foreground break-words">{goal.goal_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {goal.current_progress} / {goal.target_value}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="h-6 w-6 p-0"
                  aria-label={tr("Delete goal", "حذف الهدف")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <Progress value={percentage} className="h-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr(`${percentage}% Complete`, `مكتمل ${percentage}%`)}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {tr(`${daysRemaining} days left`, `الأيام المتبقية: ${daysRemaining}`)}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
