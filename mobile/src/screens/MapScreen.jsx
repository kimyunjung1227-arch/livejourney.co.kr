import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

const MapScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.9780,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* 마커들 */}
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;


