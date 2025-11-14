import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.date}>Effective Date: January 1, 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using TipFly AI ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          TipFly AI is a mobile application designed to help service workers track their tips, earnings, and work hours. The App provides tools for recording, analyzing, and managing tip income.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate and complete information{'\n'}
          • You are responsible for maintaining account security{'\n'}
          • You must be at least 16 years old to use this App{'\n'}
          • You are responsible for all activities under your account
        </Text>

        <Text style={styles.sectionTitle}>4. Your Data</Text>
        <Text style={styles.paragraph}>
          You retain all rights to the data you enter into the App. You are responsible for the accuracy of your data. You grant us a license to process your data to provide the Service.
        </Text>

        <Text style={styles.sectionTitle}>5. Acceptable Use</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:{'\n'}
          • Use the App for any illegal purposes{'\n'}
          • Attempt to gain unauthorized access to our systems{'\n'}
          • Reverse engineer or decompile the App{'\n'}
          • Upload viruses or malicious code{'\n'}
          • Enter false or fraudulent information
        </Text>

        <Text style={styles.sectionTitle}>6. Premium Subscription</Text>
        <Text style={styles.paragraph}>
          • Subscription fees are charged in advance on a recurring basis{'\n'}
          • Subscriptions automatically renew unless canceled{'\n'}
          • You may cancel at any time through device settings{'\n'}
          • Refunds are subject to App Store policies
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We make no guarantees about accuracy, reliability, or availability of the service.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          We are not liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid us in the past 12 months.
        </Text>

        <Text style={styles.sectionTitle}>9. Financial Disclaimer</Text>
        <Text style={styles.paragraph}>
          TipFly AI is a tracking tool, not a financial advisor. We do not provide tax, legal, or financial advice. You are solely responsible for reporting your income to tax authorities.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          You may delete your account at any time. We may suspend or terminate accounts for violations of these Terms. Account deletion will permanently delete your data.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time. We will notify you of material changes through in-app notifications or email.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms:{'\n'}
          Email: support@tipgenius.com{'\n'}
          Website: https://tipgenius.com/contact
        </Text>

        <Text style={styles.footer}>
          By using TipFly AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </Text>

        <Text style={styles.fullVersion}>
          For the complete Terms of Service, visit: https://tipgenius.com/terms
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  footer: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  fullVersion: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 40,
  },
});
