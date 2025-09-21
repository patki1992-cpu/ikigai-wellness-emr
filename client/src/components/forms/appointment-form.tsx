import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { z } from "zod";

// Form schema excluding providerId (added on server)
const appointmentFormSchema = insertAppointmentSchema.omit({ providerId: true });
type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<AppointmentFormData>;
}

export default function AppointmentForm({ onSubmit, onCancel, isLoading, initialData }: AppointmentFormProps) {
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: initialData?.patientId || "",
      appointmentDate: initialData?.appointmentDate || new Date(),
      duration: initialData?.duration || 30,
      appointmentType: initialData?.appointmentType || "",
      reason: initialData?.reason || "",
      status: initialData?.status || "scheduled",
      notes: initialData?.notes || "",
    },
  });

  const formatDateTimeLocal = (date: string | Date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return ""; // Handle Invalid Date
    return d.toISOString().slice(0, 16);
  };

  const handleDateChange = (value: string) => {
    if (value) {
      const date = new Date(value);
      return date;
    }
    return value;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-appointment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient ID *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter patient ID or MRN" data-testid="input-patient-id" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-appointment-type">
                      <SelectValue placeholder="Select appointment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="annual_physical">Annual Physical</SelectItem>
                    <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="urgent_care">Urgent Care</SelectItem>
                    <SelectItem value="specialist_referral">Specialist Referral</SelectItem>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="preventive_screening">Preventive Screening</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(field.value)}
                    onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                    data-testid="input-appointment-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Brief description of the reason for this appointment"
                  data-testid="textarea-reason"
                />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Additional notes or instructions"
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel-appointment-form"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit-appointment-form"
          >
            {isLoading ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
