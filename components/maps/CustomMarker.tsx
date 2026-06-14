/**
 * Custom marker component with symbol display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMarkerSymbol, getMarkerColor } from '@/utils/maps/mapUtils';
import { PlaceType } from '@/types/maps';

interface CustomMarkerProps {
  type: PlaceType;
  label?: string;
}

export function CustomMarker({ type, label }: CustomMarkerProps) {
  const symbol = getMarkerSymbol(type);
  const color = getMarkerColor(type);

  return (
    <View style={[styles.markerContainer, { backgroundColor: color }]}>
      <Text style={styles.markerSymbol}>{symbol}</Text>
      {label && <Text style={styles.markerLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSymbol: {
    fontSize: 24,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
});
