'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { MealItem, Visibility } from '@/types';
import {
  Utensils,
  Plus,
  Sparkles,
  Camera,
  Clock,
  Flame,
  Shield,
  Heart,
  AlertCircle
} from 'lucide-react';

export function FoodView() {
  const { currentUser, meals, addMeal } = useLifeOS();

  const [nlInput, setNlInput] = useState('');
  const [naturalLoading, setNaturalLoading] = useState(false);
  const [mealCategory, setMealCategory] = useState<MealItem['mealType']>('Lunch');
  const [foodText, setFoodText] = useState('');
  const [calories, setCalories] = useState<number>(450);
  const [portion, setPortion] = useState('1 bowl');
  const [photoUrl, setPhotoUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('SHARED');

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

    setFoodText('');
    setPhotoUrl('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h1 className="text-2xl font-extrabold tracking-tight">Food & Nourishment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mindful meal tracking, natural language food logging, and collaborative nutrition.
        </p>
      </div>

      {/* 1. Natural Language Logging AI Box */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Smart Food Logger</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Type naturally what you ate (e.g. &ldquo;I ate two scrambled eggs, sliced avocado, and sourdough toast&rdquo;) and AI will structure the entry automatically.
        </p>

        <form onSubmit={handleNaturalLanguageSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="What did you nourish yourself with?"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Meals List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            Today&apos;s Nourishment Entries
          </h2>

          <div className="space-y-3">
            {meals.map((meal) => (
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
            ))}
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
