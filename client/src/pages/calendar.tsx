import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parseISO, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Hearing } from '@shared/schema';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date ranges based on view mode and current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Fetch hearings for the date range
  const { data: hearings, isLoading } = useQuery<Hearing[]>({
    queryKey: ['/api/hearings/calendar', { 
      start: startDate.toISOString(), 
      end: endDate.toISOString() 
    }],
  });

  // Generate calendar days
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  // Get hearings for a specific day
  const getHearingsForDay = (date: Date) => {
    if (!hearings) return [];
    
    return hearings.filter(hearing => {
      const hearingDate = parseISO(hearing.hearingDate.toString());
      return hearingDate.getDate() === date.getDate() && 
             hearingDate.getMonth() === date.getMonth() && 
             hearingDate.getFullYear() === date.getFullYear();
    });
  };

  // Navigation handlers
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Map hearings by week for the current month
  const hearingsByWeek = () => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    calendarDays.forEach((day, i) => {
      if (i % 7 === 0 && currentWeek.length) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
      if (i === calendarDays.length - 1) {
        weeks.push(currentWeek);
      }
    });
    
    return weeks;
  };

  // Get selected day's hearings
  const selectedDayHearings = selectedDate ? getHearingsForDay(selectedDate) : [];

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">Calendar</h1>
        <p className="text-neutral-dark">
          Manage your court hearings and appointments
        </p>
      </div>
      
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium ml-2">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <Select
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'month' | 'week' | 'day')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          
          <Button asChild>
            <Link href="/cases/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Hearing
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Calendar Header - Days of week */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center font-medium text-neutral-dark">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    const dayHearings = getHearingsForDay(day);
                    const hasHearings = dayHearings.length > 0;
                    
                    return (
                      <div 
                        key={i} 
                        className={`min-h-[80px] p-1 border rounded-md transition-colors cursor-pointer
                          ${isCurrentMonth ? 'bg-white' : 'bg-neutral-bg text-neutral-light'}
                          ${isToday(day) ? 'border-primary' : 'border-transparent hover:border-border'}
                          ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''}
                        `}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`
                            rounded-full w-6 h-6 flex items-center justify-center text-sm
                            ${isToday(day) ? 'bg-primary text-white' : ''}
                          `}>
                            {format(day, 'd')}
                          </span>
                          {hasHearings && (
                            <Badge className="text-xs" variant="outline">
                              {dayHearings.length}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Preview of hearings (max 2) */}
                        {isCurrentMonth && hasHearings && (
                          <div className="mt-1 space-y-1">
                            {dayHearings.slice(0, 2).map((hearing) => {
                              const statusStyle = getStatusColor(hearing.status);
                              return (
                                <div 
                                  key={hearing.id} 
                                  className={`text-xs p-1 truncate rounded-sm ${statusStyle.bg} ${statusStyle.text}`}
                                >
                                  {hearing.time || '00:00'} - {hearing.notes ? truncateText(hearing.notes, 10) : 'Hearing'}
                                </div>
                              );
                            })}
                            {dayHearings.length > 2 && (
                              <div className="text-xs text-neutral-dark text-center">
                                +{dayHearings.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sidebar - Day Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {selectedDate ? (
                selectedDayHearings.length > 0 
                  ? `${selectedDayHearings.length} hearing${selectedDayHearings.length > 1 ? 's' : ''} scheduled` 
                  : 'No hearings scheduled'
              ) : 'Click on a date to view hearings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDayHearings.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayHearings.map((hearing) => {
                    const statusStyle = getStatusColor(hearing.status);
                    return (
                      <Card key={hearing.id} className="overflow-hidden">
                        <div className={`h-2 ${statusStyle.bg}`}></div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {hearing.time || 'No time set'}
                              </p>
                              <p className="text-sm text-neutral-dark">
                                {hearing.notes || 'No details'}
                              </p>
                            </div>
                            <Badge>{hearing.status}</Badge>
                          </div>
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              asChild
                            >
                              <Link href={`/cases/${hearing.caseId}`}>
                                View Case
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="h-12 w-12 mx-auto text-neutral-light mb-2" />
                  <h3 className="font-medium text-neutral-dark mb-1">No Hearings</h3>
                  <p className="text-sm text-neutral mb-4">
                    There are no hearings scheduled for this date.
                  </p>
                  <Button asChild>
                    <Link href="/cases/add">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Hearing
                    </Link>
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <ArrowLeft className="h-8 w-8 mx-auto text-neutral-light mb-2" />
                <p className="text-sm text-neutral">
                  Select a date from the calendar to view hearings
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength) + "...";
}
