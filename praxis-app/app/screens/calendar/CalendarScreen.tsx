import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../theme';
import { PraxisButton, Card, Spacer } from '../../components';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekday);
dayjs.extend(isoWeek);

type MainStackParamList = {
  WorkoutOverview: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type DayStatus = 'completed' | 'missed' | 'upcoming';

interface DayData {
  date: string; // yyyy-mm-dd
  status: DayStatus;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const today = dayjs();
  const currentWeekStart = today.startOf('isoWeek');

  // TODO: Replace with actual data from usePlanStore and useSessionStore
  const mockWeeklyData: DayData[] = useMemo(() => {
    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = currentWeekStart.add(i, 'day');
      // Mock statuses: completed, missed, upcoming
      const statuses: DayStatus[] = ['completed', 'missed', 'upcoming'];
      days.push({
        date: date.format('YYYY-MM-DD'),
        status: statuses[i % 3],
      });
    }
    return days;
  }, [currentWeekStart]);

  // TODO: Replace with actual data from usePlanStore and useSessionStore
  const mockMonthlyData: DayData[] = useMemo(() => {
    const days: DayData[] = [];
    const monthStart = today.startOf('month');
    const monthEnd = today.endOf('month');
    const daysInMonth = monthEnd.date();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = monthStart.date(i);
      const statuses: DayStatus[] = ['completed', 'missed', 'upcoming'];
      days.push({
        date: date.format('YYYY-MM-DD'),
        status: statuses[Math.floor(Math.random() * 3)],
      });
    }

    // Pad with days from previous month to align to week start
    const firstDayOfWeek = monthStart.isoWeekday();
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = monthStart.subtract(i, 'day');
      days.unshift({
        date: date.format('YYYY-MM-DD'),
        status: 'upcoming',
      });
    }

    // Pad with days from next month to complete grid
    const lastDayOfWeek = monthEnd.isoWeekday();
    const daysToAdd = 7 - lastDayOfWeek;
    for (let i = 1; i <= daysToAdd; i++) {
      const date = monthEnd.add(i, 'day');
      days.push({
        date: date.format('YYYY-MM-DD'),
        status: 'upcoming',
      });
    }

    return days;
  }, [today]);

  const getWeekRange = (): string => {
    const weekStart = currentWeekStart.format('MMM D');
    const weekEnd = currentWeekStart.add(6, 'day').format('MMM D');
    return `${weekStart} — ${weekEnd}`;
  };

  const getMonthYear = (): string => {
    return today.format('MMMM YYYY');
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setIsDrawerVisible(true);
  };

  const handleViewFullWorkout = () => {
    setIsDrawerVisible(false);
    // TODO: Pass date parameter to WorkoutOverviewScreen
    navigation.navigate('WorkoutOverview');
  };

  const getDotColor = (status: DayStatus, isToday: boolean): string => {
    if (isToday) return theme.colors.acidGreen; // Will have border outline
    switch (status) {
      case 'completed':
        return theme.colors.acidGreen;
      case 'missed':
        return theme.colors.danger;
      case 'upcoming':
        return theme.colors.graphite;
      default:
        return theme.colors.graphite;
    }
  };

  const getStatusText = (status: DayStatus): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      case 'upcoming':
        return 'Upcoming';
      default:
        return 'Upcoming';
    }
  };

  const getStatusDot = (status: DayStatus): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'missed':
        return '✕';
      case 'upcoming':
        return '○';
      default:
        return '○';
    }
  };

  const renderWeeklyView = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View style={[styles.weeklyContainer, { padding: theme.spacing.xxl }]}>
        <Text
          style={[
            styles.weekRange,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          Week of {getWeekRange()}
        </Text>

        <View style={styles.weeklyGrid}>
          {dayLabels.map((label, index) => {
            const dayData = mockWeeklyData[index];
            const isToday = dayjs(dayData.date).isSame(today, 'day');
            const dotColor = getDotColor(dayData.status, isToday);

            return (
              <TouchableOpacity
                key={index}
                style={styles.weeklyDay}
                onPress={() => handleDayPress(dayData.date)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.bodySmall,
                      marginBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  {label}
                </Text>
                <View
                  style={[
                    styles.weeklyDot,
                    {
                      backgroundColor: dotColor,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: theme.colors.acidGreen,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dotSymbol,
                      {
                        color:
                          dayData.status === 'completed' && !isToday
                            ? theme.colors.black
                            : dayData.status === 'missed'
                              ? theme.colors.black
                              : theme.colors.white,
                        fontFamily: theme.typography.fonts.bodyMedium,
                        fontSize: 16,
                      },
                    ]}
                  >
                    {getStatusDot(dayData.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthlyView = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = [];
    for (let i = 0; i < mockMonthlyData.length; i += 7) {
      weeks.push(mockMonthlyData.slice(i, i + 7));
    }

    return (
      <ScrollView
        style={styles.monthlyScrollView}
        contentContainerStyle={[
          styles.monthlyContainer,
          { padding: theme.spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.monthTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h2,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          {getMonthYear()}
        </Text>

        <View
          style={[styles.monthlyHeader, { marginBottom: theme.spacing.lg }]}
        >
          {dayLabels.map((label) => (
            <View key={label} style={styles.monthlyHeaderCell}>
              <Text
                style={[
                  styles.monthlyHeaderLabel,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View
            key={weekIndex}
            style={[styles.monthlyRow, { marginBottom: theme.spacing.md }]}
          >
            {week.map((dayData, dayIndex) => {
              const isToday = dayjs(dayData.date).isSame(today, 'day');
              const dotColor = getDotColor(dayData.status, isToday);
              const isCurrentMonth =
                dayjs(dayData.date).month() === today.month();

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={styles.monthlyCell}
                  onPress={() => handleDayPress(dayData.date)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.monthlyDot,
                      {
                        backgroundColor: isCurrentMonth
                          ? dotColor
                          : theme.colors.transparent,
                        width: isCurrentMonth ? 24 : 20,
                        height: isCurrentMonth ? 24 : 20,
                        borderRadius: isCurrentMonth ? 12 : 10,
                        borderWidth: isToday ? 2 : 0,
                        borderColor: theme.colors.acidGreen,
                        opacity: isCurrentMonth ? 1 : 0.3,
                      },
                    ]}
                  >
                    {isCurrentMonth && (
                      <Text
                        style={[
                          styles.monthlyDotSymbol,
                          {
                            color:
                              dayData.status === 'completed' && !isToday
                                ? theme.colors.black
                                : dayData.status === 'missed'
                                  ? theme.colors.black
                                  : theme.colors.white,
                            fontFamily: theme.typography.fonts.bodyMedium,
                            fontSize: 12,
                          },
                        ]}
                      >
                        {getStatusDot(dayData.status)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderDailySummaryDrawer = () => {
    if (!selectedDate) return null;

    const selectedDay = dayjs(selectedDate);
    const dayData = [...mockWeeklyData, ...mockMonthlyData].find(
      (d) => d.date === selectedDate
    ) || { date: selectedDate, status: 'upcoming' as DayStatus };

    // TODO: Get actual workout data from usePlanStore
    const mockWorkoutData = {
      focusTags: ['Strength', 'Engine'],
      duration: 61,
      volume: [
        { exercise: 'Back Squat', sets: 5 },
        { exercise: 'RDL', sets: 3 },
        { exercise: 'Conditioning', duration: 18 },
      ],
      pr: 'Back Squat: Estimated +10 lb PR',
    };

    return (
      <Modal
        visible={isDrawerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setIsDrawerVisible(false)}
        >
          <View
            style={[
              styles.drawerContent,
              {
                backgroundColor: theme.colors.graphite,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                padding: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                maxHeight: Dimensions.get('window').height * 0.7,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.drawerHandle,
                {
                  backgroundColor: theme.colors.steel,
                  width: 40,
                  height: 4,
                  borderRadius: theme.radius.pill,
                  marginBottom: theme.spacing.md,
                  alignSelf: 'center',
                },
              ]}
            />

            <Text
              style={[
                styles.drawerDate,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.h3,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {selectedDay.format('dddd, MMM D')}
            </Text>

            <Text
              style={[
                styles.drawerSession,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.fonts.body,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              {mockWorkoutData.focusTags.join(' + ')} —{' '}
              {mockWorkoutData.duration} min
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    dayData.status === 'completed'
                      ? theme.colors.acidGreen
                      : dayData.status === 'missed'
                        ? theme.colors.danger
                        : theme.colors.steel,
                  borderRadius: theme.radius.pill,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.md,
                  alignSelf: 'flex-start',
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      dayData.status === 'upcoming'
                        ? theme.colors.white
                        : theme.colors.black,
                    fontFamily: theme.typography.fonts.bodyMedium,
                    fontSize: theme.typography.sizes.bodySmall,
                  },
                ]}
              >
                {getStatusText(dayData.status)}
              </Text>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.white,
                  fontFamily: theme.typography.fonts.headingMedium,
                  fontSize: theme.typography.sizes.body,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Volume Summary
            </Text>

            <View
              style={[styles.volumeList, { marginBottom: theme.spacing.lg }]}
            >
              {mockWorkoutData.volume.map((item, index) => (
                <Text
                  key={index}
                  style={[
                    styles.volumeItem,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  • {item.exercise}
                  {'sets' in item
                    ? ` — ${item.sets} sets`
                    : ` — ${item.duration} min`}
                </Text>
              ))}
            </View>

            {mockWorkoutData.pr && (
              <>
                <Spacer size="md" />
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.white,
                      fontFamily: theme.typography.fonts.headingMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  PR Highlights
                </Text>
                <Text
                  style={[
                    styles.prText,
                    {
                      color: theme.colors.acidGreen,
                      fontFamily: theme.typography.fonts.bodyMedium,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  {mockWorkoutData.pr}
                </Text>
              </>
            )}

            <PraxisButton
              title="View Full Workout"
              onPress={handleViewFullWorkout}
              size="large"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.carbon }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.steel,
          },
        ]}
      >
        <View style={{ width: 80 }} />
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.white,
              fontFamily: theme.typography.fonts.headingMedium,
              fontSize: theme.typography.sizes.h2,
            },
          ]}
        >
          Calendar
        </Text>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleButton,
              {
                color: theme.colors.acidGreen,
                fontFamily: theme.typography.fonts.bodyMedium,
                fontSize: theme.typography.sizes.body,
              },
            ]}
          >
            {viewMode === 'week' ? 'Month' : 'Week'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'week' ? renderWeeklyView() : renderMonthlyView()}
      </View>

      {/* Daily Summary Drawer */}
      {renderDailySummaryDrawer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '600',
  },
  toggleButton: {
    fontWeight: '500',
    width: 80,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  weeklyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  weekRange: {
    textAlign: 'center',
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weeklyDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontWeight: '400',
  },
  weeklyDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSymbol: {
    fontWeight: '500',
  },
  monthlyScrollView: {
    flex: 1,
  },
  monthlyContainer: {
    // padding set inline
  },
  monthTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  monthlyHeader: {
    flexDirection: 'row',
    // marginBottom set inline
  },
  monthlyHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyHeaderLabel: {
    fontWeight: '500',
  },
  monthlyRow: {
    flexDirection: 'row',
    // marginBottom set inline
  },
  monthlyCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  monthlyDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthlyDotSymbol: {
    fontWeight: '500',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    // borderTopRadius, paddingBottom, maxHeight set inline
  },
  drawerHandle: {
    // Styled inline
  },
  drawerDate: {
    fontWeight: '600',
  },
  drawerSession: {
    fontWeight: '400',
  },
  statusBadge: {
    // Styled inline
  },
  statusText: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  volumeList: {
    // marginBottom set inline
  },
  volumeItem: {
    lineHeight: 22,
  },
  prText: {
    fontWeight: '500',
  },
});
