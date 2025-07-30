import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, onClose, menuItems }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.menuDropdown}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => {
              onClose();
              setTimeout(item.onPress, 100); // ensure menu closes before action
            }}
            activeOpacity={0.7}
          >
            <Feather name={item.icon} size={20} color={item.color || '#222'} style={{ marginRight: 10 }} />
            <Text style={[styles.menuItemText, item.color ? { color: item.color } : null]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'flex-start',
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
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
});

export default DropdownMenu; 