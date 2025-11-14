import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';

type CalculatorMode = 'bill-split' | 'tip-pool';

export default function BillSplitScreen() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());

  const [mode, setMode] = useState<CalculatorMode>('bill-split');

  // Bill Split Mode
  const [billAmount, setBillAmount] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('2');
  const [tipPercent, setTipPercent] = useState('18');
  const [customTip, setCustomTip] = useState('');

  // Tip Pool Mode
  const [totalTips, setTotalTips] = useState('');
  const [numberOfStaff, setNumberOfStaff] = useState('3');
  const [frontOfHousePercent, setFrontOfHousePercent] = useState('70');
  const [backOfHousePercent, setBackOfHousePercent] = useState('30');

  if (!isPremium) {
    return (
      <View style={styles.upgradeContainer}>
        <Ionicons name="lock-closed" size={64} color={Colors.primary} />
        <Text style={styles.upgradeTitle}>Premium Feature</Text>
        <Text style={styles.upgradeText}>
          Bill Split Calculator is a premium feature. Upgrade to access advanced calculators for splitting bills and tip pools.
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Upgrade' as never)}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Bill Split Calculations
  const calculateBillSplit = () => {
    const bill = parseFloat(billAmount) || 0;
    const people = parseInt(numberOfPeople) || 1;
    const tip = customTip ? parseFloat(customTip) : parseFloat(tipPercent);

    const tipAmount = bill * (tip / 100);
    const total = bill + tipAmount;
    const perPerson = total / people;

    return {
      billAmount: bill,
      tipAmount,
      tipPercent: tip,
      total,
      perPerson,
      people,
    };
  };

  // Tip Pool Calculations
  const calculateTipPool = () => {
    const tips = parseFloat(totalTips) || 0;
    const staff = parseInt(numberOfStaff) || 1;
    const fohPercent = parseFloat(frontOfHousePercent) || 0;
    const bohPercent = parseFloat(backOfHousePercent) || 0;

    const fohAmount = tips * (fohPercent / 100);
    const bohAmount = tips * (bohPercent / 100);

    return {
      totalTips: tips,
      frontOfHouseAmount: fohAmount,
      backOfHouseAmount: bohAmount,
      frontOfHousePercent: fohPercent,
      backOfHousePercent: bohPercent,
      staff,
    };
  };

  const billSplit = calculateBillSplit();
  const tipPool = calculateTipPool();

  const handleClear = () => {
    if (mode === 'bill-split') {
      setBillAmount('');
      setNumberOfPeople('2');
      setTipPercent('18');
      setCustomTip('');
    } else {
      setTotalTips('');
      setNumberOfStaff('3');
      setFrontOfHousePercent('70');
      setBackOfHousePercent('30');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'bill-split' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('bill-split')}
          >
            <Ionicons
              name="receipt"
              size={20}
              color={mode === 'bill-split' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'bill-split' && styles.modeButtonTextActive,
              ]}
            >
              Bill Split
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'tip-pool' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('tip-pool')}
          >
            <Ionicons
              name="people"
              size={20}
              color={mode === 'tip-pool' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'tip-pool' && styles.modeButtonTextActive,
              ]}
            >
              Tip Pool
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bill Split Mode */}
        {mode === 'bill-split' && (
          <>
            {/* Bill Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100.00"
                  placeholderTextColor={Colors.gray400}
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Number of People */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of People</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  placeholderTextColor={Colors.gray400}
                  value={numberOfPeople}
                  onChangeText={setNumberOfPeople}
                  keyboardType="number-pad"
                />
                <Text style={styles.inputSuffix}>people</Text>
              </View>
            </View>

            {/* Tip Percentage */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tip Percentage</Text>
              <View style={styles.quickButtons}>
                {['15', '18', '20', '25'].map((percent) => (
                  <TouchableOpacity
                    key={percent}
                    style={[
                      styles.quickButton,
                      tipPercent === percent && !customTip && styles.quickButtonActive,
                    ]}
                    onPress={() => {
                      setTipPercent(percent);
                      setCustomTip('');
                    }}
                  >
                    <Text
                      style={[
                        styles.quickButtonText,
                        tipPercent === percent && !customTip && styles.quickButtonTextActive,
                      ]}
                    >
                      {percent}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Custom %"
                  placeholderTextColor={Colors.gray400}
                  value={customTip}
                  onChangeText={setCustomTip}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>

            {/* Results */}
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Split Breakdown</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Bill Amount</Text>
                <Text style={styles.resultValue}>${billSplit.billAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tip ({billSplit.tipPercent}%)</Text>
                <Text style={styles.resultValue}>${billSplit.tipAmount.toFixed(2)}</Text>
              </View>

              <View style={[styles.resultRow, styles.resultRowDivider]}>
                <Text style={styles.resultLabel}>Total</Text>
                <Text style={styles.resultValue}>${billSplit.total.toFixed(2)}</Text>
              </View>

              <View style={[styles.resultRow, styles.resultRowHighlight]}>
                <Text style={styles.resultLabelHighlight}>Per Person</Text>
                <Text style={styles.resultValueHighlight}>${billSplit.perPerson.toFixed(2)}</Text>
              </View>

              <Text style={styles.resultsFooter}>
                Each person pays ${billSplit.perPerson.toFixed(2)} ({billSplit.people} people)
              </Text>
            </View>
          </>
        )}

        {/* Tip Pool Mode */}
        {mode === 'tip-pool' && (
          <>
            {/* Total Tips */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Tips to Split</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="500.00"
                  placeholderTextColor={Colors.gray400}
                  value={totalTips}
                  onChangeText={setTotalTips}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Number of Staff */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Staff</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor={Colors.gray400}
                  value={numberOfStaff}
                  onChangeText={setNumberOfStaff}
                  keyboardType="number-pad"
                />
                <Text style={styles.inputSuffix}>staff</Text>
              </View>
            </View>

            {/* Front of House % */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Front of House %</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor={Colors.gray400}
                  value={frontOfHousePercent}
                  onChangeText={setFrontOfHousePercent}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>

            {/* Back of House % */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Back of House %</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={Colors.gray400}
                  value={backOfHousePercent}
                  onChangeText={setBackOfHousePercent}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>

            {/* Results */}
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Tip Pool Distribution</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Tips</Text>
                <Text style={styles.resultValue}>${tipPool.totalTips.toFixed(2)}</Text>
              </View>

              <View style={[styles.resultRow, styles.resultRowHighlight]}>
                <Text style={styles.resultLabelHighlight}>
                  Front of House ({tipPool.frontOfHousePercent}%)
                </Text>
                <Text style={styles.resultValueHighlight}>
                  ${tipPool.frontOfHouseAmount.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.resultRow, styles.resultRowHighlight]}>
                <Text style={styles.resultLabelHighlight}>
                  Back of House ({tipPool.backOfHousePercent}%)
                </Text>
                <Text style={styles.resultValueHighlight}>
                  ${tipPool.backOfHouseAmount.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.resultsFooter}>
                Total distributed: ${(tipPool.frontOfHouseAmount + tipPool.backOfHouseAmount).toFixed(2)}
              </Text>
            </View>
          </>
        )}

        {/* Clear Button */}
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.backgroundDark,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  upgradeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeButtonTextActive: {
    color: Colors.white,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputSuffix: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickButtonTextActive: {
    color: Colors.white,
  },
  resultsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  resultRowHighlight: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  resultLabelHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultValueHighlight: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultsFooter: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
