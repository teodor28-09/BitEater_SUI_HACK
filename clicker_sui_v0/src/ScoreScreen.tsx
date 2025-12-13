import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";

interface ScoreScreenProps {
  score: number;
  totalPoints: number;
  onRestart: () => void;
}

interface SavedScore {
  totalScore: number; // Accumulated total score in seconds
  lastScore: number; // Last quiz score in seconds
  date: string;
}

export function ScoreScreen({ score, totalPoints, onRestart }: ScoreScreenProps) {
  const currentAccount = useCurrentAccount();
  const [savedScore, setSavedScore] = useState<SavedScore | null>(null);

  // Get storage key based on wallet address
  const getStorageKey = (address: string | undefined) => {
    if (!address) return null;
    return `kahoot-quiz-score-${address}`;
  };

  // Load saved score to display - reload when score changes or wallet changes
  useEffect(() => {
    const storageKey = getStorageKey(currentAccount?.address);
    if (!storageKey) {
      setSavedScore(null);
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSavedScore(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved score", e);
      }
    } else {
      setSavedScore(null);
    }
  }, [score, totalPoints, currentAccount?.address]);

  const getScoreMessage = () => {
    // Score is in seconds, so we can use it directly for messages
    if (score >= 400) return "Perfect!";
    if (score >= 300) return "Excellent!";
    if (score >= 200) return "Good job!";
    if (score >= 100) return "Not bad!";
    return "Keep practicing!";
  };

  const getScoreColor = () => {
    if (score >= 400) return "green";
    if (score >= 300) return "blue";
    if (score >= 200) return "yellow";
    return "red";
  };

  return (
    <Container size="3" py="6">
      <Card size="3" style={{ minHeight: 400 }}>
        <Box p="8" style={{ textAlign: "center" }}>
          <Heading size="9" mb="4">
            Quiz Complete! 🎯
          </Heading>

          <Box my="8">
            <Text size="8" weight="bold" color={getScoreColor()}>
              {score} seconds
            </Text>
            <Box mt="2">
              <Text size="5" weight="medium" color="gray">
                Earned This Quiz ⏱️
              </Text>
            </Box>
          </Box>

          <Box mb="6">
            <Text size="5" weight="medium">
              {getScoreMessage()}
            </Text>
          </Box>

          {savedScore && (
            <Box mb="6" p="5" style={{ 
              background: "var(--gray-a3)", 
              borderRadius: "12px",
              border: "2px solid var(--gray-a5)"
            }}>
              <Text size="4" weight="bold" mb="3" style={{ display: "block" }}>
                📊 Your Quiz Score
              </Text>
              <Flex direction="column" gap="3" align="center">
                <Box>
                  <Text size="3" color="gray" mb="1" style={{ display: "block" }}>
                    Total Accumulated:
                  </Text>
                  <Text size="6" weight="bold" color="blue">
                    {savedScore.totalScore} seconds
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray" mt="2">
                    ✨ Added {score} seconds from this quiz
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}

          <Flex justify="center" gap="3">
            <Button size="4" onClick={onRestart} style={{ minWidth: 200 }}>
              Play Again 🎮
            </Button>
          </Flex>
        </Box>
      </Card>
    </Container>
  );
}

