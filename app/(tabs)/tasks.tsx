
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task } from '@/types/storage';
import { addTask, deleteTask, getTasks, updateTask } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Priority = 'low' | 'medium' | 'high';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await getTasks();
    setTasks(loadedTasks);
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      const taskData: Partial<Task> = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        estimatedDuration: newTaskDuration ? parseInt(newTaskDuration) : undefined,
      };

      // Parser les dates si fournies (format DD/MM/YYYY)
      if (newTaskStartDate) {
        const [day, month, year] = newTaskStartDate.split('/');
        if (day && month && year) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          taskData.startDate = date.getTime();
        }
      }
      if (newTaskEndDate) {
        const [day, month, year] = newTaskEndDate.split('/');
        if (day && month && year) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          taskData.endDate = date.getTime();
        }
      }

      await addTask(newTaskTitle.trim(), taskData.priority!, taskData);
      resetForm();
      setModalVisible(false);
      loadTasks();
    }
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskStartDate('');
    setNewTaskEndDate('');
    setNewTaskDuration('');
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA07A';
      case 'low': return '#4ECDC4';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'high': return '🔴 Haute';
      case 'medium': return '🟡 Moyenne';
      case 'low': return '🟢 Basse';
    }
  };

  const handleToggleTask = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
    loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    loadTasks();
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Mes Tâches
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {activeTasks.length} active{activeTasks.length > 1 ? 's' : ''} • {completedTasks.length} terminée{completedTasks.length > 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.addTaskButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
        onPress={() => setModalVisible(true)}>
        <View style={styles.addTaskContent}>
          <View style={styles.addIconContainer}>
            <Text style={styles.addIcon}>+</Text>
          </View>
          <View style={styles.addTaskTextContainer}>
            <Text style={[styles.addTaskTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Créer une nouvelle tâche
            </Text>
            <Text style={[styles.addTaskSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Appuyez pour ajouter des détails
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}>
        <View style={[styles.modalOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                ✨ Nouvelle Tâche
              </Text>
              <TouchableOpacity onPress={() => { resetForm(); setModalVisible(false); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Titre *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#E0E0E0',
                  }]}
                  placeholder="Nom de la tâche"
                  placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Description</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#E0E0E0',
                  }]}
                  placeholder="Détails de la tâche (optionnel)"
                  placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Priorité</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high'] as Priority[]).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
                        newTaskPriority === priority && { 
                          backgroundColor: getPriorityColor(priority),
                          borderColor: getPriorityColor(priority)
                        }
                      ]}
                      onPress={() => setNewTaskPriority(priority)}>
                      <Text style={[
                        styles.priorityText,
                        { color: Colors[colorScheme ?? 'light'].text },
                        newTaskPriority === priority && { color: '#fff', fontWeight: '700' }
                      ]}>
                        {getPriorityLabel(priority)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Date début</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                      color: Colors[colorScheme ?? 'light'].text 
                    }]}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#999"
                    value={newTaskStartDate}
                    onChangeText={setNewTaskStartDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Date fin</Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                      color: Colors[colorScheme ?? 'light'].text 
                    }]}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#999"
                    value={newTaskEndDate}
                    onChangeText={setNewTaskEndDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>Durée estimée (minutes)</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                    color: Colors[colorScheme ?? 'light'].text 
                  }]}
                  placeholder="Ex: 120"
                  placeholderTextColor="#999"
                  value={newTaskDuration}
                  onChangeText={setNewTaskDuration}
                  keyboardType="number-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { resetForm(); setModalVisible(false); }}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton, !newTaskTitle.trim() && styles.createButtonDisabled]}
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}>
                <Text style={styles.createButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.tasksList}>
        {activeTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              📝 Tâches Actives
            </Text>
            {activeTasks.map(task => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { 
                    backgroundColor: task.priority === 'high' 
                      ? (colorScheme === 'dark' ? '#3d2626' : '#ffe5e5')
                      : (colorScheme === 'dark' ? '#2a2a2a' : '#fff'),
                    borderLeftWidth: task.priority === 'high' ? 6 : 4,
                    borderLeftColor: getPriorityColor(task.priority || 'medium')
                  }
                ]}>
                <TouchableOpacity
                  style={styles.taskContent}
                  onPress={() => handleToggleTask(task)}>
                  <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: Colors[colorScheme ?? 'light'].text },
                        task.completed && styles.taskTitleCompleted
                      ]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={[styles.taskDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {task.description}
                      </Text>
                    )}
                    <View style={styles.taskMetadata}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority || 'medium') + '20' }]}>
                        <Text style={[styles.priorityBadgeText, { color: getPriorityColor(task.priority || 'medium') }]}>
                          {getPriorityLabel(task.priority || 'medium')}
                        </Text>
                      </View>
                      <Text style={[styles.pomodorosText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        🍅 {task.pomodorosCompleted}
                      </Text>
                      {task.estimatedDuration && (
                        <Text style={[styles.durationText, { color: Colors[colorScheme ?? 'light'].text }]}>
                          ⏱️ {task.estimatedDuration}min
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTask(task.id)}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {completedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              ✅ Terminées
            </Text>
            {completedTasks.map(task => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff',
                    borderLeftWidth: 4,
                    borderLeftColor: getPriorityColor(task.priority || 'medium'),
                    opacity: 0.7
                  }
                ]}>
                <TouchableOpacity
                  style={styles.taskContent}
                  onPress={() => handleToggleTask(task)}>
                  <View style={[styles.checkbox, styles.checkboxChecked]}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: Colors[colorScheme ?? 'light'].text },
                        styles.taskTitleCompleted
                      ]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={[styles.taskDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {task.description}
                      </Text>
                    )}
                    <View style={styles.taskMetadata}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority || 'medium') + '20' }]}>
                        <Text style={[styles.priorityBadgeText, { color: getPriorityColor(task.priority || 'medium') }]}>
                          {getPriorityLabel(task.priority || 'medium')}
                        </Text>
                      </View>
                      <Text style={[styles.pomodorosText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        🍅 {task.pomodorosCompleted}
                      </Text>
                      {task.estimatedDuration && (
                        <Text style={[styles.durationText, { color: Colors[colorScheme ?? 'light'].text }]}>
                          ⏱️ {task.estimatedDuration}min
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTask(task.id)}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Aucune tâche pour le moment.{'\n'}Ajoutez-en une pour commencer ! 🚀
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  addTaskButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addTaskTextContainer: {
    flex: 1,
  },
  addTaskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  addTaskSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 5,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  textInput: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  createButton: {
    backgroundColor: '#4ECDC4',
  },
  createButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
    letterSpacing: -0.3,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskDescription: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 8,
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pomodorosText: {
    fontSize: 12,
    opacity: 0.7,
  },
  durationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 24,
  },
});
