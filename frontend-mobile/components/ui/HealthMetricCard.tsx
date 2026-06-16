import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumCard } from './PremiumCard';
import { Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HealthMetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export function HealthMetricCard({ title, value, unit, icon, color = Palette.primary }: HealthMetricCardProps) {
  const isDark = useColorScheme() === 'dark';
  const textColor = isDark ? '#F8FAFC' : Palette.text;
  const labelColor = isDark ? '#94A3B8' : Palette.textMuted;

  return (
    <PremiumCard style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: labelColor }]}>{title}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: textColor }]}>{value}</Text>
          {unit && <Text style={[styles.unit, { color: labelColor }]}>{unit}</Text>}
        </View>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    minWidth: 140,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 12,
    marginLeft: 4,
  },
});
