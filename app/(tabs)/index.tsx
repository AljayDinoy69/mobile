import { ThemedText } from '@/components/ThemedText';
import { useUser } from '@/components/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { setUser, users, getUserByEmail, addUser } = useUser();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpContact, setSignUpContact] = useState('');
  
  // Helper for emergency call
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const clearLogin = () => {
    setLoginEmail('');
    setLoginPassword('');
  };
  const clearSignUp = () => {
    setSignUpFirstName('');
    setSignUpLastName('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
    setSignUpContact('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section with Circular Report Button */}
        <LinearGradient
          colors={["#1E3A8A", "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle}>
              Emergency Response Hub
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Report emergencies instantly. Get help when you need it most.
            </ThemedText>
            
            {/* Circular Report Button with Logo */}
            <TouchableOpacity 
              style={styles.circularReportBtn} 
              onPress={() => router.push('./report')}
              activeOpacity={0.8}
            >
              <View style={styles.circularBtnInner}>
                <FontAwesome name="exclamation-triangle" size={32} color="#DC2626" />
                <ThemedText style={styles.circularBtnText}>REPORT</ThemedText>
                <ThemedText style={styles.circularBtnSubtext}>EMERGENCY</ThemedText>
              </View>
            </TouchableOpacity>
            
            <ThemedText style={styles.heroNote}>
              No account required • Reports submitted instantly
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Join Network Section */}
        <View style={styles.joinSection}>
          <ThemedText style={styles.sectionTitle}>Join the Emergency Response Network</ThemedText>
          <ThemedText style={styles.joinDesc}>
            Sign up for an account to track your reports and access additional features.
          </ThemedText>
          <View style={styles.joinButtons}>
            <TouchableOpacity 
              style={[styles.joinBtn, styles.loginBtn]} 
              onPress={() => setShowLogin(true)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.joinBtnText}>Log In</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.joinBtn, styles.signupBtn]} 
              onPress={() => setShowSignUp(true)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.joinBtnText}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="camera" size={24} color="#1E3A8A" />
              </View>
              <ThemedText style={styles.featureTitle}>Instant Reporting</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Report emergencies with photos and location, without an account, in seconds.
              </ThemedText>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="users" size={24} color="#DC2626" />
              </View>
              <ThemedText style={styles.featureTitle}>Coordinated Response</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Emergency responders receive real-time information and location for faster response.
              </ThemedText>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <FontAwesome name="map-marker" size={24} color="#059669" />
              </View>
              <ThemedText style={styles.featureTitle}>Precise Location</ThemedText>
              <ThemedText style={styles.featureDesc}>
                GPS coordinates and address information help responders find you quickly.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.contactsSection}>
          <ThemedText style={styles.sectionTitle}>Emergency Contacts</ThemedText>
          <View style={styles.contactsGrid}>
            <TouchableOpacity 
              style={[styles.contactCard, styles.emergencyContact]} 
              onPress={() => handleCall('911')}
              activeOpacity={0.7}
            >
              <FontAwesome name="phone" size={20} color="#DC2626" />
              <ThemedText style={styles.contactType}>Life-Threatening Emergency</ThemedText>
              <ThemedText style={styles.contactNumber}>911</ThemedText>
              <ThemedText style={styles.contactDesc}>Police, Fire, Medical</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactCard, styles.poisonContact]} 
              onPress={() => handleCall('1-800-222-1222')}
              activeOpacity={0.7}
            >
              <FontAwesome name="phone" size={20} color="#1E3A8A" />
              <ThemedText style={styles.contactType}>Poison Control</ThemedText>
              <ThemedText style={styles.contactNumber}>1-800-222-1222</ThemedText>
              <ThemedText style={styles.contactDesc}>24/7 Poison Help</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactCard, styles.nonEmergencyContact]} 
              onPress={() => handleCall('5551234567')}
              activeOpacity={0.7}
            >
              <FontAwesome name="phone" size={20} color="#059669" />
              <ThemedText style={styles.contactType}>Non-Emergency</ThemedText>
              <ThemedText style={styles.contactNumber}>(555) 123-4567</ThemedText>
              <ThemedText style={styles.contactDesc}>General Services</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Social Media Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')} style={styles.footerIcon}>
          <FontAwesome name="facebook" size={24} color="#4267B2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com')} style={styles.footerIcon}>
          <FontAwesome name="twitter" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com')} style={styles.footerIcon}>
          <FontAwesome name="youtube" size={24} color="#FF0000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')} style={styles.footerIcon}>
          <FontAwesome name="instagram" size={24} color="#E4405F" />
        </TouchableOpacity>
      </View>

      {/* Login Modal */}
      <Modal visible={showLogin} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowLogin(false); clearLogin(); }}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Log In</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#666"
              value={loginEmail}
              onChangeText={setLoginEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#666"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: '#1E3A8A' }]} 
              onPress={() => {
                const found = users.find(u => u.email === loginEmail && u.password === loginPassword);
                if (found) {
                  setUser(found);
                  setShowLogin(false);
                  clearLogin();
                  if (found.role === 'admin') {
                    router.push('/dashboard-admin');
                  } else if (found.role === 'responder') {
                    router.push('/dashboard-responder');
                  } else {
                    router.push('/dashboard');
                  }
                } else {
                  alert('Invalid email or password');
                }
              }}
            >
              <ThemedText style={styles.modalActionBtnText}>Log In</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sign Up Modal */}
      <Modal visible={showSignUp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowSignUp(false); clearSignUp(); }}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Sign Up</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={signUpFirstName}
              onChangeText={setSignUpFirstName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={signUpLastName}
              onChangeText={setSignUpLastName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#666"
              value={signUpEmail}
              onChangeText={setSignUpEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Contact Number"
              placeholderTextColor="#666"
              value={signUpContact}
              onChangeText={setSignUpContact}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#666"
              value={signUpPassword}
              onChangeText={setSignUpPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              value={signUpConfirmPassword}
              onChangeText={setSignUpConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: '#059669' }]} 
              onPress={async () => {
                const newUser = {
                  name: `${signUpFirstName} ${signUpLastName}`.trim(),
                  email: signUpEmail,
                  contact: signUpContact,
                  password: signUpPassword,
                  role: 'user',
                };
                await addUser(newUser);
                setUser(newUser);
                setShowSignUp(false);
                clearSignUp();
                router.push('/dashboard');
              }}
            >
              <ThemedText style={styles.modalActionBtnText}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 400,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.95,
    lineHeight: 22,
  },
  circularReportBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  circularBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  circularBtnSubtext: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  heroNote: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  joinSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  joinDesc: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  joinButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  joinBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginBtn: {
    backgroundColor: '#1E3A8A',
  },
  signupBtn: {
    backgroundColor: '#059669',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  featuresGrid: {
    gap: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  featureCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: Platform.OS === 'web' ? 1 : undefined,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  contactsSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#F8FAFC',
  },
  contactsGrid: {
    gap: 12,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: Platform.OS === 'web' ? 1 : undefined,
  },
  emergencyContact: {
    borderColor: '#DC2626',
  },
  poisonContact: {
    borderColor: '#1E3A8A',
  },
  nonEmergencyContact: {
    borderColor: '#059669',
  },
  contactType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerIcon: {
    marginHorizontal: 16,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 2,
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  modalActionBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
