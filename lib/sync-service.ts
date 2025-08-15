import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SyncConfig {
  userId?: string;
  deviceId: string;
  platform: string;
  syncInterval: number; // milliseconds
}

export class SyncService {
  private static instance: SyncService;
  private config: SyncConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  private constructor(config: SyncConfig) {
    this.config = config;
    this.setupNetworkListener();
  }

  static getInstance(config?: SyncConfig): SyncService {
    if (!SyncService.instance && config) {
      SyncService.instance = new SyncService(config);
    }
    return SyncService.instance;
  }

  private setupNetworkListener() {
    // Monitor network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.performFullSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async startSync() {
    // Register device connection
    await this.registerDevice();
    
    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.performSync();
      }
    }, this.config.syncInterval);

    // Perform initial sync
    await this.performFullSync();
  }

  async stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Mark device as offline
    await this.updateDeviceStatus('offline');
  }

  private async registerDevice() {
    try {
      const { data, error } = await supabase.functions.invoke('sync-handler', {
        body: {
          action: 'heartbeat',
          device_id: this.config.deviceId,
          platform: this.config.platform,
          user_id: this.config.userId
        }
      });

      if (error) throw error;
      console.log('Device registered:', data);
    } catch (error) {
      console.error('Device registration failed:', error);
    }
  }

  private async updateDeviceStatus(status: 'online' | 'offline') {
    try {
      await supabase
        .from('device_connections')
        .upsert({
          device_id: this.config.deviceId,
          user_id: this.config.userId,
          platform: this.config.platform,
          status,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  }

  async performSync() {
    if (!this.isOnline || !this.config.userId) return;

    try {
      // Send heartbeat
      await this.registerDevice();

      // Get incremental updates
      const lastSync = await AsyncStorage.getItem('last_sync_timestamp');
      
      const { data, error } = await supabase.functions.invoke('real-time-sync', {
        body: {
          action: 'get_updates',
          user_id: this.config.userId,
          since: lastSync
        }
      });

      if (error) throw error;

      if (data?.updates && data.updates.length > 0) {
        await this.processUpdates(data.updates);
        await AsyncStorage.setItem('last_sync_timestamp', new Date().toISOString());
      }

    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async performFullSync() {
    if (!this.isOnline || !this.config.userId) return;

    try {
      const { data, error } = await supabase.functions.invoke('sync-handler', {
        body: {
          action: 'sync_all',
          device_id: this.config.deviceId,
          platform: this.config.platform,
          user_id: this.config.userId
        }
      });

      if (error) throw error;

      // Store synced data locally for offline access
      if (data?.data) {
        await AsyncStorage.setItem('synced_user_data', JSON.stringify(data.data));
        await AsyncStorage.setItem('last_full_sync', new Date().toISOString());
      }

      console.log('Full sync completed:', data);
      return data?.data;

    } catch (error) {
      console.error('Full sync failed:', error);
      
      // Return cached data if available
      const cachedData = await AsyncStorage.getItem('synced_user_data');
      return cachedData ? JSON.parse(cachedData) : null;
    }
  }

  private async processUpdates(updates: any[]) {
    for (const update of updates) {
      try {
        // Process each update based on table and event type
        switch (update.table_name) {
          case 'users':
            await this.handleUserUpdate(update);
            break;
          case 'reports':
            await this.handleReportUpdate(update);
            break;
          default:
            console.log('Unknown table update:', update.table_name);
        }
      } catch (error) {
        console.error('Failed to process update:', update, error);
      }
    }
  }

  private async handleUserUpdate(update: any) {
    // Handle user data updates
    console.log('Processing user update:', update);
    // Trigger UI refresh or state updates as needed
  }

  private async handleReportUpdate(update: any) {
    // Handle report data updates
    console.log('Processing report update:', update);
    // Trigger UI refresh or state updates as needed
  }

  async broadcastUpdate(table: string, eventType: string, recordId: string) {
    if (!this.isOnline || !this.config.userId) return;

    try {
      await supabase.functions.invoke('real-time-sync', {
        body: {
          action: 'broadcast_update',
          table,
          event_type: eventType,
          record_id: recordId,
          user_id: this.config.userId
        }
      });
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }

  // Generate unique device ID
  static async generateDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }
}