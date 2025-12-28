import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

const FRAMES = [
  // Frame 1
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 2
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║      █      ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 3
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║      █      ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 4
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║      █      ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 5
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║      █      ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 6
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄█▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 7
  `
   ╔═══════════════╗
   ║ ███████████ ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ █████████ ║
   ╚═══════════════╝
  `,
  // Frame 8
  `
   ╔═══════════════╗
   ║  ▀▀█████▀▀  ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `,
  // Frame 9 - Final
  `
   ╔═══════════════╗
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║  ▀▀▀▀▀▀▀▀▀  ║
   ║             ║
   ║             ║
   ║             ║
   ║             ║
   ║  ▄▄▄▄▄▄▄▄▄  ║
   ║ ███████████ ║
   ╚═══════════════╝
  `
];

interface AsciiAnimationProps {
  onComplete: () => void;
  duration?: number;
}

export const AsciiAnimation: React.FC<AsciiAnimationProps> = ({
  onComplete,
  duration = 2000
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const frameDelay = duration / FRAMES.length;
    const interval = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= FRAMES.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, frameDelay);
          return prev;
        }
        return prev + 1;
      });
    }, frameDelay);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={2}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {chalk.cyan(FRAMES[frameIndex])}
        </Text>
      </Box>
      <Box>
        <Text bold color="blue">
          FOCUS TIMER
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Preparing your productivity session...
        </Text>
      </Box>
    </Box>
  );
};
