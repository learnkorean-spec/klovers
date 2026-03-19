# Enhance SchedulingManager with Suggestion Modal

## Overview
This guide explains how to add a "Suggest Packages" feature to the existing `SchedulingManager` component. This feature shows which schedule packages should be created based on:
1. Teacher availability (from `teacher_availability` table)
2. Student preferences (from `student_package_preferences`)
3. Existing packages (from `schedule_packages`)

## Current State
- `src/components/admin/SchedulingManager.tsx` allows admins to create, edit, and delete schedule packages
- File size: ~68KB
- Main functions: Adding/editing packages, toggling active status, managing groups

## Changes Required

### 1. Add Imports
**File**: `src/components/admin/SchedulingManager.tsx`

Add at the top with other imports:
```typescript
import { getSuggestedPackages, formatSuggestion } from "@/lib/scheduleAutomation";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Lightbulb, Plus } from "lucide-react";
```

### 2. Add State for Suggestions
Inside the SchedulingManager component, add:
```typescript
const [suggestions, setSuggestions] = useState<SuggestedPackage[]>([]);
const [suggestionsLoading, setSuggestionsLoading] = useState(false);
const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
```

### 3. Add Function to Load Suggestions
```typescript
const handleLoadSuggestions = async () => {
  try {
    setSuggestionsLoading(true);
    const suggested = await getSuggestedPackages(userId!, uniqueLevels);
    setSuggestions(suggested);
    setShowSuggestionsDialog(true);
  } catch (error) {
    console.error("Error loading suggestions:", error);
    toast({
      title: "Error",
      description: "Failed to load suggestions",
      variant: "destructive",
    });
  } finally {
    setSuggestionsLoading(false);
  }
};
```

### 4. Add Quick-Add Function
```typescript
const handleQuickAddPackage = async (suggestion: SuggestedPackage) => {
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][suggestion.day_of_week];

  try {
    // Create the schedule package
    const { error } = await supabase
      .from("schedule_packages")
      .insert({
        level: suggestion.level,
        day_of_week: suggestion.day_of_week,
        start_time: suggestion.start_time,
        duration_min: 90, // Default, can be customized
        timezone: "Africa/Cairo",
        capacity: 5, // Default, can be customized
        is_active: true,
        course_type: "group",
      });

    if (error) throw error;

    toast({
      title: "Success",
      description: `Added ${suggestion.level} on ${dayName} at ${suggestion.start_time}`,
    });

    // Refresh the packages list
    await fetchPackages();

    // Remove from suggestions
    setSuggestions(suggestions.filter(s => s !== suggestion));
  } catch (error) {
    console.error("Error creating package:", error);
    toast({
      title: "Error",
      description: "Failed to create package",
      variant: "destructive",
    });
  }
};
```

### 5. Add Button to Trigger Suggestions
In the render section of SchedulingManager, add a button near the "Add Package" button:

```typescript
<div className="flex gap-2 mb-4">
  <Button onClick={handleAddPackage}>
    <Plus className="h-4 w-4 mr-2" />
    Add Package Manually
  </Button>
  <Button
    variant="secondary"
    onClick={handleLoadSuggestions}
    disabled={suggestionsLoading}
  >
    <Lightbulb className="h-4 w-4 mr-2" />
    {suggestionsLoading ? "Loading..." : "View Suggestions"}
  </Button>
</div>
```

### 6. Add Suggestions Dialog
Add this modal component after the existing form dialogs:

```typescript
<Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
  <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Suggested Schedule Packages</DialogTitle>
      <DialogDescription>
        Based on your availability and student preferences. Click "Add" to create any of these packages.
      </DialogDescription>
    </DialogHeader>

    {suggestions.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        All suggested packages already exist! Your availability is fully covered.
      </p>
    ) : (
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition"
          >
            <div className="flex-1">
              <div className="font-semibold">
                {suggestion.level} • {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][suggestion.day_of_week]} @ {suggestion.start_time}
              </div>
              <div className="text-sm text-muted-foreground">
                {suggestion.studentCount > 0 ? (
                  <span className="text-green-600 font-medium">
                    {suggestion.studentCount} {suggestion.studentCount === 1 ? 'student' : 'students'} want this slot
                  </span>
                ) : (
                  <span>No requests yet, but available per your schedule</span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleQuickAddPackage(suggestion)}
              disabled={suggestion.existsAlready}
            >
              {suggestion.existsAlready ? "Exists" : "Add"}
            </Button>
          </div>
        ))}
      </div>
    )}
  </DialogContent>
</Dialog>
```

## Integration Checklist

After adding the above:

- [ ] Import statements added correctly
- [ ] State variables added for suggestions
- [ ] Load suggestions function works
- [ ] Quick-add function creates packages correctly
- [ ] Suggestion button appears in UI
- [ ] Dialog opens and shows suggestions
- [ ] Packages created through "Add" button appear in the main list
- [ ] Suggestions update after adding a package
- [ ] Error handling works for failed additions
- [ ] UI matches existing Klovers design

## Testing Scenarios

1. **No teacher availability set**: Suggestions should be empty
2. **Teacher availability set, no packages**: All available slots should appear as suggestions
3. **Some packages exist**: Only missing slots should appear as suggestions
4. **Students have preferences**: Suggestions should highlight slots with high student demand
5. **Quick-add**: Clicking "Add" should create package and remove from suggestions

## Notes

- The `getSuggestedPackages` function is in `src/lib/scheduleAutomation.ts`
- Format suggestion text using `formatSuggestion()` helper if needed
- Default duration is 90 minutes; can be made customizable per admin preference
- Default capacity is 5; can be made customizable per admin preference
- Timezone defaults to "Africa/Cairo"; can be made configurable

## Optional Enhancements

1. **Customize package details**: Allow admin to set duration/capacity in the quick-add modal
2. **Bulk add**: Add checkboxes to select multiple suggestions and add them at once
3. **Auto-suggest**: Show top suggestions on dashboard load
4. **Notification**: Alert admin when N students request a time slot
