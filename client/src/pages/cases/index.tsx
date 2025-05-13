import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, getStatusColor } from '@/lib/utils';
import { CASE_STATUSES } from '@shared/schema';
import type { Case } from '@shared/schema';

export default function CasesIndex() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);

  // Get search params from URL
  const searchParams = new URLSearchParams(window.location.search);
  const searchFromUrl = searchParams.get('search');
  const statusFromUrl = searchParams.get('status');

  // Set initial search term and filter from URL params
  useEffect(() => {
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
    if (statusFromUrl) {
      setFilterStatus(statusFromUrl);
    }
  }, [searchFromUrl, statusFromUrl]);

  // Fetch cases with search/filter params
  const { data: cases, isLoading, refetch } = useQuery<Case[]>({
    queryKey: [
      '/api/cases', 
      searchTerm ? { search: searchTerm } : {}, 
      filterStatus ? { status: filterStatus } : {}
    ],
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (filterStatus) params.set('status', filterStatus);
    
    const newUrl = `/cases${params.toString() ? `?${params.toString()}` : ''}`;
    setLocation(newUrl);
    
    refetch();
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string | null) => {
    setFilterStatus(status);
    
    // Update URL with status param
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (status) params.set('status', status);
    
    const newUrl = `/cases${params.toString() ? `?${params.toString()}` : ''}`;
    setLocation(newUrl);
    
    refetch();
  };

  // Handle delete case
  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/cases/${caseToDelete.id}`);
      
      toast({
        title: 'Case deleted',
        description: `Case ${caseToDelete.caseNumber} has been deleted successfully.`,
      });
      
      // Invalidate queries and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/case-statuses'] });
      
      setIsDeleteDialogOpen(false);
      setCaseToDelete(null);
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete case. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary mb-4 sm:mb-0">Cases</h1>
        
        <Button asChild>
          <Link href="/cases/add">
            <Plus className="w-4 h-4 mr-2" />
            Add New Case
          </Link>
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <form onSubmit={handleSearch} className="flex-1 flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral" />
                <Input 
                  type="search"
                  placeholder="Search by case number or title..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus ? `Status: ${filterStatus}` : 'Filter by Status'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilterByStatus(null)}>
                  All Statuses
                </DropdownMenuItem>
                {CASE_STATUSES.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => handleFilterByStatus(status)}>
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : cases && cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case No.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Hearing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => {
                  const statusStyle = getStatusColor(caseItem.status);
                  
                  return (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">
                        <Link href={`/cases/${caseItem.id}`} className="text-primary hover:underline">
                          {caseItem.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{caseItem.title}</TableCell>
                      <TableCell>{caseItem.courtName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text}`}>
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(caseItem.nextHearingDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                            <Link href={`/cases/${caseItem.id}`}>
                              <span className="sr-only">View</span>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                            <Link href={`/cases/${caseItem.id}?edit=true`}>
                              <span className="sr-only">Edit</span>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setCaseToDelete(caseItem);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <span className="sr-only">Delete</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <h3 className="text-lg font-medium text-neutral-dark mb-2">No cases found</h3>
              <p className="text-sm text-neutral mb-6">
                {searchTerm || filterStatus 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Start by adding your first case'}
              </p>
              <Button asChild>
                <Link href="/cases/add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Case
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the case <span className="font-semibold">{caseToDelete?.caseNumber}</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCaseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
