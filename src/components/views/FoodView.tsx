'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { MealItem, MealSlot, Visibility } from '@/types';
import {
  Utensils,
  Plus,
  Sparkles,
  Camera,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  Users,
  AlertCircle,
  Coffee,
  Sun,
  Moon,
  Sunrise,
  Check,
  Edit2
} from 'lucide-react';

const MEAL_SLOTS: { slot: MealSlot; label: string; timeHint: string; icon: any; color: string }[] = [
  { slot: 'BREAKFAST', label: 'Morning / Breakfast', timeHint: '7:00 AM – 10:30 AM', icon: Sunrise, color: 'text-amber-500' },
  { slot: 'LUNCH', label: 'Lunch', timeHint: '12:30 PM – 2:30 PM', icon: Sun, color: 'text-orange-500' },
  { slot: 'SNACK', label: 'Snacks & Tea', timeHint: '4:00 PM – 6:00 PM', icon: Coffee, color: 'text-rose-500' },
  { slot: 'DINNER', label: 'Dinner', timeHint: '7:30 PM – 10:00 PM', icon: Moon, color: 'text-indigo-500' }
];

export function FoodView() {
  const { currentUser, partnerUser, meals, addMeal, dailyMealChecks, toggleMealCheck } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'mine' | 'partner'>('mine');
  const [dishInputs, setDishInputs] = useState<Record<string, string>>({});
  const [editingSlot, setEditingSlot] = useState<MealSlot | null>(null);

  // Form states for manual & natural language logging
  const [nlInput, setNlInput] = useState('');
  const [naturalLoading, setNaturalLoading] = useState(false);
  const [mealCategory, setMealCategory] = useState<MealItem['mealType']>('Lunch');
  const [foodText, setFoodText] = useState('');
  const [calories, setCalories] = useState<number>(450);
  const [portion, setPortion] = useState('1 bowl');
  const [photoUrl, setPhotoUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('SHARED');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to get check status for user & slot today
  const getMealCheck = (userId: string, slot: MealSlot) => {
    return dailyMealChecks.find(c => c.userId === userId && c.date === todayStr && c.slot === slot);
  };

  const handleToggleMeal = (slot: MealSlot, forUserId?: string) => {
    const dish = dishInputs[slot] || undefined;
    toggleMealCheck(slot, dish, forUserId);
    setEditingSlot(null);
  };

  const handleNaturalLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim()) return;
    setNaturalLoading(true);

    const parsed = AIService.parseMealNaturalLanguage(nlInput);
    addMeal({
      mealType: parsed.mealType,
      food: parsed.food,
      portion: parsed.portion,
      estimatedCalories: parsed.estimatedCalories,
      visibility: 'SHARED',
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())
    });

    // Also mark the corresponding slot as eaten automatically!
    const slotMap: Record<string, MealSlot> = {
      'Breakfast': 'BREAKFAST',
      'Lunch': 'LUNCH',
      'Snack': 'SNACK',
      'Dinner': 'DINNER'
    };
    const correspondingSlot = slotMap[parsed.mealType];
    if (correspondingSlot) {
      toggleMealCheck(correspondingSlot, parsed.food);
    }

    setNlInput('');
    setNaturalLoading(false);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodText.trim()) return;

    addMeal({
      mealType: mealCategory,
      food: foodText.trim(),
      portion,
      estimatedCalories: calories,
      photoUrl: photoUrl.trim() || undefined,
      visibility,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())
    });

    const slotMap: Record<string, MealSlot> = {
      'Breakfast': 'BREAKFAST',
      'Lunch': 'LUNCH',
      'Snack': 'SNACK',
      'Dinner': 'DINNER'
    };
    const correspondingSlot = slotMap[mealCategory];
    if (correspondingSlot) {
      toggleMealCheck(correspondingSlot, foodText.trim());
    }

    setFoodText('');
    setPhotoUrl('');
  };

  const myMealsCount = MEAL_SLOTS.filter(s => getMealCheck(currentUser.id, s.slot)?.had).length;
  const partnerMealsCount = partnerUser ? MEAL_SLOTS.filter(s => getMealCheck(partnerUser.id, s.slot)?.had).length : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Utensils className="h-6 w-6 text-primary" />
            <span>Daily Food & Nutrition</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live synchronized meal tracker: check off morning, lunch, snacks, and dinner in real-time.
          </p>
        </div>

        {/* Real-time Partner Awareness Pill */}
        {partnerUser && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">{partnerUser.name.split(' ')[0]}&apos;s Nutrition</span>
              <span className="text-xs font-extrabold text-foreground">{partnerMealsCount} of 4 meals eaten</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {Math.round((partnerMealsCount / 4) * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* 1. DAILY MEAL CHECKLIST (Morning, Lunch, Snacks, Dinner: Had or Not) */}
      <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Today&apos;s Meal Status (Have you had it?)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              1-tap toggle to update and synchronize across both your phone and laptop instantly.
            </p>
          </div>

          {/* User View Selector */}
          {partnerUser && (
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'mine' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {currentUser.name.split(' ')[0]} ({myMealsCount}/4)
              </button>
              <button
                onClick={() => setActiveTab('partner')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'partner' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {partnerUser.name.split(' ')[0]} ({partnerMealsCount}/4)
              </button>
            </div>
          )}
        </div>

        {/* 4 Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MEAL_SLOTS.map((slotItem) => {
            const Icon = slotItem.icon;
            const targetUser = activeTab === 'mine' ? currentUser : (partnerUser || currentUser);
            const check = getMealCheck(targetUser.id, slotItem.slot);
            const isHad = Boolean(check?.had);
            const isEditing = editingSlot === slotItem.slot;

            return (
              <div
                key={slotItem.slot}
                className={`relative rounded-2xl border p-4 transition-all space-y-3 ${
                  isHad
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-xs'
                    : 'border-border/70 bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isHad ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-foreground">{slotItem.label}</h3>
                      <span className="text-[10px] text-muted-foreground block">{slotItem.timeHint}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isHad
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isHad ? 'EATEN' : 'NOT YET'}
                  </span>
                </div>

                {/* Status details & Dish name */}
                <div className="min-h-[36px] text-xs">
                  {isHad ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <Check className="h-3 w-3" />
                        <span>Had at {check?.time || 'Today'}</span>
                      </div>
                      <p className="text-foreground font-medium truncate text-xs">
                        {check?.dishName || 'Meal confirmed'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-[11px] italic">
                      Not logged yet. Tap button below when eaten.
                    </p>
                  )}
                </div>

                {/* Dish name inline input if editing */}
                {isEditing && (
                  <div className="space-y-1 pt-1 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="What did you eat? (e.g. Oats)"
                      value={dishInputs[slotItem.slot] || ''}
                      onChange={(e) => setDishInputs({ ...dishInputs, [slotItem.slot]: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 border-t border-border/40 flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleMeal(slotItem.slot, targetUser.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                      isHad
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-primary text-primary-foreground shadow-xs hover:opacity-95'
                    }`}
                  >
                    {isHad ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Had it (Tap to undo)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Mark as Had</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingSlot(isEditing ? null : slotItem.slot)}
                    title="Add or edit dish name"
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Natural Language Food Logger */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Quick AI Food Logger</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Type naturally what you ate (e.g. &ldquo;Ate 2 scrambled eggs, avocado toast, and green tea for breakfast&rdquo;) and AI will log calories and tick the meal checklist automatically.
        </p>

        <form onSubmit={handleNaturalLanguageSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="What did you nourish yourself with today?"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={naturalLoading || !nlInput.trim()}
            className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50"
          >
            Log Meal
          </button>
        </form>
      </div>

      {/* 3. Detailed Meals History & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Meals List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            <span>Today&apos;s Detailed Nutrition Log</span>
          </h2>

          <div className="space-y-3">
            {meals.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-border/60 bg-card text-muted-foreground text-xs">
                No individual detailed meals added yet today. Use the meal checklist above to tick off your meals!
              </div>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-start justify-between p-4 rounded-2xl border border-border bg-card shadow-2xs gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                        {meal.mealType}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {meal.time}
                      </span>
                      {meal.visibility === 'SHARED' && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                          Shared
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{meal.food}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      {meal.portion && <span>Portion: {meal.portion}</span>}
                      {meal.estimatedCalories && (
                        <span className="flex items-center gap-1 font-semibold text-amber-500">
                          <Flame className="h-3 w-3" /> ~{meal.estimatedCalories} kcal (Estimated)
                        </span>
                      )}
                    </div>
                  </div>

                  {meal.photoUrl && (
                    <img
                      src={meal.photoUrl}
                      alt={meal.food}
                      className="h-16 w-16 rounded-xl object-cover border border-border"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dietary Profile & Recommendations */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-foreground">Dietary Preferences</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Preference</span>
                <span className="font-semibold capitalize text-foreground">{currentUser.dietaryPreference || 'Omnivore'}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Allergies</span>
                <span className="font-semibold text-rose-500">{currentUser.allergies?.join(', ') || 'None declared'}</span>
              </div>
              <div className="pt-1">
                <span className="text-muted-foreground">Favorites</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentUser.favoriteFoods?.map(fav => (
                    <span key={fav} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-[11px]">
                      {fav}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-primary" /> Health First Philosophy
            </p>
            <p>
              LIFE OS prioritizes joyful, sustained vitality over restrictive diets. All nutrition figures are approximate guidelines.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
