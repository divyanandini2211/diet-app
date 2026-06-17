import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from 'react-native-circular-progress-indicator';
import { Animated, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { BarChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';

export default function ProgressAnalyticsScreen({ patient }) {
  const [progressData, setProgressData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('protein');
  const [selectedDuration, setSelectedDuration] = useState('daily');
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState(null);
  const [heatmapTooltipPos, setHeatmapTooltipPos] = useState({ x: 0, y: 0 });

  const proteinAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;
  const fiberAnim = useRef(new Animated.Value(0)).current;
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoadingProgress(true);
      const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/progress`);
      setProgressData(res.data);
      const todayData = res.data?.today;

      if (todayData) {
        Animated.timing(proteinAnim, { toValue: Math.min(todayData.protein?.actualPercentage || 0, 100), duration: 600, useNativeDriver: false }).start();
        Animated.timing(carbsAnim, { toValue: Math.min(todayData.carbs?.actualPercentage || 0, 100), duration: 600, useNativeDriver: false }).start();
        Animated.timing(fatAnim, { toValue: Math.min(todayData.fat?.actualPercentage || 0, 100), duration: 600, useNativeDriver: false }).start();
        Animated.timing(fiberAnim, { toValue: Math.min(todayData.fiber?.actualPercentage || 0, 100), duration: 600, useNativeDriver: false }).start();
      }
    } catch (error) {
      console.log('Progress Fetch Error:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const getWeeklyChartData = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const formattedDate = d.toISOString().split('T')[0];
      dates.push(formattedDate);
    }

    return dates.map(date => {
      const metricData = progressData[date]?.[selectedMetric];
      return {
        value: Math.min(metricData?.actualPercentage || 0, 100),
        label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        actualPercentage: metricData?.actualPercentage || 0,
        date
      };
    });
  };
  
  const getHeatmapData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const heatmap = [];

    for (let i = 0; i < firstDay; i++) {
      heatmap.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const metricData = progressData[formattedDate]?.[selectedMetric];
      heatmap.push({
        empty: false,
        day,
        date: formattedDate,
        actualPercentage: metricData?.actualPercentage ?? null
      });
    }
    return heatmap;
  };

  const getHeatmapColor = (percentage) => {
    if (percentage === null || percentage === undefined) return '#F3F4F6';
    if (percentage < 40) return '#F87171';
    if (percentage < 70) return '#FBBF24';
    if (percentage < 90) return '#4ADE80';
    return '#16A34A';
  };

  const getAdherenceStatus = (value) => {
    if (value === null || value === undefined) return 'No data';
    if (value < 50) return 'Poor adherence';
    if (value < 70) return 'Fair adherence';
    if (value < 90) return 'Good adherence';
    return 'Excellent adherence';
  };

  const formatHeatmapDate = (dateStr) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]} ${months[parseInt(parts[1]) - 1]}`;
  };

  return (
    <View style={styles.contentPad}>
      <Text style={styles.sectionTitle}>📈 Progress Analytics</Text>

      {/* DROPDOWNS WITH THE FINAL COLOR FIXES */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1, borderWidth: 2, borderColor: '#2F6FED', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <Picker
            selectedValue={selectedDuration}
            onValueChange={(itemValue) => setSelectedDuration(itemValue)}
            style={{ color: '#000000' }} // Force text black
            dropdownIconColor="#000000" // Force arrow black
          >
            <Picker.Item label="Daily" value="daily" color="#000000" />
            <Picker.Item label="Weekly" value="weekly" color="#000000" />
            <Picker.Item label="Monthly" value="monthly" color="#000000" />
          </Picker>
        </View>

        <View style={{ flex: 1, borderWidth: 2, borderColor: '#2F6FED', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <Picker
            selectedValue={selectedMetric}
            onValueChange={(itemValue) => setSelectedMetric(itemValue)}
            style={{ color: '#000000' }} // Force text black
            dropdownIconColor="#000000" // Force arrow black
          >
            <Picker.Item label="Calories" value="calories" color="#000000" />
            <Picker.Item label="Protein" value="protein" color="#000000" />
            <Picker.Item label="Carbs" value="carbs" color="#000000" />
            <Picker.Item label="Fat" value="fat" color="#000000" />
            <Picker.Item label="Fiber" value="fiber" color="#000000" />
          </Picker>
        </View>
      </View>

      {loadingProgress ? (
        <ActivityIndicator size="large" color="#005BB5" />
      ) : (
        <View style={styles.chartCard}>
          {selectedDuration === 'daily' && (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>📈 Daily Progress</Text>
              <View style={styles.calorieRow}>
                <View style={styles.circularProgressContainer}>
                  <CircularProgress
                    value={Math.round(progressData?.today?.calories?.actual || 0)}
                    radius={55}
                    maxValue={progressData?.today?.calories?.target || 1500}
                    activeStrokeColor={'#005BB5'}
                    inActiveStrokeColor={'#E0E0E0'}
                    activeStrokeWidth={10}
                    inActiveStrokeWidth={10}
                    showProgressValue={false}
                    title={"CALORIES"}
                    titleColor={'#666'}
                    titleStyle={{ fontWeight: '700', fontSize: 12 }}
                  />
                </View>
                <View style={styles.calorieTextColumn}>
                  <Text style={styles.calorieCount}>{Math.round(progressData?.today?.calories?.actual || 0)}</Text>
                  <Text style={styles.calorieTarget}>/ {progressData?.today?.calories?.target || 0}</Text>
                  <Text style={styles.calorieUnit}>KCAL</Text>
                </View>
              </View>

              <View style={styles.macroBarContainer}>
                {[
                  { key: 'protein', anim: proteinAnim },
                  { key: 'carbs', anim: carbsAnim },
                  { key: 'fat', anim: fatAnim },
                  { key: 'fiber', anim: fiberAnim }
                ].map((item) => {
                  const metricData = progressData?.today?.[item.key];
                  return (
                    <View key={item.key} style={styles.macroBarRow}>
                      <Text style={styles.macroBarLabel}>{item.key.charAt(0).toUpperCase() + item.key.slice(1)}</Text>
                      <View style={styles.barBackground}>
                        <Animated.View
                          style={[
                            styles.barFill,
                            {
                              width: item.anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                              backgroundColor: item.key === 'fat' && (metricData?.actual || 0) > (metricData?.target || 0) ? '#D32F2F' : '#005BB5'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.macroBarValue}>{metricData?.actual || 0}g / {metricData?.target || 0}g</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {selectedDuration === 'weekly' && (
            <BarChart
              key={selectedMetric + selectedDuration}
              data={getWeeklyChartData()}
              barWidth={24}
              spacing={18}
              height={220}
              initialSpacing={0}
              endSpacing={0}
              disableScroll={true}
              noOfSections={5}
              stepValue={20}
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
              maxValue={100}
              frontColor="#159A8C"
              barBorderTopLeftRadius={7}
              barBorderTopRightRadius={7}
              isAnimated
              onPress={(item, index) => {
                setSelectedPoint(item);
                setTooltipPos({ x: Math.max(10, index * 42), y: 15 });
                clearTimeout(global.tooltipTimer);
                global.tooltipTimer = setTimeout(() => setSelectedPoint(null), 1800);
              }}
            />
          )}

          {selectedPoint && (
            <View style={[styles.floatingTooltip, { left: tooltipPos.x, top: tooltipPos.y }]}>
              <Text style={styles.floatingTooltipDate}>{selectedPoint.date}</Text>
              <Text style={styles.floatingTooltipPercent}>{selectedPoint.actualPercentage}%</Text>
            </View>
          )}

          {selectedDuration === 'monthly' && (
            <View style={styles.heatmapCard}>
              <Text style={styles.heatmapTitle}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <View style={styles.heatmapGridContainer}>
                <View style={styles.weekHeader}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={index} style={styles.weekDay}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {getHeatmapData().map((item, index) => {
                    if (item.empty) return <View key={index} style={styles.emptyCalendarCell} />;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        style={[
                          styles.calendarCell,
                          item.day === new Date().getDate() && { borderWidth: 2, borderColor: '#2563EB' },
                          { backgroundColor: getHeatmapColor(item.actualPercentage) }
                        ]}
                        onPress={() => {
                          setSelectedHeatmapPoint(item);
                          const col = index % 7;
                          const row = Math.floor(index / 7);
                          const tooltipX = col * 44;
                          setHeatmapTooltipPos({ x: tooltipX > 180 ? tooltipX - 120 : tooltipX, y: row * 46 });
                          clearTimeout(global.heatmapTooltipTimer);
                          global.heatmapTooltipTimer = setTimeout(() => setSelectedHeatmapPoint(null), 2500);
                        }}
                      >
                        <Text style={[styles.calendarDate, item.actualPercentage !== null && { color: '#FFF' }]}>{item.day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedHeatmapPoint && (
                  <View style={[styles.heatmapTooltip, { left: heatmapTooltipPos.x, top: heatmapTooltipPos.y - 75 }]}>
                    <Text style={styles.heatmapTooltipDate}>{formatHeatmapDate(selectedHeatmapPoint.date)}</Text>
                    <Text style={styles.heatmapTooltipMetric}>{selectedMetric.charAt(0).toUpperCase()}{selectedMetric.slice(1)}: {selectedHeatmapPoint.actualPercentage ?? 0}%</Text>
                    <Text style={styles.heatmapTooltipStatus}>{getAdherenceStatus(selectedHeatmapPoint.actualPercentage)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentPad: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#003366', marginBottom: 12, marginTop: 15 },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  floatingTooltip: { position: 'absolute', backgroundColor: '#081028', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center', zIndex: 999 },
  floatingTooltipDate: { color: '#CBD5E1', fontSize: 10, marginBottom: 2 },
  floatingTooltipPercent: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  heatmapCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E5E5E5', marginTop: 16 },
  heatmapTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 16 },
  heatmapGridContainer: { position: 'relative' },
  weekHeader: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  weekDay: { width: '14.28%', textAlign: 'center', fontWeight: '700', fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '13%', aspectRatio: 1, borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginHorizontal: '0.6%' },
  emptyCalendarCell: { width: '13%', aspectRatio: 1, marginHorizontal: '0.6%' },
  calendarDate: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  heatmapTooltip: { position: 'absolute', backgroundColor: '#081028', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, zIndex: 999, minWidth: 140 },
  heatmapTooltipDate: { color: '#CBD5E1', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  heatmapTooltipMetric: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  heatmapTooltipStatus: { color: '#159A8C', fontSize: 11, fontWeight: '600' },
  progressCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, elevation: 3, marginBottom: 30 },
  progressTitle: { color: '#003366', fontWeight: '800', fontSize: 16, marginBottom: 20 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  circularProgressContainer: { alignItems: 'center', justifyContent: 'center' },
  calorieTextColumn: { alignItems: 'flex-end' },
  calorieCount: { fontSize: 32, fontWeight: '800' },
  calorieTarget: { fontSize: 16, fontWeight: '600', color: '#666' },
  calorieUnit: { fontSize: 11, fontWeight: '700', color: '#999', marginTop: 4 },
  macroBarContainer: { gap: 14 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroBarLabel: { width: 60, fontWeight: '600', color: '#333', fontSize: 13 },
  barBackground: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  macroBarValue: { minWidth: 85, textAlign: 'right', fontWeight: '700', fontSize: 12 }
});