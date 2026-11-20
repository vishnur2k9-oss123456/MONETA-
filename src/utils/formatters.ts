import { RiskLevel } from '../types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function getRiskTextColor(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return 'text-red-600 dark:text-red-400';
    case 'High':
      return 'text-orange-600 dark:text-orange-400';
    case 'Medium':
      return 'text-yellow-700 dark:text-yellow-400';
    case 'Low':
      return 'text-green-700 dark:text-green-400';
  }
}

export function getRiskHexColor(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return '#ef4444';
    case 'High':
      return '#f97316';
    case 'Medium':
      return '#eab308';
    case 'Low':
      return '#22c55e';
  }
}

export function getRiskMarkerBg(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return 'bg-red-500';
    case 'High':
      return 'bg-orange-500';
    case 'Medium':
      return 'bg-yellow-500';
    case 'Low':
      return 'bg-green-500';
  }
}

export function getRiskBarBg(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return 'bg-red-500/85';
    case 'High':
      return 'bg-orange-500/85';
    case 'Medium':
      return 'bg-yellow-500/85';
    case 'Low':
      return 'bg-green-500/85';
  }
}
