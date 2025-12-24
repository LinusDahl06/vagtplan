import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image, StyleSheet } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getEmployeeColor } from '../utils/employeeColors';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsView({ workspace, ownerInfo }) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [viewType, setViewType] = useState('chart');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState({});

  // Get all employees including owner
  const allEmployees = useMemo(() => {
    const employees = [...workspace.employees];
    const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);

    if (!ownerInEmployees && ownerInfo) {
      employees.unshift({
        userId: workspace.ownerId,
        name: ownerInfo.name,
        username: ownerInfo.username,
        email: ownerInfo.email,
        photoURL: ownerInfo.photoURL || null,
        roleId: '1',
        color: getEmployeeColor(workspace.ownerId)
      });
    }

    // Ensure all employees have a color (fallback for existing data)
    const employeesWithColors = employees.map(emp => ({
      ...emp,
      color: emp.color || getEmployeeColor(emp.userId)
    }));

    return employeesWithColors;
  }, [workspace.employees, workspace.ownerId, ownerInfo]);

  // Calculate monthly hours per employee for current month
  const currentMonthHours = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const hours = {};
    
    allEmployees.forEach(emp => {
      hours[emp.userId] = {
        name: emp.name,
        total: 0,
        shifts: []
      };
    });

    workspace.schedule?.forEach(shift => {
      const shiftDate = new Date(shift.date);
      if (shiftDate.getFullYear() === currentYear && shiftDate.getMonth() === currentMonth) {
        if (hours[shift.employeeId]) {
          hours[shift.employeeId].total += shift.hours;
          hours[shift.employeeId].shifts.push(shift);
        }
      }
    });

    return hours;
  }, [workspace.schedule, allEmployees]);

  // Get monthly data organized by month for table view
  const monthlyData = useMemo(() => {
    const data = {};
    const now = new Date();
    
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
      const monthName = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      
      data[monthKey] = {
        name: monthName,
        date: date,
        employees: {}
      };
      
      allEmployees.forEach(emp => {
        data[monthKey].employees[emp.userId] = {
          name: emp.name,
          total: 0,
          shifts: []
        };
      });
    }

    workspace.schedule?.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const monthKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}`;
      
      if (data[monthKey] && data[monthKey].employees[shift.employeeId]) {
        data[monthKey].employees[shift.employeeId].total += shift.hours;
        data[monthKey].employees[shift.employeeId].shifts.push(shift);
      }
    });

    return Object.values(data).reverse();
  }, [workspace.schedule, allEmployees, i18n.language]);

  // Prepare data for bar chart (current month)
  const barChartData = useMemo(() => {
    const sortedEmployees = Object.entries(currentMonthHours)
      .sort((a, b) => b[1].total - a[1].total);

    // Map userId to employee color
    const employeeColors = sortedEmployees.map(([userId, _]) => {
      const employee = allEmployees.find(emp => emp.userId === userId);
      return employee?.color || '#3b82f6';
    });

    return {
      labels: sortedEmployees.map(([_, data]) => data.name.split(' ')[0]),
      datasets: [{
        data: sortedEmployees.map(([_, data]) => data.total),
        colors: employeeColors.map(color => () => color),
        strokeWidth: 2
      }],
      barColors: employeeColors,
      legend: sortedEmployees.map(([_, data]) => data.name.split(' ')[0])
    };
  }, [currentMonthHours, allEmployees]);

  // Calculate monthly hours for selected employee
  const monthlyHoursData = useMemo(() => {
    if (!selectedEmployee) return null;

    const monthNames = i18n.language === 'da'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthlyHours = Array(12).fill(0);

    const employeeShifts = workspace.schedule?.filter(s => s.employeeId === selectedEmployee.userId) || [];

    employeeShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const monthsAgo = (currentDate.getFullYear() - shiftDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - shiftDate.getMonth());
      
      if (monthsAgo >= 0 && monthsAgo < 12) {
        monthlyHours[11 - monthsAgo] += shift.hours;
      }
    });

    const startMonth = new Date();
    startMonth.setMonth(startMonth.getMonth() - 11);

    const labels = [];
    for (let i = 0; i < 12; i++) {
      const month = new Date(startMonth);
      month.setMonth(startMonth.getMonth() + i);
      labels.push(monthNames[month.getMonth()]);
    }

    return {
      labels,
      datasets: [{
        data: monthlyHours
      }]
    };
  }, [selectedEmployee, workspace.schedule, i18n.language]);

  const toggleMonthExpansion = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const toggleEmployeeExpansion = (monthKey, userId) => {
    const key = `${monthKey}-${userId}`;
    setExpandedEmployees(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const barChartConfig = useMemo(() => ({
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => theme.textSecondary,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 10
    },
    propsForBackgroundLines: {
      strokeWidth: 1
    }
  }), [theme]);

  const lineChartConfig = useMemo(() => ({
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => {
      if (selectedEmployee?.color) {
        // Convert hex to rgba
        const hex = selectedEmployee.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return `rgba(76, 175, 80, ${opacity})`;
    },
    labelColor: (opacity = 1) => theme.textSecondary,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 10
    }
  }), [theme, selectedEmployee]);

  const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
  const currentMonthName = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <View style={styles(theme).container}>
      {/* Sticky Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerTitleContainer}>
          <Ionicons name="analytics-outline" size={24} color={theme.primary} />
          <Text style={styles(theme).headerTitle}>{t('analytics.title')}</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles(theme).scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Month Hours Section */}
        <View style={styles(theme).section}>
        <View style={styles(theme).sectionHeaderRow}>
          <Text style={styles(theme).sectionTitle}>{t('analytics.hoursThisMonth', { month: currentMonthName })}</Text>

          <View style={styles(theme).dropdownContainer}>
            <TouchableOpacity
              style={styles(theme).dropdownButton}
              onPress={() => setShowViewDropdown(!showViewDropdown)}
            >
              <Ionicons
                name={viewType === 'chart' ? 'bar-chart-outline' : 'list-outline'}
                size={16}
                color={theme.primary}
              />
              <Text style={styles(theme).dropdownButtonText}>
                {viewType === 'chart' ? t('analytics.viewMode.chart') : t('analytics.viewMode.table')}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {showViewDropdown && (
              <View style={styles(theme).dropdownMenu}>
                <TouchableOpacity
                  style={styles(theme).dropdownItem}
                  onPress={() => {
                    setViewType('chart');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="bar-chart-outline" size={16} color={theme.primary} />
                  <Text style={styles(theme).dropdownItemText}>{t('analytics.viewMode.chartView')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles(theme).dropdownItem}
                  onPress={() => {
                    setViewType('table');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="list-outline" size={16} color={theme.primary} />
                  <Text style={styles(theme).dropdownItemText}>{t('analytics.viewMode.tableView')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {viewType === 'chart' ? (
          <View style={styles(theme).chartContainer}>
            {barChartData.datasets[0].data.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles(theme).chartScrollContent}
              >
                <BarChart
                  data={barChartData}
                  width={Math.max(screenWidth - 48, barChartData.labels.length * 60)}
                  height={220}
                  chartConfig={barChartConfig}
                  style={styles(theme).chart}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisLabel=""
                  yAxisSuffix="h"
                  withCustomBarColorFromData
                />
              </ScrollView>
            ) : (
              <Text style={styles(theme).noDataText}>{t('analytics.noDataThisMonth')}</Text>
            )}
          </View>
        ) : (
          <View style={styles(theme).tableContainer}>
            {monthlyData.map((monthData, idx) => {
              const monthKey = `${monthData.date.getFullYear()}-${monthData.date.getMonth()}`;
              const employeesWithHours = Object.entries(monthData.employees)
                .filter(([_, data]) => data.total > 0)
                .sort((a, b) => b[1].total - a[1].total);

              if (employeesWithHours.length === 0) return null;

              return (
                <View key={monthKey}>
                  <TouchableOpacity
                    style={styles(theme).monthHeader}
                    onPress={() => toggleMonthExpansion(monthKey)}
                  >
                    <Text style={styles(theme).monthName}>{monthData.name}</Text>
                    <View style={styles(theme).monthHeaderRight}>
                      <Text style={styles(theme).monthTotal}>
                        {employeesWithHours.reduce((sum, [_, data]) => sum + data.total, 0).toFixed(1)}h
                      </Text>
                      <Ionicons
                        name={expandedMonths[monthKey] ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedMonths[monthKey] && (
                    <View style={styles(theme).expandedMonthContent}>
                      {employeesWithHours.map(([userId, data]) => {
                        const employeeKey = `${monthKey}-${userId}`;
                        const sortedShifts = [...data.shifts].sort((a, b) =>
                          new Date(a.date) - new Date(b.date)
                        );
                        // Get full employee data including photoURL
                        const employee = allEmployees.find(emp => emp.userId === userId);

                        return (
                          <View key={userId}>
                            <TouchableOpacity
                              style={styles(theme).employeeRow}
                              onPress={() => toggleEmployeeExpansion(monthKey, userId)}
                            >
                              <View style={styles(theme).employeeInfo}>
                                {employee?.photoURL ? (
                                  <Image
                                    source={{ uri: employee.photoURL }}
                                    style={styles(theme).avatarTinyImage}
                                  />
                                ) : (
                                  <View style={styles(theme).avatarTiny}>
                                    <Text style={styles(theme).avatarTinyText}>{data.name.charAt(0)}</Text>
                                  </View>
                                )}
                                <Text style={styles(theme).employeeName}>{data.name}</Text>
                              </View>
                              <View style={styles(theme).employeeHoursContainer}>
                                <Text style={styles(theme).employeeHours}>{data.total.toFixed(1)}h</Text>
                                <Ionicons
                                  name={expandedEmployees[employeeKey] ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={theme.textSecondary}
                                />
                              </View>
                            </TouchableOpacity>

                            {expandedEmployees[employeeKey] && (
                              <View style={styles(theme).shiftsContent}>
                                {sortedShifts.map((shift, shiftIdx) => (
                                  <View key={shiftIdx} style={styles(theme).shiftRow}>
                                    <Text style={styles(theme).shiftDate}>
                                      {new Date(shift.date).toLocaleDateString(locale, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </Text>
                                    <Text style={styles(theme).shiftName}>{shift.shiftName}</Text>
                                    <Text style={styles(theme).shiftHours}>{shift.hours}h</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Monthly Trends Section */}
      <View style={styles(theme).section}>
        <View style={styles(theme).sectionHeaderRow}>
          <Text style={styles(theme).sectionTitle}>{t('analytics.monthlyTrend')}</Text>

          <View style={styles(theme).dropdownContainer}>
            <TouchableOpacity
              style={styles(theme).dropdownButton}
              onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            >
              <Text style={styles(theme).dropdownButtonText}>
                {selectedEmployee ? selectedEmployee.name.split(' ')[0] : t('analytics.selectEmployee')}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {showEmployeeDropdown && (
              <View style={styles(theme).dropdownMenu}>
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={styles(theme).dropdownScrollView}
                >
                  {allEmployees.map(emp => (
                    <TouchableOpacity
                      key={emp.userId}
                      style={styles(theme).dropdownItem}
                      onPress={() => {
                        setSelectedEmployee(emp);
                        setShowEmployeeDropdown(false);
                      }}
                    >
                      {emp.photoURL ? (
                        <Image source={{ uri: emp.photoURL }} style={styles(theme).avatarTinyImage} />
                      ) : (
                        <View style={styles(theme).avatarTiny}>
                          <Text style={styles(theme).avatarTinyText}>{emp.name.charAt(0)}</Text>
                        </View>
                      )}
                      <Text style={styles(theme).dropdownItemText}>{emp.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles(theme).chartContainer}>
          {selectedEmployee && monthlyHoursData ? (
            <View>
              <LineChart
                data={monthlyHoursData}
                width={screenWidth - 48}
                height={220}
                chartConfig={lineChartConfig}
                style={styles(theme).chart}
                bezier
                fromZero
                yAxisLabel=""
                yAxisSuffix="h"
              />
            </View>
          ) : (
            <View style={styles(theme).placeholderContainer}>
              <Ionicons name="trending-up-outline" size={48} color={theme.textSecondary} />
              <Text style={styles(theme).placeholderText}>
                {t('analytics.selectEmployeePrompt')}
              </Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dropdownButtonText: {
    color: theme.text,
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 150,
    maxHeight: 200,
    zIndex: 1001,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownItemText: {
    color: theme.text,
    fontSize: 14,
  },
  chartContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chartScrollContent: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginLeft: -16,
    marginRight: -16,
  },
  noDataText: {
    color: theme.textSecondary,
    fontSize: 14,
    padding: 40,
  },
  tableContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surfaceVariant,
  },
  monthName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  monthHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthTotal: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedMonthContent: {
    backgroundColor: theme.background,
    padding: 12,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarTiny: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTinyImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  avatarTinyText: {
    color: theme.surfaceVariant,
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeeName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  employeeHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeHours: {
    color: theme.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  shiftsContent: {
    backgroundColor: 'theme.surfaceVariant',
    padding: 12,
    marginLeft: 20,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: theme.primary,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  shiftDate: {
    color: theme.textSecondary,
    fontSize: 12,
    width: 90,
    flexShrink: 0,
  },
  shiftName: {
    color: theme.text,
    fontSize: 13,
    flex: 1,
    marginHorizontal: 8,
  },
  shiftHours: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
    flexShrink: 0,
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});