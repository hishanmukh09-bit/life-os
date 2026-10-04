'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PhotoLightboxModal } from '@/components/modals/PhotoLightboxModal';

// Views
import { HomeView } from '@/components/views/HomeView';
import { DailyTimelineView } from '@/components/views/DailyTimelineView';
import { MyDayView } from '@/components/views/MyDayView';
import { TasksView } from '@/components/views/TasksView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { ClassScheduleView } from '@/components/views/ClassScheduleView';
import { TrackWellnessView } from '@/components/views/TrackWellnessView';
import { WorkoutView } from '@/components/views/WorkoutView';
import { FoodView } from '@/components/views/FoodView';
import { StudyView } from '@/components/views/StudyView';
import { HabitsView } from '@/components/views/HabitsView';
import { GoalsProgressView } from '@/components/views/GoalsProgressView';
import { SharedCalendarView } from '@/components/views/SharedCalendarView';
import { PhotoGalleryView } from '@/components/views/PhotoGalleryView';
import { GrowthReadingView } from '@/components/views/GrowthReadingView';
import { FinanceTravelView } from '@/components/views/FinanceTravelView';
import { UsSupportView } from '@/components/views/UsSupportView';
import { JournalMemoriesView } from '@/components/views/JournalMemoriesView';
import { LifeAdminView } from '@/components/views/LifeAdminView';
import { AICoachView } from '@/components/views/AICoachView';
import { SettingsView } from '@/components/views/SettingsView';
import { LandingAuthView } from '@/components/views/LandingAuthView';

export default function AppEntry() {
  const { activeView } = useLifeOS();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return <LandingAuthView onEnterApp={() => setIsAuthenticated(true)} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'HOME':
        return <HomeView />;
      case 'TIMELINE':
        return <DailyTimelineView />;
      case 'MY_DAY':
        return <MyDayView />;
      case 'TASKS':
        return <TasksView />;
      case 'PROJECTS':
        return <ProjectsView />;
      case 'SCHEDULE':
        return <ClassScheduleView />;
      case 'TRACK':
        return <TrackWellnessView />;
      case 'WORKOUT':
        return <WorkoutView />;
      case 'FOOD':
        return <FoodView />;
      case 'STUDY':
        return <StudyView />;
      case 'HABITS':
        return <HabitsView />;
      case 'GOALS':
      case 'PROGRESS':
        return <GoalsProgressView />;
      case 'CALENDAR':
        return <SharedCalendarView />;
      case 'GALLERY':
        return <PhotoGalleryView />;
      case 'GROWTH':
        return <GrowthReadingView />;
      case 'FINANCE':
        return <FinanceTravelView />;
      case 'US':
        return <UsSupportView />;
      case 'JOURNAL':
      case 'MEMORIES':
        return <JournalMemoriesView />;
      case 'LIFE_ADMIN':
        return <LifeAdminView />;
      case 'AI_COACH':
        return <AICoachView />;
      case 'SETTINGS':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Navbar />

      <div className="flex-1 flex w-full">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      <MobileNav />
      <PhotoLightboxModal />
    </div>
  );
}
