import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Gavel } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/login', data);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      // Refresh the page to trigger re-authentication
      window.location.reload();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="test@test.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="test123" 
                          type="password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in to your account'}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 p-4 bg-neutral-bg rounded-lg">
              <p className="text-sm font-medium text-center mb-2">Test Credentials</p>
              <div className="text-xs text-neutral-dark text-center space-y-1">
                <p><strong>Email:</strong> test@test.com</p>
                <p><strong>Password:</strong> test123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}