import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme';
import { Spacer } from '@components';
import { WorkoutBlock } from '@core/types';
import WorkoutBlockPreview from './WorkoutBlockPreview';

// Type alias for compatibility with requirements
type TrainingBlock = WorkoutBlock;

interface WorkoutBlocksListProps {
  blocks: TrainingBlock[];
}

export default function WorkoutBlocksList({
  blocks,
}: WorkoutBlocksListProps) {
  const theme = useTheme();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <View key={block.id}>
          <WorkoutBlockPreview block={block} />
          {index < blocks.length - 1 && <Spacer size="lg" />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
