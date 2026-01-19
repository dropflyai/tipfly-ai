import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { Colors, GradientColors, Shadows, GlassStyles } from '../../constants/colors';
import { AppConfig } from '../../constants/config';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatPrice, getMonthlyEquivalent, calculateSavings } from '../../services/purchases/revenuecat';
import { useAlert } from '../../contexts/AlertContext';
import { lightHaptic, mediumHaptic, successHaptic } from '../../utils/haptics';
import { useGamificationStore } from '../../store/gamificationStore';
import { formatCurrency } from '../../utils/formatting';
import { getPersonalBests, PersonalBests } from '../../services/api/leaderboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PricingPlan = 'monthly' | 'annual';

const PREMIUM_FEATURES = [
  { icon: 'infinite', title: 'Unlimited History', description: 'Track tips forever' },
  { icon: 'sparkles', title: 'AI Entry', description: 'Voice & conversational input' },
  { icon: 'calculator', title: 'Bill Split', description: 'Split bills & calculate pools' },
  { icon: 'document-text', title: 'Tax Reports', description: 'Quarterly estimates & exports' },
  { icon: 'trophy', title: 'Goals', description: 'Set & track savings goals' },
  { icon: 'download', title: 'Export', description: 'CSV/PDF for tax filing' },
] as const;

