// Phones: native date + time pickers. The browser version is start-time-picker.web.tsx.
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Chip } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export interface StartTimePickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

export function StartTimePicker({ value, onChange }: StartTimePickerProps) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Chip
          label={value.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          onPress={() => setShowDate(true)}
        />
        <Chip
          label={value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          onPress={() => setShowTime(true)}
        />
      </View>
      {(showDate || Platform.OS === 'ios') && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          minimumDate={new Date()}
          onChange={(_, d) => {
            setShowDate(false);
            if (d) {
              const next = new Date(value);
              next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              onChange(next);
            }
          }}
        />
      )}
      {(showTime || Platform.OS === 'ios') && (
        <DateTimePicker
          value={value}
          mode="time"
          minuteInterval={15}
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={(_, d) => {
            setShowTime(false);
            if (d) {
              const next = new Date(value);
              next.setHours(d.getHours(), d.getMinutes(), 0, 0);
              onChange(next);
            }
          }}
        />
      )}
    </>
  );
}
