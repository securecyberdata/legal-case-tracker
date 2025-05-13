import { useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [isOnCases] = useRoute("/cases");
  const { toast } = useToast();
  
  const handleSearch = (query: string) => {
    if (query.trim()) {
      if (!isOnCases) {
        setLocation(`/cases?search=${encodeURIComponent(query)}`);
      } else {
        // We're already on the cases page, handle search via state/props
        // This would be handled by the cases page component
      }
    } else {
      toast({
        title: "Please enter a search term",
        description: "Search term cannot be empty",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-bg">
      {/* Sidebar for navigation */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />
      
      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Topbar 
          onMenuClick={() => setMobileSidebarOpen(true)}
          onSearch={handleSearch}
        />
        
        {/* Content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
