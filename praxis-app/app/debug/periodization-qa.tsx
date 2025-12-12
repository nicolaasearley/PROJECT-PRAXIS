import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@theme';
import { PraxisButton, Spacer } from '@components';
import { runAllPeriodizationScenarios, QAScenarioResult } from '@/utils/periodization/qaScenarios';

export default function PeriodizationQAScreen() {
  const theme = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<QAScenarioResult[] | null>(null);
  const [fullOutput, setFullOutput] = useState<string>('');

  /**
   * Format all scenario results into a single text output
   */
  const formatFullOutput = (scenarioResults: QAScenarioResult[]): string => {
    const output: string[] = [];
    
    output.push('╔══════════════════════════════════════════════════════════════════════════════╗');
    output.push('║                    PERIODIZATION ENGINE QA SIMULATION                       ║');
    output.push('║                         Diagnostic Test Suite                               ║');
    output.push('╚══════════════════════════════════════════════════════════════════════════════╝');
    output.push('');
    output.push(`Generated: ${new Date().toISOString()}`);
    output.push('');

    scenarioResults.forEach((result) => {
      output.push('═'.repeat(80));
      output.push(`SCENARIO ${result.id} — ${result.title}`);
      output.push('═'.repeat(80));
      output.push(`Description: ${result.description}`);
      output.push('');

      if (result.warnings.length > 0) {
        output.push('Warnings:');
        result.warnings.forEach((warning) => {
          output.push(`  - ${warning}`);
        });
        output.push('');
      }

      if (result.errors.length > 0) {
        output.push('Errors:');
        result.errors.forEach((error) => {
          output.push(`  - ${error}`);
        });
        output.push('');
      }

      if (result.logs.length > 0) {
        output.push('Logs:');
        result.logs.forEach((log) => {
          output.push(`  ${log}`);
        });
        output.push('');
      }
    });

    // Summary
    output.push('═'.repeat(80));
    output.push('QA SUMMARY');
    output.push('═'.repeat(80));
    output.push(`Total Scenarios: ${scenarioResults.length}`);
    output.push(`Scenarios with Errors: ${scenarioResults.filter((r) => r.errors.length > 0).length}`);
    output.push(`Scenarios with Warnings: ${scenarioResults.filter((r) => r.warnings.length > 0).length}`);
    output.push('═'.repeat(80));

    return output.join('\n');
  };

  const handleRunScenarios = async () => {
    setIsRunning(true);
    setResults(null);
    setFullOutput('');

    try {
      const scenarioResults = await runAllPeriodizationScenarios();
      setResults(scenarioResults);
      
      // Generate full output string
      const output = formatFullOutput(scenarioResults);
      setFullOutput(output);
      
      // Print to Metro terminal
      console.log('===== PERIODIZATION QA OUTPUT =====');
      console.log(output);
    } catch (error: any) {
      console.error('Error running scenarios:', error);
      const errorResult: QAScenarioResult = {
        id: 'ERROR',
        title: 'Execution Error',
        description: 'Failed to run scenarios',
        logs: [],
        warnings: [],
        errors: [`Failed to run scenarios: ${error.message}`],
      };
      setResults([errorResult]);
      const output = formatFullOutput([errorResult]);
      setFullOutput(output);
      console.log('===== PERIODIZATION QA OUTPUT =====');
      console.log(output);
    } finally {
      setIsRunning(false);
    }
  };

  const renderScenarioResult = (result: QAScenarioResult) => {
    const hasWarnings = result.warnings.length > 0;
    const hasErrors = result.errors.length > 0;

    return (
      <View key={result.id} style={styles.scenarioContainer}>
        <Text
          style={[
            styles.scenarioHeader,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.headingMedium,
            },
          ]}
        >
          === Scenario {result.id}: {result.title} ===
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.body,
            },
          ]}
        >
          {result.description}
        </Text>

        {hasWarnings && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.warning || theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                },
              ]}
            >
              Warnings:
            </Text>
            {result.warnings.map((warning, idx) => (
              <Text
                key={idx}
                style={[
                  styles.listItem,
                  {
                    color: theme.colors.warning || theme.colors.textMuted,
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                - {warning}
              </Text>
            ))}
          </View>
        )}

        {hasErrors && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.error || '#ff4444',
                  fontFamily: theme.typography.fonts.bodyMedium,
                },
              ]}
            >
              Errors:
            </Text>
            {result.errors.map((error, idx) => (
              <Text
                key={idx}
                style={[
                  styles.listItem,
                  {
                    color: theme.colors.error || '#ff4444',
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                - {error}
              </Text>
            ))}
          </View>
        )}

        {result.logs.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fonts.bodyMedium,
                },
              ]}
            >
              Logs:
            </Text>
            {result.logs.map((log, idx) => (
              <Text
                key={idx}
                style={[
                  styles.logLine,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.monospace || theme.typography.fonts.body,
                  },
                ]}
              >
                {log}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={true}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fonts.heading,
              fontSize: theme.typography.sizes.h1,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          Periodization QA Console
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.body,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          Developer-only diagnostic tool for testing the periodization engine.
        </Text>

        <PraxisButton
          title={isRunning ? 'Running scenarios...' : 'Run All Scenarios'}
          onPress={handleRunScenarios}
          disabled={isRunning}
          variant="primary"
        />

        {fullOutput && (
          <>
            <Spacer size="md" />
            <PraxisButton
              title="Copy Output"
              variant="outline"
              onPress={async () => {
                await Clipboard.setStringAsync(fullOutput);
                Alert.alert('Copied', 'QA output copied to clipboard.');
              }}
            />
            <Spacer size="md" />
            <PraxisButton
              title="Save Output to File"
              variant="outline"
              onPress={async () => {
                try {
                  const path = FileSystem.documentDirectory + `periodization_qa_${Date.now()}.txt`;
                  await FileSystem.writeAsStringAsync(path, fullOutput);
                  Alert.alert('Saved', `File saved to:\n${path}`);
                } catch (err) {
                  console.error('File save error:', err);
                  Alert.alert('Error', 'Unable to save the output file.');
                }
              }}
            />
          </>
        )}

        {isRunning && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Spacer size="md" />
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fonts.body,
                },
              ]}
            >
              Running scenarios...
            </Text>
          </View>
        )}

        {results && (
          <>
            <Spacer size="xl" />
            <View
              style={[
                styles.resultsHeader,
                {
                  borderBottomColor: theme.colors.border || theme.colors.textMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultsTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.headingMedium,
                    fontSize: theme.typography.sizes.h3,
                  },
                ]}
              >
                Results
              </Text>
              <Text
                style={[
                  styles.resultsSummary,
                  {
                    color: theme.colors.textMuted,
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                {results.length} scenario(s) completed
              </Text>
            </View>

            <Spacer size="lg" />

            {results.map((result) => renderScenarioResult(result))}

            <Spacer size="xl" />

            {/* Summary */}
            <View
              style={[
                styles.summaryContainer,
                {
                  backgroundColor: theme.colors.surface2,
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.headingMedium,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                QA Summary
              </Text>

              <Text
                style={[
                  styles.summaryText,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                Total Scenarios: {results.length}
              </Text>
              <Text
                style={[
                  styles.summaryText,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                Scenarios with Errors:{' '}
                {results.filter((r) => r.errors.length > 0).length}
              </Text>
              <Text
                style={[
                  styles.summaryText,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fonts.body,
                  },
                ]}
              >
                Scenarios with Warnings:{' '}
                {results.filter((r) => r.warnings.length > 0).length}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    fontWeight: '400',
  },
  resultsHeader: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 8,
  },
  resultsTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  resultsSummary: {
    fontWeight: '400',
  },
  scenarioContainer: {
    marginBottom: 32,
  },
  scenarioHeader: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    fontWeight: '400',
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 20,
  },
  logLine: {
    fontWeight: '400',
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 16,
  },
  summaryContainer: {
    marginTop: 16,
  },
  summaryTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  summaryText: {
    fontWeight: '400',
    marginBottom: 4,
  },
});