export default function UpgradeScreenV2() {
  const navigation = useNavigation();
  const { success, error: showError, confirm } = useAlert();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');
  const [personalBests, setPersonalBests] = useState<PersonalBests | null>(null);

  const { streak } = useGamificationStore();

  const {
    packages,
    isLoading,
    error,
    loadOfferings,
    purchase,
    restore,
    isPremium,
    clearError,
  } = useSubscriptionStore();

  useEffect(() => {
    loadOfferings();
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const bests = await getPersonalBests();
      setPersonalBests(bests);
    } catch (err) {
      console.error('[UpgradeScreen] Error loading user stats:', err);
    }
  };

  const monthlyPackage = packages.find(
    (pkg) =>
      pkg.identifier === '$rc_monthly' ||
      pkg.product.identifier.toLowerCase().includes('monthly')
  );

  const annualPackage = packages.find(
    (pkg) =>
      pkg.identifier === '$rc_annual' ||
      pkg.product.identifier.toLowerCase().includes('annual')
  );

  const savings =
    monthlyPackage && annualPackage
      ? calculateSavings(monthlyPackage, annualPackage)
      : 33;

  const handleUpgrade = async () => {
    mediumHaptic();
    const selectedPackage = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;

    if (!selectedPackage) {
      confirm(
        'Coming Soon',
        'Premium subscriptions are being set up. We\'ll notify you when ready!',
        () => {},
        'OK',
        false
      );
      return;
    }

    try {
      const purchaseSuccess = await purchase(selectedPackage);

      if (purchaseSuccess) {
        successHaptic();
        success('Welcome to Premium!', 'Your subscription is now active. Enjoy all the premium features!');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (err: any) {
      if (!err.userCancelled) {
        showError('Purchase Failed', err.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    lightHaptic();
    try {
      const restored = await restore();

      if (restored) {
        successHaptic();
        success('Restored!', 'Your premium subscription has been restored.');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showError('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (err: any) {
      showError('Restore Failed', err.message || 'Failed to restore purchases.');
    }
  };

  useEffect(() => {
    if (error) {
      showError('Error', error);
      clearError();
    }
  }, [error]);

  // Already premium view
  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.premiumHeroCard}>
            <LinearGradient
              colors={GradientColors.gold}
              style={styles.premiumHeroGradient}
            >
              <Ionicons name="star" size={48} color={Colors.background} />
              <Text style={styles.premiumHeroTitle}>Premium Member</Text>
              <Text style={styles.premiumHeroSubtitle}>Thank you for your support!</Text>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>Your Premium Features</Text>

          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={24} color={Colors.gold} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.featureCheck} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Premium</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={GradientColors.blue}
            style={styles.heroGradient}
          >
            <Text style={styles.heroEmoji}>🚀</Text>
            <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
            <Text style={styles.heroSubtitle}>Join 10,000+ workers maximizing their income</Text>
          </LinearGradient>
        </View>

        {/* Your Stats - Loss Aversion Card */}
        {(personalBests?.hasData || (streak?.total_tips_logged && streak.total_tips_logged > 0)) && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Ionicons name="bar-chart" size={20} color={Colors.primary} />
              <Text style={styles.statsTitle}>Your Progress So Far</Text>
            </View>
            <Text style={styles.statsSubtitle}>Don't lose access to your data!</Text>

            <View style={styles.statsGrid}>
              {personalBests?.lifetimeTotal != null && personalBests.lifetimeTotal > 0 ? (
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{formatCurrency(personalBests.lifetimeTotal)}</Text>
                  <Text style={styles.statBoxLabel}>Total Earned</Text>
                </View>
              ) : null}
              {streak?.total_tips_logged != null && streak.total_tips_logged > 0 ? (
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{streak.total_tips_logged}</Text>
                  <Text style={styles.statBoxLabel}>Tips Logged</Text>
                </View>
              ) : null}
              {streak?.current_streak != null && streak.current_streak > 0 ? (
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{streak.current_streak} 🔥</Text>
                  <Text style={styles.statBoxLabel}>Day Streak</Text>
                </View>
              ) : null}
              {personalBests?.bestDay ? (
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{formatCurrency(personalBests.bestDay.amount)}</Text>
                  <Text style={styles.statBoxLabel}>Best Day</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.statsWarning}>
              <Ionicons name="alert-circle" size={16} color={Colors.warning} />
              <Text style={styles.statsWarningText}>
                Free accounts are limited to 30 days of history
              </Text>
            </View>
          </View>
        )}

        {/* Features */}
        <Text style={styles.sectionTitle}>What You Get</Text>

        <View style={styles.featuresGrid}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={24} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {/* Annual Plan */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
          onPress={() => {
            lightHaptic();
            setSelectedPlan('annual');
          }}
        >
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>SAVE {savings}%</Text>
          </View>
          <View style={styles.planRadio}>
            {selectedPlan === 'annual' && <View style={styles.planRadioInner} />}
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>Annual</Text>
            <Text style={styles.planPrice}>
              {annualPackage ? formatPrice(annualPackage) : `$${AppConfig.PREMIUM_ANNUAL_PRICE}/year`}
            </Text>
            <Text style={styles.planEquivalent}>
              Just {annualPackage ? getMonthlyEquivalent(annualPackage) : '$3.33'}/month
            </Text>
          </View>
          <View style={styles.planBestValue}>
            <Text style={styles.planBestValueText}>Best Value</Text>
          </View>
        </TouchableOpacity>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
          onPress={() => {
            lightHaptic();
            setSelectedPlan('monthly');
          }}
        >
          <View style={styles.planRadio}>
            {selectedPlan === 'monthly' && <View style={styles.planRadioInner} />}
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>
              {monthlyPackage ? formatPrice(monthlyPackage) : `$${AppConfig.PREMIUM_MONTHLY_PRICE}/month`}
            </Text>
            <Text style={styles.planEquivalent}>Cancel anytime</Text>
          </View>
        </TouchableOpacity>

        {/* Testimonial */}
        <View style={styles.testimonialCard}>
          <View style={styles.testimonialStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons key={i} name="star" size={16} color={Colors.gold} />
            ))}
          </View>
          <Text style={styles.testimonialText}>
            "I saved $400 on taxes last year. Worth every penny!"
          </Text>
          <Text style={styles.testimonialAuthor}>— Sarah, Server in Chicago</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={handleUpgrade}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.ctaButtonText}>Start 7-Day Free Trial</Text>
              <Text style={styles.ctaButtonSubtext}>
                Then {selectedPlan === 'monthly'
                  ? monthlyPackage ? formatPrice(monthlyPackage) : `$${AppConfig.PREMIUM_MONTHLY_PRICE}/mo`
                  : annualPackage ? formatPrice(annualPackage) : `$${AppConfig.PREMIUM_ANNUAL_PRICE}/yr`
                }
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Fine print & Restore */}
        <Text style={styles.finePrint}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Subscription auto-renews unless canceled 24 hours before the end of the current period.
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={isLoading}>
          <Text style={[styles.restoreLink, isLoading && styles.restoreLinkDisabled]}>
            Already subscribed? Restore purchase
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.glowBlueSubtle,
  },
  heroGradient: {
    padding: 28,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },

  // User Stats Card
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 76) / 2,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 10,
    padding: 12,
  },
  statsWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
  },

  // Premium Hero (already subscribed)
  premiumHeroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.glowGoldSubtle,
  },
  premiumHeroGradient: {
    padding: 32,
    alignItems: 'center',
  },
  premiumHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.background,
    marginTop: 12,
  },
  premiumHeroSubtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  featureCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Plan Cards
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 14,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.background,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  planEquivalent: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planBestValue: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBestValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Testimonial
  testimonialCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  testimonialText: {
    fontSize: 15,
    color: Colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    ...Shadows.buttonBlue,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  ctaButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  finePrint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  restoreLink: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: 8,
  },
  restoreLinkDisabled: {
    opacity: 0.5,
  },
});
