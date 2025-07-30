import DropdownMenu from '@/components/DropdownMenu';
import { useUser, type UserInfo } from '@/components/UserContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const mockUsers = [
  { id: '1', status: 'active', name: 'Emergency Administrator', email: 'group10@gmail.com', role: 'admin', department: 'Emergency Management', badge: '', roleColor: '#e0d7fa' },
  { id: '2', status: 'active', name: 'John Officer', email: 'police@emergency.gov', role: 'police', department: 'Police Department', badge: 'PD-001', roleColor: '#d7e9fa' },
  { id: '3', status: 'active', name: 'Mike Firefighter', email: 'fire@emergency.gov', role: 'fire', department: 'Fire Department', badge: 'FD-001', roleColor: '#fad7d7' },
  { id: '4', status: 'active', name: 'Sarah Paramedic', email: 'ems@emergency.gov', role: 'ems', department: 'Emergency Medical Services', badge: 'EMS-001', roleColor: '#d7fadf' },
  { id: '5', status: 'active', name: 'Dr. Emily Doctor', email: 'er@hospital.gov', role: 'hospital_er', department: 'Hospital Emergency Room', badge: 'ER-001', roleColor: '#fad7f6' },
  { id: '6', status: 'active', name: 'Aljay Dinoy', email: 'aljayencodinoy@gmail.com', role: 'user', department: 'General Public', badge: '', roleColor: '#e0e0e0' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<'users' | 'reports' | 'analytics'>('users');
  const router = useRouter();
  const { user, setUser, addUser, updateUser, deleteUser, users } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', contact: '', role: 'responder', department: '', badge: '' });
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [allReports, setAllReports] = useState<any[]>([]);

  // Dynamic stats
  const activeUsers = users.length;
  const inactiveUsers = users.filter((u: UserInfo) => u.status === 'inactive').length;
  // Placeholder state for reports/incidents/alerts
  const [pendingReports, setPendingReports] = useState(2);
  const [activeIncidents, setActiveIncidents] = useState(3);
  const [criticalAlerts, setCriticalAlerts] = useState(1);

  // Load all reports for admin
  useEffect(() => {
    let interval: any;
    const loadReports = async () => {
      const stored = await AsyncStorage.getItem('all-reports');
      setAllReports(stored ? JSON.parse(stored) : []);
    };
    if (tab === 'reports') {
      loadReports();
      interval = setInterval(loadReports, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [tab]);

  // Sort reports from newest to oldest
  const sortReportsByDate = (reports: any[]) => {
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Filtered users
  const filteredUsers = users.filter((u: any) => {
    // Ensure all required properties exist
    if (!u || !u.name || !u.email || !u.role) return false;
    
    return (roleFilter === 'all' || u.role === roleFilter) &&
      (deptFilter === 'all' || (u.department || 'None') === deptFilter) &&
      (
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(search.toLowerCase())
      );
  });

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
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
        </View>
        <View style={styles.headerRightRowMobile}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.burgerBtn}>
            <Feather name="menu" size={30} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusOnline}>● System Online</Text>
        <Text style={styles.statusActive}>All Services Active</Text>
        <Text style={styles.statusRealtime}>⚠️ Real-time updates enabled</Text>
      </View>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statNum}>{activeUsers}</Text><Text style={styles.statLabel}>Active Users</Text><Text style={styles.statSubLabel}>{inactiveUsers} inactive</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{pendingReports}</Text><Text style={styles.statLabel}>Pending Reports</Text><Text style={styles.statSubLabel}>Awaiting assignment</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{activeIncidents}</Text><Text style={styles.statLabel}>Active Incidents</Text><Text style={styles.statSubLabel}>In progress</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{criticalAlerts}</Text><Text style={styles.statLabel}>Critical Alerts</Text><Text style={styles.statSubLabel}>Require immediate attention</Text></View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'users' && styles.tabBtnActive]} onPress={() => setTab('users')}><Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>User Management</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'reports' && styles.tabBtnActive]} onPress={() => setTab('reports')}><Text style={[styles.tabText, tab === 'reports' && styles.tabTextActive]}>All Reports</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'analytics' && styles.tabBtnActive]} onPress={() => setTab('analytics')}><Text style={[styles.tabText, tab === 'analytics' && styles.tabTextActive]}>System Analytics</Text></TouchableOpacity>
      </View>
      {/* User Management Table */}
      {tab === 'users' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>User & Responder Management</Text>
            <TouchableOpacity style={styles.addUserBtn} onPress={() => setShowAddUser(true)}><Ionicons name="person-add" size={18} color="#fff" /><Text style={styles.addUserBtnText}>Add User</Text></TouchableOpacity>
          </View>
          <Text style={styles.sectionDesc}>Manage all users and emergency responders with full CRUD operations</Text>
          {/* Search and Filter Controls */}
          <View style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
            <TextInput
              style={[styles.profileInput, { flex: 2, marginRight: 8, marginBottom: 0 }]}
              placeholder="Search by name, email, or department"
              value={search}
              onChangeText={setSearch}
            />
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {['all', 'admin', 'responder', 'user'].map(role => (
                  <TouchableOpacity key={role} style={[styles.roleBadge, { backgroundColor: roleFilter === role ? '#a084e8' : '#e0e0e0', marginRight: 4, marginBottom: 0 }]} onPress={() => setRoleFilter(role)}>
                    <Text style={{ color: roleFilter === role ? '#fff' : '#222', fontWeight: 'bold', fontSize: 12 }}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {['all', ...Array.from(new Set(users.map((u: any) => u.department || 'None')))]
                  .map((dept: string) => (
                    <TouchableOpacity key={dept} style={[styles.roleBadge, { backgroundColor: deptFilter === dept ? '#a084e8' : '#e0e0e0', marginRight: 4, marginBottom: 0 }]} onPress={() => setDeptFilter(dept)}>
                      <Text style={{ color: deptFilter === dept ? '#fff' : '#222', fontWeight: 'bold', fontSize: 12 }}>{dept}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeader, { flex: 1 }]}>Status</Text>
            <Text style={[styles.tableHeader, { flex: 2 }]}>Name</Text>
            <Text style={[styles.tableHeader, { flex: 3 }]}>Email</Text>
            <Text style={[styles.tableHeader, { flex: 1.5 }]}>Role</Text>
            <Text style={[styles.tableHeader, { flex: 2 }]}>Department</Text>
            <Text style={[styles.tableHeader, { flex: 1 }]}>Badge</Text>
            <Text style={[styles.tableHeader, { flex: 2 }]}>Actions</Text>
          </View>
          {filteredUsers.map((user: any) => {
            // Ensure user has all required properties
            if (!user || !user.name || !user.email || !user.role) return null;
            
            return (
              <View key={user.email} style={styles.tableRow}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#43a047', fontSize: 18 }}>●</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{user.name}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{user.email}</Text>
                <View style={[styles.tableCell, { flex: 1.5 }]}> 
                  <Text style={[styles.roleBadge, { backgroundColor: user.roleColor || '#e0e0e0' }]}>{user.role}</Text> 
                </View>
                <Text style={[styles.tableCell, { flex: 2 }]}>{user.department || 'None'}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{user.badge || '-'}</Text>
                <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => { setEditUser(user); setShowEditUser(true); }}><Ionicons name="create" size={18} color="#222" /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} onPress={async () => {
                    if (window.confirm && !window.confirm('Are you sure you want to delete this user?')) return;
                    await deleteUser(user.email);
                  }}><Ionicons name="trash" size={18} color="#d32f2f" /></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
      {/* Add User Modal */}
      <Modal visible={showAddUser} animationType="slide" transparent onRequestClose={() => setShowAddUser(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAddUser(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Add New User</Text>
            {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
            <TextInput style={styles.profileInput} placeholder="Full Name" value={newUser.name} onChangeText={t => setNewUser(u => ({ ...u, name: t }))} />
            <TextInput style={styles.profileInput} placeholder="Email" value={newUser.email} onChangeText={t => setNewUser(u => ({ ...u, email: t }))} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.profileInput} placeholder="Password" value={newUser.password} onChangeText={t => setNewUser(u => ({ ...u, password: t }))} secureTextEntry />
            <TextInput style={styles.profileInput} placeholder="Contact Number" value={newUser.contact} onChangeText={t => setNewUser(u => ({ ...u, contact: t }))} keyboardType="phone-pad" />
            <TextInput style={styles.profileInput} placeholder="Department" value={newUser.department} onChangeText={t => setNewUser(u => ({ ...u, department: t }))} />
            <TextInput style={styles.profileInput} placeholder="Badge (optional)" value={newUser.badge} onChangeText={t => setNewUser(u => ({ ...u, badge: t }))} />
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {['responder', 'admin', 'user'].map(role => (
                <TouchableOpacity key={role} style={[styles.roleBadge, { backgroundColor: newUser.role === role ? '#a084e8' : '#e0e0e0', marginRight: 8 }]} onPress={() => setNewUser(u => ({ ...u, role }))}>
                  <Text style={{ color: newUser.role === role ? '#fff' : '#222', fontWeight: 'bold' }}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#a084e8', marginTop: 8 }]} onPress={async () => {
              // Validation
              if (!newUser.name || !newUser.email || !newUser.password) {
                setError('Name, email, and password are required.'); return;
              }
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newUser.email)) {
                setError('Invalid email address.'); return;
              }
              if (users.some((u: any) => u.email === newUser.email)) {
                setError('Email already exists.'); return;
              }
              setError('');
              await addUser(newUser);
              setShowAddUser(false);
              setNewUser({ name: '', email: '', password: '', contact: '', role: 'responder', department: '', badge: '' });
            }}>
              <Text style={styles.modalActionBtnText}>Create User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit User Modal */}
      <Modal visible={showEditUser} animationType="slide" transparent onRequestClose={() => setShowEditUser(false)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowEditUser(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Edit User</Text>
            {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
            <TextInput style={styles.profileInput} placeholder="Full Name" value={editUser?.name} onChangeText={t => setEditUser((u: any) => ({ ...u, name: t }))} />
            <TextInput style={styles.profileInput} placeholder="Email" value={editUser?.email} onChangeText={t => setEditUser((u: any) => ({ ...u, email: t }))} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.profileInput} placeholder="Password" value={editUser?.password} onChangeText={t => setEditUser((u: any) => ({ ...u, password: t }))} secureTextEntry />
            <TextInput style={styles.profileInput} placeholder="Contact Number" value={editUser?.contact} onChangeText={t => setEditUser((u: any) => ({ ...u, contact: t }))} keyboardType="phone-pad" />
            <TextInput style={styles.profileInput} placeholder="Department" value={editUser?.department} onChangeText={t => setEditUser((u: any) => ({ ...u, department: t }))} />
            <TextInput style={styles.profileInput} placeholder="Badge (optional)" value={editUser?.badge} onChangeText={t => setEditUser((u: any) => ({ ...u, badge: t }))} />
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {['responder', 'admin', 'user'].map(role => (
                <TouchableOpacity key={role} style={[styles.roleBadge, { backgroundColor: editUser?.role === role ? '#a084e8' : '#e0e0e0', marginRight: 8 }]} onPress={() => setEditUser((u: any) => ({ ...u, role }))}>
                  <Text style={{ color: editUser?.role === role ? '#fff' : '#222', fontWeight: 'bold' }}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#a084e8', marginTop: 8 }]} onPress={async () => {
              if (!editUser) return;
              if (!editUser.name || !editUser.email || !editUser.password) {
                setError('Name, email, and password are required.'); return;
              }
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(editUser.email)) {
                setError('Invalid email address.'); return;
              }
              if (editUser.password.length < 6) {
                setError('Password must be at least 6 characters.'); return;
              }
              setError('');
              await updateUser(editUser.email, editUser);
              setShowEditUser(false);
              setEditUser(null);
            }}>
              <Text style={styles.modalActionBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Placeholder for other tabs */}
      {tab === 'reports' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={styles.sectionTitle}>All Submitted Reports</Text>
          <Text style={styles.sectionDesc}>Complete overview of all emergency reports submitted to the system</Text>
          {allReports.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No reports submitted yet.</Text>
          ) : sortReportsByDate(allReports).map((report: any) => (
            <View key={report.id} style={styles.reportCard}>
              {/* Report Header */}
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>
                  {report.chiefComplaint || report.title || 'Emergency Report'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: report.status === 'Completed' ? '#4CAF50' : '#FF9800' }]}>
                  <Text style={styles.statusBadgeText}>{report.status || 'Awaiting Assessment'}</Text>
                </View>
              </View>
              
              {/* Incident Photo */}
              {report.photo && (
                <Image source={{ uri: report.photo }} style={styles.reportImage} resizeMode="cover" />
              )}
              
              {/* User Information */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>👤 Reporter Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Full Name:</Text>
                  <Text style={styles.infoValue}>{report.fullName || 'Anonymous'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Number:</Text>
                  <Text style={styles.infoValue}>{report.contactNumber || 'N/A'}</Text>
                </View>
              </View>
              
              {/* Incident Details */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>🚨 Incident Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chief Complaint:</Text>
                  <Text style={styles.infoValue}>{report.chiefComplaint || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Person Involved:</Text>
                  <Text style={styles.infoValue}>{report.personInvolved || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description:</Text>
                  <Text style={styles.infoValue}>{report.description || 'No additional details provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Priority:</Text>
                  <Text style={styles.infoValue}>{report.priority || 'Medium'}</Text>
                </View>
              </View>
              
              {/* Location Information */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>📍 Location Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Coordinates:</Text>
                  <Text style={styles.infoValue}>
                    {report.location?.lat || report.location?.coords?.latitude}, {report.location?.lng || report.location?.coords?.longitude}
                  </Text>
                </View>
              </View>
              
              {/* System Information */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>📊 System Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Submitted:</Text>
                  <Text style={styles.infoValue}>
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                  </Text>
                </View>
                {report.responders && report.responders.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Assigned Responders:</Text>
                    <Text style={styles.infoValue}>{report.responders.join(', ')}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      {tab === 'analytics' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>System Analytics (Coming Soon)</Text>
        </View>
      )}
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
            {/* Add profile fields as needed for admin */}
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: '#a084e8', marginTop: 18 }]}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.modalActionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  logo: { fontSize: 32, marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 13, color: '#888' },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff0f0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10, borderWidth: 1, borderColor: '#d32f2f' },
  emergencyBtnText: { color: '#d32f2f', fontWeight: 'bold', marginLeft: 4 },
  adminBadge: { backgroundColor: '#a084e8', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginRight: 10 },
  adminBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  profileBtn: { padding: 4 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222c', paddingHorizontal: 16, paddingVertical: 6 },
  statusOnline: { color: '#43a047', fontWeight: 'bold', fontSize: 13 },
  statusActive: { color: '#1976d2', fontWeight: 'bold', fontSize: 13 },
  statusRealtime: { color: '#fbc02d', fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 4, alignItems: 'center', padding: 16, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#377DFF' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  statSubLabel: { fontSize: 11, color: '#bbb', marginTop: 2 },
  tabsRow: { flexDirection: 'row', backgroundColor: '#f8f9fb', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#a084e8', backgroundColor: '#fff' },
  tabText: { color: '#888', fontWeight: 'bold' },
  tabTextActive: { color: '#a084e8' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  sectionDesc: { fontSize: 13, color: '#888', marginBottom: 10 },
  addUserBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  addUserBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f1f1', borderRadius: 6, padding: 8, marginBottom: 4 },
  tableHeader: { fontWeight: 'bold', color: '#888', fontSize: 13 },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, padding: 8, marginBottom: 4, elevation: 1 },
  tableCell: { fontSize: 13, color: '#222', paddingHorizontal: 2 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, color: '#222', fontWeight: 'bold', fontSize: 12 },
  actionIcon: { marginHorizontal: 4, padding: 4 },
  headerLeftRowMobile: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shieldIcon: { width: 30, height: 30, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', flex: 1 },
  headerRightRowMobile: { flexDirection: 'row', alignItems: 'center' },
  burgerBtn: { padding: 4 },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '100%',
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 10,
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
    width: '90%',
    alignItems: 'center',
    elevation: 10,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#222',
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  modalActionBtn: {
    backgroundColor: '#222',
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
  profileInput: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  reportCard: {
    backgroundColor: '#f6f8fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reportImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 13,
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
}); 