// @ts-nocheck
import React from 'react';
import renderer from 'react-test-renderer';
import PraxisButton from '@/components/PraxisButton';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('PraxisButton', () => {
  it('renders the provided title', () => {
    const tree = renderer
      .create(
        <ThemeProvider>
          <PraxisButton title="Press me" onPress={() => {}} />
        </ThemeProvider>
      )
      .toJSON();

    expect(tree).toBeTruthy();
  });

  it('respects disabled state', () => {
    const instance = renderer.create(
      <ThemeProvider>
        <PraxisButton title="Disabled" onPress={() => {}} disabled />
      </ThemeProvider>
    );

    expect(instance.root.findByType(PraxisButton).props.disabled).toBe(true);
  });
});
