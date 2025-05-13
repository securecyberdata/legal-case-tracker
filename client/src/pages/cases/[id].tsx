import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Plus,
  Save,
  Trash2,
  FilePlus,
  CalendarIcon,
  User,
  Building2,
  ClipboardList,
  GavelIcon,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { insertCaseSchema, insertHearingSchema, CASE_STATUSES, COURT_TYPES } from "@shared/schema";
import type { Case, Hearing } from "@shared/schema";

// Extend case schema for editing
const editCaseSchema = insertCaseSchema.partial();

// Extend hearing schema
const hearingFormSchema = insertHearingSchema.extend({
  time: z.string().min(1, "Time is required"),
});

export default function CaseDetails() {
  const [, params] = useRoute("/cases/:id");
  const { id } = params || { id: "" };
  const caseId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddHearingDialogOpen, setIsAddHearingDialogOpen] = useState(false);

  // Check if edit mode is enabled via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "true") {
      setIsEditing(true);
    }
  }, []);

  // Fetch case details
  const {
    data: caseData,
    isLoading,
    error,
  } = useQuery<Case>({
    queryKey: [`/api/cases/${caseId}`],
    enabled: !!caseId,
  });

  // Fetch hearings for this case
  const { data: hearings, isLoading: isLoadingHearings } = useQuery<Hearing[]>({
    queryKey: [`/api/hearings`, { caseId }],
    enabled: !!caseId,
  });

  // Case edit form
  const caseForm = useForm<z.infer<typeof editCaseSchema>>({
    resolver: zodResolver(editCaseSchema),
    defaultValues: {
      caseNumber: "",
      title: "",
      description: "",
      courtName: "",
      courtType: undefined,
      status: undefined,
      filingDate: undefined,
      nextHearingDate: undefined,
    },
  });

  // Hearing form
  const hearingForm = useForm<z.infer<typeof hearingFormSchema>>({
    resolver: zodResolver(hearingFormSchema),
    defaultValues: {
      caseId: caseId,
      hearingDate: new Date(),
      time: "10:00",
      notes: "",
      status: "Scheduled",
    },
  });

  // Update form when case data is loaded
  useEffect(() => {
    if (caseData) {
      caseForm.reset({
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        description: caseData.description || "",
        courtName: caseData.courtName,
        courtType: caseData.courtType,
        status: caseData.status,
        filingDate: caseData.filingDate ? new Date(caseData.filingDate) : undefined,
        nextHearingDate: caseData.nextHearingDate
          ? new Date(caseData.nextHearingDate)
          : undefined,
      });
    }
  }, [caseData, caseForm]);

  // Handle case update
  const onSaveCase = async (data: z.infer<typeof editCaseSchema>) => {
    try {
      await apiRequest("PUT", `/api/cases/${caseId}`, data);

      toast({
        title: "Case updated",
        description: "The case details have been updated successfully.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/case-statuses"] });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating case:", error);
      toast({
        title: "Error",
        description: "Failed to update the case. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle case deletion
  const onDeleteCase = async () => {
    try {
      await apiRequest("DELETE", `/api/cases/${caseId}`);

      toast({
        title: "Case deleted",
        description: "The case has been deleted successfully.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/case-statuses"] });

      navigate("/cases");
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        title: "Error",
        description: "Failed to delete the case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle adding a new hearing
  const onAddHearing = async (data: z.infer<typeof hearingFormSchema>) => {
    try {
      await apiRequest("POST", "/api/hearings", data);

      toast({
        title: "Hearing scheduled",
        description: "The hearing has been scheduled successfully.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/hearings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${caseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      hearingForm.reset();
      setIsAddHearingDialogOpen(false);
    } catch (error) {
      console.error("Error scheduling hearing:", error);
      toast({
        title: "Error",
        description: "Failed to schedule the hearing. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If loading
  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/cases")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If error occurred
  if (error || !caseData) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/cases")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Case</h3>
              <p className="text-neutral-dark mb-6">
                Unable to load the case details. The case may not exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/cases")}>Return to Cases</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine case status style
  const statusStyle = getStatusColor(caseData.status);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/cases")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-primary">
            {isEditing ? "Edit Case" : caseData.title}
          </h1>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        // Edit Mode
        <Form {...caseForm}>
          <form onSubmit={caseForm.handleSubmit(onSaveCase)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Case Details Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Case Details</CardTitle>
                  <CardDescription>Edit the details of this case</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={caseForm.control}
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

                    <FormField
                      control={caseForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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

                  <FormField
                    control={caseForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={caseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={caseForm.control}
                      name="courtName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Court Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={caseForm.control}
                      name="courtType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Court Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={caseForm.control}
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
                              <CalendarComponent
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
                      control={caseForm.control}
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
                              <CalendarComponent
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
                  </div>
                </CardContent>
              </Card>

              {/* Client and Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-dark mb-4">
                      {caseData.clientId ? (
                        "Client is assigned to this case."
                      ) : (
                        "No client is currently assigned to this case."
                      )}
                    </p>
                    {/* Client assignment would go here in a more complete implementation */}
                    <Button variant="outline" className="w-full" disabled>
                      {caseData.clientId ? "Change Client" : "Assign Client"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button type="submit" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      ) : (
        // View Mode
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Case Details</CardTitle>
                    <CardDescription>Basic information about the case</CardDescription>
                  </div>
                  <Badge className={`${statusStyle.bg} ${statusStyle.text}`}>
                    {caseData.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-dark">Case Number</h4>
                      <p className="text-primary font-medium">{caseData.caseNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-dark">Filing Date</h4>
                      <p>{formatDate(caseData.filingDate)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-dark">Description</h4>
                    <p className="text-sm mt-1">{caseData.description || "No description provided"}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-dark">Court Name</h4>
                      <p>{caseData.courtName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-dark">Court Type</h4>
                      <p>{caseData.courtType || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-dark">Next Hearing</h4>
                    <p>{caseData.nextHearingDate ? formatDate(caseData.nextHearingDate) : "No hearing scheduled"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hearings Tab */}
            <Tabs defaultValue="hearings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hearings">Hearings</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="hearings" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>Hearing History</CardTitle>
                      <Button onClick={() => setIsAddHearingDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Hearing
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHearings ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : hearings && hearings.length > 0 ? (
                      <div className="space-y-4">
                        {hearings.map(hearing => (
                          <div
                            key={hearing.id}
                            className="border rounded-md p-4 bg-neutral-bg bg-opacity-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-primary rounded-md text-white">
                                  <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {formatDate(hearing.hearingDate)}
                                    {hearing.time && ` at ${hearing.time}`}
                                  </h4>
                                  <p className="text-sm text-neutral-dark mt-1">
                                    {hearing.notes || "No additional notes"}
                                  </p>
                                </div>
                              </div>
                              <Badge>{hearing.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <h3 className="text-lg font-medium text-neutral-dark mb-2">No hearings scheduled</h3>
                        <p className="text-sm text-neutral mb-4">
                          There are no hearings scheduled for this case yet.
                        </p>
                        <Button onClick={() => setIsAddHearingDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule First Hearing
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>Case Documents</CardTitle>
                      <Button disabled>
                        <FilePlus className="h-4 w-4 mr-2" />
                        Add Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <h3 className="text-lg font-medium text-neutral-dark mb-2">No documents yet</h3>
                      <p className="text-sm text-neutral mb-4">
                        There are no documents attached to this case.
                      </p>
                      <Button variant="outline" disabled>
                        <FilePlus className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Card */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.clientId ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-neutral-bg flex items-center justify-center text-primary text-lg">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Client #{caseData.clientId}</h4>
                        <p className="text-sm text-neutral-dark">View client details</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/clients/${caseData.clientId}`}>
                        View Client Details
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-dark mb-4">
                      No client is assigned to this case yet.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      Assign Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  onClick={() => setIsAddHearingDialogOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Hearing
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </CardContent>
            </Card>

            {/* Court Information */}
            <Card>
              <CardHeader>
                <CardTitle>Court Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-bg flex items-center justify-center text-primary text-lg">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">{caseData.courtName}</h4>
                    <p className="text-sm text-neutral-dark">{caseData.courtType || "Not specified"}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Court Website
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the case <span className="font-semibold">{caseData.caseNumber}</span> and all
              associated hearings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteCase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Hearing Dialog */}
      <AlertDialog open={isAddHearingDialogOpen} onOpenChange={setIsAddHearingDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Hearing</AlertDialogTitle>
            <AlertDialogDescription>
              Schedule a new hearing for case {caseData.caseNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Form {...hearingForm}>
            <form onSubmit={hearingForm.handleSubmit(onAddHearing)} className="space-y-4 py-2">
              <FormField
                control={hearingForm.control}
                name="hearingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hearing Date</FormLabel>
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
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={hearingForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={hearingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any details about the hearing"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={hearingForm.control}
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
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Adjourned">Adjourned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit">Schedule</AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
