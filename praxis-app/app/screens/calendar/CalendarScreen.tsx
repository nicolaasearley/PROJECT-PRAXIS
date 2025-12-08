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
import { PraxisButton, Card, Spacer, Chip } from '../../components';
import { usePlanStore } from '../../store/usePlanStore';
import type { WorkoutPlanDay } from '../../core/types';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekday);
dayjs.extend(isoWeek);

type MainStackParamList = {
  WorkoutOverview: { planDayId?: string } | undefined;
  OnboardingComplete: undefined;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;

type DayStatus = 'none' | 'rest' | 'pastPlanned' | 'todayPlanned' | 'upcoming';

/**
 * Normalize date string to yyyy-mm-dd format
 */
function toDateKey(dateString: string): string {
  return dateString.slice(0, 10);
}

export default function CalendarScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { plan } = usePlanStore();

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const today = dayjs();
  const todayKey = today.format('YYYY-MM-DD');
  const currentWeekStart = today.startOf('isoWeek');

  // Build plan by date map
  const planByDate = useMemo(() => {
    const map = new Map<string, WorkoutPlanDay>();
    plan.forEach((day) => {
      const dateKey = toDateKey(day.date);
      map.set(dateKey, day);
    });
    return map;
  }, [plan]);

  /**
   * Get day status based on plan data
   */
  const getDayStatus = (dateKey: string): DayStatus => {
    const planDay = planByDate.get(dateKey);

    if (!planDay) {
      return 'none';
    }

    if (planDay.blocks.length === 0) {
      return 'rest';
    }

    // Compare dates
    const dayDate = dayjs(dateKey);
    const todayDate = dayjs(todayKey);

    if (dayDate.isSame(todayDate, 'day')) {
      return 'todayPlanned';
    } else if (dayDate.isBefore(todayDate, 'day')) {
      return 'pastPlanned';
    } else {
      return 'upcoming';
    }
  };

  // Generate weekly data
  const weeklyData = useMemo(() => {
    const days: Array<{ date: string; status: DayStatus }> = [];
    for (let i = 0; i < 7; i++) {
      const date = currentWeekStart.add(i, 'day');
      const dateKey = date.format('YYYY-MM-DD');
      days.push({
        date: dateKey,
        status: getDayStatus(dateKey),
      });
    }
    return days;
  }, [currentWeekStart, planByDate]);

  // Generate monthly data
  const monthlyData = useMemo(() => {
    const days: Array<{ date: string; status: DayStatus }> = [];
    const monthStart = today.startOf('month');
    const monthEnd = today.endOf('month');
    const daysInMonth = monthEnd.date();

    // Pad with days from previous month to align to week start
    const firstDayOfWeek = monthStart.isoWeekday();
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = monthStart.subtract(i, 'day');
      const dateKey = date.format('YYYY-MM-DD');
      days.push({
        date: dateKey,
        status: getDayStatus(dateKey),
      });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = monthStart.date(i);
      const dateKey = date.format('YYYY-MM-DD');
      days.push({
        date: dateKey,
        status: getDayStatus(dateKey),
      });
    }

    // Pad with days from next month to complete grid
    const lastDayOfWeek = monthEnd.isoWeekday();
    const daysToAdd = 7 - lastDayOfWeek;
    for (let i = 1; i <= daysToAdd; i++) {
      const date = monthEnd.add(i, 'day');
      const dateKey = date.format('YYYY-MM-DD');
      days.push({
        date: dateKey,
        status: getDayStatus(dateKey),
      });
    }

    return days;
  }, [today, planByDate]);

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
    if (!selectedDate) return;

    const planDay = planByDate.get(selectedDate);
    if (!planDay) {
      setIsDrawerVisible(false);
      return;
    }

    setIsDrawerVisible(false);
    // TODO: Verify route name matches navigation setup
    navigation.navigate('WorkoutOverview', { planDayId: planDay.id });
  };

  const getDotColor = (status: DayStatus, isToday: boolean): string => {
    if (isToday && status !== 'none' && status !== 'rest') {
      return theme.colors.acidGreen;
    }

    switch (status) {
      case 'todayPlanned':
        return theme.colors.acidGreen;
      case 'upcoming':
        return theme.colors.graphite;
      case 'pastPlanned':
        return theme.colors.steel;
      case 'rest':
        return 'transparent';
      case 'none':
        return 'transparent';
      default:
        return theme.colors.graphite;
    }
  };

  const getDotBorderColor = (status: DayStatus, isToday: boolean): string => {
    if (isToday && (status === 'todayPlanned' || status === 'upcoming')) {
      return theme.colors.acidGreen;
    }
    if (status === 'rest') {
      return theme.colors.steel;
    }
    return 'transparent';
  };

  const getDotFill = (status: DayStatus): boolean => {
    return (
      status === 'todayPlanned' ||
      status === 'upcoming' ||
      status === 'pastPlanned'
    );
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
            const dayData = weeklyData[index];
            const isToday = dayjs(dayData.date).isSame(today, 'day');
            const dotColor = getDotColor(dayData.status, isToday);
            const borderColor = getDotBorderColor(dayData.status, isToday);
            const isFilled = getDotFill(dayData.status);

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
                      backgroundColor: isFilled ? dotColor : 'transparent',
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: borderColor !== 'transparent' ? 2 : 0,
                      borderColor: borderColor,
                    },
                  ]}
                />
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
    for (let i = 0; i < monthlyData.length; i += 7) {
      weeks.push(monthlyData.slice(i, i + 7));
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
              const borderColor = getDotBorderColor(dayData.status, isToday);
              const isFilled = getDotFill(dayData.status);
              const isCurrentMonth =
                dayjs(dayData.date).month() === today.month();
              const dayNumber = dayjs(dayData.date).date();

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={styles.monthlyCell}
                  onPress={() => handleDayPress(dayData.date)}
                  activeOpacity={0.7}
                >
                  {isCurrentMonth && (
                    <Text
                      style={[
                        styles.monthlyDayNumber,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.fonts.body,
                          fontSize: theme.typography.sizes.bodySmall,
                          marginBottom: 4,
                        },
                      ]}
                    >
                      {dayNumber}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.monthlyDot,
                      {
                        backgroundColor:
                          isFilled && isCurrentMonth ? dotColor : 'transparent',
                        width: isCurrentMonth ? 20 : 16,
                        height: isCurrentMonth ? 20 : 16,
                        borderRadius: isCurrentMonth ? 10 : 8,
                        borderWidth:
                          borderColor !== 'transparent' && isCurrentMonth
                            ? 2
                            : 0,
                        borderColor: borderColor,
                        opacity: isCurrentMonth ? 1 : 0.3,
                      },
                    ]}
                  />
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
    const planDay = planByDate.get(selectedDate);

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

            {planDay ? (
              <>
                {/* Focus Tags */}
                {planDay.focusTags.length > 0 && (
                  <View
                    style={[
                      styles.focusTagsContainer,
                      { marginBottom: theme.spacing.md },
                    ]}
                  >
                    {planDay.focusTags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        variant="accent"
                        size="small"
                        style={{ marginRight: theme.spacing.xs }}
                      />
                    ))}
                  </View>
                )}

                {/* Duration */}
                <Text
                  style={[
                    styles.drawerSession,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  {planDay.estimatedDurationMinutes} min
                </Text>

                {/* Blocks List */}
                {planDay.blocks.length > 0 ? (
                  <>
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
                      Blocks
                    </Text>
                    <View
                      style={[
                        styles.blocksList,
                        { marginBottom: theme.spacing.lg },
                      ]}
                    >
                      {planDay.blocks.map((block, index) => (
                        <Text
                          key={block.id}
                          style={[
                            styles.blockItem,
                            {
                              color: theme.colors.white,
                              fontFamily: theme.typography.fonts.body,
                              fontSize: theme.typography.sizes.bodySmall,
                              marginBottom:
                                index < planDay.blocks.length - 1
                                  ? theme.spacing.sm
                                  : 0,
                            },
                          ]}
                        >
                          • {block.title}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color: theme.colors.muted,
                        fontFamily: theme.typography.fonts.body,
                        fontSize: theme.typography.sizes.body,
                        marginBottom: theme.spacing.lg,
                      },
                    ]}
                  >
                    Rest day — no workout planned.
                  </Text>
                )}

                {/* View Full Workout Button */}
                {planDay.blocks.length > 0 && (
                  <PraxisButton
                    title="View Full Workout"
                    onPress={handleViewFullWorkout}
                    size="large"
                  />
                )}
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.fonts.body,
                      fontSize: theme.typography.sizes.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  No workout planned.
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Empty plan state
  if (plan.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.black }]}
        edges={['top', 'bottom']}
      >
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
                fontFamily: theme.typography.fonts.headingLarge,
                fontSize: theme.typography.sizes.h1,
              },
            ]}
          >
            Calendar
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <View
          style={[
            styles.emptyContainer,
            {
              padding: theme.spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.white,
                fontFamily: theme.typography.fonts.heading,
                fontSize: theme.typography.sizes.h2,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            No active training plan.
          </Text>
          <PraxisButton
            title="Generate Plan"
            onPress={() => navigation.navigate('OnboardingComplete')}
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

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
              fontFamily: theme.typography.fonts.headingLarge,
              fontSize: theme.typography.sizes.h1,
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
                width: 80,
                textAlign: 'right',
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
    fontWeight: '700',
  },
  toggleButton: {
    fontWeight: '500',
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
  monthlyDayNumber: {
    fontWeight: '400',
  },
  monthlyDot: {
    alignItems: 'center',
    justifyContent: 'center',
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
  focusTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  blocksList: {
    // marginBottom set inline
  },
  blockItem: {
    lineHeight: 22,
  },
  emptyText: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

// TODO: integrate completed session history to show "completed" vs "missed" vs "upcoming".
// TODO: support swipe or navigation between weeks/months.
// TODO: add legends for dot colors.
