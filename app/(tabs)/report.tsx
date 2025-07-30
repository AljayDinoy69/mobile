import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '@/components/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EmergencyReportScreen() {
  const router = useRouter();
  const { users, getUserByEmail, user } = useUser();
  const responders = users.filter(u => u.role === 'responder');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [showComplaintDropdown, setShowComplaintDropdown] = useState(false);
  const [personInvolved, setPersonInvolved] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [selectedResponders, setSelectedResponders] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill user information if logged in
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setContactNumber(user.contact || '');
    }
  }, [user]);

  // Chief Complaint options
  const complaintOptions = [
    'Medical Emergency',
    'Traffic Accident',
    'Fire Emergency',
    'Crime/Assault',
    'Natural Disaster',
    'Chemical Spill',
    'Building Collapse',
    'Gas Leak',
    'Water Emergency',
    'Power Outage',
    'Animal Attack',
    'Drowning',
    'Suicide Attempt',
    'Domestic Violence',
    'Industrial Accident'
  ];

  // Person Involved options
  const personInvolvedOptions = [
    '1 Person',
    '2 People',
    '3 People',
    '4 People',
    '5 People',
    '6-10 People',
    '11-20 People',
    '21-50 People',
    '51-100 People',
    '100+ People',
    'Unknown',
    'Other'
  ];

  // Auto-fetch location on mount
  useEffect(() => {
    (async () => {
      setLocationStatus('Locating...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Permission denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLocationStatus('Location Confirmed');
    })();
  }, []);

  // Camera
  const handleCapturePhoto = async () => {
    if (photoLoading) return;
    setPhotoLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access required', 'Please enable camera permissions to capture an incident photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        console.log('Photo captured:', result.assets[0].uri);
      } else {
        console.log('Camera cancelled or no photo.');
      }
    } catch (e) {
      console.error('Photo capture error:', e);
      Alert.alert('Photo Error', 'An error occurred while capturing the photo. Please try again.');
    } finally {
      setPhotoLoading(false);
      console.log('Photo loading finished.');
    }
  };

  // Manual location refresh
  const handleGetLocation = async () => {
    setLocationStatus('Locating...');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Permission denied');
        Alert.alert('Location access required', 'Please enable location permissions.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLocationStatus('Location Confirmed');
    } catch (e) {
      console.error('Location error:', e);
      setLocationStatus('Location error');
      Alert.alert('Location Error', 'Failed to get location. Please try again.');
    }
  };

  // Multi-select responders
  const toggleResponder = (id: string) => {
    setSelectedResponders((prev) =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Clear form fields
  const clearForm = () => {
    // Reset to user profile information if logged in, otherwise clear
    if (user) {
      setFullName(user.name || '');
      setContactNumber(user.contact || '');
    } else {
      setFullName('');
      setContactNumber('');
    }
    setChiefComplaint('');
    setShowComplaintDropdown(false);
    setPersonInvolved('');
    setShowPersonDropdown(false);
    setDescription('');
    setPhoto(null);
    setLocation(null);
    setLocationStatus('');
    setSelectedResponders([]);
    setSubmitting(false);
  };

  // Submit
  const canSubmit = contactNumber.trim() && chiefComplaint && personInvolved && photo && selectedResponders.length > 0 && location;
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const report = {
        id: Date.now().toString(),
        fullName: fullName.trim() || (user?.name || 'Anonymous'),
        contactNumber: contactNumber.trim() || (user?.contact || 'N/A'),
        chiefComplaint,
        personInvolved,
        description,
        photo,
        location,
        status: 'Awaiting Assessment',
        createdAt: new Date().toISOString(),
        priority: 'medium',
        type: 'other',
        responders: selectedResponders,
      };
      // Send report to each selected responder
      for (const responderEmail of selectedResponders) {
        const key = `responder-reports-${responderEmail}`;
        const existing = await AsyncStorage.getItem(key);
        const reports = existing ? JSON.parse(existing) : [];
        await AsyncStorage.setItem(key, JSON.stringify([...reports, report]));
      }
      // Save report to user's own submitted reports
      const userInfoStr = await AsyncStorage.getItem('user-info');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      if (userInfo && userInfo.email) {
        const userKey = `user-reports-${userInfo.email}`;
        const userReports = await AsyncStorage.getItem(userKey);
        const parsedUserReports = userReports ? JSON.parse(userReports) : [];
        await AsyncStorage.setItem(userKey, JSON.stringify([...parsedUserReports, report]));
      }
      // Save report to global all-reports for admin dashboard
      const allReportsKey = 'all-reports';
      const allReports = await AsyncStorage.getItem(allReportsKey);
      const parsedAllReports = allReports ? JSON.parse(allReports) : [];
      await AsyncStorage.setItem(allReportsKey, JSON.stringify([...parsedAllReports, report]));
      setTimeout(() => {
        setSubmitting(false);
        clearForm();
        
        // Create detailed notification message
        const notificationMessage = `✅ Emergency Report Submitted Successfully!

🚨 Chief Complaint: ${chiefComplaint}
👤 Reporter: ${fullName.trim() || 'Anonymous'}
📞 Contact: ${contactNumber}
👥 Person Involved: ${personInvolved}
📍 Location: ${location?.coords?.latitude}, ${location?.coords?.longitude}
📸 Photo: ${photo ? 'Included' : 'Not provided'}
📝 Description: ${description || 'No additional details'}
🕒 Submitted: ${new Date().toLocaleString()}
👥 Sent to: ${selectedResponders.length} responder(s)

Your report has been sent to the selected emergency responders. They will review and respond to your emergency as soon as possible.`;
        
        Alert.alert('Report Submitted Successfully!', notificationMessage);
        router.back();
        console.log('Report submitted.');
      }, 1200);
    } catch (e) {
      console.error('Submit error:', e);
      setSubmitting(false);
      Alert.alert('Submit Error', 'Failed to submit the report. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} style={{ width: '100%' }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { clearForm(); router.back(); }}>
          <Text style={styles.backBtnText}>← Back to Home</Text>
        </TouchableOpacity>
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={{ color: '#FF3B3B', textAlign: 'center', marginBottom: 4 }}>⚠️ Emergency Report</ThemedText>
          <ThemedText style={{ textAlign: 'center', marginBottom: 8 }}>Report an emergency incident – No account required</ThemedText>
          
          {/* Full Name - Optional */}
          <ThemedText style={styles.sectionLabel}>Full Name (Optional)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name (optional)"
            value={fullName}
            onChangeText={setFullName}
          />
          
          {/* Contact Number - Required */}
          <ThemedText style={styles.sectionLabel}>Contact Number <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          <TextInput
            style={[styles.input, !contactNumber.trim() && styles.inputError]}
            placeholder="Enter your contact number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
          
          {/* Chief Complaint - Required */}
          <ThemedText style={styles.sectionLabel}>Chief Complaint <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          <TouchableOpacity 
            style={[styles.dropdownButton, !chiefComplaint && styles.inputError]} 
            onPress={() => setShowComplaintDropdown(true)}
          >
            <Text style={{ color: chiefComplaint ? '#333' : '#999' }}>
              {chiefComplaint || 'Select the type of emergency'}
            </Text>
            <Text style={{ color: '#666' }}>▼</Text>
          </TouchableOpacity>
          
          {/* Chief Complaint Dropdown Modal */}
          <Modal
            visible={showComplaintDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowComplaintDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              onPress={() => setShowComplaintDropdown(false)}
            >
              <View style={styles.dropdownModal}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Select Emergency Type</Text>
                  <TouchableOpacity onPress={() => setShowComplaintDropdown(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.dropdownList}>
                  {complaintOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setChiefComplaint(option);
                        setShowComplaintDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Person Involved - Required */}
          <ThemedText style={styles.sectionLabel}>Person Involved <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          <TouchableOpacity 
            style={[styles.dropdownButton, !personInvolved && styles.inputError]} 
            onPress={() => setShowPersonDropdown(true)}
          >
            <Text style={{ color: personInvolved ? '#333' : '#999' }}>
              {personInvolved || 'Select who was involved'}
            </Text>
            <Text style={{ color: '#666' }}>▼</Text>
          </TouchableOpacity>
          
          {/* Person Involved Dropdown Modal */}
          <Modal
            visible={showPersonDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPersonDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              onPress={() => setShowPersonDropdown(false)}
            >
              <View style={styles.dropdownModal}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Select Person Involved</Text>
                  <TouchableOpacity onPress={() => setShowPersonDropdown(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.dropdownList}>
                  {personInvolvedOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setPersonInvolved(option);
                        setShowPersonDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          <ThemedText style={styles.sectionLabel}>Detailed Description (Optional)</ThemedText>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="Provide detailed information about the incident, injuries, damages, etc."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          {/* Responder Selection */}
          <ThemedText style={styles.sectionLabel}>Select Responders <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          {/* Dropdown removed as requested */}
          <View style={styles.responderRow}>
            {responders.map(r => (
              <TouchableOpacity
                key={r.email}
                style={[styles.responderBtn, selectedResponders.includes(r.email) && styles.responderBtnSelected]}
                onPress={() => toggleResponder(r.email)}
              >
                <Text style={{ color: selectedResponders.includes(r.email) ? '#fff' : '#333' }}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Location */}
          <ThemedText style={styles.sectionLabel}>Location Information <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          <TouchableOpacity style={styles.locationBox} onPress={handleGetLocation}>
            <Text style={{ color: location ? '#00B67A' : '#888' }}>
              {location ? `Location Confirmed\n${location.coords.latitude}, ${location.coords.longitude}` : locationStatus || 'Tap to get current location'}
            </Text>
          </TouchableOpacity>
          {/* Photo Capture */}
          <ThemedText style={styles.sectionLabel}>Incident Documentation <Text style={{ color: '#FF3B3B' }}>*</Text></ThemedText>
          <View style={styles.photoBox}>
            {photoLoading ? (
              <Text style={{ color: '#888', textAlign: 'center' }}>Processing photo...</Text>
            ) : (photo && typeof photo === 'string') ? (
              <>
                <Image
                  source={{ uri: photo }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                  onError={() => {
                    console.log('Image failed to load:', photo);
                    setPhoto(null);
                    Alert.alert('Photo Error', 'Failed to load the captured photo. Please try again.');
                  }}
                />
                <TouchableOpacity style={{ marginTop: 8 }} onPress={() => { setPhoto(null); console.log('Photo removed by user'); }}>
                  <Text style={{ color: '#FF3B3B', fontWeight: 'bold' }}>Remove Photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>No photo captured</Text>
            )}
          </View>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapturePhoto}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{photoLoading ? 'Processing...' : '📷 Capture Photo'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FF3B3B', fontSize: 12, marginTop: 2, marginBottom: 8 }}>
            Camera access is required to document the emergency. Please enable permissions and capture a photo.
          </Text>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: canSubmit ? '#FF3B3B' : '#ccc' }]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {submitting ? 'Submitting...' : 'Submit Emergency Report'}
            </Text>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6fa',
    paddingTop: Platform.select({ ios: 48, android: 24, default: 24 }),
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FF3B3B',
    borderWidth: 0,
    elevation: 2,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  card: {
    width: '98%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#fafbfc',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#FF3B3B',
    borderWidth: 1,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  responderBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  responderBtnSelected: {
    backgroundColor: '#377DFF',
    borderColor: '#377DFF',
  },
  locationBox: {
    borderWidth: 1,
    borderColor: '#b3e6c7',
    backgroundColor: '#f6fff9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    marginTop: 2,
  },
  photoBox: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafbfc',
    borderRadius: 8,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginTop: 2,
  },
  photoPreview: {
    width: 120,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  captureBtn: {
    backgroundColor: '#FF3B3B',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 2,
  },
  submitBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 150,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f7f7f7',
    marginTop: 4,
  },
  dropdownBtnText: {
    fontSize: 15,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  dropdownList: {
    maxHeight: 200,
  },
  // Dropdown styles removed
}); 