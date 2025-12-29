#!/bin/bash

# ============================================================
# Export iOS Credentials for GitHub Actions
# ============================================================
# This script helps you extract credentials from your Mac
# and prepare them for GitHub Secrets
# ============================================================

echo "============================================"
echo "iOS Credentials Export for GitHub Actions"
echo "============================================"
echo ""

# Create output directory
OUTPUT_DIR="$HOME/Desktop/github-secrets"
mkdir -p "$OUTPUT_DIR"

echo "Output will be saved to: $OUTPUT_DIR"
echo ""

# ============================================
# STEP 1: Distribution Certificate
# ============================================
echo "STEP 1: Distribution Certificate"
echo "---------------------------------"
echo "You need to export your iOS Distribution certificate from Keychain Access."
echo ""
echo "1. Open Keychain Access"
echo "2. Search for 'iPhone Distribution'"
echo "3. Right-click the certificate → Export"
echo "4. Save as: distribution.p12"
echo "5. Set a password (remember it!)"
echo "6. Save to: $OUTPUT_DIR/distribution.p12"
echo ""
read -p "Press Enter when you've exported the certificate..."

if [ -f "$OUTPUT_DIR/distribution.p12" ]; then
    echo "✅ Found distribution.p12"
    echo ""
    echo "Converting to base64..."
    base64 -i "$OUTPUT_DIR/distribution.p12" -o "$OUTPUT_DIR/IOS_DIST_CERT_BASE64.txt"
    echo "✅ Saved: IOS_DIST_CERT_BASE64.txt"
else
    echo "❌ distribution.p12 not found in $OUTPUT_DIR"
    echo "   Please export it and run this script again."
fi

echo ""

# ============================================
# STEP 2: Provisioning Profile
# ============================================
echo "STEP 2: Provisioning Profile"
echo "----------------------------"
echo "Download your App Store provisioning profile from Apple Developer."
echo ""
echo "1. Go to: https://developer.apple.com/account/resources/profiles/list"
echo "2. Find or create an 'App Store' profile for com.tipflyai.app"
echo "3. Download it"
echo "4. Save to: $OUTPUT_DIR/profile.mobileprovision"
echo ""
read -p "Press Enter when you've downloaded the profile..."

if [ -f "$OUTPUT_DIR/profile.mobileprovision" ]; then
    echo "✅ Found profile.mobileprovision"
    echo ""
    echo "Converting to base64..."
    base64 -i "$OUTPUT_DIR/profile.mobileprovision" -o "$OUTPUT_DIR/IOS_PROVISIONING_PROFILE_BASE64.txt"

    # Extract profile name
    PROFILE_NAME=$(security cms -D -i "$OUTPUT_DIR/profile.mobileprovision" 2>/dev/null | plutil -extract Name raw - 2>/dev/null)
    echo "$PROFILE_NAME" > "$OUTPUT_DIR/IOS_PROVISIONING_PROFILE_NAME.txt"

    echo "✅ Saved: IOS_PROVISIONING_PROFILE_BASE64.txt"
    echo "✅ Profile Name: $PROFILE_NAME"
else
    echo "❌ profile.mobileprovision not found in $OUTPUT_DIR"
fi

echo ""

# ============================================
# STEP 3: App Store Connect API Key
# ============================================
echo "STEP 3: App Store Connect API Key"
echo "----------------------------------"
echo "Create an API key for uploading to TestFlight."
echo ""
echo "1. Go to: https://appstoreconnect.apple.com/access/api"
echo "2. Click '+' to create a new key"
echo "3. Name: 'GitHub Actions'"
echo "4. Access: 'App Manager' or 'Admin'"
echo "5. Download the .p8 file"
echo "6. Save to: $OUTPUT_DIR/AuthKey.p8"
echo "7. Note the Key ID and Issuer ID from the page"
echo ""
read -p "Press Enter when you've downloaded the API key..."

if [ -f "$OUTPUT_DIR/AuthKey.p8" ]; then
    echo "✅ Found AuthKey.p8"
    cp "$OUTPUT_DIR/AuthKey.p8" "$OUTPUT_DIR/APP_STORE_CONNECT_API_KEY.txt"
    echo "✅ Saved: APP_STORE_CONNECT_API_KEY.txt"
else
    echo "❌ AuthKey.p8 not found in $OUTPUT_DIR"
fi

echo ""
echo "============================================"
echo "SUMMARY - GitHub Secrets to Create"
echo "============================================"
echo ""
echo "Go to: https://github.com/dropflyai/tipfly-ai/settings/secrets/actions"
echo ""
echo "Add these secrets:"
echo ""
echo "1. IOS_DIST_CERT_BASE64"
echo "   → Paste contents of: $OUTPUT_DIR/IOS_DIST_CERT_BASE64.txt"
echo ""
echo "2. IOS_DIST_CERT_PASSWORD"
echo "   → The password you used when exporting the .p12"
echo ""
echo "3. IOS_PROVISIONING_PROFILE_BASE64"
echo "   → Paste contents of: $OUTPUT_DIR/IOS_PROVISIONING_PROFILE_BASE64.txt"
echo ""
echo "4. IOS_PROVISIONING_PROFILE_NAME"
echo "   → Paste contents of: $OUTPUT_DIR/IOS_PROVISIONING_PROFILE_NAME.txt"
echo ""
echo "5. APPLE_TEAM_ID"
echo "   → G46B7YC46C"
echo ""
echo "6. APP_STORE_CONNECT_API_KEY_ID"
echo "   → The Key ID from App Store Connect"
echo ""
echo "7. APP_STORE_CONNECT_ISSUER_ID"
echo "   → The Issuer ID from App Store Connect"
echo ""
echo "8. APP_STORE_CONNECT_API_KEY"
echo "   → Paste contents of: $OUTPUT_DIR/APP_STORE_CONNECT_API_KEY.txt"
echo ""
echo "9. EXPO_PUBLIC_SUPABASE_URL"
echo "   → https://qzdulxkdfjhgcazfnwvb.supabase.co"
echo ""
echo "10. EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "    → (from your eas.json)"
echo ""
echo "11. EXPO_PUBLIC_ANTHROPIC_API_KEY"
echo "    → (from your eas.json)"
echo ""
echo "============================================"
echo "Once all secrets are added, push the workflow:"
echo ""
echo "  cd /Users/dropfly/Projects/tipfly-ai"
echo "  git push --force origin main"
echo ""
echo "============================================"
