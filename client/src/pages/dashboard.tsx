import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Briefcase, 
  Scale3d, 
  CalendarDays, 
  Users, 
  ChevronRight,
  EyeIcon,
  PencilIcon,
  ArrowRight,
  ArrowUp,
  FileText,
  CalendarCheck,
  Plus,
  UserPlus,
  FileEdit
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatTimeAgo, getStatusColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Case, Client, Activity } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date());

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch upcoming cases
  const { data: upcomingCases, isLoading: isLoadingCases } = useQuery<Case[]>({
    queryKey: ["/api/cases/upcoming"],
  });

  // Fetch case status distribution
  const { data: caseStatuses, isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["/api/dashboard/case-statuses"],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Fetch recent clients
  const { data: recentClients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients/recent"],
  });

  // Generate calendar days
  const calendarDays = () => {
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = new Date(month.getFullYear(), month.getMonth(), 0 - (firstDayOfMonth - i - 1));
      days.push({
        date: day,
        isCurrentMonth: false,
        hasEvent: false,
        eventType: null
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(month.getFullYear(), month.getMonth(), i);
      
      // Simulate events - in a real app, check if this date has hearings
      const hasEvent = Math.random() > 0.8;
      const eventTypes = ['primary-light', 'warning', 'success', 'error'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      days.push({
        date: day,
        isCurrentMonth: true,
        hasEvent,
        eventType: hasEvent ? eventType : null
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(month.getFullYear(), month.getMonth() + 1, i);
      days.push({
        date: day,
        isCurrentMonth: false,
        hasEvent: false,
        eventType: null
      });
    }
    
    return days;
  };

  const previousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        
        <Button asChild>
          <Link href="/cases/add">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Link>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Cases */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-neutral-dark text-sm">Total Cases</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-semibold">{stats?.totalCases || 0}</p>
                )}
              </div>
              <div className="p-2 bg-primary text-white rounded-md">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-success text-sm flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>12% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Active Cases */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-neutral-dark text-sm">Active Cases</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-semibold">{stats?.activeCases || 0}</p>
                )}
              </div>
              <div className="p-2 bg-success text-white rounded-md">
                <Scale3d className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-success text-sm flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>5% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Hearings This Week */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-neutral-dark text-sm">Hearings This Week</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-semibold">{stats?.hearingsThisWeek || 0}</p>
                )}
              </div>
              <div className="p-2 bg-amber-500 text-white rounded-md">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-amber-500 text-sm flex items-center">
              <span>Upcoming this week</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Clients */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-neutral-dark text-sm">Total Clients</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-semibold">{stats?.totalClients || 0}</p>
                )}
              </div>
              <div className="p-2 bg-secondary text-white rounded-md">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-success text-sm flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>8% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Upcoming Hearings</h2>
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                {isLoadingCases ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                ) : upcomingCases && upcomingCases.length > 0 ? (
                  <table className="min-w-full divide-y divide-neutral-lighter">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Case No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Court</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-lighter">
                      {upcomingCases.map((caseItem) => {
                        const statusStyle = getStatusColor(caseItem.status);
                        return (
                          <tr key={caseItem.id} className="hover:bg-neutral-bg">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-primary">{caseItem.caseNumber}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-neutral-dark">{caseItem.title}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-neutral-dark">{caseItem.courtName}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-neutral-dark">{formatDate(caseItem.nextHearingDate)}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                {caseItem.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                              <Button variant="ghost" size="sm" asChild className="text-primary">
                                <Link href={`/cases/${caseItem.id}`}>
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild className="text-neutral-dark">
                                <Link href={`/cases/${caseItem.id}?edit=true`}>
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-6 text-center text-neutral-dark">
                    <p>No upcoming hearings scheduled</p>
                    <Button variant="outline" className="mt-3" asChild>
                      <Link href="/cases/add">Schedule a Hearing</Link>
                    </Button>
                  </div>
                )}
              </div>
              
              {upcomingCases && upcomingCases.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button variant="link" asChild>
                    <Link href="/cases">
                      View All Hearings <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoadingActivities ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="ml-3 flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : activities && activities.length > 0 ? (
                  activities.map((activity) => {
                    const actionType = activity.action.toLowerCase();
                    
                    let IconComponent;
                    let iconBackground = "bg-primary";
                    
                    if (actionType.includes("case")) {
                      IconComponent = FileText;
                      iconBackground = "bg-primary";
                    } else if (actionType.includes("hearing")) {
                      IconComponent = CalendarCheck;
                      iconBackground = "bg-success";
                    } else if (actionType.includes("client")) {
                      IconComponent = UserPlus;
                      iconBackground = "bg-secondary";
                    } else if (actionType.includes("update")) {
                      IconComponent = FileEdit;
                      iconBackground = "bg-amber-500";
                    } else {
                      IconComponent = FileText;
                    }
                    
                    return (
                      <div key={activity.id} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className={`h-8 w-8 rounded-full ${iconBackground} flex items-center justify-center text-white text-sm`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-neutral-dark">
                            {activity.details}
                          </p>
                          <p className="text-xs text-neutral">
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-neutral-dark">
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Calendar Section */}
        <div>
          {/* Mini Calendar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Calendar</h2>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={previousMonth}
                    className="text-neutral hover:text-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={nextMonth}
                    className="text-neutral hover:text-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <h3 className="text-center text-sm font-medium text-neutral-dark mb-4">
                {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral mb-2">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays().map((day, index) => {
                  const isToday = new Date().toDateString() === day.date.toDateString();
                  
                  let className = "py-1 text-sm";
                  if (!day.isCurrentMonth) className += " text-neutral-light";
                  else className += " text-neutral-dark";
                  
                  if (isToday) {
                    className += " font-bold";
                  }
                  
                  if (day.hasEvent) {
                    className += ` rounded-full bg-${day.eventType} text-white`;
                  }
                  
                  return (
                    <div key={index} className={className}>
                      {day.date.getDate()}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4">
                <Button asChild className="w-full">
                  <Link href="/calendar">
                    Schedule Hearing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Clients */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Recent Clients</h2>
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoadingClients ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3 flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-6" />
                    </div>
                  ))
                ) : recentClients && recentClients.length > 0 ? (
                  recentClients.map((client) => (
                    <div key={client.id} className="flex items-center">
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10 rounded-full">
                          <AvatarFallback className="bg-neutral-bg text-primary">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-neutral-dark">
                          {client.name}
                        </p>
                        <p className="text-xs text-neutral">
                          {client.contactNumber || client.email || "No contact info"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-dark">
                    <p>No clients added yet</p>
                    <Button variant="outline" className="mt-3" asChild>
                      <Link href="/clients/add">Add Client</Link>
                    </Button>
                  </div>
                )}
              </div>
              
              {recentClients && recentClients.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button variant="link" asChild>
                    <Link href="/clients">
                      View All Clients <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Case Distribution by Status */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">Case Status</h2>
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoadingStatuses ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))
                ) : caseStatuses && caseStatuses.length > 0 ? (
                  caseStatuses.map((statusItem, index) => {
                    // Calculate percentage
                    const totalCases = caseStatuses.reduce((sum, item) => sum + item.count, 0);
                    const percentage = Math.round((statusItem.count / totalCases) * 100);
                    
                    // Determine color based on status
                    let progressColor = "bg-neutral";
                    if (statusItem.status === "Active") progressColor = "bg-success";
                    else if (statusItem.status === "Pending") progressColor = "bg-amber-500";
                    else if (statusItem.status === "Urgent") progressColor = "bg-destructive";
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-dark">{statusItem.status}</span>
                          <span className="text-sm font-medium text-neutral-dark">{statusItem.count}</span>
                        </div>
                        <div className="w-full bg-neutral-bg rounded-full h-2">
                          <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-neutral-dark">
                    <p>No case data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
