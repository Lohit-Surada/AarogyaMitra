/**
 * Example/mock data for testing maps functionality
 * Replace with real data from Google Places API
 */

import { Place } from '@/types/maps';

export const MOCK_HOSPITALS: Place[] = [
  {
    id: 'hospital_1',
    name: 'Apollo Hospital',
    placeType: 'hospital',
    location: { latitude: 28.7041, longitude: 77.1025 },
    address: '12, Parliament Street, New Delhi, Delhi 110001',
    distance: 1200,
    rating: 4.7,
    phoneNumber: '+91-11-4155-5555',
    website: 'https://www.apollohospitals.com',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Apollo Hospital, New Delhi',
  },
  {
    id: 'hospital_2',
    name: 'Fortis Hospital',
    placeType: 'hospital',
    location: { latitude: 28.5244, longitude: 77.1855 },
    address: 'A-Block, Sector 62, Noida, Uttar Pradesh 201301',
    distance: 2300,
    rating: 4.6,
    phoneNumber: '+91-120-4100-100',
    website: 'https://www.fortisdelhi.com',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Fortis Hospital, Noida',
  },
  {
    id: 'hospital_3',
    name: 'Max Super Specialty Hospital',
    placeType: 'hospital',
    location: { latitude: 28.5494, longitude: 77.2003 },
    address: '1-B, Press Enclave Road, New Delhi, Delhi 110029',
    distance: 3100,
    rating: 4.5,
    phoneNumber: '+91-11-4155-5000',
    website: 'https://www.maxhealthcare.in',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Max Super Specialty Hospital, New Delhi',
  },
];

export const MOCK_PHARMACIES: Place[] = [
  {
    id: 'pharmacy_1',
    name: 'Apollo Pharmacy',
    placeType: 'pharmacy',
    location: { latitude: 28.6139, longitude: 77.209 },
    address: 'Plot No. 2, Pocket C, Basant Kunj, New Delhi, Delhi 110070',
    distance: 800,
    rating: 4.4,
    phoneNumber: '+91-11-4100-3300',
    website: 'https://www.apollopharmacy.in',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Apollo Pharmacy, New Delhi',
  },
  {
    id: 'pharmacy_2',
    name: 'MedPlus',
    placeType: 'pharmacy',
    location: { latitude: 28.5945, longitude: 77.2043 },
    address: 'Sector 8, R.K. Puram, New Delhi, Delhi 110022',
    distance: 1500,
    rating: 4.2,
    phoneNumber: '+91-11-4100-1100',
    website: 'https://www.medplusmart.com',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'MedPlus, New Delhi',
  },
  {
    id: 'pharmacy_3',
    name: 'Netmeds',
    placeType: 'pharmacy',
    location: { latitude: 28.6292, longitude: 77.2197 },
    address: 'Plot No. 28, Pocket A2, Sector 8, R.K. Puram, New Delhi, Delhi 110022',
    distance: 2100,
    rating: 4.3,
    phoneNumber: '+91-11-4100-2200',
    website: 'https://www.netmeds.com',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Netmeds, New Delhi',
  },
];

export const MOCK_CLINICS: Place[] = [
  {
    id: 'clinic_1',
    name: 'Dr. Raj Clinic',
    placeType: 'clinic',
    location: { latitude: 28.6108, longitude: 77.2166 },
    address: 'Plot No. 5, DLF Center, Block A, New Delhi, Delhi 110001',
    distance: 1800,
    rating: 4.1,
    phoneNumber: '+91-11-4155-5000',
    openingHours: { isOpen: true },
    businessStatus: 'OPERATIONAL',
    formattedAddress: 'Dr. Raj Clinic, New Delhi',
  },
];

export default {
  hospitals: MOCK_HOSPITALS,
  pharmacies: MOCK_PHARMACIES,
  clinics: MOCK_CLINICS,
};
