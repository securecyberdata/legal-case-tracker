import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CalendarIcon, 
  Building2, 
  Briefcase,
  ArrowLeft,
  Upload,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { generateCaseNumber, formatDate } from '@/lib/utils';
import { CASE_STATUSES, COURT_TYPES, insertCaseSchema } from '@shared/schema';

// Create a form schema that accepts Date objects for dates
const formSchema = z.object({
  applicationNumber: z.string().optional(),
  caseNumber: z.string().min(1, "Case number is required"),
  firNumber: z.string().optional(),
  plaintiffName: z.string().optional(),
  defendantName: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courtName: z.string().min(1, "Court name is required"),
  courtType: z.enum(COURT_TYPES).optional(),
  status: z.enum(CASE_STATUSES).default("Pending"),
  filingDate: z.date().optional(),
  nextHearingDate: z.date().optional(),
  clientId: z.number().optional(),
  documents: z.string().optional(),
  previousMessages: z.string().optional(),
});

export default function CaseAdd() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicationNumber: '',
      caseNumber: generateCaseNumber(),
      firNumber: '',
      plaintiffName: '',
      defendantName: '',
      title: '',
      description: '',
      courtName: '',
      courtType: undefined,
      status: 'Pending',
      filingDate: new Date(),
      nextHearingDate: undefined,
      clientId: undefined,
      documents: '',
      previousMessages: '',
    }
  });

  // Document generation function
  const generateDocument = async (docType: 'bail' | 'bail_before_arrest') => {
    const formData = form.getValues();
    
    if (!formData.caseNumber || !formData.title || !formData.courtName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the case number, title, and court name before generating documents.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create document content using case data
      const documentContent = createDocumentContent(docType, formData);
      
      // Create and download the document
      downloadDocument(documentContent, `${docType}_${formData.caseNumber}.docx`);
      
      toast({
        title: 'Document Generated',
        description: `${docType === 'bail' ? 'Bail Application' : 'Bail Before Arrest'} document has been generated successfully.`,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Create document content based on case data
  const createDocumentContent = (docType: 'bail' | 'bail_before_arrest', caseData: any) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (docType === 'bail') {
      return `BAIL APPLICATION

IN THE COURT OF ${caseData.courtName?.toUpperCase() || 'DISTRICT COURT'}

Case No: ${caseData.caseNumber}
Application No: ${caseData.applicationNumber || 'N/A'}
FIR No: ${caseData.firNumber || 'N/A'}

PETITIONER: ${caseData.plaintiffName || 'Applicant'}
RESPONDENT: ${caseData.defendantName || 'State'}

SUBJECT: Application for Grant of Bail

Respected Sir/Madam,

I, ${caseData.plaintiffName || 'the applicant'}, through my counsel, most respectfully submit as follows:

1. That the above-mentioned case is pending before this Hon'ble Court.
2. That the applicant is innocent and has been falsely implicated in this case.
3. That the applicant undertakes to appear before the court on each and every date of hearing.
4. That the applicant will not tamper with evidence or influence witnesses.
5. That the applicant is ready to furnish any surety or bond as may be required by this Hon'ble Court.

PRAYER:
It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to grant bail to the applicant in the above-mentioned case.

Date: ${currentDate}
Place: ${caseData.courtName || 'Court'}

Through Counsel
${caseData.plaintiffName || 'Applicant'}`;
    } else {
      return `APPLICATION FOR BAIL BEFORE ARREST
(ANTICIPATORY BAIL)

IN THE COURT OF ${caseData.courtName?.toUpperCase() || 'DISTRICT COURT'}

Case No: ${caseData.caseNumber}
Application No: ${caseData.applicationNumber || 'N/A'}
FIR No: ${caseData.firNumber || 'N/A'}

PETITIONER: ${caseData.plaintiffName || 'Applicant'}
RESPONDENT: ${caseData.defendantName || 'State'}

SUBJECT: Application for Anticipatory Bail

Respected Sir/Madam,

I, ${caseData.plaintiffName || 'the applicant'}, through my counsel, most respectfully submit as follows:

1. That the applicant has reasonable apprehension of arrest in connection with the above-mentioned case.
2. That the applicant is innocent and has been falsely implicated in this case.
3. That the applicant undertakes to cooperate with the investigation and appear before the court when required.
4. That the applicant will not tamper with evidence or influence witnesses.
5. That the applicant is ready to furnish any surety or bond as may be required by this Hon'ble Court.

PRAYER:
It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to grant anticipatory bail to the applicant in the above-mentioned case.

Date: ${currentDate}
Place: ${caseData.courtName || 'Court'}

Through Counsel
${caseData.plaintiffName || 'Applicant'}`;
    }
  };

  // Download document function
  const downloadDocument = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Convert Date objects to ISO strings for the API
      const processedData = {
        ...data,
        filingDate: data.filingDate ? new Date(data.filingDate).toISOString().split('T')[0] : undefined,
        nextHearingDate: data.nextHearingDate ? new Date(data.nextHearingDate).toISOString().split('T')[0] : undefined,
      };
      
      // Validate the processed data against the insertCaseSchema
      const validatedData = insertCaseSchema.parse(processedData);
      
      const response = await apiRequest('POST', '/api/cases', validatedData);
      const newCase = await response.json();
      
      toast({
        title: 'Case created successfully',
        description: `Case ${newCase.caseNumber} has been created.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/case-statuses'] });
      
      // Navigate to case details page
      navigate(`/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: 'Error creating case',
        description: 'Failed to create the case. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cases')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
        <h1 className="text-2xl font-semibold text-primary">Add New Case</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
                <CardDescription>
                  Enter the basic information about the case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applicationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter application number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="caseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FIR Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter FIR number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CASE_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plaintiffName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plaintiff Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter plaintiff name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defendantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Defendant Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter defendant name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Smith vs. State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Brief description of the case" 
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Court Details & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Court & Dates</CardTitle>
                <CardDescription>
                  Court information and important dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="courtName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Lahore High Court" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="courtType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select court type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="filingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Filing Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nextHearingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Next Hearing Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Attachments</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <Textarea 
                            {...field} 
                            placeholder="Enter document references or upload information" 
                            className="min-h-[80px]"
                          />
                          <Button type="button" variant="outline" className="w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Attach Documents
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previousMessages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Messages</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter any previous messages or notes related to this case" 
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardFooter className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate('/cases')}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Case'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      {/* Document Generation Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Generate Legal Documents</span>
            </CardTitle>
            <CardDescription>
              Generate legal documents using the case information you just created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => generateDocument('bail')}
              >
                <FileText className="h-6 w-6" />
                <span>Bail Application</span>
                <span className="text-xs text-muted-foreground">Generate bail application document</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => generateDocument('bail_before_arrest')}
              >
                <FileText className="h-6 w-6" />
                <span>Bail Before Arrest</span>
                <span className="text-xs text-muted-foreground">Generate anticipatory bail document</span>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Note: Document generation will use the case details from the form above.</p>
              <p>Make sure all required fields are filled before generating documents.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
