import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { AppConfig } from '../../constants/config';

type PricingPlan = 'monthly' | 'annual';

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');

  const handleUpgrade = () => {
    // TODO: Integrate with RevenueCat for in-app purchases
    Alert.alert(
      'Subscription Coming Soon',
      'We\'re currently setting up secure payment processing to bring you premium features.\n\nPremium will include:\n✨ Bill Split Calculator\n✨ Tax Tracking & Reports\n✨ Goals & Savings Tracking\n✨ Advanced Analytics\n✨ Export to CSV/PDF\n✨ Unlimited History\n\nWe\'ll notify you as soon as it\'s ready!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Unlock Your Full Earning Potential</Text>
          <Text style={styles.heroSubtitle}>
            Join 10,000+ service workers maximizing their income
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Feature
            icon="infinite"
            title="Unlimited History"
            description="Track tips forever, never lose your data"
          />
          <Feature
            icon="camera"
            title="Receipt Scanning"
            description="Snap & scan receipts in 2 seconds with AI"
          />
          <Feature
            icon="calculator"
            title="Bill Split Calculator"
            description="Split bills and calculate tip pools easily"
          />
          <Feature
            icon="document-text"
            title="Tax Tracking"
            description="Quarterly estimates, deductions, export reports"
          />
          <Feature
            icon="bar-chart"
            title="Advanced Analytics"
            description="See your best earning days, shifts, and trends"
          />
          <Feature
            icon="trophy"
            title="Goal Setting"
            description="Set savings goals and track your progress"
          />
          <Feature
            icon="download"
            title="Export Reports"
            description="CSV/PDF for accountants and tax filing"
          />
          <Feature
            icon="close-circle"
            title="No Ads"
            description="Clean, distraction-free experience"
          />
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>Choose Your Plan</Text>

          {/* Annual Plan (Recommended) */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'annual' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.pricingBadge}>
              <Text style={styles.pricingBadgeText}>SAVE 33%</Text>
            </View>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingRadio}>
                {selectedPlan === 'annual' && <View style={styles.pricingRadioInner} />}
              </View>
              <View style={styles.pricingInfo}>
                <Text style={styles.pricingPlan}>Annual</Text>
                <Text style={styles.pricingPrice}>$39.99/year</Text>
                <Text style={styles.pricingDesc}>Just $3.33/month - Best value!</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'monthly' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.pricingHeader}>
              <View style={styles.pricingRadio}>
                {selectedPlan === 'monthly' && <View style={styles.pricingRadioInner} />}
              </View>
              <View style={styles.pricingInfo}>
                <Text style={styles.pricingPlan}>Monthly</Text>
                <Text style={styles.pricingPrice}>$4.99/month</Text>
                <Text style={styles.pricingDesc}>Billed monthly, cancel anytime</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.testimonialsTitle}>What servers are saying</Text>

          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "I saved $400 on taxes last year thanks to TipFly AI. Worth every penny!"
            </Text>
            <Text style={styles.testimonialAuthor}>— Sarah, Server in Chicago</Text>
            <View style={styles.testimonialStars}>
              <Text>⭐⭐⭐⭐⭐</Text>
            </View>
          </View>

          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "The receipt scanner is a game changer. Logging tips takes 2 seconds now."
            </Text>
            <Text style={styles.testimonialAuthor}>— Alex, Bartender in NYC</Text>
            <View style={styles.testimonialStars}>
              <Text>⭐⭐⭐⭐⭐</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleUpgrade}>
          <Text style={styles.ctaButtonText}>
            Start 7-Day Free Trial
          </Text>
          <Text style={styles.ctaButtonSubtext}>
            Then {selectedPlan === 'monthly' ? '$4.99/month' : '$39.99/year'}, cancel anytime
          </Text>
        </TouchableOpacity>

        {/* Fine Print */}
        <Text style={styles.finePrint}>
          By continuing, you agree to our Terms of Service and Privacy Policy. Your subscription
          will auto-renew unless canceled 24 hours before the end of the current period.
        </Text>

        {/* Restore Purchase Link */}
        <TouchableOpacity onPress={() => Alert.alert('Restore', 'Restore purchase coming soon')}>
          <Text style={styles.restoreLink}>Already subscribed? Restore purchase</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
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
  scrollContent: {
    padding: 20,
    gap: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pricingSection: {
    gap: 12,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  pricingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  pricingBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pricingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pricingRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  pricingDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  testimonialsSection: {
    gap: 16,
  },
  testimonialsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  testimonialCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  testimonialText: {
    fontSize: 15,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  testimonialStars: {
    flexDirection: 'row',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  ctaButtonSubtext: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  finePrint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  restoreLink: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
});
