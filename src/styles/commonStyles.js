import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  backButton: {
    color: '#4CAF50',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workspaceCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workspaceCardContent: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  workspaceInfo: {
    fontSize: 14,
    color: '#888',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#f44336',
  },
  addButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  createModal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  shiftCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  shiftName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shiftHours: {
    color: '#4CAF50',
    fontSize: 16,
  },
});