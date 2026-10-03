'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { SharedExpense, TripItem, SubscriptionItem, DocumentItem } from '@/types';
import {
  CreditCard,
  Plane,
  CheckSquare,
  FileText,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Bell,
  Clock,
  Luggage,
  Users
} from 'lucide-react';

export function FinanceTravelView() {
  const {
    currentUser,
    partnerUser,
    sharedExpenses,
    addSharedExpense,
    toggleSettleExpense,
    trips,
    togglePackingItem,
    addTrip,
    subscriptions,
    addSubscription,
    documents,
    addDocument
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'TRIP' | 'DOCS' | 'SUBS'>('EXPENSES');

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(45);
  const [expCat, setExpCat] = useState<SharedExpense['category']>('Food');

  // Subscriptions form
  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState<number>(12);
  const [subRenewal, setSubRenewal] = useState('2026-10-25');

  // Documents form
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentItem['documentType']>('Passport');
  const [docExpiry, setDocExpiry] = useState('2028-10-15');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    addSharedExpense(expTitle.trim(), expAmount, expCat, 50);
    setExpTitle('');
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    addSubscription({
      name: subName.trim(),
      cost: subCost,
      billingCycle: 'Monthly',
      renewalDate: subRenewal,
      category: 'Productivity',
      reminderEnabled: true
    });
    setSubName('');
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    addDocument({
      title: docTitle.trim(),
      documentType: docType,
      expiryDate: docExpiry
    });
    setDocTitle('');
  };

  // Balance calculation
  const totalPaidByAlex = sharedExpenses.filter(e => !e.isSettled && e.paidByUserId === 'user_alex').reduce((a, b) => a + b.amount, 0);
  const totalPaidByMaya = sharedExpenses.filter(e => !e.isSettled && e.paidByUserId === 'user_maya').reduce((a, b) => a + b.amount, 0);
  const diff = (totalPaidByAlex - totalPaidByMaya) / 2;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Finance, Trips & Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            50/50 shared expense settlement, shared trip packing lists & document renewals.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center rounded-2xl bg-muted/50 p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'EXPENSES' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <span>Shared Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('TRIP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'TRIP' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Plane className="h-4 w-4 text-primary" />
          <span>Trip Planner & Packing</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'DOCS' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <FileText className="h-4 w-4 text-amber-500" />
          <span>Document Reminders</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'SUBS' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Bell className="h-4 w-4 text-purple-500" />
          <span>Subscriptions</span>
        </button>
      </div>

      {/* 1. SHARED EXPENSES TAB */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Balance Reassurance Card */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-500/10 via-card to-card border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Shared 50/50 Balance</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                {diff > 0
                  ? `Maya owes Alex $${diff.toFixed(2)}`
                  : diff < 0
                  ? `Alex owes Maya $${Math.abs(diff).toFixed(2)}`
                  : 'All shared expenses are settled! 🎉'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total active shared spend: ${(totalPaidByAlex + totalPaidByMaya).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className="p-5 rounded-3xl border border-border bg-card grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Expense Description (e.g. Weekly Groceries)"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Amount ($)"
              value={expAmount}
              onChange={(e) => setExpAmount(parseFloat(e.target.value))}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <select
              value={expCat}
              onChange={(e) => setExpCat(e.target.value as SharedExpense['category'])}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            >
              <option value="Food">Food</option>
              <option value="Trips">Trips</option>
              <option value="Shopping">Shopping</option>
              <option value="Projects">Projects</option>
              <option value="Events">Events</option>
              <option value="Household">Household</option>
            </select>
            <button
              type="submit"
              className="py-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Add Shared 50/50
            </button>
          </form>

          {/* Expenses List */}
          <div className="space-y-3">
            {sharedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-2xs text-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSettleExpense(exp.id)}
                    className="text-muted-foreground hover:text-emerald-500"
                  >
                    {exp.isSettled ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <h3 className={`font-bold ${exp.isSettled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                      <span className="font-semibold text-primary">{exp.category}</span>
                      <span>&bull; Paid by {exp.paidByName}</span>
                      <span>&bull; {exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-foreground text-sm">${exp.amount.toFixed(2)}</div>
                  <span className={`text-[10px] font-semibold ${exp.isSettled ? 'text-muted-foreground' : 'text-emerald-500'}`}>
                    {exp.isSettled ? 'Settled' : 'Split 50/50'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TRIP PLANNER & PACKING */}
      {activeTab === 'TRIP' && (
        <div className="space-y-6">
          {trips.map((trip) => (
            <div key={trip.id} className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                    Shared Itinerary
                  </span>
                  <h2 className="text-lg font-bold text-foreground">{trip.destination}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {trip.startDate} &ndash; {trip.endDate} &bull; Budget: ${trip.budget}
                  </p>
                </div>
              </div>

              {/* Reusable Packing List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
                    <Luggage className="h-4 w-4 text-primary" /> Reusable Packing List
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {trip.packingList.filter(p => p.packed).length} / {trip.packingList.length} Packed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {trip.packingList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => togglePackingItem(trip.id, item.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        item.packed
                          ? 'border-border/50 bg-secondary/30 text-muted-foreground line-through'
                          : 'border-border bg-card hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {item.packed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. DOCUMENT EXPIRY REMINDERS */}
      {activeTab === 'DOCS' && (
        <div className="space-y-6">
          <form onSubmit={handleAddDoc} className="p-5 rounded-3xl border border-border bg-card grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Document Title (e.g. Driver's License)"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentItem['documentType'])}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            >
              <option value="Passport">Passport</option>
              <option value="ID">National ID</option>
              <option value="License">Driver&apos;s License</option>
              <option value="Certificate">Certificate</option>
              <option value="College ID">College ID</option>
              <option value="Insurance">Insurance</option>
            </select>
            <input
              type="date"
              value={docExpiry}
              onChange={(e) => setDocExpiry(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <button
              type="submit"
              className="py-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Add Document
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                    {doc.documentType}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Exp: {doc.expiryDate}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground pt-1">{doc.title}</h4>
                {doc.notes && <p className="text-muted-foreground">{doc.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUBSCRIPTION TRACKER */}
      {activeTab === 'SUBS' && (
        <div className="space-y-6">
          <form onSubmit={handleAddSub} className="p-5 rounded-3xl border border-border bg-card grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Service Name (e.g. Spotify)"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <input
              type="number"
              required
              placeholder="Monthly Cost ($)"
              value={subCost}
              onChange={(e) => setSubCost(parseFloat(e.target.value))}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <input
              type="date"
              value={subRenewal}
              onChange={(e) => setSubRenewal(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <button
              type="submit"
              className="py-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Track Subscription
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{sub.name}</span>
                  <span className="font-extrabold text-primary">${sub.cost}/mo</span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between pt-1">
                  <span>Renews: {sub.renewalDate}</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm">{sub.billingCycle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
