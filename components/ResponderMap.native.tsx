import React from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface ResponderMapProps {
  currentLocation: { latitude: number; longitude: number };
  incidentLocation: { latitude: number; longitude: number };
  routeCoords: { latitude: number; longitude: number }[];
}

const ResponderMap: React.FC<ResponderMapProps> = ({ currentLocation, incidentLocation, routeCoords }) => {
  return (
    <View style={{ width: '100%', height: 300, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (currentLocation.latitude + incidentLocation.latitude) / 2,
          longitude: (currentLocation.longitude + incidentLocation.longitude) / 2,
          latitudeDelta: Math.abs(currentLocation.latitude - incidentLocation.latitude) + 0.01,
          longitudeDelta: Math.abs(currentLocation.longitude - incidentLocation.longitude) + 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          pinColor="#377DFF"
        />
        <Marker
          coordinate={incidentLocation}
          title="Incident Location"
          pinColor="#d32f2f"
        />
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#377DFF"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

export default ResponderMap; 