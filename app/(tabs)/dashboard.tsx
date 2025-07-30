import DropdownMenu from '@/components/DropdownMenu';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '@/components/UserContext';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const { user, setUser } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileContact, setProfileContact] = useState(user?.contact || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [editReportModalVisible, setEditReportModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editChiefComplaint, setEditChiefComplaint] = useState('');
  const [editPersonInvolved, setEditPersonInvolved] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Load user's submitted reports
  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const key = `user-reports-${user.email}`;
      const stored = await AsyncStorage.getItem(key);
      setMyReports(stored ? JSON.parse(stored) : []);
    })();
  }, [user?.email, showReportsModal]);

  // Load all reports for status modal
  const loadAllReports = async () => {
    const allReportsKey = 'all-reports';
    const allReportsStr = await AsyncStorage.getItem(allReportsKey);
    setAllReports(allReportsStr ? JSON.parse(allReportsStr) : []);
  };

  // Sort reports from newest to oldest
  const sortReportsByDate = (reports: any[]) => {
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Edit report handler
  const openEditReportModal = (report: any) => {
    setEditingReport(report);
    setEditChiefComplaint(report.chiefComplaint || '');
    setEditPersonInvolved(report.personInvolved || '');
    setEditDescription(report.description || '');
    setEditReportModalVisible(true);
  };
  const closeEditReportModal = () => {
    setEditReportModalVisible(false);
    setEditingReport(null);
    setEditChiefComplaint('');
    setEditPersonInvolved('');
    setEditDescription('');
  };
  const saveEditedReport = async () => {
    if (!editingReport) return;
    // Update in user reports
    const userKey = `user-reports-${user?.email}`;
    const userReportsStr = await AsyncStorage.getItem(userKey);
    const userReports = userReportsStr ? JSON.parse(userReportsStr) : [];
    const updatedUserReports = userReports.map((r: any) => r.id === editingReport.id ? { ...r, chiefComplaint: editChiefComplaint, personInvolved: editPersonInvolved, description: editDescription } : r);
    await AsyncStorage.setItem(userKey, JSON.stringify(updatedUserReports));
    setMyReports(updatedUserReports);
    // Update in all-reports
    const allReportsKey = 'all-reports';
    const allReportsStr = await AsyncStorage.getItem(allReportsKey);
    const allReports = allReportsStr ? JSON.parse(allReportsStr) : [];
    const updatedAllReports = allReports.map((r: any) => r.id === editingReport.id ? { ...r, chiefComplaint: editChiefComplaint, personInvolved: editPersonInvolved, description: editDescription } : r);
    await AsyncStorage.setItem(allReportsKey, JSON.stringify(updatedAllReports));
    // Update in responder-reports
    if (editingReport.responders && editingReport.responders.length > 0) {
      for (const responderEmail of editingReport.responders) {
        const responderKey = `responder-reports-${responderEmail}`;
        const responderReportsStr = await AsyncStorage.getItem(responderKey);
        const responderReports = responderReportsStr ? JSON.parse(responderReportsStr) : [];
        const updatedResponderReports = responderReports.map((r: any) => r.id === editingReport.id ? { ...r, chiefComplaint: editChiefComplaint, personInvolved: editPersonInvolved, description: editDescription } : r);
        await AsyncStorage.setItem(responderKey, JSON.stringify(updatedResponderReports));
      }
    }
    closeEditReportModal();
  };
  // Delete report handler
  const deleteReport = async (report: any) => {
    // Remove from user reports
    const userKey = `user-reports-${user.email}`;
    const userReportsStr = await AsyncStorage.getItem(userKey);
    const userReports = userReportsStr ? JSON.parse(userReportsStr) : [];
    const updatedUserReports = userReports.filter((r: any) => r.id !== report.id);
    await AsyncStorage.setItem(userKey, JSON.stringify(updatedUserReports));
    setMyReports(updatedUserReports);
    // Remove from all-reports
    const allReportsKey = 'all-reports';
    const allReportsStr = await AsyncStorage.getItem(allReportsKey);
    const allReports = allReportsStr ? JSON.parse(allReportsStr) : [];
    const updatedAllReports = allReports.filter((r: any) => r.id !== report.id);
    await AsyncStorage.setItem(allReportsKey, JSON.stringify(updatedAllReports));
    // Remove from responder-reports
    if (report.responders && report.responders.length > 0) {
      for (const responderEmail of report.responders) {
        const responderKey = `responder-reports-${responderEmail}`;
        const responderReportsStr = await AsyncStorage.getItem(responderKey);
        const responderReports = responderReportsStr ? JSON.parse(responderReportsStr) : [];
        const updatedResponderReports = responderReports.filter((r: any) => r.id !== report.id);
        await AsyncStorage.setItem(responderKey, JSON.stringify(updatedResponderReports));
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftRowMobile}>
          <Image
            source={require('@/assets/images/shield-icon.png')}
            style={[styles.shieldIcon, isMobile && styles.shieldIconMobile]}
            resizeMode="contain"
          />
          <ThemedText type="title" style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>Emergency Response Hub</ThemedText>
        </View>
        <View style={styles.headerRightRowMobile}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="#222" style={{ marginRight: 10 }} />
          </TouchableOpacity>
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
            <TextInput
              style={styles.profileInput}
              placeholder="Full Name"
              value={profileName}
              onChangeText={setProfileName}
            />
            <TextInput
              style={styles.profileInput}
              placeholder="Email"
              value={profileEmail}
              onChangeText={setProfileEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.profileInput}
              placeholder="Contact Number"
              value={profileContact}
              onChangeText={setProfileContact}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.profileInput}
              placeholder="Address (optional)"
              value={profileAddress}
              onChangeText={setProfileAddress}
            />
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: '#377DFF', marginTop: 18 }]}
              onPress={() => {
                setUser({ name: profileName, email: profileEmail, contact: profileContact, address: profileAddress });
                setShowProfile(false);
              }}
            >
              <Text style={styles.modalActionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Reports Modal */}
      <Modal visible={showReportsModal} animationType="slide" transparent onRequestClose={() => setShowReportsModal(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={[styles.profileModalContainer, { maxHeight: '80%' }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowReportsModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>My Submitted Reports</Text>
            <ScrollView style={{ width: '100%' }}>
              {myReports.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No reports submitted yet.</Text>
              ) : myReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((report: any) => (
                <View key={report.id} style={{ backgroundColor: '#f6f8fa', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {report.chiefComplaint || report.title || 'Emergency Report'}
                  </Text>
                  <Text style={{ color: '#555', marginBottom: 2 }}>{report.description}</Text>
                  
                  {/* User Information */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#888', fontSize: 12 }}>👤 Reporter: {report.fullName || 'Anonymous'}</Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>📞 Contact: {report.contactNumber || 'N/A'}</Text>
                  </View>
                  
                  {/* Person Involved */}
                  <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>👥 Person Involved: {report.personInvolved || 'N/A'}</Text>
                  
                  {report.photo && (
                    <Image source={{ uri: report.photo }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  )}
                  <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>Status: {report.status}</Text>
                  <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>Submitted: {new Date(report.createdAt).toLocaleString()}</Text>
                  {report.responders && report.responders.length > 0 && (
                    <Text style={{ color: '#377DFF', fontSize: 12, marginBottom: 2 }}>Sent to: {report.responders.join(', ')}</Text>
                  )}
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                    <TouchableOpacity onPress={() => openEditReportModal(report)}>
                      <Text style={{ color: '#377DFF', fontSize: 14 }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteReport(report)}>
                      <Text style={{ color: '#d32f2f', fontSize: 14 }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Emergency Status Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent onRequestClose={() => setShowStatusModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxHeight: '85%' }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 6 }} onPress={() => setShowStatusModal(false)}>
              <Text style={{ fontSize: 22, color: '#888' }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Current Emergency Reports Status</Text>
            <ScrollView style={{ width: '100%' }}>
              {allReports.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No reports submitted yet.</Text>
              ) : sortReportsByDate(allReports).map((report: any) => (
                <View key={report.id} style={{ backgroundColor: '#f6f8fa', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {report.chiefComplaint || report.title || 'Emergency Report'}
                  </Text>
                  <Text style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>👥 Person Involved: {report.personInvolved || 'N/A'}</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Status: {report.status}</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Submitted: {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={editReportModalVisible} animationType="slide" transparent onRequestClose={closeEditReportModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', maxWidth: 400 }}>
            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 6 }} onPress={closeEditReportModal}>
              <Text style={{ fontSize: 22, color: '#888' }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Edit Report</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 }}
              placeholder="Chief Complaint"
              value={editChiefComplaint}
              onChangeText={setEditChiefComplaint}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 }}
              placeholder="Person Involved"
              value={editPersonInvolved}
              onChangeText={setEditPersonInvolved}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16, minHeight: 60 }}
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <TouchableOpacity style={{ backgroundColor: '#377DFF', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 }} onPress={saveEditedReport}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.realtimeBanner}>
        <MaterialIcons name="warning" size={16} color="#fbc02d" style={{ marginRight: 4 }} />
        <Text style={{ color: '#333', fontSize: 13 }}>Real-time updates enabled</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: isMobile ? 8 : 16, paddingBottom: 32 }}>
        {/* Welcome Banner */}
        <LinearGradient colors={["#377DFF", "#FF3B3B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.welcomeBanner, isMobile && styles.welcomeBannerMobile]}>
          <ThemedText type="title" style={[styles.welcomeTitle, isMobile && styles.welcomeTitleMobile]}>Welcome to Emergency Response Hub</ThemedText>
          <Text style={[styles.welcomeDesc, isMobile && styles.welcomeDescMobile]}>Your safety is our priority. Access emergency services and stay informed.</Text>
        </LinearGradient>
        {/* Main Cards */}
        <View style={[styles.cardRow, isMobile && styles.cardRowMobile]}>
          <ThemedView style={[styles.mainCardBlue, isMobile && styles.mainCardMobile]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="history" size={20} color="#377DFF" style={{ marginRight: 6 }} />
              <ThemedText type="subtitle">Recent Reports</ThemedText>
            </View>
            <Text style={styles.cardDesc}>View recently submitted reports</Text>
            <TouchableOpacity style={styles.cardBtn} onPress={() => setShowReportsModal(true)}>
              <Ionicons name="eye-outline" size={18} color="#377DFF" style={{ marginRight: 6 }} />
              <Text style={styles.cardBtnText}>View Reports</Text>
            </TouchableOpacity>
          </ThemedView>
          <ThemedView style={[styles.mainCardOrange, isMobile && styles.mainCardMobile]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="report-problem" size={20} color="#e65100" style={{ marginRight: 6 }} />
              <ThemedText type="subtitle" style={{ color: '#b45309' }}>Report Emergency</ThemedText>
            </View>
            <Text style={styles.cardDesc}>Report emergency incidents</Text>
            <TouchableOpacity style={styles.cardBtnOrange} onPress={() => router.push('/dashboard-report')}>
              <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.cardBtnTextWhite}>File Report</Text>
            </TouchableOpacity>
          </ThemedView>
          <ThemedView style={[styles.mainCardBlue, isMobile && styles.mainCardMobile]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="show-chart" size={20} color="#377DFF" style={{ marginRight: 6 }} />
              <ThemedText type="subtitle">Emergency Status</ThemedText>
            </View>
            <Text style={styles.cardDesc}>Check local emergency status</Text>
            <TouchableOpacity style={styles.cardBtn} onPress={() => { loadAllReports(); setShowStatusModal(true); }}>
              <Text style={styles.cardBtnText}>View Status</Text>
            </TouchableOpacity>
          </ThemedView>
        </View>
        {/* Emergency Contacts */}
        <ThemedView style={styles.sectionCard}>
          <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Emergency Contacts</ThemedText>
          <View style={[styles.contactsGrid, isMobile && styles.contactsGridMobile]}>
            <View style={styles.contactsCol}>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>Police Department</Text><Text style={styles.contactNumBlue}>911</Text></View>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>Fire Department</Text><Text style={styles.contactNumRed}>911</Text></View>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>Medical Emergency</Text><Text style={styles.contactNumGreen}>911</Text></View>
            </View>
            <View style={styles.contactsCol}>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>Poison Control</Text><Text style={styles.contactNumPurple}>1-800-222-1222</Text></View>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>Non-Emergency Police</Text><Text style={styles.contactNumGray}>(555) 123-4567</Text></View>
              <View style={styles.contactRow}><Text style={styles.contactLabel}>City Services</Text><Text style={styles.contactNumGray}>(555) 987-6543</Text></View>
            </View>
          </View>
        </ThemedView>
        {/* Safety Information */}
        <ThemedView style={styles.sectionCard}>
          <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Safety Information</ThemedText>
          <View style={styles.safetyRow}>
            <MaterialIcons name="warning" size={18} color="#fbc02d" style={{ marginRight: 6 }} />
            <Text style={styles.safetyAlert}><Text style={{ fontWeight: 'bold' }}>Weather Alert:</Text> Severe thunderstorm warning in effect until 8:00 PM tonight.</Text>
          </View>
          <View style={styles.safetyRow}>
            <MaterialIcons name="check-circle" size={18} color="#43a047" style={{ marginRight: 6 }} />
            <Text style={styles.safetyAlert}><Text style={{ fontWeight: 'bold' }}>Emergency Preparedness:</Text> Keep emergency supplies ready: water, food, flashlight, and first aid kit.</Text>
          </View>
          <View style={styles.safetyRow}>
            <MaterialIcons name="map" size={18} color="#1976d2" style={{ marginRight: 6 }} />
            <Text style={styles.safetyAlert}><Text style={{ fontWeight: 'bold' }}>Evacuation Routes:</Text> Know your local evacuation routes and emergency shelters in your area.</Text>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 28,
    paddingBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 2,
  },
  headerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 28,
    paddingBottom: 4,
    minHeight: 54,
  },
  headerRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeftRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#222',
  },
  headerTitleMobile: {
    fontSize: 16,
  },
  headerSub: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    flexShrink: 1,
  },
  headerSubMobile: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: 'auto',
    marginTop: 4,
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#43a047',
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    color: '#222',
    marginRight: 4,
  },
  statusDivider: {
    color: '#888',
    marginHorizontal: 4,
    fontSize: 13,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 14,
  },
  emergencyBtnMobile: {
    width: '100%',
    justifyContent: 'center',
    marginLeft: 0,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  emergencyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  userBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },
  userBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  realtimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#ffe082',
  },
  welcomeBanner: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  welcomeBannerMobile: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  welcomeTitleMobile: {
    fontSize: 17,
  },
  welcomeDesc: {
    color: '#f3f3f3',
    fontSize: 15,
    marginTop: 2,
  },
  welcomeDescMobile: {
    fontSize: 13,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  cardRowMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  mainCardBlue: {
    flex: 1,
    backgroundColor: '#f5faff',
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 2,
    minWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  mainCardOrange: {
    flex: 1,
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 2,
    minWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  mainCardMobile: {
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 8,
    padding: 12,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#377DFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  cardBtnText: {
    color: '#377DFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardBtnOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  cardBtnTextWhite: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  contactsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactsGridMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  contactsCol: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  contactLabel: {
    fontSize: 15,
    color: '#222',
  },
  contactNumBlue: { color: '#377DFF', fontWeight: 'bold', fontSize: 15 },
  contactNumRed: { color: '#d32f2f', fontWeight: 'bold', fontSize: 15 },
  contactNumGreen: { color: '#43a047', fontWeight: 'bold', fontSize: 15 },
  contactNumPurple: { color: '#8e24aa', fontWeight: 'bold', fontSize: 15 },
  contactNumGray: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyAlert: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  burgerBtn: {
    marginLeft: 8,
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'flex-end',
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 44,
    marginRight: 10,
    minWidth: 180,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
  },
  shieldIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  shieldIconMobile: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalContainer: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#888',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fafbfc',
  },
  modalActionBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  modalActionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 