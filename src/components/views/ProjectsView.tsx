'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { ProjectItem } from '@/types';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  LifeBuoy
} from 'lucide-react';

export function ProjectsView() {
  const {
    currentUser,
    projects,
    addProject,
    toggleProjectMilestone,
    addMilestoneToProject,
    requestHelp
  } = useLifeOS();

  const [showAddProject, setShowAddProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-11-20');
  const [isShared, setIsShared] = useState(true);

  // AI Subtask Breakdown Assistant State
  const [aiBreakdownModal, setAiBreakdownModal] = useState<ProjectItem | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    'Research kinematics libraries & C++ dependencies',
    'Design 3D printable end-effector gripper',
    'Configure ROS 2 MoveIt trajectory controller',
    'Write documentation and video demo report'
  ]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addProject(newTitle.trim(), newDesc.trim(), newDeadline, isShared);
    setNewTitle('');
    setNewDesc('');
    setShowAddProject(false);
  };

  const handleAdoptAISubtasks = (project: ProjectItem) => {
    addMilestoneToProject(project.id, 'AI Structured Milestone Plan', aiSuggestions);
    setAiBreakdownModal(null);
  };

  const handleTriggerBlockerHelp = (project: ProjectItem) => {
    requestHelp('Technical', `Project "${project.title}" is blocked: ${project.blockerReason || 'Needs component delivery'}`);
    alert('Blocker help notification sent to partner! ❤️');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Project Mode & Milestones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured student projects with milestones, subtasks, blocker tracking & AI breakdowns.
          </p>
        </div>

        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.map((proj) => (
          <div key={proj.id} className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
            
            {/* Project Top Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                    Project &bull; {proj.status}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Target: {proj.deadline}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{proj.title}</h2>
                <p className="text-xs text-muted-foreground">{proj.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-primary">{proj.progress}% Done</span>
                  <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setAiBreakdownModal(proj)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Breakdown</span>
                </button>
              </div>
            </div>

            {/* Blockers alert if present */}
            {proj.blockerReason && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span><strong>Blocked:</strong> {proj.blockerReason}</span>
                </div>
                <button
                  onClick={() => handleTriggerBlockerHelp(proj)}
                  className="px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 hover:opacity-90"
                >
                  Ask Partner for Help
                </button>
              </div>
            )}

            {/* Milestones & Tasks Hierarchy */}
            <div className="space-y-4 pt-1">
              <span className="text-xs font-bold text-foreground uppercase text-[10px] tracking-wider">
                Milestones & Subtasks ({proj.milestones.length})
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proj.milestones.map((ms) => (
                  <div key={ms.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => toggleProjectMilestone(proj.id, ms.id)}
                        className="flex items-center gap-2 cursor-pointer font-bold text-foreground"
                      >
                        {ms.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={ms.completed ? 'line-through text-muted-foreground' : ''}>{ms.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{ms.tasks.filter(t => t.completed).length}/{ms.tasks.length}</span>
                    </div>

                    <div className="space-y-1.5 pl-6 border-l border-border/60 ml-2">
                      {ms.tasks.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className={t.completed ? 'line-through' : 'text-foreground'}>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* AI Breakdown Confirmation Modal */}
      {aiBreakdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-purple-500">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">AI Project Breakdown</h3>
              </div>
              <button onClick={() => setAiBreakdownModal(null)} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Suggested milestone decomposition for: <strong className="text-foreground">{aiBreakdownModal.title}</strong>. Requires your explicit confirmation before adding.
            </p>

            <div className="p-4 rounded-2xl bg-secondary/40 space-y-2 text-xs">
              <span className="font-bold text-foreground">Proposed Deliverables:</span>
              <ul className="space-y-1 text-muted-foreground">
                {aiSuggestions.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setAiBreakdownModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAdoptAISubtasks(aiBreakdownModal)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Approve & Create Milestones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create Academic / Life Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Robotic Manipulator"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief objectives and key milestones..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Target Deadline</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
