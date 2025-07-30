import DropdownMenu from '@/components/DropdownMenu';
import ResponderMap from '@/components/ResponderMap';
import { useUser } from '@/components/UserContext';
import { Feather } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResponderDashboard() {
  const { user } = useUser();
  const [tab, setTab] = useState<'available' | 'mycases' | 'rejected'>('available');
  // Per-responder data storage (localStorage/AsyncStorage by user.email)
  const [reports, setReports] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [rejectedCases, setRejectedCases] = useState<any[]>([]);
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [newReportBanner, setNewReportBanner] = useState(false);
  const [locateModalVisible, setLocateModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [viewReportModalVisible, setViewReportModalVisible] = useState(false);
  const [viewedReport, setViewedReport] = useState<any>(null);

  // Mark report as read/unread
  const toggleRead = async (reportId: string) => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    const updated = reports.map(r => r.id === reportId ? { ...r, read: !r.read } : r);
    setReports(updated);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  // Mark report as read
  const markAsRead = async (reportId: string) => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    // Get all reports (not just available)
    const stored = await AsyncStorage.getItem(key);
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((r: any) => r.id === reportId ? { ...r, read: true } : r);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    setReports(updated.filter((r: any) => !r.taken && !r.rejected));
    setMyCases(updated.filter((r: any) => r.taken));
    setRejectedCases(updated.filter((r: any) => r.rejected));
  };
  // Mark report as unread
  const markAsUnread = async (reportId: string) => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    const stored = await AsyncStorage.getItem(key);
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((r: any) => r.id === reportId ? { ...r, read: false } : r);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    setReports(updated.filter((r: any) => !r.taken && !r.rejected));
    setMyCases(updated.filter((r: any) => r.taken));
    setRejectedCases(updated.filter((r: any) => r.rejected));
  };

  // Take case
  const takeCase = async (reportId: string) => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    const stored = await AsyncStorage.getItem(key);
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((r: any) => r.id === reportId ? { ...r, taken: true, rejected: false } : r);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    setReports(updated.filter((r: any) => !r.taken && !r.rejected));
    setMyCases(updated.filter((r: any) => r.taken));
    setRejectedCases(updated.filter((r: any) => r.rejected));
  };
  // Reject case
  const rejectCase = async (reportId: string) => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    const stored = await AsyncStorage.getItem(key);
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((r: any) => r.id === reportId ? { ...r, rejected: true, taken: false } : r);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    setReports(updated.filter((r: any) => !r.taken && !r.rejected));
    setMyCases(updated.filter((r: any) => r.taken));
    setRejectedCases(updated.filter((r: any) => r.rejected));
    // Store in global rejected-reports
    const rejectedReport = updated.find((r: any) => r.id === reportId);
    if (rejectedReport) {
      const globalKey = 'rejected-reports';
      const globalStored = await AsyncStorage.getItem(globalKey);
      const globalList = globalStored ? JSON.parse(globalStored) : [];
      await AsyncStorage.setItem(globalKey, JSON.stringify([...globalList, rejectedReport]));
    }
  };

  const openLocateModal = async (report: any) => {
    setSelectedReport(report);
    setLocateModalVisible(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setCurrentLocation(null);
      setRouteCoords([]);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const currLoc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    setCurrentLocation(currLoc);
    // Fetch directions
    if (report?.location) {
      const destLat = report.location.lat || report.location.coords?.latitude;
      const destLng = report.location.lng || report.location.coords?.longitude;
      const apiKey = 'AIzaSyAKTotj_XSXEFS6ZLreewpXOGg1ARQ4JYs'; // Inserted user-provided API key
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${currLoc.latitude},${currLoc.longitude}&destination=${destLat},${destLng}&key=${apiKey}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const points = polyline.decode(data.routes[0].overview_polyline.points);
          const coords = points.map((point: [number, number]) => ({ latitude: point[0], longitude: point[1] }));
          setRouteCoords(coords);
        } else {
          setRouteCoords([]);
        }
      } catch (e) {
        setRouteCoords([]);
      }
    }
  };
  const closeLocateModal = () => {
    setLocateModalVisible(false);
    setSelectedReport(null);
    setCurrentLocation(null);
    setRouteCoords([]);
  };

  const openImageModal = (uri: string) => {
    setSelectedImageUri(uri);
    setImageModalVisible(true);
  };
  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUri(null);
  };

  const openViewReportModal = (report: any) => {
    setViewedReport(report);
    setViewReportModalVisible(true);
  };
  const closeViewReportModal = () => {
    setViewReportModalVisible(false);
    setViewedReport(null);
  };

  // Filtered reports
  const filteredReports = reports.filter(r =>
    statusFilter === 'all' ? true : statusFilter === 'read' ? r.read : !r.read
  );

  // Load cases on mount and when reports change
  useEffect(() => {
    if (!user?.email) return;
    const key = `responder-reports-${user.email}`;
    const loadCases = async () => {
      const stored = await AsyncStorage.getItem(key);
      const all = stored ? JSON.parse(stored) : [];
      setReports(all.filter((r: any) => !r.taken && !r.rejected));
      setMyCases(all.filter((r: any) => r.taken));
      setRejectedCases(all.filter((r: any) => r.rejected));
    };
    loadCases();
    const interval = setInterval(loadCases, 5000);
    return () => clearInterval(interval);
  }, [user?.email, newReportBanner]);

  // Helper for completed today
  const today = new Date();
  const isToday = (dateStr: string) => {
    const today = new Date().toDateString();
    return new Date(dateStr).toDateString() === today;
  };

  // Sort reports from newest to oldest
  const sortReportsByDate = (reports: any[]) => {
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };
  const completedToday = myCases.filter((r: any) => r.status === 'Completed' && isToday(r.completedTime || r.updatedAt || r.takenTime));
  // Average response time in minutes for completed today
  const avgResponseTime = completedToday.length > 0 ?
    Math.round(
      completedToday.reduce((sum: number, r: any) => {
        const created = new Date(r.createdAt || r.time || r.takenTime);
        const completed = new Date(r.completedTime || r.updatedAt || r.takenTime);
        return sum + (completed.getTime() - created.getTime()) / 60000;
      }, 0) / completedToday.length
    ) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fb', paddingTop: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftRowMobile}>
          <Image
            source={require('@/assets/images/shield-icon.png')}
            style={styles.shieldIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Emergency Response Hub</Text>
          <View style={styles.responderBadge}><Text style={styles.responderBadgeText}>RESPONDER</Text></View>
        </View>
        <View style={styles.headerRightRowMobile}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.burgerBtn}>
            <Feather name="menu" size={30} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Mobile Burger Menu Modal */}
      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        menuItems={[
          {
            icon: 'user',
            label: 'Profile',
            onPress: () => setShowProfile(true),
          },
          {
            icon: 'settings',
            label: 'Settings',
            onPress: () => {},
          },
          {
            icon: 'info',
            label: 'About',
            onPress: () => {},
          },
          {
            icon: 'log-out',
            label: 'Logout',
            onPress: () => router.push('/'),
            color: '#d32f2f',
          },
        ]}
      />
      {/* Profile Modal */}
      <Modal visible={showProfile} animationType="slide" transparent onRequestClose={() => setShowProfile(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowProfile(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Edit Profile</Text>
            {/* Add profile fields as needed for responder */}
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: '#377DFF', marginTop: 18 }]}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.modalActionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusOnline}>● System Online</Text>
        <Text style={styles.statusActive}>All Services Active</Text>
        <Text style={styles.statusRealtime}>⚠️ Real-time updates enabled</Text>
      </View>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statNum}>{myCases.length}</Text><Text style={styles.statLabel}>My Active Cases</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{reports.length}</Text><Text style={styles.statLabel}>Available Reports</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{completedToday.length}</Text><Text style={styles.statLabel}>Completed Today</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{avgResponseTime}m</Text><Text style={styles.statLabel}>Response Time</Text></View>
      </View>
      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.reportBtn}><Text style={styles.reportBtnText}>+ Report Emergency</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Emergency Contact</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Team Communication</Text></TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'available' && styles.tabBtnActive]} onPress={() => setTab('available')}><Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>Available Reports</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'mycases' && styles.tabBtnActive]} onPress={() => setTab('mycases')}><Text style={[styles.tabText, tab === 'mycases' && styles.tabTextActive]}>My Cases</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'rejected' && styles.tabBtnActive]} onPress={() => setTab('rejected')}><Text style={[styles.tabText, tab === 'rejected' && styles.tabTextActive]}>Rejected Cases</Text></TouchableOpacity>
      </View>
      {/* Reports List */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {tab === 'available' && (
          <View>
            <Text style={styles.sectionTitle}>Available Emergency Reports</Text>
            <Text style={styles.sectionDesc}>Reports requiring Police Department response. Multiple responders can take the same case.</Text>
            {/* Filter Controls */}
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {['all', 'unread', 'read'].map(f => (
                <TouchableOpacity key={f} style={[styles.roleBadge, { backgroundColor: statusFilter === f ? '#377DFF' : '#e0e0e0', marginRight: 8 }]} onPress={() => setStatusFilter(f as any)}>
                  <Text style={{ color: statusFilter === f ? '#fff' : '#222', fontWeight: 'bold' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {sortReportsByDate(filteredReports).map((report) => (
              <View key={report.id} style={[styles.reportCard, !report.read && styles.unreadReportCard]}>
                {report.photo && (
                  <TouchableOpacity onPress={() => openImageModal(report.photo)}>
                    <Image source={{ uri: report.photo }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                <Text style={[styles.reportTitle, !report.read && { color: '#fff' }]}>
                  {report.chiefComplaint || report.title || `Emergency Report - ${report.status}`}
                </Text>
                <Text style={[styles.reportDesc, !report.read && { color: '#fff' }]}>{report.description}</Text>
                
                {/* User Information */}
                <View style={styles.userInfoSection}>
                  <Text style={[styles.userInfoLabel, !report.read && { color: '#fff' }]}>
                    📞 Contact: {report.contactNumber || 'N/A'}
                  </Text>
                  <Text style={[styles.userInfoLabel, !report.read && { color: '#fff' }]}>
                    👤 Reporter: {report.fullName || 'Anonymous'}
                  </Text>
                </View>
                
                {/* Person Involved */}
                <Text style={[styles.personInvolved, !report.read && { color: '#fff' }]}>
                  👥 Person Involved: {report.personInvolved || 'N/A'}
                </Text>
                
                {/* Location Information */}
                <Text style={[styles.reportLocation, !report.read && { color: '#fff' }]}>
                  📍 {report.location?.lat || report.location?.coords?.latitude}, {report.location?.lng || report.location?.coords?.longitude}
                </Text>
                
                {/* Timestamp */}
                <Text style={[styles.timestamp, !report.read && { color: '#fff' }]}>
                  🕒 {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                </Text>
                
                <View style={styles.reportActions}>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => { markAsRead(report.id); openViewReportModal(report); }}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.takeBtn} onPress={() => { markAsRead(report.id); takeCase(report.id); }}><Text style={styles.takeBtnText}>Take Case</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => { markAsRead(report.id); rejectCase(report.id); }}><Text style={styles.rejectBtnText}>Reject</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        {tab === 'mycases' && (
          <View>
            <Text style={styles.sectionTitle}>My Cases</Text>
            {myCases.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No cases taken yet.</Text>
            ) : sortReportsByDate(myCases).map((report: any) => (
              <View key={report.id} style={styles.reportCard}>
                {report.photo && (
                  <TouchableOpacity onPress={() => openImageModal(report.photo)}>
                    <Image source={{ uri: report.photo }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                <Text style={styles.reportTitle}>
                  {report.chiefComplaint || report.title || `Emergency Report - ${report.status}`}
                </Text>
                <Text style={styles.reportDesc}>{report.description}</Text>
                
                {/* User Information */}
                <View style={styles.userInfoSection}>
                  <Text style={styles.userInfoLabel}>
                    📞 Contact: {report.contactNumber || 'N/A'}
                  </Text>
                  <Text style={styles.userInfoLabel}>
                    👤 Reporter: {report.fullName || 'Anonymous'}
                  </Text>
                </View>
                
                {/* Location Information */}
                <Text style={styles.reportLocation}>
                  📍 {report.location?.lat || report.location?.coords?.latitude}, {report.location?.lng || report.location?.coords?.longitude}
                </Text>
                
                {/* Timestamp */}
                <Text style={styles.timestamp}>
                  🕒 {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                </Text>
                
                <View style={styles.reportActions}>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => openViewReportModal(report)}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.takeBtn} onPress={() => openLocateModal(report)}>
                    <Text style={styles.takeBtnText}>Locate Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        {tab === 'rejected' && (
          <View>
            <Text style={styles.sectionTitle}>Rejected Cases</Text>
            {rejectedCases.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No rejected cases.</Text>
            ) : sortReportsByDate(rejectedCases).map((report: any) => (
              <View key={report.id} style={[styles.reportCard, !report.read && styles.unreadReportCard]}>
                {report.photo && (
                  <TouchableOpacity onPress={() => openImageModal(report.photo)}>
                    <Image source={{ uri: report.photo }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                <Text style={[styles.reportTitle, !report.read && { color: '#fff' }]}>{report.title || `Emergency Report - ${report.status}`}</Text>
                <Text style={[styles.reportDesc, !report.read && { color: '#fff' }]}>{report.description}</Text>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Reported by: {(report.userName && report.userName !== 'Unknown') ? report.userName : (report.userEmail || report.user) || 'Unknown'}</Text>
                <Text style={[styles.reportLocation, !report.read && { color: '#fff' }]}>📍 {report.location?.lat || report.location?.coords?.latitude}, {report.location?.lng || report.location?.coords?.longitude}</Text>
                <View style={styles.reportActions}>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => { markAsRead(report.id); openViewReportModal(report); }}>
                    <Text style={styles.viewBtnText}>View Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {/* Notification Banner for new reports */}
      {newReportBanner && (
        <View style={{ backgroundColor: '#377DFF', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>New report received!</Text>
        </View>
      )}
      {/* Locate Modal */}
      <Modal visible={locateModalVisible} animationType="slide" transparent onRequestClose={closeLocateModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxHeight: '80%' }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 6 }} onPress={closeLocateModal}>
              <Text style={{ fontSize: 22, color: '#888' }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Location Details</Text>
            {Platform.OS !== 'web' && currentLocation && selectedReport?.location ? (
              <ResponderMap
                currentLocation={currentLocation}
                incidentLocation={{
                  latitude: selectedReport.location.lat || selectedReport.location.coords?.latitude,
                  longitude: selectedReport.location.lng || selectedReport.location.coords?.longitude,
                }}
                routeCoords={routeCoords}
              />
            ) : Platform.OS === 'web' && selectedReport?.location ? (
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Image
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/staticmap?center=${selectedReport.location.lat || selectedReport.location.coords?.latitude},${selectedReport.location.lng || selectedReport.location.coords?.longitude}&zoom=16&size=600x300&markers=color:red%7C${selectedReport.location.lat || selectedReport.location.coords?.latitude},${selectedReport.location.lng || selectedReport.location.coords?.longitude}&key=AIzaSyAKTotj_XSXEFS6ZLreewpXOGg1ARQ4JYs`
                  }}
                  style={{ width: 300, height: 150, borderRadius: 8, marginBottom: 8 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#377DFF', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 }}
                  onPress={() => {
                    const lat = selectedReport.location.lat || selectedReport.location.coords?.latitude;
                    const lng = selectedReport.location.lng || selectedReport.location.coords?.longitude;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ marginBottom: 10, color: '#888' }}>Fetching location data...</Text>
            )}
          </View>
        </View>
      </Modal>
      {/* Image Modal */}
      <Modal visible={imageModalVisible} animationType="fade" transparent onRequestClose={closeImageModal}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={closeImageModal}>
          {selectedImageUri && (
            <Image source={{ uri: selectedImageUri }} style={{ width: '90%', height: '60%', borderRadius: 12, resizeMode: 'contain' }} />
          )}
        </TouchableOpacity>
      </Modal>
      {/* View Report Modal */}
      <Modal visible={viewReportModalVisible} animationType="slide" transparent onRequestClose={closeViewReportModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxHeight: '85%' }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 6 }} onPress={closeViewReportModal}>
              <Text style={{ fontSize: 22, color: '#888' }}>✕</Text>
            </TouchableOpacity>
            {viewedReport && (
              <ScrollView style={{ width: '100%' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: '#FF3B3B' }}>
                  {viewedReport.chiefComplaint || viewedReport.title || 'Emergency Report'}
                </Text>
                
                {/* Incident Photo */}
                {viewedReport.photo && (
                  <TouchableOpacity onPress={() => openImageModal(viewedReport.photo)}>
                    <Image source={{ uri: viewedReport.photo }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 15 }} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                
                {/* User Information Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>👤 Reporter Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name:</Text>
                    <Text style={styles.detailValue}>{viewedReport.fullName || 'Anonymous'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact Number:</Text>
                    <Text style={styles.detailValue}>{viewedReport.contactNumber || 'N/A'}</Text>
                  </View>
                </View>
                
                {/* Incident Details Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🚨 Incident Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Chief Complaint:</Text>
                    <Text style={styles.detailValue}>{viewedReport.chiefComplaint || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Person Involved:</Text>
                    <Text style={styles.detailValue}>{viewedReport.personInvolved || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{viewedReport.description || 'No additional details provided'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>{viewedReport.status || 'Awaiting Assessment'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Priority:</Text>
                    <Text style={styles.detailValue}>{viewedReport.priority || 'Medium'}</Text>
                  </View>
                </View>
                
                {/* Location Information Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📍 Location Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coordinates:</Text>
                    <Text style={styles.detailValue}>
                      {viewedReport.location?.lat || viewedReport.location?.coords?.latitude}, {viewedReport.location?.lng || viewedReport.location?.coords?.longitude}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => {
                      const lat = viewedReport.location?.lat || viewedReport.location?.coords?.latitude;
                      const lng = viewedReport.location?.lng || viewedReport.location?.coords?.longitude;
                      if (Platform.OS === 'web') {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                      } else {
                        // For mobile, you might want to open the native maps app
                        // This would require additional setup
                      }
                    }}
                  >
                    <Text style={styles.mapButtonText}>🗺️ Open in Maps</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Timestamp Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🕒 Timestamp</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reported:</Text>
                    <Text style={styles.detailValue}>
                      {viewedReport.createdAt ? new Date(viewedReport.createdAt).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeftRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 10,
  },
  responderBadge: {
    backgroundColor: '#377DFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  responderBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRightRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  burgerBtn: {
    padding: 4,
  },
  logo: { fontSize: 32, marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 13, color: '#888' },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff0f0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10, borderWidth: 1, borderColor: '#d32f2f' },
  emergencyBtnText: { color: '#d32f2f', fontWeight: 'bold', marginLeft: 4 },
  profileBtn: { padding: 4 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222c', paddingHorizontal: 16, paddingVertical: 6 },
  statusOnline: { color: '#43a047', fontWeight: 'bold', fontSize: 13 },
  statusActive: { color: '#1976d2', fontWeight: 'bold', fontSize: 13 },
  statusRealtime: { color: '#fbc02d', fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 4, alignItems: 'center', padding: 16, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#377DFF' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 8 },
  reportBtn: { backgroundColor: '#d32f2f', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  reportBtnText: { color: '#fff', fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#f1f1f1', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  actionBtnText: { color: '#222', fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#377DFF', backgroundColor: '#fff' },
  tabText: { color: '#888', fontWeight: 'bold' },
  tabTextActive: { color: '#377DFF' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2, color: '#222' },
  sectionDesc: { fontSize: 13, color: '#888', marginBottom: 10 },
  reportCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 14, elevation: 1 },
  reportTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  reportDesc: { color: '#555', fontSize: 13, marginBottom: 4 },
  reportLocation: { color: '#888', fontSize: 12, marginBottom: 8 },
  reportTag: { backgroundColor: '#fffbe6', color: '#b45309', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, marginRight: 6 },
  reportTagOther: { backgroundColor: '#f1f1f1', color: '#888', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12 },
  reportActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  viewBtn: { backgroundColor: '#f1f1f1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  viewBtnText: { color: '#222', fontWeight: 'bold' },
  takeBtn: { backgroundColor: '#377DFF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  takeBtnText: { color: '#fff', fontWeight: 'bold' },
  rejectBtn: { backgroundColor: '#fff0f0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  rejectBtnText: { color: '#d32f2f', fontWeight: 'bold' },
  rejectedTag: { color: '#888', fontWeight: 'bold', marginLeft: 8 },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#888',
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  modalActionBtn: {
    backgroundColor: '#377DFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    width: '100%',
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unreadReportCard: { backgroundColor: '#23272f' },
  userInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 13,
    color: '#888',
  },
  personInvolved: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  detailSection: {
    backgroundColor: '#f8f9fb',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#377DFF',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
  },
  mapButton: {
    backgroundColor: '#377DFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 