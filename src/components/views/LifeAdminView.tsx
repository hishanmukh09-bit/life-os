'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { LifeAdminItem, KnowledgeItem } from '@/types';
import {
  FolderLock,
  ShoppingCart,
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  DollarSign,
  Tag,
  Search,
  ExternalLink
} from 'lucide-react';

export function LifeAdminView() {
  const {
    currentUser,
    shoppingItems,
    toggleShoppingItem,
    addShoppingItem,
    lifeAdminItems,
    addLifeAdminItem,
    toggleLifeAdminStatus,
    knowledgeItems,
    addKnowledgeItem
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'SHOPPING' | 'ADMIN' | 'KNOWLEDGE'>('SHOPPING');

  // Shopping form
  const [shopTitle, setShopTitle] = useState('');
  const [shopCat, setShopCat] = useState('Groceries');

  // Admin form
  const [adminTitle, setAdminTitle] = useState('');
  const [adminCat, setAdminCat] = useState<LifeAdminItem['category']>('Bill');
  const [adminDate, setAdminDate] = useState('2026-10-25');
  const [adminAmount, setAdminAmount] = useState<number>(50);

  // Knowledge form
  const [knTitle, setKnTitle] = useState('');
  const [knContent, setKnContent] = useState('');
  const [knTags, setKnTags] = useState('Learning, Reference');
  const [knCategory, setKnCategory] = useState<KnowledgeItem['category']>('Learning');

  const handleAddShopping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopTitle.trim()) return;
    addShoppingItem(shopTitle.trim(), shopCat);
    setShopTitle('');
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle.trim()) return;
    addLifeAdminItem({
      title: adminTitle.trim(),
      category: adminCat,
      dueDate: adminDate,
      amount: adminAmount
    });
    setAdminTitle('');
  };

  const handleAddKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knTitle.trim()) return;
    addKnowledgeItem(
      knTitle.trim(),
      knCategory,
      knContent.trim(),
      knTags.split(',').map(t => t.trim())
    );
    setKnTitle('');
    setKnContent('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Life Administration & Shared Space</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realtime shared shopping list, upcoming renewals, bills & collective knowledge vault.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center rounded-2xl bg-muted/50 p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('SHOPPING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'SHOPPING' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <ShoppingCart className="h-4 w-4 text-emerald-500" />
          <span>Shared Shopping List ({shoppingItems.filter(i => !i.completed).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'ADMIN' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <FolderLock className="h-4 w-4 text-primary" />
          <span>Bills & Renewals ({lifeAdminItems.filter(i => i.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KNOWLEDGE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'KNOWLEDGE' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span>Knowledge Vault ({knowledgeItems.length})</span>
        </button>
      </div>

      {/* 1. SHOPPING LIST TAB */}
      {activeTab === 'SHOPPING' && (
        <div className="space-y-6">
          <form onSubmit={handleAddShopping} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Add item to shared shopping list (e.g. Sourdough bread, Matcha powder)..."
              value={shopTitle}
              onChange={(e) => setShopTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-sm text-foreground"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Add Item
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shoppingItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleShoppingItem(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  item.completed
                    ? 'border-border/40 bg-secondary/30 text-muted-foreground line-through'
                    : 'border-border bg-card hover:border-emerald-500/50 shadow-2xs text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-xs font-semibold">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Added by {item.addedByName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LIFE ADMIN (BILLS & RENEWALS) */}
      {activeTab === 'ADMIN' && (
        <div className="space-y-6">
          <form onSubmit={handleAddAdmin} className="p-5 rounded-3xl border border-border bg-card grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Item Title (e.g. Health Insurance renewal)"
              value={adminTitle}
              onChange={(e) => setAdminTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <select
              value={adminCat}
              onChange={(e) => setAdminCat(e.target.value as LifeAdminItem['category'])}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            >
              <option value="Bill">Bill</option>
              <option value="Renewal">Renewal</option>
              <option value="Document">Document</option>
              <option value="Appointment">Appointment</option>
              <option value="Repair">Repair</option>
              <option value="Purchase">Purchase</option>
            </select>
            <input
              type="date"
              value={adminDate}
              onChange={(e) => setAdminDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <button
              type="submit"
              className="py-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Add Admin Item
            </button>
          </form>

          <div className="space-y-3">
            {lifeAdminItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-2xs text-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLifeAdminStatus(item.id)}
                    className="text-muted-foreground hover:text-emerald-500"
                  >
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <h4 className={`font-bold ${item.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                      <span className="font-semibold text-primary">{item.category}</span>
                      {item.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {item.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {item.amount !== undefined && (
                  <span className="font-extrabold text-foreground text-sm">
                    ${item.amount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. KNOWLEDGE VAULT */}
      {activeTab === 'KNOWLEDGE' && (
        <div className="space-y-6">
          <form onSubmit={handleAddKnowledge} className="p-5 rounded-3xl border border-border bg-card space-y-3 text-xs">
            <input
              type="text"
              required
              placeholder="Knowledge Title (e.g. Optimal Cognitive Nutrition Protocol)"
              value={knTitle}
              onChange={(e) => setKnTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-bold"
            />
            <textarea
              rows={2}
              required
              placeholder="Insights, takeaways, synthesis..."
              value={knContent}
              onChange={(e) => setKnContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <div className="flex justify-between items-center">
              <input
                type="text"
                placeholder="Tags (e.g. Science, Study, Focus)"
                value={knTags}
                onChange={(e) => setKnTags(e.target.value)}
                className="w-1/2 px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
              >
                Store in Vault
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeItems.map((item) => (
              <div key={item.id} className="p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-2 text-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                  {item.category}
                </span>
                <h4 className="text-sm font-bold text-foreground pt-1">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {item.tags.map(t => (
                    <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
