/**
 * Main Maps Screen Component
 * Displays hospitals and pharmacies nearby with interactive map features
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  Text,
  Dimensions,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sharing from 'expo-sharing';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Place, LatLng, PlaceType, TravelMode, TravelRouteInfo } from '@/types/maps';
import { geolocationService } from '@/services/maps/geolocationService';
import { googleMapsService } from '@/services/maps/googleMapsService';
import {
  createRegionFromLocations,
  sortPlacesByDistance,
} from '@/utils/maps/mapUtils';
import { PlaceDetails } from '../../components/maps/PlaceDetails';

const TRAVEL_MODES: Array<{
  mode: TravelMode;
  label: string;
  icon: 'directions-walk' | 'directions-bike' | 'directions-car' | 'directions-bus';
  color: string;
}> = [
  { mode: 'walking', label: 'Walk', icon: 'directions-walk', color: '#27ae60' },
  { mode: 'bicycling', label: 'Bike', icon: 'directions-bike', color: '#16a085' },
  { mode: 'driving', label: 'Car', icon: 'directions-car', color: '#3498db' },
  { mode: 'transit', label: 'Bus', icon: 'directions-bus', color: '#8e44ad' },
];

const INITIAL_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

interface NearbyPlaces {
  hospitals: Place[];
  pharmacies: Place[];
}

const getRouteLineStyle = (mode: TravelMode) => {
  switch (mode) {
    case 'walking':
      return { strokeColor: '#27ae60', strokeWidth: 4, lineDashPattern: undefined };
    case 'bicycling':
      return { strokeColor: '#16a085', strokeWidth: 4, lineDashPattern: undefined };
    case 'driving':
      return { strokeColor: '#3498db', strokeWidth: 5, lineDashPattern: undefined };
    case 'transit':
      return { strokeColor: '#8e44ad', strokeWidth: 4, lineDashPattern: undefined };
  }
};

export default function MapsScreen() {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaces>({
    hospitals: [],
    pharmacies: [],
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [routeOptions, setRouteOptions] = useState<Partial<Record<TravelMode, TravelRouteInfo | null>>>({});
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'pharmacies' | 'all'>('all');
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>('driving');
  const [routeLoading, setRouteLoading] = useState(false);

  const selectedRoute = selectedPlace ? routeOptions[selectedTravelMode] ?? null : null;
  const selectedRouteInfo = selectedRoute
    ? {
        distance: googleMapsService.formatDistance(selectedRoute.distance),
        duration: googleMapsService.formatDuration(selectedRoute.duration),
      }
    : null;

  /**
   * Initialize location and load nearby places
   */
  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      setRoutePolyline([]);
      return;
    }

    if (selectedRoute?.overview_polyline?.points) {
      setRoutePolyline(googleMapsService.decodePolyline(selectedRoute.overview_polyline.points));
      return;
    }

    setRoutePolyline([]);
  }, [selectedPlace, selectedTravelMode, routeOptions]);

  /**
   * Initialize map with current location
   */
  const initializeMap = async () => {
    try {
      setLoading(true);

      // Get current location
      const location = await geolocationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);

        // Load nearby places
        await loadNearbyPlaces(location);

        // Animate to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Failed to initialize map. Please check location permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load nearby hospitals and pharmacies
   */
  const loadNearbyPlaces = async (location: LatLng) => {
    try {
      const [hospitals, pharmacies] = await Promise.all([
        googleMapsService.getNearbyHospitals(location, searchRadius),
        googleMapsService.getNearbyPharmacies(location, searchRadius),
      ]);

      setNearbyPlaces({
        hospitals: hospitals.slice(0, 20),
        pharmacies: pharmacies.slice(0, 20),
      });

      if (mapRef.current && hospitals.length > 0 && pharmacies.length > 0) {
        const allPlaces = [...hospitals, ...pharmacies];
        const region = createRegionFromLocations([location, ...allPlaces.map((p) => p.location)], 0.15);
        mapRef.current.animateToRegion(region);
      }
    } catch (error) {
      console.error('Error loading nearby places:', error);
      Alert.alert('Error', 'Failed to load nearby locations');
    }
  };

  /**
   * Load route calculations for all travel modes.
   */
  const loadRouteOptions = async (place: Place) => {
    if (!currentLocation) {
      setRouteOptions({});
      return;
    }

    setRouteLoading(true);
    try {
      const routes = await googleMapsService.getDirectionsForModes(currentLocation, place.location);
      setRouteOptions(routes);
    } catch (error) {
      console.error('Error loading route options:', error);
      setRouteOptions({});
      Alert.alert('Error', 'Failed to calculate route options.');
    } finally {
      setRouteLoading(false);
    }
  };

  /**
   * Refresh a clicked place with Google Place Details to get the latest photo and metadata.
   */
  const hydrateSelectedPlace = async (place: Place) => {
    const detailedPlace = await googleMapsService.getPlaceDetails(place.id, place.placeType);
    if (detailedPlace) {
      setSelectedPlace({
        ...place,
        ...detailedPlace,
        placeType: place.placeType,
      });
    }
  };

  /**
   * Location functions
   */

  const handleShare = () => {
    if (!selectedPlace || !currentLocation) return;
    try {
      const message = `Check out ${selectedPlace.name} (${selectedPlace.placeType})\n${selectedPlace.address}\nDirections: https://maps.google.com/?q=${selectedPlace.location.latitude},${selectedPlace.location.longitude}`;
      void Sharing.shareAsync(message, { mimeType: 'text/plain', UTI: 'public.plain-text' });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share failed', 'Could not share location');
    }
  };

  /**
   * Handle place marker press
   */
  const handleMarkerPress = async (place: Place) => {
    setSelectedPlace(place);
    setRouteOptions({});
    setRoutePolyline([]);

    void hydrateSelectedPlace(place);

    if (currentLocation) {
      await loadRouteOptions(place);
    }
  };

  /**
   * Handle navigate button press
   */
  const handleNavigate = () => {
    if (selectedPlace && currentLocation) {
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const destination = `${selectedPlace.location.latitude},${selectedPlace.location.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        origin,
      )}&destination=${encodeURIComponent(destination)}&travelmode=${selectedTravelMode}`;

      Linking.openURL(url).catch(() => {
        Alert.alert('Navigation', 'Unable to open Google Maps for navigation.');
      });
    }
  };

  /**
   * Filter places based on search text
   */
  const getFilteredPlaces = () => {
    let places: Place[] = [];

    if (activeTab === 'hospitals' || activeTab === 'all') {
      places = [...places, ...nearbyPlaces.hospitals];
    }
    if (activeTab === 'pharmacies' || activeTab === 'all') {
      places = [...places, ...nearbyPlaces.pharmacies];
    }

    if (searchText) {
      const query = searchText.trim().toLowerCase();
      places = places.filter(
        (place) =>
          (place.name ?? '').toLowerCase().includes(query) ||
          (place.address ?? place.formattedAddress ?? '').toLowerCase().includes(query),
      );
    }

    const uniquePlaces = Array.from(
      new Map(places.map((place) => [`${place.placeType}-${place.id}`, place] as const)).values(),
    );

    return sortPlacesByDistance(uniquePlaces);
  };

  /**
   * Zoom to all places
   */
  const zoomToAllPlaces = () => {
    const allPlaces = getFilteredPlaces();
    if (allPlaces.length === 0 || !currentLocation) return;

    const region = createRegionFromLocations(
      [currentLocation, ...allPlaces.map((p) => p.location)],
      0.2,
    );
    if (mapRef.current) {
      mapRef.current.animateToRegion(region);
    }
  };

  const filteredPlaces = getFilteredPlaces();
  const hospitalCount = nearbyPlaces.hospitals.length;
  const pharmacyCount = nearbyPlaces.pharmacies.length;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <ThemedText style={styles.loadingText}>Loading nearby locations...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={false}>
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="blue">
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationInner} />
            </View>
          </Marker>
        )}

        {/* Hospital Markers */}
        {nearbyPlaces.hospitals.map((hospital) => (
          <Marker
            key={`hospital-${hospital.id}`}
            coordinate={hospital.location}
            title={hospital.name}
            onPress={() => handleMarkerPress(hospital)}
            tracksViewChanges={selectedPlace?.id === hospital.id}>
            <View
              style={[
                styles.markerContainer,
                styles.hospitalMarker,
                selectedPlace?.id === hospital.id && styles.selectedMarker,
              ]}>
              <MaterialIcons name="local-hospital" size={28} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Pharmacy Markers */}
        {nearbyPlaces.pharmacies.map((pharmacy) => (
          <Marker
            key={`pharmacy-${pharmacy.id}`}
            coordinate={pharmacy.location}
            title={pharmacy.name}
            onPress={() => handleMarkerPress(pharmacy)}
            tracksViewChanges={selectedPlace?.id === pharmacy.id}>
            <View
              style={[
                styles.markerContainer,
                styles.pharmacyMarker,
                selectedPlace?.id === pharmacy.id && styles.selectedMarker,
              ]}>
              <MaterialIcons name="local-pharmacy" size={28} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Route Polyline */}
        {routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            {...getRouteLineStyle(selectedTravelMode)}
            geodesic={true}
          />
        )}
      </MapView>

      {/* Top Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color="#95a5a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals, pharmacies..."
            placeholderTextColor="#95a5a6"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Feather name="x" size={20} color="#95a5a6" />
            </Pressable>
          ) : null}
        </View>

        {/* Location and Zoom Controls */}
        <View style={styles.controlsContainer}>
          <Pressable
            style={styles.controlButton}
            onPress={initializeMap}>
            <MaterialIcons name="my-location" size={24} color="#fff" />
          </Pressable>

          {/* Removed Navigation Controls */}

          <Pressable
            style={styles.controlButton}
            onPress={zoomToAllPlaces}>
            <MaterialIcons name="zoom-out-map" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Places List Tab */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'hospitals' && styles.activeTab]}
          onPress={() => setActiveTab('hospitals')}>
          <MaterialIcons
            name="local-hospital"
            size={18}
            color={activeTab === 'hospitals' ? '#fff' : '#7f8c8d'}
          />
          <Text
            style={[styles.tabText, activeTab === 'hospitals' && styles.activeTabText]}>
            Hospitals ({hospitalCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'pharmacies' && styles.activeTab]}
          onPress={() => setActiveTab('pharmacies')}>
          <View
            style={[
              styles.tabIconCircle,
              { backgroundColor: activeTab === 'pharmacies' ? '#fff' : '#2ecc71' },
            ]}>
            <MaterialIcons
              name="add"
              size={14}
              color={activeTab === 'pharmacies' ? '#2ecc71' : '#fff'}
            />
          </View>
          <Text
            style={[styles.tabText, activeTab === 'pharmacies' && styles.activeTabText]}>
            Pharmacies ({pharmacyCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}>
          <MaterialIcons
            name="list"
            size={18}
            color={activeTab === 'all' ? '#fff' : '#7f8c8d'}
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </Pressable>
      </View>

      {/* Bottom Sheet with Place Details or Places List */}
      <View style={[styles.bottomSheet, selectedPlace && styles.bottomSheetExpanded]}>
        {selectedPlace ? (
          <ScrollView style={styles.routeDetailsWrapper} showsVerticalScrollIndicator={false}>
            <View style={styles.routeHeaderBar}>
              <Pressable style={styles.headerCloseBtn} onPress={() => setSelectedPlace(null)}>
                <MaterialIcons name="close" size={24} color="#2c3e50" />
              </Pressable>
              <Text style={styles.placeNameHeader}>{selectedPlace.name}</Text>
              <Pressable style={styles.headerShareBtn} onPress={handleShare}>
                <MaterialIcons name="share" size={20} color="#3498db" />
              </Pressable>
            </View>

            {selectedPlace.photoUrl && (
              <Image source={{ uri: selectedPlace.photoUrl }} style={styles.placeImageLarge} />
            )}

            <View style={styles.placeInfoCard}>
              <View style={styles.placeInfoRow}>
                <MaterialIcons name="place" size={18} color="#e74c3c" />
                <Text style={styles.placeInfoText} numberOfLines={2}>{selectedPlace.address}</Text>
              </View>
              {selectedPlace.phoneNumber && (
                <View style={styles.placeInfoRow}>
                  <MaterialIcons name="phone" size={18} color="#27ae60" />
                  <Pressable onPress={() => Linking.openURL(`tel:${selectedPlace.phoneNumber}`)}>
                    <Text style={[styles.placeInfoText, { color: '#3498db' }]}>{selectedPlace.phoneNumber}</Text>
                  </Pressable>
                </View>
              )}
              {selectedPlace.website && (
                <View style={styles.placeInfoRow}>
                  <MaterialIcons name="language" size={18} color="#16a085" />
                  <Pressable onPress={() => Linking.openURL(selectedPlace.website!)}>
                    <Text style={[styles.placeInfoText, { color: '#3498db' }]}>Visit website</Text>
                  </Pressable>
                </View>
              )}
              {selectedPlace.rating && (
                <View style={styles.placeInfoRow}>
                  <MaterialIcons name="star" size={18} color="#f39c12" />
                  <Text style={styles.placeInfoText}>{selectedPlace.rating.toFixed(1)} rating</Text>
                </View>
              )}
              {selectedPlace.businessStatus && (
                <View style={styles.placeInfoRow}>
                  <MaterialIcons name="info" size={18} color="#9b59b6" />
                  <Text style={styles.placeInfoText}>Status: {selectedPlace.businessStatus.replace(/_/g, ' ')}</Text>
                </View>
              )}
              {selectedPlace.openingHours && (
                <View style={styles.placeInfoRow}>
                  <MaterialIcons name="access-time" size={18} color="#34495e" />
                  <Text style={[styles.placeInfoText, { color: selectedPlace.openingHours.isOpen ? '#27ae60' : '#e74c3c', fontWeight: '700' }]}>
                    {selectedPlace.openingHours.isOpen ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Travel Modes</Text>
            <View style={styles.travelModeGrid}>
              {TRAVEL_MODES.map((mode) => {
                const route = routeOptions[mode.mode];
                const isActive = selectedTravelMode === mode.mode;

                return (
                  <Pressable
                    key={mode.mode}
                    style={[styles.travelModeCard, isActive && styles.travelModeCardActive]}
                    onPress={() => setSelectedTravelMode(mode.mode)}>
                    <View style={[styles.travelModeIcon, { backgroundColor: mode.color }]}>
                      <MaterialIcons name={mode.icon} size={18} color="#fff" />
                    </View>
                    <Text style={[styles.travelModeLabel, isActive && styles.travelModeLabelActive]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.travelModeMeta} numberOfLines={2}>
                      {route
                        ? `${googleMapsService.formatDistance(route.distance)} • ${googleMapsService.formatDuration(route.duration)}`
                        : 'Calculating route'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedRouteInfo && (
              <View style={styles.actionButtonsRow}>
                <Pressable style={[styles.actionButton, styles.directionsButton]} onPress={handleNavigate}>
                  <MaterialIcons name="directions" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Directions</Text>
                </Pressable>
              </View>
            )}

            {selectedRouteInfo && (
              <View style={styles.routeSummaryBar}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="straighten" size={16} color="#7f8c8d" />
                  <Text style={styles.summaryText}>{selectedRouteInfo.distance}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
                  <Text style={styles.summaryText}>{selectedRouteInfo.duration}</Text>
                </View>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : (
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => `${item.placeType}-${item.id}`}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.placeListItem,
                  selectedPlace?.id === item.id && styles.selectedPlaceItem,
                ]}
                onPress={() => handleMarkerPress(item)}>
                <View style={styles.placeListContent}>
                  <View style={styles.placeListHeader}>
                    {item.photoUrl ? (
                      <Image source={{ uri: item.photoUrl }} style={styles.placeListImage} />
                    ) : (
                      <View
                        style={[
                          styles.placeListImageFallback,
                          item.placeType === 'hospital'
                            ? styles.placeListHospitalImageFallback
                            : styles.placeListPharmacyImageFallback,
                        ]}>
                        <MaterialIcons
                          name={item.placeType === 'hospital' ? 'local-hospital' : 'add'}
                          size={16}
                          color="#fff"
                        />
                      </View>
                    )}
                    <View style={styles.placeListTextContainer}>
                      <Text style={styles.placeListName}>{item.name}</Text>
                      <Text style={styles.placeListDistance}>
                        {googleMapsService.formatDistance(item.distance)} • ~{Math.max(1, Math.ceil(item.distance / 500))} min
                      </Text>
                    </View>
                    {item.rating && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}⭐</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.placeListAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="location-off" size={40} color="#bdc3c7" />
                <Text style={styles.emptyText}>
                  No {activeTab === 'hospitals' ? 'hospitals' : activeTab === 'pharmacies' ? 'pharmacies' : 'places'} found
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}
      </View>
    </ThemedView>
    </GestureHandlerRootView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  userLocationMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
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
  hospitalMarker: {
    backgroundColor: '#e74c3c',
  },
  pharmacyMarker: {
    backgroundColor: '#2ecc71',
  },
  selectedMarker: {
    transform: [{ scale: 1.3 }],
    shadowOpacity: 0.5,
  },
  searchContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#2c3e50',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  controlButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: '#e74c3c',
  },
  tabContainer: {
    position: 'absolute',
    bottom: height * 0.35,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#fff',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeDetailsWrapper: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  routeHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  travelModeGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  travelModeCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  travelModeCardActive: {
    backgroundColor: '#ecf6ff',
    borderColor: '#3498db',
  },
  travelModeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  travelModeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c3e50',
  },
  travelModeLabelActive: {
    color: '#3498db',
  },
  travelModeMeta: {
    marginTop: 4,
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  routeSummaryBar: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeSummaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  routeSummaryMode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  routeSummaryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  routeSummaryDivider: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  routeGuidanceCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ecf6ff',
    borderWidth: 1,
    borderColor: '#cfe8fb',
  },
  routeGuidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  routeGuidanceTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
  },
  routeGuidanceStep: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3498db',
  },
  routeGuidanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 18,
  },
  routeGuidanceMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#7f8c8d',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  placeListItem: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  selectedPlaceItem: {
    backgroundColor: '#ecf6ff',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  placeListContent: {
    gap: 4,
  },
  placeListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeListImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
  },
  placeListImageFallback: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeListHospitalImageFallback: {
    backgroundColor: '#e74c3c',
  },
  placeListPharmacyImageFallback: {
    backgroundColor: '#2ecc71',
  },
  placeListIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeListHospitalIconCircle: {
    backgroundColor: '#e74c3c',
  },
  placeListPharmacyIconCircle: {
    backgroundColor: '#2ecc71',
  },
  placeListTextContainer: {
    flex: 1,
  },
  placeListName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  placeListDistance: {
    fontSize: 12,
    color: '#95a5a6',
  },
  ratingBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  placeListAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '500',
  },
  bottomSheetExpanded: {
    height: height * 0.85,
  },
  routeHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeNameHeader: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginHorizontal: 12,
  },
  headerShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeImageLarge: {
    width: '100%',
    height: 200,
    backgroundColor: '#ecf0f1',
  },
  placeInfoCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  placeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#27ae60',
  },
  directionsButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  routeSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ecf6ff',
    borderWidth: 1,
    borderColor: '#cfe8fb',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#bdc3c7',
  },
  bottomPadding: {
    height: 30,
  },
});
