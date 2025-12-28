#!/usr/bin/env node

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import { Timer } from './timer.ts';

// Format time as MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Progress bar component
const ProgressBar = ({ progress, width = 30 }) => {
  const filled = Math.round(progress * width);
  const empty = width - filled;
  const bar = chalk.blue('━'.repeat(filled)) + chalk.gray('━'.repeat(empty));
  return <Text>{bar}</Text>;
};

// Preset button component
const Preset = ({ minutes, isActive, onSelect }) => {
  const style = isActive ? chalk.blue.bold : chalk.gray;
  return <Text>{style(`[${minutes}m]`)}</Text>;
};

// Main App component
const App = () => {
  const { exit } = useApp();

  // State
  const [activity, setActivity] = useState('');
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Presets
  const presets = [5, 15, 25, 45, 60];

  // Initialize timer
  useEffect(() => {
    const t = new Timer({
      duration: duration,
      activity: activity || 'Focus',
      onTick: (r) => setRemaining(r),
      onComplete: (entry) => {
        setIsRunning(false);
        setHistory(prev => [entry, ...prev].slice(0, 20));
        // Bell sound (cross-platform)
        process.stdout.write('\x07');
      },
      onStop: (entry) => {
        setHistory(prev => [entry, ...prev].slice(0, 20));
      }
    });
    setTimer(t);

    return () => {
      if (t.intervalId) clearInterval(t.intervalId);
    };
  }, []);

  // Update timer when duration changes
  useEffect(() => {
    if (timer && !isRunning) {
      timer.setDuration(duration);
      timer.remaining = duration;
      setRemaining(duration);
    }
  }, [duration, timer, isRunning]);

  // Update timer activity
  useEffect(() => {
    if (timer) {
      timer.setActivity(activity || 'Focus');
    }
  }, [activity, timer]);

  // Handle keyboard input
  useInput((input, key) => {
    if (isEditingActivity) {
      if (key.return) {
        setIsEditingActivity(false);
      }
      return;
    }

    // Quit
    if (input === 'q' || (key.ctrl && input === 'c')) {
      if (timer && timer.isRunning) {
        timer.stop();
      }
      exit();
      return;
    }

    // Start/Stop toggle
    if (input === 's' || input === ' ') {
      if (timer) {
        if (timer.isRunning) {
          timer.stop();
          setIsRunning(false);
        } else {
          timer.remaining = remaining;
          timer.start();
          setIsRunning(true);
        }
      }
      return;
    }

    // Reset
    if (input === 'r' && !isRunning) {
      if (timer) {
        timer.reset();
        setRemaining(duration);
      }
      return;
    }

    // Edit activity
    if (input === 'a' && !isRunning) {
      setIsEditingActivity(true);
      return;
    }

    // Toggle history
    if (input === 'h') {
      setShowHistory(prev => !prev);
      return;
    }

    // Preset selection (1-5)
    const presetIndex = parseInt(input) - 1;
    if (presetIndex >= 0 && presetIndex < presets.length && !isRunning) {
      const mins = presets[presetIndex];
      setSelectedPreset(mins);
      setDuration(mins * 60);
      setRemaining(mins * 60);
    }
  });

  const progress = remaining / duration;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="blue">Focus Timer</Text>
      </Box>

      {/* Activity */}
      <Box justifyContent="center" marginBottom={1}>
        {isEditingActivity ? (
          <Box>
            <Text color="gray">Activity: </Text>
            <TextInput
              value={activity}
              onChange={setActivity}
              onSubmit={() => setIsEditingActivity(false)}
              placeholder="What are you focusing on?"
            />
          </Box>
        ) : (
          <Text color="gray" italic>
            {activity || 'What are you focusing on?'}
          </Text>
        )}
      </Box>

      {/* Timer Display */}
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={isRunning ? 'green' : 'white'}>
          {formatTime(remaining)}
        </Text>
      </Box>

      {/* Progress Bar */}
      <Box justifyContent="center" marginBottom={1}>
        <ProgressBar progress={progress} width={30} />
      </Box>

      {/* Presets */}
      {!isRunning && (
        <Box justifyContent="center" marginBottom={1} gap={1}>
          {presets.map((mins, i) => (
            <Text key={mins}>
              <Text color={selectedPreset === mins ? 'blue' : 'gray'}>
                {selectedPreset === mins ? '[' : ' '}
                {i + 1}:{mins}m
                {selectedPreset === mins ? ']' : ' '}
              </Text>
            </Text>
          ))}
        </Box>
      )}

      {/* Controls */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="gray">
          {isRunning ? (
            <Text>[s]top  [q]uit</Text>
          ) : (
            <Text>[s]tart  [a]ctivity  [r]eset  [h]istory  [q]uit</Text>
          )}
        </Text>
      </Box>

      {/* History */}
      {showHistory && (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1} marginTop={1}>
          <Text bold marginBottom={1}>History</Text>
          {history.length === 0 ? (
            <Text color="gray">No sessions yet</Text>
          ) : (
            history.slice(0, 5).map((entry, i) => (
              <Text key={i} color="gray">
                {entry.completed ? '✓' : '○'} {entry.activity} - {formatTime(entry.elapsed)}
              </Text>
            ))
          )}
        </Box>
      )}

      {/* Status */}
      {isRunning && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="green">● Running</Text>
        </Box>
      )}
    </Box>
  );
};

// Render the app
render(<App />);
