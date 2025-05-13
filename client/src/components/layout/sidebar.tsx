import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  LayoutDashboard, 
  Gavel, 
  Users, 
  CalendarDays, 
  Settings,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Navigation links
  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { name: "Cases", path: "/cases", icon: <Gavel className="h-5 w-5 mr-3" /> },
    { name: "Clients", path: "/clients", icon: <Users className="h-5 w-5 mr-3" /> },
    { name: "Calendar", path: "/calendar", icon: <CalendarDays className="h-5 w-5 mr-3" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="p-0 bg-primary text-white">
          <MobileSidebarContent 
            location={location} 
            user={user} 
            navItems={navItems} 
            onClose={onMobileClose} 
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-primary text-white">
        <SidebarContent location={location} user={user} navItems={navItems} />
      </div>
    </div>
  );
}

interface SidebarContentProps {
  location: string;
  user: any;
  navItems: Array<{ name: string; path: string; icon: React.ReactNode }>;
  onClose?: () => void;
}

function SidebarContent({ location, user, navItems }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-primary-light">
        <Link href="/">
          <h1 className="text-xl font-bold cursor-pointer">LawCasePro</h1>
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-5 px-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
            >
              <a
                className={cn(
                  "group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-white",
                  location === item.path || (item.path !== "/" && location.startsWith(item.path))
                    ? "bg-primary-light"
                    : "hover:bg-primary-light"
                )}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-primary-light p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 rounded-full bg-primary-light">
              {user?.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
              ) : (
                <AvatarFallback className="bg-primary-light text-white">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="ml-3">
              <p className="text-sm leading-5 font-medium text-white">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.email || 'User')}
              </p>
              <p className="text-xs leading-4 font-medium text-neutral-lighter">
                Attorney
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileSidebarContent({ location, user, navItems, onClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Mobile header with close button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-light">
        <Link href="/">
          <h1 className="text-xl font-bold cursor-pointer">LawCasePro</h1>
        </Link>
        <Button 
          variant="ghost" 
          className="text-white hover:bg-primary-light" 
          onClick={onClose}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-5 px-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={onClose}
            >
              <a
                className={cn(
                  "group flex items-center px-2 py-3 text-base leading-6 font-medium rounded-md text-white",
                  location === item.path || (item.path !== "/" && location.startsWith(item.path))
                    ? "bg-primary-light"
                    : "hover:bg-primary-light"
                )}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-primary-light p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 rounded-full bg-primary-light">
              {user?.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
              ) : (
                <AvatarFallback className="bg-primary-light text-white">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="ml-3">
              <p className="text-base leading-6 font-medium text-white">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.email || 'User')}
              </p>
              <p className="text-sm leading-5 font-medium text-neutral-lighter">
                Attorney
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logout Link */}
      <div className="p-4">
        <a 
          href="/api/logout" 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-primary-light hover:bg-primary-dark"
        >
          Logout
        </a>
      </div>
    </div>
  );
}
