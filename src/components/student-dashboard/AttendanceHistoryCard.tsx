import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarCheck, ChevronDown } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AttendanceDate } from "./types";

// Moved out of StudentDashboard.tsx as part of splitting that 1300-line page
// into per-component files — behavior and markup are unchanged.
export const AttendanceHistoryCard = ({ dates }: { dates: AttendanceDate[] }) => {
  const { t, tInterpolate, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const dateLocale = language === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <KloverIcon name="calendar-check" className="h-7 w-7" />
                {tInterpolate(t("dashboardPage.attendanceHistory"), { count: dates.length })}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-1">
              {dates.map((d, i) => (
                <div key={`${d.date}-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-end">{i + 1}.</span>
                    <CalendarCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(d.date + "T00:00:00").toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AttendanceHistoryCard;
