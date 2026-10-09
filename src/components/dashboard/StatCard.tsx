import React from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  type: "balance" | "income" | "expense" | "savings";
  badgeText?: string;
}

export function StatCard({
  title,
  value,
  description,
  type,
  badgeText = "Placeholder",
}: StatCardProps) {
  const configs = {
    balance: {
      icon: Wallet,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
      accentBorder: "hover:border-emerald-200 dark:hover:border-emerald-800",
    },
    income: {
      icon: TrendingUp,
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-50 dark:bg-teal-950/60",
      accentBorder: "hover:border-teal-200 dark:hover:border-teal-800",
    },
    expense: {
      icon: TrendingDown,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50 dark:bg-rose-950/60",
      accentBorder: "hover:border-rose-200 dark:hover:border-rose-800",
    },
    savings: {
      icon: PiggyBank,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
      accentBorder: "hover:border-indigo-200 dark:hover:border-indigo-800",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${config.accentBorder}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {badgeText}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
