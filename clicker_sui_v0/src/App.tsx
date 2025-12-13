import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { Quiz } from "./Quiz";
import { ScoreScreen } from "./ScoreScreen";
import { ClickerGame } from "./ClickerGame";
import { WalletGate } from "./WalletGate";
import { quizQuestions } from "./quizData";

interface SavedScore {
  totalScore: number; // Accumulated total score in seconds
  lastScore: number; // Last quiz score in seconds
  date: string;
}

type AppMode = "home" | "quiz" | "clicker";

function App() {
  const currentAccount = useCurrentAccount();
  const [currentView, setCurrentView] = useState<AppMode>("home");
  const [quizComplete, setQuizComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [savedScore, setSavedScore] = useState<SavedScore | null>(null);
  const [availableClickerTime, setAvailableClickerTime] = useState(0);
  const [liveClickerTime, setLiveClickerTime] = useState(0); // Live time during game

  // Get storage key based on wallet address
  const getStorageKey = (address: string | undefined) => {
    if (!address) return null;
    return `kahoot-quiz-score-${address}`;
  };

  // Load saved score for current wallet
  useEffect(() => {
    const storageKey = getStorageKey(currentAccount?.address);
    if (!storageKey) {
      setSavedScore(null);
      setAvailableClickerTime(0);
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const scoreData = JSON.parse(saved);
        setSavedScore(scoreData);
        setAvailableClickerTime(scoreData.totalScore || 0);
      } catch (e) {
        console.error("Failed to load saved score", e);
        setSavedScore(null);
        setAvailableClickerTime(0);
      }
    } else {
      setSavedScore(null);
      setAvailableClickerTime(0);
    }
  }, [currentAccount?.address, quizComplete]); // Reload when wallet changes or quiz completes

  const handleGoHome = () => {
    setCurrentView("home");
    setQuizComplete(false);
    setFinalScore(0);
    setTotalPoints(0);
    setLiveClickerTime(availableClickerTime); // Reset live time to available time
  };

  const handleStartQuiz = () => {
    setCurrentView("quiz");
    setQuizComplete(false);
  };

  const handleStartClicker = () => {
    setCurrentView("clicker");
    setLiveClickerTime(availableClickerTime); // Initialize live time
  };

  const handleClickerTimeUpdate = (remainingTime: number) => {
    // Update live time as game is played
    setLiveClickerTime(remainingTime);
  };

  const handleClickerTimeUsed = (secondsUsed: number) => {
    if (!currentAccount?.address) return;
    
    const storageKey = getStorageKey(currentAccount.address);
    if (!storageKey || !savedScore) return;

    // Deduct used time from total score
    const newTotalScore = Math.max(0, savedScore.totalScore - secondsUsed);
    const updatedScore: SavedScore = {
      ...savedScore,
      totalScore: newTotalScore,
      date: new Date().toISOString(),
    };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedScore));
    setSavedScore(updatedScore);
    setAvailableClickerTime(newTotalScore);
    setLiveClickerTime(newTotalScore); // Sync live time
  };

  const handleQuizComplete = (score: number, total: number) => {
    if (!currentAccount?.address) {
      console.error("No wallet connected");
      return;
    }

    setFinalScore(score);
    setTotalPoints(total);
    setQuizComplete(true);
    
    const storageKey = getStorageKey(currentAccount.address);
    if (!storageKey) return;
    
    // Get previous saved score for this wallet and add new score to it
    const previousSaved = localStorage.getItem(storageKey);
    let previousTotal = 0;
    
    if (previousSaved) {
      try {
        const prev = JSON.parse(previousSaved);
        previousTotal = prev.totalScore || 0;
      } catch (e) {
        console.error("Failed to load previous score", e);
      }
    }
    
    // Save accumulated score to localStorage for this wallet
    const scoreData: SavedScore = {
      totalScore: previousTotal + score, // Add new score to previous total
      lastScore: score, // Store the last quiz score
      date: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(scoreData));
    setSavedScore(scoreData);
    setAvailableClickerTime(scoreData.totalScore);
  };

  const handleRestart = () => {
    setQuizComplete(false);
    setFinalScore(0);
    setTotalPoints(0);
    // Don't clear savedScore - keep it visible
    // Optionally go back to home or stay in quiz
  };

  return (
    <WalletGate>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>BitEater Game 🎮</Heading>
        </Box>

        <Flex gap="4" align="center">
          <Box
            px="3"
            py="2"
            style={{
              background: "var(--gray-a3)",
              borderRadius: "6px",
              border: "1px solid var(--gray-a5)",
            }}
          >
            <Box mb="1">
              <Text size="2" weight="medium" color="gray">
                Clicker Time
              </Text>
            </Box>
            <Text size="4" weight="bold" color={availableClickerTime > 0 ? "green" : "red"}>
              {currentView === "clicker" ? liveClickerTime : availableClickerTime} seconds
            </Text>
          </Box>
          <Box>
            <ConnectButton />
          </Box>
        </Flex>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentView === "home" ? (
            <Card size="3" style={{ minHeight: 500 }}>
              <Box p="8" style={{ textAlign: "center" }}>
                <Heading size="9" mb="4">
                  Welcome to BitEater! 🎮
                </Heading>
                <Text size="5" color="gray" mb="6">
                  Test your knowledge and earn time to play!
                </Text>
                
                {savedScore && (
                  <Box mb="6" p="5" style={{ 
                    background: "var(--gray-a3)", 
                    borderRadius: "12px",
                    border: "2px solid var(--gray-a5)"
                  }}>
                    <Text size="4" weight="bold" mb="3" style={{ display: "block" }}>
                      Your Progress 📊
                    </Text>
                    <Flex direction="column" gap="3" align="center">
                      
                      <Box>
                        <Text size="3" color="gray" mb="1" style={{ display: "block" }}>
                          Available Clicker Time:
                        </Text>
                        <Text size="6" weight="bold" color={availableClickerTime > 0 ? "green" : "red"}>
                          {availableClickerTime} seconds
                        </Text>
                      </Box>
                      {savedScore.lastScore > 0 && (
                        <Box>
                          <Text size="2" color="gray" mt="2">
                            Last quiz: {savedScore.lastScore} seconds
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                )}

                <Flex direction="column" gap="4" align="center" mt="6">
                  <Button
                    size="4"
                    onClick={handleStartQuiz}
                    style={{ minWidth: 300, minHeight: 70, fontSize: "1.3rem" }}
                  >
                    🧠 Start Quiz
                  </Button>
                  <Button
                    size="4"
                    onClick={handleStartClicker}
                    disabled={availableClickerTime <= 0}
                    style={{ minWidth: 300, minHeight: 70, fontSize: "1.3rem" }}
                    color={availableClickerTime > 0 ? "green" : "gray"}
                  >
                    🪙 Play Clicker
                    {availableClickerTime <= 0 && " (Earn time first!)"}
                  </Button>
                </Flex>

                
              </Box>
            </Card>
          ) : currentView === "quiz" ? (
            <Card size="3" style={{ minHeight: 500 }}>
              <Flex mb="4" gap="3" justify="center">
                <Button size="3" onClick={handleGoHome} variant="soft">
                  🏠 Back to Home
                </Button>
              </Flex>
              {quizComplete ? (
                <ScoreScreen
                  score={finalScore}
                  totalPoints={totalPoints}
                  onRestart={handleRestart}
                />
              ) : (
                <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
              )}
            </Card>
          ) : (
            <Card size="3" style={{ minHeight: 500 }}>
              <Flex mb="4" gap="3" justify="center">
                <Button size="3" onClick={handleGoHome} variant="soft">
                  🏠 Back to Home
                </Button>
              </Flex>
              {availableClickerTime <= 0 ? (
                <Box p="8" style={{ textAlign: "center" }}>
                  <Heading size="6" mb="4" color="gray">
                    No Time Available ⏰
                  </Heading>
                  <Text size="4" color="gray" mb="4">
                    Complete the Quiz to earn time for the Clicker game!
                  </Text>
                  <Button
                    size="4"
                    onClick={handleStartQuiz}
                    style={{ minWidth: 200 }}
                  >
                    Go to Quiz 🧠
                  </Button>
                </Box>
              ) : (
                <ClickerGame 
                  availableTime={availableClickerTime} 
                  onTimeUsed={handleClickerTimeUsed}
                  onTimeUpdate={handleClickerTimeUpdate}
                />
              )}
            </Card>
          )}
        </Container>
      </Container>
    </WalletGate>
  );
}

export default App;
