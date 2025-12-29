// Receipt Capture Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GlassStyles } from '../constants/colors';
import {
  takeReceiptPhoto,
  pickReceiptFromLibrary,
  uploadReceipt,
  deleteReceipt,
} from '../services/receipt/receiptService';
import { lightHaptic, successHaptic, errorHaptic } from '../utils/haptics';

interface ReceiptCaptureProps {
  tipEntryId?: string;
  currentReceiptUrl?: string | null;
  onReceiptCaptured?: (url: string) => void;
  onReceiptRemoved?: () => void;
  disabled?: boolean;
}

export const ReceiptCapture: React.FC<ReceiptCaptureProps> = ({
  tipEntryId,
  currentReceiptUrl,
  onReceiptCaptured,
  onReceiptRemoved,
  disabled = false,
}) => {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const imageUrl = localImageUri || currentReceiptUrl;

  const handleTakePhoto = async () => {
    lightHaptic();
    setShowOptions(false);

    const uri = await takeReceiptPhoto();
    if (uri) {
      setLocalImageUri(uri);

      if (tipEntryId) {
        await handleUpload(uri);
      } else {
        // Just store locally for now, will upload when tip is saved
        onReceiptCaptured?.(uri);
      }
    }
  };

  const handlePickFromLibrary = async () => {
    lightHaptic();
    setShowOptions(false);

    const uri = await pickReceiptFromLibrary();
    if (uri) {
      setLocalImageUri(uri);

      if (tipEntryId) {
        await handleUpload(uri);
      } else {
        onReceiptCaptured?.(uri);
      }
    }
  };

  const handleUpload = async (uri: string) => {
    if (!tipEntryId) return;

    setIsUploading(true);
    try {
      const result = await uploadReceipt(uri, tipEntryId);

      if (result.success && result.url) {
        successHaptic();
        onReceiptCaptured?.(result.url);
      } else {
        errorHaptic();
        Alert.alert('Upload Failed', result.error || 'Could not upload receipt');
        setLocalImageUri(null);
      }
    } catch (error) {
      errorHaptic();
      Alert.alert('Error', 'Failed to upload receipt');
      setLocalImageUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            lightHaptic();

            // Delete from storage if it's a URL
            if (currentReceiptUrl && !localImageUri) {
              await deleteReceipt(currentReceiptUrl);
            }

            setLocalImageUri(null);
            onReceiptRemoved?.();
          },
        },
      ]
    );
  };

  const handlePress = () => {
    lightHaptic();

    if (imageUrl) {
      setShowPreview(true);
    } else {
      setShowOptions(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, disabled && styles.containerDisabled]}
        onPress={handlePress}
        disabled={disabled || isUploading}
        activeOpacity={0.7}
      >
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
            <View style={styles.imageOverlay}>
              <Ionicons name="eye" size={16} color={Colors.white} />
              <Text style={styles.viewText}>View</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.emptyText}>Add Receipt</Text>
            <Text style={styles.emptySubtext}>Optional</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Add Receipt</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={24} color={Colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionSubtitle}>
                  Use camera to capture receipt
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handlePickFromLibrary}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={24} color={Colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Choose from Library</Text>
                <Text style={styles.optionSubtitle}>
                  Select existing photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setShowPreview(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => {
                setShowPreview(false);
                setShowOptions(true);
              }}
            >
              <Ionicons name="camera" size={20} color={Colors.white} />
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.previewButtonDanger]}
              onPress={() => {
                setShowPreview(false);
                handleRemove();
              }}
            >
              <Ionicons name="trash" size={20} color={Colors.error} />
              <Text style={[styles.previewButtonText, { color: Colors.error }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Compact version for tip entry cards
export const ReceiptBadge: React.FC<{
  hasReceipt: boolean;
  onPress?: () => void;
}> = ({ hasReceipt, onPress }) => {
  if (!hasReceipt) return null;

  return (
    <TouchableOpacity style={styles.badge} onPress={onPress}>
      <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...GlassStyles.card,
    padding: 0,
    overflow: 'hidden',
    height: 120,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  uploadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Options Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  optionsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  // Preview Modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  previewClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Badge
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 168, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReceiptCapture;
