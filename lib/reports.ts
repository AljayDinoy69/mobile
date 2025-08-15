import { supabase } from './supabase';
import { SyncService } from './sync-service';

export interface Report {
  id?: string;
  user_id?: string;
  full_name: string;
  contact_number: string;
  chief_complaint: string;
  person_involved: string;
  description?: string;
  photo_url?: string;
  location_lat?: number;
  location_lng?: number;
  status: string;
  priority: string;
  responders?: string[];
  created_at?: string;
  updated_at?: string;
}

export class ReportsService {
  // Create a new report
  static async createReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Report | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            user_id: report.user_id,
            full_name: report.full_name,
            contact_number: report.contact_number,
            chief_complaint: report.chief_complaint,
            person_involved: report.person_involved,
            description: report.description || '',
            photo_url: report.photo_url || '',
            location_lat: report.location_lat,
            location_lng: report.location_lng,
            status: report.status || 'Awaiting Assessment',
            priority: report.priority || 'medium',
            responders: report.responders || [],
          },
        ])
        .select()
        .single();

      // Broadcast update to all devices
      const syncService = SyncService.getInstance();
      if (syncService) {
        await syncService.broadcastUpdate('reports', 'insert', data.id);
      }

      return { data, error };
    } catch (error) {
      console.error('Error creating report:', error);
      return { data: null, error };
    }
  }

  // Get all reports (admin view)
  static async getAllReports(): Promise<{ data: Report[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching all reports:', error);
      return { data: [], error };
    }
  }

  // Get reports for a specific user
  static async getUserReports(userId: string): Promise<{ data: Report[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return { data: [], error };
    }
  }

  // Get reports assigned to a responder
  static async getResponderReports(responderEmail: string): Promise<{ data: Report[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .contains('responders', [responderEmail])
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching responder reports:', error);
      return { data: [], error };
    }
  }

  // Update a report
  static async updateReport(id: string, updates: Partial<Report>): Promise<{ data: Report | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      // Broadcast update to all devices
      const syncService = SyncService.getInstance();
      if (syncService) {
        await syncService.broadcastUpdate('reports', 'update', id);
      }

      return { data, error };
    } catch (error) {
      console.error('Error updating report:', error);
      return { data: null, error };
    }
  }

  // Delete a report
  static async deleteReport(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      // Broadcast update to all devices
      const syncService = SyncService.getInstance();
      if (syncService) {
        await syncService.broadcastUpdate('reports', 'delete', id);
      }

      return { error };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { error };
    }
  }

  // Subscribe to real-time changes
  static subscribeToReports(callback: (payload: any) => void) {
    return supabase
      .channel('reports_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reports' },
        callback
      )
      .subscribe();
  }
}