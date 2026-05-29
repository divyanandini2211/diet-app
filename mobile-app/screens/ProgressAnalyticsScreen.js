
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import axios from 'axios';

import { BarChart } from 'react-native-gifted-charts';

import { Picker } from '@react-native-picker/picker';

export default function ProgressAnalyticsScreen({
  patient
}) {

  const [progressData, setProgressData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('protein');
  const [selectedDuration, setSelectedDuration] = useState('weekly');
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {

    try {

      setLoadingProgress(true);

      const res = await axios.get(
        `${API_URL}/api/dietitian/patient/${patient._id}/progress`
      );

      setProgressData(res.data);

    } catch (error) {

      console.log(
        'Progress Fetch Error:',
        error
      );

    } finally {

      setLoadingProgress(false);
    }
  };

  const getWeeklyChartData = () => {

    const dates = Object.keys(progressData)
      .sort()
      .slice(selectedDuration === 'weekly' ? -7 : -30);

    return dates.map(date => {

      const metricData =
        progressData[date]?.[selectedMetric];

      return {

        value: Math.min(
          metricData?.actualPercentage || 0,
          100
        ),

        label:
          `${date.slice(8,10)}/${date.slice(5,7)}`,

        actualPercentage:
          metricData?.actualPercentage || 0,

        date
      };
    });
  };

  return (

    <View style={styles.contentPad}>

      <Text style={styles.sectionTitle}>
        📈 Progress Analytics
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 20
        }}
      >

        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderColor: '#2F6FED',
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#FFF'
          }}
        >

          <Picker
            selectedValue={selectedDuration}
            onValueChange={(itemValue) =>
              setSelectedDuration(itemValue)
            }
          >
            <Picker.Item
              label="Weekly"
              value="weekly"
            />

            <Picker.Item
              label="Monthly"
              value="monthly"
            />
          </Picker>

        </View>

        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderColor: '#2F6FED',
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#FFF'
          }}
        >

          <Picker
            selectedValue={selectedMetric}
            onValueChange={(itemValue) =>
              setSelectedMetric(itemValue)
            }
          >
            <Picker.Item
              label="Calories"
              value="calories"
            />

            <Picker.Item
              label="Protein"
              value="protein"
            />

            <Picker.Item
              label="Carbs"
              value="carbs"
            />

            <Picker.Item
              label="Fat"
              value="fat"
            />

            <Picker.Item
              label="Fiber"
              value="fiber"
            />
          </Picker>

        </View>

      </View>

      {loadingProgress ? (

        <ActivityIndicator
          size="large"
          color="#005BB5"
        />

      ) : (

        <View style={styles.chartCard}>

          <BarChart
            key={
              selectedMetric +
              selectedDuration
            }
            data={getWeeklyChartData()}
            barWidth={22}
            spacing={26}
            height={220}
            disableScroll
            initialSpacing={30}
            endSpacing={30}
            noOfSections={5}
            stepValue={20}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{
              color: '#94A3B8',
              fontSize: 10
            }}
            xAxisLabelTextStyle={{
              color: '#64748B',
              fontSize: 10
            }}
            maxValue={100}
            frontColor="#159A8C"
            barBorderTopLeftRadius={7}
            barBorderTopRightRadius={7}
            isAnimated

            onPress={(item, index) => {

              setSelectedPoint(item);

              setTooltipPos({
                x: 20 + (index * 48),
                y: 15
              });

              clearTimeout(global.tooltipTimer);

              global.tooltipTimer =
                setTimeout(() => {

                  setSelectedPoint(null);

                }, 1800);
            }}
          />

          {selectedPoint && (

            <View
              style={[
                styles.floatingTooltip,
                {
                  left: tooltipPos.x,
                  top: tooltipPos.y
                }
              ]}
            >

              <Text
                style={
                  styles.floatingTooltipDate
                }
              >
                {selectedPoint.date}
              </Text>

              <Text
                style={
                  styles.floatingTooltipPercent
                }
              >
                {selectedPoint.actualPercentage}%
              </Text>

            </View>
          )}

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  contentPad: {
    padding: 20,
    paddingBottom: 40
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003366',
    marginBottom: 12,
    marginTop: 15
  },

  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  floatingTooltip: {
    position: 'absolute',
    backgroundColor: '#081028',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
  },

  floatingTooltipDate: {
    color: '#CBD5E1',
    fontSize: 10,
    marginBottom: 2,
  },

  floatingTooltipPercent: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  }

});

