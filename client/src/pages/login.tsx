import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Gavel, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Redirect when login completes
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Left section with image */}
      <div className="hidden lg:block lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-30"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white px-12">
          <Gavel className="h-16 w-16 mb-6" />
          <h1 className="text-4xl font-bold mb-2">LawCasePro</h1>
          <p className="text-xl mb-8">Case Management System for Pakistani Lawyers</p>
          <div className="max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">Streamline Your Legal Practice</h2>
              <p className="text-sm opacity-90 mb-4">
                Organize cases, manage clients, and never miss a court date with our comprehensive legal case management solution.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 bg-white rounded-full"></div>
                <p>Track all your cases in one place</p>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-2">
                <div className="h-2 w-2 bg-white rounded-full"></div>
                <p>Schedule and manage hearings with ease</p>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-2">
                <div className="h-2 w-2 bg-white rounded-full"></div>
                <p>Maintain detailed client records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right section with login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <Gavel className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to LawCasePro</CardTitle>
            <CardDescription>
              Sign in to access your legal case management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-neutral-dark mb-4">
                Click the button below to securely sign in
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
              >
                Sign in to your account
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm text-neutral">
            <p className="w-full">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
