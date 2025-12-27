import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth } from '../config/firebase';

export default function ShiftNotesModal({ visible, onClose, shift, onSaveNote, allEmployees }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);

  const currentUser = auth.currentUser;

  // Update local notes when shift changes
  useEffect(() => {
    setLocalNotes(shift?.notes || []);
  }, [shift]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      Alert.alert(t('common.error'), t('shiftNotes.errors.emptyNote'));
      return;
    }

    setLoading(true);
    try {
      const note = {
        id: Date.now().toString(),
        text: newNote.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'User',
        createdAt: new Date().toISOString(),
      };

      const updatedNotes = [...localNotes, note];

      // Update local state immediately for instant feedback
      setLocalNotes(updatedNotes);
      setNewNote('');

      // Save to backend
      await onSaveNote(shift, updatedNotes);
    } catch (error) {
      console.error('Error adding note:', error);
      // Revert local state on error
      setLocalNotes(shift?.notes || []);
      Alert.alert(t('common.error'), t('shiftNotes.errors.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    Alert.alert(
      t('shiftNotes.deleteNote.title'),
      t('shiftNotes.deleteNote.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedNotes = localNotes.filter(n => n.id !== noteId);

              // Update local state immediately
              setLocalNotes(updatedNotes);

              // Save to backend
              await onSaveNote(shift, updatedNotes);
            } catch (error) {
              console.error('Error deleting note:', error);
              // Revert local state on error
              setLocalNotes(shift?.notes || []);
              Alert.alert(t('common.error'), t('shiftNotes.errors.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles(theme).modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles(theme).modalContent}>
              {/* Header */}
              <View style={styles(theme).header}>
                <View style={styles(theme).headerLeft}>
                  <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                  <View style={styles(theme).headerTextContainer}>
                    <Text style={styles(theme).modalTitle}>{t('shiftNotes.title')}</Text>
                    <Text style={styles(theme).shiftInfo}>
                      {shift?.employeeName} - {shift?.shiftName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles(theme).closeButton}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Notes List */}
              <ScrollView style={styles(theme).notesList} showsVerticalScrollIndicator={false}>
                {localNotes.length === 0 ? (
                  <View style={styles(theme).emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.textSecondary} />
                    <Text style={styles(theme).emptyStateText}>{t('shiftNotes.noNotes')}</Text>
                  </View>
                ) : (
                  localNotes.map((note) => {
                    const isOwnNote = note.authorId === currentUser.uid;
                    return (
                      <View key={note.id} style={styles(theme).noteItem}>
                        <View style={styles(theme).noteHeader}>
                          <View style={styles(theme).noteAuthorContainer}>
                            <Ionicons name="person-circle-outline" size={16} color={theme.primary} />
                            <Text style={styles(theme).noteAuthor}>{note.authorName}</Text>
                          </View>
                          <View style={styles(theme).noteActions}>
                            <Text style={styles(theme).noteDate}>{formatDate(note.createdAt)}</Text>
                            {isOwnNote && (
                              <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                                <Ionicons name="trash-outline" size={16} color={theme.error} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <Text style={styles(theme).noteText}>{note.text}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Add Note Input */}
              <View style={styles(theme).inputSection}>
                <TextInput
                  style={styles(theme).input}
                  placeholder={t('shiftNotes.addPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  maxLength={500}
                  editable={!loading}
                  textAlignVertical="center"
                />
                <TouchableOpacity
                  style={[styles(theme).sendButton, loading && styles(theme).sendButtonDisabled]}
                  onPress={handleAddNote}
                  disabled={loading || !newNote.trim()}
                >
                  <Ionicons name="send" size={20} color={newNote.trim() ? theme.primary : theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
  );
}

const styles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: 400,
    maxWidth: '90%',
    height: '70%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  shiftInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  noteItem: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  noteText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    color: theme.text,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 12,
  },
  sendButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
