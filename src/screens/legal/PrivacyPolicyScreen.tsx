import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Effective Date: January 1, 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          TipFly AI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Account Information:</Text> Email address, full name, job title, and password (encrypted){'\n\n'}
          <Text style={styles.bold}>Tip Tracking Data:</Text> Date of work shifts, hours worked, tips earned, shift type, optional notes, and goals{'\n\n'}
          <Text style={styles.bold}>Device Information:</Text> Device type, operating system, unique identifiers, and mobile network information{'\n\n'}
          <Text style={styles.bold}>Usage Data:</Text> Features used, time spent in app, screens viewed, and error logs
        </Text>

        <Text style={styles.sectionTitle}>3. Information We Do NOT Collect</Text>
        <Text style={styles.paragraph}>
          • Social Security Numbers{'\n'}
          • Bank account or credit card numbers{'\n'}
          • Employer information{'\n'}
          • Exact location data{'\n'}
          • Biometric data{'\n'}
          • Contact lists{'\n'}
          • Photos or media (unless you share them)
        </Text>

        <Text style={styles.sectionTitle}>4. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n\n'}
          • Provide core tip tracking functionality{'\n'}
          • Calculate earnings, averages, and trends{'\n'}
          • Send notifications about goals and reminders{'\n'}
          • Sync your data across devices{'\n'}
          • Improve the App and fix bugs{'\n'}
          • Provide customer support
        </Text>

        <Text style={styles.sectionTitle}>5. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Cloud Storage:</Text> Your data is stored securely on Supabase (PostgreSQL database) in the United States{'\n\n'}
          <Text style={styles.bold}>Encryption:</Text> AES-256 encryption for data at rest, TLS 1.3 for data in transit{'\n\n'}
          <Text style={styles.bold}>Authentication:</Text> Secure password hashing (bcrypt) and role-based access controls
        </Text>

        <Text style={styles.sectionTitle}>6. We Do NOT Sell Your Data</Text>
        <Text style={styles.paragraph}>
          We do not sell, rent, or trade your personal information to third parties for marketing purposes. Period.
        </Text>

        <Text style={styles.sectionTitle}>7. Service Providers</Text>
        <Text style={styles.paragraph}>
          We share data with trusted service providers:{'\n\n'}
          • <Text style={styles.bold}>Supabase:</Text> Database and authentication{'\n'}
          • <Text style={styles.bold}>AWS/Vercel:</Text> Hosting and cloud services{'\n'}
          • <Text style={styles.bold}>Apple/Google:</Text> Payment processing for subscriptions{'\n\n'}
          All providers are bound by strict confidentiality agreements.
        </Text>

        <Text style={styles.sectionTitle}>8. Your Privacy Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n\n'}
          • <Text style={styles.bold}>Access Your Data:</Text> View all data we have about you{'\n'}
          • <Text style={styles.bold}>Update Your Data:</Text> Correct inaccurate information{'\n'}
          • <Text style={styles.bold}>Export Your Data:</Text> Download your data in JSON format{'\n'}
          • <Text style={styles.bold}>Delete Your Account:</Text> Permanently delete your account and data{'\n'}
          • <Text style={styles.bold}>Opt-Out:</Text> Unsubscribe from marketing emails
        </Text>

        <Text style={styles.sectionTitle}>9. California & EU Rights</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CCPA (California):</Text> Right to know what data is collected, right to opt-out of sale (we don't sell), right to non-discrimination{'\n\n'}
          <Text style={styles.bold}>GDPR (EU):</Text> Right to data portability, right to restriction of processing, right to object, right to lodge complaints
        </Text>

        <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          TipFly AI is not intended for children under 16. We do not knowingly collect information from children under 16. If we discover we have, we will delete it immediately.
        </Text>

        <Text style={styles.sectionTitle}>11. Data Retention</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Active Accounts:</Text> Data retained while account is active{'\n'}
          • <Text style={styles.bold}>Deleted Accounts:</Text> Data permanently deleted within 30 days{'\n'}
          • <Text style={styles.bold}>Backups:</Text> Backup copies deleted within 90 days
        </Text>

        <Text style={styles.sectionTitle}>12. Data Breach Notification</Text>
        <Text style={styles.paragraph}>
          In the event of a data breach, we will investigate immediately and notify affected users within 72 hours. We will take steps to secure systems and prevent future breaches.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of changes through in-app notifications or email. Your continued use after changes constitutes acceptance.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={styles.paragraph}>
          For questions about this Privacy Policy:{'\n'}
          Email: privacy@tipgenius.com{'\n'}
          Support: support@tipgenius.com{'\n'}
          Website: https://tipgenius.com/privacy
        </Text>

        <Text style={styles.footer}>
          By using TipFly AI, you consent to the collection and use of information in accordance with this Privacy Policy.
        </Text>

        <Text style={styles.fullVersion}>
          For the complete Privacy Policy, visit: https://tipgenius.com/privacy
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
  bold: {
    fontWeight: '600',
    color: Colors.text,
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
