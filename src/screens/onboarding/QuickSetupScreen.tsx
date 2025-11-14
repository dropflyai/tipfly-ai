import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'QuickSetup'>;
};

export default function QuickSetupScreen({ navigation }: Props) {
  const [hoursPerShift, setHoursPerShift] = useState(6);
  const [shiftsPerWeek, setShiftsPerWeek] = useState(5);

  const handleContinue = () => {
    // In a real app, save these preferences
    navigation.navigate('Signup');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What's your typical shift like?</Text>
        <Text style={styles.subtitle}>
          This helps us calculate projections and goals
        </Text>

        {/* Hours per shift */}
        <View style={styles.section}>
          <Text style={styles.label}>Hours per shift</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{hoursPerShift}</Text>
              <Text style={styles.valueUnit}>hours</Text>
            </View>
            <View style={styles.buttonRow}>
              {[4, 5, 6, 7, 8, 10, 12].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.optionButton,
                    hoursPerShift === hours && styles.optionButtonSelected,
                  ]}
                  onPress={() => setHoursPerShift(hours)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    hoursPerShift === hours && styles.optionButtonTextSelected,
                  ]}>
                    {hours}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Shifts per week */}
        <View style={styles.section}>
          <Text style={styles.label}>Shifts per week</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{shiftsPerWeek}</Text>
              <Text style={styles.valueUnit}>shifts</Text>
            </View>
            <View style={styles.buttonRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((shifts) => (
                <TouchableOpacity
                  key={shifts}
                  style={[
                    styles.optionButton,
                    shiftsPerWeek === shifts && styles.optionButtonSelected,
                  ]}
                  onPress={() => setShiftsPerWeek(shifts)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    shiftsPerWeek === shifts && styles.optionButtonTextSelected,
                  ]}>
                    {shifts}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly estimate</Text>
          <Text style={styles.summaryValue}>
            {hoursPerShift * shiftsPerWeek} hours/week
          </Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  sliderContainer: {
    gap: 16,
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
  },
  valueUnit: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  optionButtonTextSelected: {
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.gray50,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
