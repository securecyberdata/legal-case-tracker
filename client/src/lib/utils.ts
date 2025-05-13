import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

// Combines class names with tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date as a readable string
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM dd, yyyy");
}

// Format date with time
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM dd, yyyy h:mm a");
}

// Format time ago for activity timestamps
export function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } else if (isYesterday(dateObj)) {
    return "Yesterday at " + format(dateObj, "h:mm a");
  } else {
    return format(dateObj, "MMM dd, yyyy");
  }
}

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A";
  
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
  }).format(amount);
}

// Generate case number
export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CIV-${year}-${random}`;
}

// Map status to color
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  icon?: string;
} {
  switch (status) {
    case "Active":
      return { bg: "bg-success bg-opacity-10", text: "text-success", icon: "gavel" };
    case "Pending":
      return { bg: "bg-warning bg-opacity-10", text: "text-warning", icon: "clock" };
    case "Scheduled":
      return { bg: "bg-success bg-opacity-10", text: "text-success", icon: "calendar" };
    case "Adjourned":
      return { bg: "bg-neutral bg-opacity-10", text: "text-neutral-dark", icon: "redo" };
    case "Closed":
      return { bg: "bg-muted bg-opacity-20", text: "text-muted-foreground", icon: "check" };
    case "Urgent":
      return { bg: "bg-destructive bg-opacity-10", text: "text-destructive", icon: "alert-triangle" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength) + "...";
}
