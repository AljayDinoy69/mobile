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
  private lastSyncTimestamp: string | null = null;

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
        console.log('Network: Online - Starting full sync');
        this.performFullSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('Network: Offline - Caching data locally');
      });
    }
  }

  async startSync() {
    console.log('Starting sync service for device:', this.config.deviceId);
    
    // Register device connection
    await this.registerDevice();
    
    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.performIncrementalSync();
      }
    }, this.config.syncInterval);

    // Perform initial full sync
    await this.performFullSync();
  }

  async stopSync() {
    console.log('Stopping sync service for device:', this.config.deviceId);
    
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
      console.log('Device registered successfully:', data);
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
      
      console.log(`Device status updated to: ${status}`);
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  }

  async performIncrementalSync() {
    if (!this.isOnline || !this.config.userId) return;

    try {
      console.log('Performing incremental sync...');
      
      // Send heartbeat to keep connection alive
      await this.registerDevice();

      // Get incremental updates since last sync
      const { data, error } = await supabase.functions.invoke('real-time-sync', {
        body: {
          action: 'get_updates',
          user_id: this.config.userId,
          since: this.lastSyncTimestamp
        }
      });

      if (error) throw error;

      if (data?.updates && data.updates.length > 0) {
        console.log(`Processing ${data.updates.length} incremental updates`);
        await this.processUpdates(data.updates);
        this.lastSyncTimestamp = new Date().toISOString();
        await AsyncStorage.setItem('last_sync_timestamp', this.lastSyncTimestamp);
      }

    } catch (error) {
      console.error('Incremental sync failed:', error);
    }
  }

  async performFullSync() {
    if (!this.isOnline) {
      console.log('Offline - Loading cached data');
      return await this.loadCachedData();
    }

    try {
      console.log('Performing full sync...');
      
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
        this.lastSyncTimestamp = data.data.sync_timestamp;
        console.log('Full sync completed successfully');
      }

      return data?.data;

    } catch (error) {
      console.error('Full sync failed:', error);
      
      // Return cached data if available
      return await this.loadCachedData();
    }
  }

  private async loadCachedData() {
    try {
      const cachedData = await AsyncStorage.getItem('synced_user_data');
      if (cachedData) {
        console.log('Loading cached data for offline use');
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
    return null;
  }

  private async processUpdates(updates: any[]) {
    for (const update of updates) {
      try {
        console.log('Processing update:', update.table_name, update.event_type);
        
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
    console.log('Processing user update:', update);
    // Trigger UI refresh or state updates as needed
    // This would typically emit events that components can listen to
  }

  private async handleReportUpdate(update: any) {
    console.log('Processing report update:', update);
    // Trigger UI refresh or state updates as needed
    // This would typically emit events that components can listen to
  }

  async broadcastUpdate(table: string, eventType: string, recordId: string) {
    if (!this.isOnline || !this.config.userId) return;

    try {
      console.log(`Broadcasting update: ${table}.${eventType} for record ${recordId}`);
      
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
      console.log('Generated new device ID:', deviceId);
    }
    
    return deviceId;
  }

  // Update user ID for the sync service
  updateUserId(userId: string) {
    this.config.userId = userId;
    console.log('Sync service updated for user:', userId);
  }

  // Get sync statistics
  async getSyncStats() {
    try {
      const lastFullSync = await AsyncStorage.getItem('last_full_sync');
      const lastIncrementalSync = await AsyncStorage.getItem('last_sync_timestamp');
      
      return {
        lastFullSync: lastFullSync ? new Date(lastFullSync) : null,
        lastIncrementalSync: lastIncrementalSync ? new Date(lastIncrementalSync) : null,
        isOnline: this.isOnline,
        deviceId: this.config.deviceId,
        platform: this.config.platform
      };
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return null;
    }
  }
}