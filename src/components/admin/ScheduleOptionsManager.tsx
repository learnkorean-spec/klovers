import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ScheduleOption {
  id: string;
  category: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "weekday", label: "Weekdays" },
  { value: "time_window", label: "Time Windows" },
  { value: "start_option", label: "Start Options" },
];

const ScheduleOptionsManager = () => {
  const [options, setOptions] = useState<ScheduleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingOption, setEditingOption] = useState<ScheduleOption | null>(null);
  const [newCategory, setNewCategory] = useState("weekday");
  const [newLabel, setNewLabel] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const fetchOptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schedule_options" as any)
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setOptions((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOptions(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast({ title: "Label required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("schedule_options" as any).insert({
      category: newCategory,
      label: newLabel.trim(),
      sort_order: newSortOrder,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Option added" });
    setShowAdd(false);
    setNewLabel("");
    setNewSortOrder(0);
    fetchOptions();
  };

  const handleUpdate = async () => {
    if (!editingOption) return;
    const { error } = await supabase.from("schedule_options" as any).update({
      label: editingOption.label,
      sort_order: editingOption.sort_order,
      is_active: editingOption.is_active,
    } as any).eq("id", editingOption.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Option updated" });
    setEditingOption(null);
    fetchOptions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("schedule_options" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Option deleted" });
    fetchOptions();
  };

  const handleToggleActive = async (opt: ScheduleOption) => {
    const { error } = await supabase.from("schedule_options" as any)
      .update({ is_active: !opt.is_active } as any)
      .eq("id", opt.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchOptions();
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: options.filter((o) => o.category === cat.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{options.length} options configured</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Option
        </Button>
      </div>

      {grouped.map((group) => {
        const isCollapsed = collapsedCategories[group.value] ?? false;
        return (
          <Collapsible key={group.value} open={!isCollapsed} onOpenChange={(open) => setCollapsedCategories(prev => ({ ...prev, [group.value]: !open }))}>
            <div className="space-y-2">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full text-left py-1">
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {group.label}
                  <Badge variant="secondary" className="ml-1 text-xs">{group.items.length}</Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((opt) => (
                      <TableRow key={opt.id}>
                        <TableCell className="font-medium">{opt.label}</TableCell>
                        <TableCell>{opt.sort_order}</TableCell>
                        <TableCell>
                          <Switch checked={opt.is_active} onCheckedChange={() => handleToggleActive(opt)} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingOption({ ...opt })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(opt.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {group.items.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No options</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Schedule Option</DialogTitle>
            <DialogDescription>Add a new weekday, time window, or start option.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Monday, Morning (9am-12pm)" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={newSortOrder} onChange={(e) => setNewSortOrder(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={handleAdd}>Add Option</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOption} onOpenChange={(open) => !open && setEditingOption(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
            <DialogDescription>Modify this schedule option.</DialogDescription>
          </DialogHeader>
          {editingOption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={editingOption.label} onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={editingOption.sort_order} onChange={(e) => setEditingOption({ ...editingOption, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingOption.is_active} onCheckedChange={(v) => setEditingOption({ ...editingOption, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button className="w-full" onClick={handleUpdate}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleOptionsManager;
