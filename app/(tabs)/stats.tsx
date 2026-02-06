import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Session } from '@/types/storage';
import { getSessions } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

type FilterPeriod = 'day' | 'week' | 'month' | 'all';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  const [chartOffset, setChartOffset] = useState(0);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    todaySessions: 0,
    todayMinutes: 0,
    weekSessions: 0,
    weekMinutes: 0,
    averagePerDay: 0,
  });

  useEffect(() => {
    loadStats();
    setChartOffset(0); // Réinitialiser l'offset quand on change de filtre
  }, [filterPeriod]);

  const loadStats = async () => {
    const allSessions = await getSessions();
    setSessions(allSessions);

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    let startOfPeriod: Date;
    switch (filterPeriod) {
      case 'day':
        startOfPeriod = startOfToday;
        break;
      case 'week':
        startOfPeriod = new Date();
        startOfPeriod.setDate(startOfPeriod.getDate() - 7);
        break;
      case 'month':
        startOfPeriod = new Date();
        startOfPeriod.setDate(startOfPeriod.getDate() - 30);
        break;
      case 'all':
        startOfPeriod = new Date(0); // Depuis le début
        break;
    }

    const focusSessions = allSessions.filter(s => s.type === 'focus');
    const todaySessions = focusSessions.filter(s => s.completedAt >= startOfToday.getTime());
    const periodSessions = focusSessions.filter(s => s.completedAt >= startOfPeriod.getTime());

    const totalMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const periodMinutes = periodSessions.reduce((sum, s) => sum + s.duration, 0);
    
    const daysInPeriod = filterPeriod === 'day' ? 1 : 
                        filterPeriod === 'week' ? 7 : 
                        filterPeriod === 'month' ? 30 : 
                        Math.max(1, Math.ceil((now - (focusSessions[focusSessions.length - 1]?.completedAt || now)) / (1000 * 60 * 60 * 24)));

    setStats({
      totalSessions: focusSessions.length,
      totalMinutes,
      todaySessions: todaySessions.length,
      todayMinutes,
      weekSessions: periodSessions.length,
      weekMinutes: periodMinutes,
      averagePerDay: periodSessions.length > 0 ? Math.round(periodMinutes / daysInPeriod) : 0,
    });
  };

  const CircularProgress = ({ percentage, color, radius, strokeWidth }: any) => {
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <Circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
    );
  };

  const CircularStats = () => {
    const dailyGoal = 120; // 4 sessions * 30 minutes
    const weeklyGoal = 840; // 7 jours * 120 minutes
    const monthlyGoal = 3600; // 30 jours * 120 minutes

    const todayPercentage = Math.min((stats.todayMinutes / dailyGoal) * 100, 100);
    const weekPercentage = Math.min((stats.weekMinutes / weeklyGoal) * 100, 100);
    const totalPercentage = Math.min((stats.totalMinutes / monthlyGoal) * 100, 100);

    const size = 280;
    const center = size / 2;

    return (
      <View style={[styles.circularContainer, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
        <View style={styles.circularWrapper}>
          <Svg height={size} width={size}>
            {/* Cercle de fond extérieur */}
            <Circle
              stroke={colorScheme === 'dark' ? '#3a3a3a' : '#f0f0f0'}
              fill="transparent"
              strokeWidth={18}
              r={center - 25}
              cx={center}
              cy={center}
            />
            {/* Cercle de fond moyen */}
            <Circle
              stroke={colorScheme === 'dark' ? '#3a3a3a' : '#f0f0f0'}
              fill="transparent"
              strokeWidth={18}
              r={center - 55}
              cx={center}
              cy={center}
            />
            {/* Cercle de fond intérieur */}
            <Circle
              stroke={colorScheme === 'dark' ? '#3a3a3a' : '#f0f0f0'}
              fill="transparent"
              strokeWidth={18}
              r={center - 85}
              cx={center}
              cy={center}
            />
            
            {/* Progrès extérieur - Total */}
            <CircularProgress
              percentage={totalPercentage}
              color="#45B7D1"
              radius={center}
              strokeWidth={18}
            />
            {/* Progrès moyen - Semaine */}
            <CircularProgress
              percentage={weekPercentage}
              color="#4ECDC4"
              radius={center}
              strokeWidth={18}
            />
            {/* Progrès intérieur - Aujourd'hui */}
            <CircularProgress
              percentage={todayPercentage}
              color="#FF6B6B"
              radius={center}
              strokeWidth={18}
            />
          </Svg>
          
          {/* Centre avec statistique principale */}
          <View style={styles.circularCenter}>
            <Text style={[styles.centerValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {stats.todaySessions}
            </Text>
            <Text style={[styles.centerLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Sessions
            </Text>
            <Text style={[styles.centerSubLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Aujourd'hui
            </Text>
          </View>
        </View>

        {/* Légendes */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                🔥 Aujourd'hui
              </Text>
              <Text style={[styles.legendValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {stats.todayMinutes} / {dailyGoal} min
              </Text>
            </View>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                📊 {getPeriodLabel()}
              </Text>
              <Text style={[styles.legendValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {stats.weekMinutes} / {weeklyGoal} min
              </Text>
            </View>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#45B7D1' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                🏆 Total
              </Text>
              <Text style={[styles.legendValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {stats.totalSessions} sessions · {stats.totalMinutes} min
              </Text>
            </View>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA07A' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                ⚡ Moyenne
              </Text>
              <Text style={[styles.legendValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {stats.averagePerDay} min/jour
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getDailyData = () => {
    const allDataPoints = [];
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    let totalPeriods: number;
    
    switch (filterPeriod) {
      case 'day':
        totalPeriods = 24; // 24 heures
        break;
      case 'week':
        totalPeriods = 7;
        break;
      case 'month':
        totalPeriods = 30;
        break;
      case 'all':
        totalPeriods = 12; // 12 derniers mois
        break;
    }
    
    for (let i = 0; i < totalPeriods; i++) {
      let date: Date;
      let nextDate: Date;
      let label: string;
      
      if (filterPeriod === 'day') {
        // Heures de 0h à 23h du jour actuel (ou jour selon offset)
        const dayOffset = Math.floor(chartOffset * 6 / 24); // Chaque jour = 4 pages de 6h
        const hourOffset = (chartOffset * 6) % 24; // Heure de début dans le jour
        
        date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        date.setHours(i, 0, 0, 0);
        nextDate = new Date(date);
        nextDate.setHours(i + 1);
        label = `${i}h`;
      } else if (filterPeriod === 'week') {
        // 7 derniers jours - réorganiser pour commencer par lundi
        date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const dayIndex = date.getDay();
        // Convertir dimanche (0) en 6, et décaler les autres de -1
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        label = dayNames[adjustedIndex];
      } else if (filterPeriod === 'all') {
        // 12 derniers mois avec abréviations
        date = new Date(now);
        date.setMonth(date.getMonth() - (11 - i));
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        nextDate = new Date(date);
        nextDate.setMonth(date.getMonth() + 1);
        label = monthNames[date.getMonth()];
      } else {
        // Jours du mois
        date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);
        nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        label = date.getDate().toString();
      }
      
      const periodSessions = sessions.filter(
        s => s.type === 'focus' && 
        s.completedAt >= date.getTime() && 
        s.completedAt < nextDate.getTime()
      );
      
      const minutes = periodSessions.reduce((sum, s) => sum + s.duration, 0);
      
      allDataPoints.push({
        day: label,
        sessions: periodSessions.length,
        minutes,
      });
    }
    
    return allDataPoints;
  };

  const getVisibleData = () => {
    const allData = getDailyData();
    const itemsPerPage = 6;
    const start = chartOffset * itemsPerPage;
    const end = start + itemsPerPage;
    return allData.slice(start, end);
  };

  const getTotalPages = () => {
    const allData = getDailyData();
    return Math.ceil(allData.length / 6);
  };

  const canGoPrevious = () => chartOffset > 0;
  const canGoNext = () => chartOffset < getTotalPages() - 1;

  const dailyData = getVisibleData();
  const maxMinutes = Math.max(...dailyData.map(d => d.minutes), 1);

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'day': return "Aujourd'hui";
      case 'week': return '7 derniers jours';
      case 'month': return '30 derniers jours';
      case 'all': return 'Tout';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Statistiques
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Suivez votre productivité
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'day' && styles.filterButtonActive
          ]}
          onPress={() => setFilterPeriod('day')}>
          <Text style={[
            styles.filterButtonText,
            { color: filterPeriod === 'day' ? '#fff' : Colors[colorScheme ?? 'light'].text }
          ]}>
            📅 Jour
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'week' && styles.filterButtonActive
          ]}
          onPress={() => setFilterPeriod('week')}>
          <Text style={[
            styles.filterButtonText,
            { color: filterPeriod === 'week' ? '#fff' : Colors[colorScheme ?? 'light'].text }
          ]}>
            📆 Semaine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'month' && styles.filterButtonActive
          ]}
          onPress={() => setFilterPeriod('month')}>
          <Text style={[
            styles.filterButtonText,
            { color: filterPeriod === 'month' ? '#fff' : Colors[colorScheme ?? 'light'].text }
          ]}>
            🗓️ Mois
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilterPeriod('all')}>
          <Text style={[
            styles.filterButtonText,
            { color: filterPeriod === 'all' ? '#fff' : Colors[colorScheme ?? 'light'].text }
          ]}>
            🌍 Tout
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <CircularStats />

        <View style={[styles.chartContainer, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              📈 {getPeriodLabel()}
              {filterPeriod === 'day' && chartOffset > 0 && ` (-${Math.floor(chartOffset * 6 / 24)}j)`}
            </Text>
            <View style={styles.chartNavigation}>
              <TouchableOpacity
                style={[styles.navButton, !canGoPrevious() && styles.navButtonDisabled]}
                onPress={() => canGoPrevious() && setChartOffset(chartOffset - 1)}
                disabled={!canGoPrevious()}>
                <Text style={styles.navButtonText}>
                  ◀
                </Text>
              </TouchableOpacity>
              <View style={styles.pageIndicatorContainer}>
                <Text style={[styles.pageIndicator, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {chartOffset + 1} / {getTotalPages()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.navButton, !canGoNext() && styles.navButtonDisabled]}
                onPress={() => canGoNext() && setChartOffset(chartOffset + 1)}
                disabled={!canGoNext()}>
                <Text style={styles.navButtonText}>
                  ▶
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chart}>
            {dailyData.map((day, index) => {
              const heightPercentage = (day.minutes / maxMinutes) * 100;
              const barColor = day.minutes > 0 ? (heightPercentage > 70 ? '#4ECDC4' : heightPercentage > 40 ? '#45B7D1' : '#A8E6CF') : '#E0E0E0';
              return (
                <View key={index} style={styles.barContainer}>
                  <Text style={[styles.barValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {day.minutes > 0 ? `${day.minutes}m` : ''}
                  </Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(heightPercentage, 3)}%`,
                          backgroundColor: barColor,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.insights}>
          <Text style={[styles.insightsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            💡 Insights
          </Text>
          {stats.todaySessions === 0 && (
            <Text style={[styles.insightText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Commencez votre première session aujourd'hui !
            </Text>
          )}
          {stats.todaySessions > 0 && stats.todaySessions < 4 && (
            <Text style={[styles.insightText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Bon début ! Essayez de compléter 4+ sessions aujourd'hui.
            </Text>
          )}
          {stats.todaySessions >= 4 && (
            <Text style={[styles.insightText, { color: Colors[colorScheme ?? 'light'].text }]}>
              🔥 Incroyable ! Vous êtes en feu aujourd'hui !
            </Text>
          )}
          {stats.weekSessions >= 20 && (
            <Text style={[styles.insightText, { color: Colors[colorScheme ?? 'light'].text }]}>
              🏆 Semaine exceptionnelle ! Continuez comme ça !
            </Text>
          )}
        </View>
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
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  circularContainer: {
    marginBottom: 25,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  circularWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  circularCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
  },
  centerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  centerSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.5,
  },
  legendContainer: {
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chartNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  pageIndicatorContainer: {
    minWidth: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barWrapper: {
    width: '85%',
    height: 140,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
  },
  insights: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  insightsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  insightText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
    lineHeight: 20,
    fontWeight: '500',
  },
});
