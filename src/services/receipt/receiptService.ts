// Receipt Service - Handle receipt photo capture and storage
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../api/supabase';
import { Analytics } from '../analytics/analytics';

const RECEIPT_BUCKET = 'receipts';
const MAX_IMAGE_SIZE = 1024 * 1024 * 5; // 5MB
const IMAGE_QUALITY = 0.7;

export interface ReceiptUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Request camera permissions
export const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// Request media library permissions
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Take a photo with camera
export const takeReceiptPhoto = async (): Promise<string | null> => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    console.log('[Receipt] Camera permission denied');
    return null;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: IMAGE_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      console.log('[Receipt] Photo capture cancelled');
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('[Receipt] Error taking photo:', error);
    return null;
  }
};

// Pick photo from library
export const pickReceiptFromLibrary = async (): Promise<string | null> => {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    console.log('[Receipt] Media library permission denied');
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: IMAGE_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      console.log('[Receipt] Image selection cancelled');
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('[Receipt] Error picking image:', error);
    return null;
  }
};

// Compress image if needed
const compressImage = async (uri: string): Promise<string> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);

    // If file is already small enough, return as is
    if (fileInfo.exists && fileInfo.size && fileInfo.size <= MAX_IMAGE_SIZE) {
      return uri;
    }

    // For larger files, we'd use image manipulation
    // For now, just return the uri (expo-image-picker already compresses)
    console.log('[Receipt] Image size:', fileInfo.size);
    return uri;
  } catch (error) {
    console.error('[Receipt] Error checking file size:', error);
    return uri;
  }
};

// Upload receipt to Supabase Storage
export const uploadReceipt = async (
  localUri: string,
  tipEntryId: string
): Promise<ReceiptUploadResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Compress if needed
    const compressedUri = await compressImage(localUri);

    // Generate unique filename
    const fileExt = localUri.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${tipEntryId}_${Date.now()}.${fileExt}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert to array buffer
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(fileName, bytes.buffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('[Receipt] Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(RECEIPT_BUCKET)
      .getPublicUrl(fileName);

    Analytics.track('receipt_captured', { success: true });

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('[Receipt] Upload error:', error);
    Analytics.track('receipt_captured', { success: false });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

// Delete receipt from storage
export const deleteReceipt = async (receiptUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = receiptUrl.split('/');
    const bucketIndex = urlParts.indexOf(RECEIPT_BUCKET);
    if (bucketIndex === -1) return false;

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[Receipt] Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Receipt] Delete error:', error);
    return false;
  }
};

// Update tip entry with receipt URL
export const attachReceiptToTip = async (
  tipEntryId: string,
  receiptUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tip_entries')
      .update({
        receipt_url: receiptUrl,
        receipt_uploaded_at: new Date().toISOString(),
      })
      .eq('id', tipEntryId);

    if (error) {
      console.error('[Receipt] Error attaching to tip:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Receipt] Error attaching to tip:', error);
    return false;
  }
};

// Get receipt URL for a tip entry
export const getReceiptUrl = async (tipEntryId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('tip_entries')
      .select('receipt_url')
      .eq('id', tipEntryId)
      .single();

    if (error || !data?.receipt_url) {
      return null;
    }

    return data.receipt_url;
  } catch (error) {
    console.error('[Receipt] Error getting receipt URL:', error);
    return null;
  }
};
