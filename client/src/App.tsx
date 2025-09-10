import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import { useEffect, ReactNode } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Layout from "@/components/layout/layout";
import CasesIndex from "@/pages/cases/index";
import CaseAdd from "@/pages/cases/add";
import CaseDetails from "@/pages/cases/[id]";
import ClientsIndex from "@/pages/clients/index";
import ClientAdd from "@/pages/clients/add";
import Calendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

// Protected route component
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  children?: ReactNode;
}

const ProtectedRoute = ({ component: Component, children, ...rest }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Don't render protected component if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render the protected component
  return <Component {...rest}>{children}</Component>;
};

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/" component={() => (
        <ProtectedRoute component={Layout}>
          <Dashboard />
        </ProtectedRoute>
      )} />
      
      <Route path="/cases" component={() => (
        <ProtectedRoute component={Layout}>
          <CasesIndex />
        </ProtectedRoute>
      )} />
      
      <Route path="/cases/add" component={() => (
        <ProtectedRoute component={Layout}>
          <CaseAdd />
        </ProtectedRoute>
      )} />
      
      <Route path="/cases/:id" component={() => (
        <ProtectedRoute component={Layout}>
          <CaseDetails />
        </ProtectedRoute>
      )} />
      
      <Route path="/clients" component={() => (
        <ProtectedRoute component={Layout}>
          <ClientsIndex />
        </ProtectedRoute>
      )} />
      
      <Route path="/clients/add" component={() => (
        <ProtectedRoute component={Layout}>
          <ClientAdd />
        </ProtectedRoute>
      )} />
      
      <Route path="/calendar" component={() => (
        <ProtectedRoute component={Layout}>
          <Calendar />
        </ProtectedRoute>
      )} />
      
      <Route path="/settings" component={() => (
        <ProtectedRoute component={Layout}>
          <Settings />
        </ProtectedRoute>
      )} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
