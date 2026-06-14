/**
 * Place details component for bottom sheet
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { Place } from '@/types/maps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons, Entypo } from '@expo/vector-icons';

interface PlaceDetailsProps {
  place: Place;
  distance: string;
  duration?: string;
  onNavigate?: () => void;
  onCall?: () => void;
}

export function PlaceDetails({
  place,
  distance,
  duration,
  onNavigate,
  onCall,
}: PlaceDetailsProps) {
  const handleCallPress = async () => {
    if (place.phoneNumber) {
      try {
        await Linking.openURL(`tel:${place.phoneNumber}`);
        onCall?.();
      } catch (error) {
        Alert.alert('Error', 'Could not open phone dialer');
      }
    }
  };

  const handleWebsitePress = async () => {
    if (place.website) {
      try {
        await Linking.openURL(place.website);
      } catch (error) {
        Alert.alert('Error', 'Could not open website');
      }
    }
  };

  const handleDirectionsPress = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header with image and status */}
        <View style={styles.headerSection}>
          {place.photoUrl && (
            <Image source={{ uri: place.photoUrl }} style={styles.placeImage} />
          )}
          <View style={styles.headerOverlay}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: place.openingHours?.isOpen ? '#27ae60' : '#e74c3c',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {place.openingHours?.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Place name and rating */}
        <View style={styles.titleSection}>
          <ThemedText type="title" style={styles.placeName}>
            {place.name}
          </ThemedText>

          {place.rating && (
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <MaterialIcons
                  key={i}
                  name="star"
                  size={16}
                  color={i < Math.floor(place.rating || 0) ? '#f39c12' : '#bdc3c7'}
                />
              ))}
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Distance and time */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={20} color="#e74c3c" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{distance}</Text>
            </View>
          </View>

          {duration && (
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={20} color="#3498db" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Est. Time</Text>
                <Text style={styles.infoValue}>{duration}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Address
          </ThemedText>
          <Text style={styles.addressText}>{place.address}</Text>
        </View>

        {/* Contact information */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact
          </ThemedText>

          {place.phoneNumber && (
            <Pressable style={styles.contactItem} onPress={handleCallPress}>
              <MaterialIcons name="phone" size={20} color="#3498db" />
              <Text style={styles.contactText}>{place.phoneNumber}</Text>
            </Pressable>
          )}

          {place.website && (
            <Pressable style={styles.contactItem} onPress={handleWebsitePress}>
              <MaterialIcons name="language" size={20} color="#3498db" />
              <Text style={[styles.contactText, styles.linkText]}>Visit Website</Text>
            </Pressable>
          )}

          {!place.phoneNumber && !place.website && (
            <Text style={styles.noInfoText}>Contact information not available</Text>
          )}
        </View>

        {/* Business information */}
        {place.businessStatus && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Status
            </ThemedText>
            <View style={styles.statusRow}>
              <Entypo
                name={
                  place.businessStatus === 'OPERATIONAL'
                    ? 'check'
                    : place.businessStatus === 'CLOSED_PERMANENTLY'
                      ? 'cross'
                      : 'info'
                }
                size={16}
                color={
                  place.businessStatus === 'OPERATIONAL'
                    ? '#27ae60'
                    : place.businessStatus === 'CLOSED_PERMANENTLY'
                      ? '#e74c3c'
                      : '#f39c12'
                }
              />
              <Text style={styles.statusValue}>
                {place.businessStatus === 'OPERATIONAL'
                  ? 'Operational'
                  : place.businessStatus === 'CLOSED_PERMANENTLY'
                    ? 'Permanently Closed'
                    : 'Temporarily Closed'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        {place.phoneNumber && (
          <Pressable
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCallPress}>
            <MaterialIcons name="phone" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.actionButton, styles.navigateButton]}
          onPress={handleDirectionsPress}>
          <MaterialIcons name="directions" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Navigate</Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerSection: {
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
    height: 200,
    backgroundColor: '#ecf0f1',
    position: 'relative',
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  titleSection: {
    marginBottom: 12,
  },
  placeName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  contactText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#2c3e50',
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  noInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#e74c3c',
  },
  navigateButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
