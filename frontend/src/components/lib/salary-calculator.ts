import { SalaryInput, SalaryResult } from "../../../shared/schema";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function formatCurrencyWithUnit(amount: number): string {
  return `${formatCurrency(amount)} VND`;
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatNumberWithVND(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function parseFormattedNumber(value: string): number {
  // Remove all formatting except numbers and minus sign
  const cleaned = value.replace(/[^\d-]/g, '');
  
  // If the cleaned string is empty, return 0
  if (cleaned === '' || cleaned === '-') {
    return 0;
  }
  
  // Simply parse the cleaned number - no smart parsing
  // This ensures that when user deletes digits, the remaining value is preserved
  // For example: "800.000" -> delete "8" -> "00.000" -> cleaned "00000" -> 0
  // But we want to preserve partial values properly
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Vietnamese tax brackets for reference
export const TAX_BRACKETS = [
  { range: "Up to 5,000,000", rate: "5%" },
  { range: "5,000,001 - 10,000,000", rate: "10%" },
  { range: "10,000,001 - 18,000,000", rate: "15%" },
  { range: "18,000,001 - 32,000,000", rate: "20%" },
  { range: "32,000,001 - 52,000,000", rate: "25%" },
  { range: "52,000,001 - 80,000,000", rate: "30%" },
  { range: "Above 80,000,000", rate: "35%" },
];

export function downloadJsonFile(data: any, filename: string = 'salary_calculations.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
