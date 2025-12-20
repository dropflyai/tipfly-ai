import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Job, Position } from '../../types';
import {
  getPositionsByJob,
  createPosition,
  deletePosition,
  setDefaultPosition,
  POSITION_PRESETS,
} from '../../services/api/positions';
import { lightHaptic, mediumHaptic, errorHaptic } from '../../utils/haptics';

interface PositionsModalProps {
  visible: boolean;
  job: Job;
  onClose: () => void;
}

const POSITION_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export default function PositionsModal({ visible, job, onClose }: PositionsModalProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(POSITION_COLORS[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPositions();
    }
  }, [visible]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await getPositionsByJob(job.id);
      setPositions(data);
    } catch (error) {
      console.error('[PositionsModal] Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) {
      errorHaptic();
      Alert.alert('Error', 'Please enter a position name');
      return;
    }

    try {
      setCreating(true);
      await createPosition({
        job_id: job.id,
        name: newPositionName.trim(),
        color: selectedColor,
        is_default: positions.length === 0, // First position is default
      });
      mediumHaptic();
      setNewPositionName('');
      setShowAddForm(false);
      loadPositions();
    } catch (error) {
      console.error('[PositionsModal] Error creating position:', error);
      errorHaptic();
      Alert.alert('Error', 'Failed to create position');
    } finally {
      setCreating(false);
    }
  };

  const handleAddPreset = async (preset: typeof POSITION_PRESETS[number]) => {
    try {
      await createPosition({
        job_id: job.id,
        name: preset.name,
        color: preset.color,
        is_default: positions.length === 0,
      });
      mediumHaptic();
      loadPositions();
    } catch (error) {
      console.error('[PositionsModal] Error creating preset position:', error);
      errorHaptic();
      Alert.alert('Error', 'Failed to add position');
    }
  };

  const handleSetDefault = async (positionId: string) => {
    try {
      lightHaptic();
      await setDefaultPosition(job.id, positionId);
      loadPositions();
    } catch (error) {
      console.error('[PositionsModal] Error setting default:', error);
      Alert.alert('Error', 'Failed to set default position');
    }
  };

  const handleDelete = (position: Position) => {
    Alert.alert(
      'Delete Position',
      `Are you sure you want to delete "${position.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              mediumHaptic();
              await deletePosition(position.id);
              loadPositions();
            } catch (error) {
              console.error('[PositionsModal] Error deleting:', error);
              errorHaptic();
              Alert.alert('Error', 'Failed to delete position');
            }
          },
        },
      ]
    );
  };

  // Get presets that haven't been added yet
  const availablePresets = POSITION_PRESETS.filter(
    preset => !positions.some(p => p.name.toLowerCase() === preset.name.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Positions</Text>
            <Text style={styles.headerSubtitle}>{job.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Positions let you track different roles at the same job (e.g., Server vs Bartender) to see which earns more.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <>
              {/* Current Positions */}
              {positions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Positions</Text>
                  {positions.map((position) => (
                    <View key={position.id} style={styles.positionCard}>
                      <View style={styles.positionLeft}>
                        <View style={[styles.positionColor, { backgroundColor: position.color }]} />
                        <Text style={styles.positionName}>{position.name}</Text>
                        {position.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.positionActions}>
                        {!position.is_default && (
                          <TouchableOpacity
                            onPress={() => handleSetDefault(position.id)}
                            style={styles.positionActionButton}
                          >
                            <Ionicons name="star-outline" size={18} color={Colors.warning} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDelete(position)}
                          style={styles.positionActionButton}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Add Presets */}
              {availablePresets.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quick Add</Text>
                  <View style={styles.presetsGrid}>
                    {availablePresets.map((preset) => (
                      <TouchableOpacity
                        key={preset.name}
                        style={styles.presetButton}
                        onPress={() => handleAddPreset(preset)}
                      >
                        <View style={[styles.presetColor, { backgroundColor: preset.color }]} />
                        <Text style={styles.presetName}>{preset.name}</Text>
                        <Ionicons name="add" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Custom Position Form */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Custom Position</Text>
                {showAddForm ? (
                  <View style={styles.addForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Position name (e.g., Captain)"
                      placeholderTextColor={Colors.textSecondary}
                      value={newPositionName}
                      onChangeText={setNewPositionName}
                      autoFocus
                    />
                    <Text style={styles.colorLabel}>Color</Text>
                    <View style={styles.colorPicker}>
                      {POSITION_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => {
                            lightHaptic();
                            setSelectedColor(color);
                          }}
                        >
                          {selectedColor === color && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowAddForm(false);
                          setNewPositionName('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addButton, creating && styles.addButtonDisabled]}
                        onPress={handleAddPosition}
                        disabled={creating}
                      >
                        {creating ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.addButtonText}>Add Position</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.showFormButton}
                    onPress={() => {
                      lightHaptic();
                      setShowAddForm(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.showFormButtonText}>Add Custom Position</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loader: {
    marginTop: 40,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  positionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  positionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  positionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  positionActionButton: {
    padding: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  addForm: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  showFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  showFormButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});
