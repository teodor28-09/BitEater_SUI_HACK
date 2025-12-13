import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  Progress,
} from "@radix-ui/themes";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

interface QuizProps {
  questions: Question[];
  onComplete: (score: number, totalPoints: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute in seconds
  const [timeRemainingForQuestion, setTimeRemainingForQuestion] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer countdown effect
  useEffect(() => {
    if (showResult) return; // Don't countdown when showing result

    setTimeRemaining(60); // Reset timer for new question
    setTimeRemainingForQuestion(null);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, showResult]);

  // Handle time up separately
  useEffect(() => {
    if (timeRemaining === 0 && !showResult) {
      // Time's up - auto submit
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Auto-submit with current selection (or null if no selection)
      const correct = selectedAnswer === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      setTimeRemainingForQuestion(0); // No time remaining
      
      setScore((prevScore) => {
        if (correct) {
          // Even if time is up, if answer is correct, they get 0 points (no time remaining)
          return prevScore + 0;
        }
        return prevScore;
      });
      setTotalPoints((prevTotal) => prevTotal + 60); // Add full time to total possible
      
      setShowResult(true);
    }
  }, [timeRemaining, showResult, selectedAnswer, currentQuestion]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return; // Don't allow changes after submitting
    
    // Toggle: if clicking the same answer, deselect it; otherwise select the new one
    if (selectedAnswer === answerIndex) {
      setSelectedAnswer(null);
    } else {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const remainingTime = timeRemaining;
    setTimeRemainingForQuestion(remainingTime);

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      // Score is based on time remaining
      setScore(score + remainingTime);
    }
    // Total possible points is the full 60 seconds per question
    setTotalPoints(totalPoints + 60);

    setShowResult(true);
  };

  const handleNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(null);
      setTimeRemaining(60);
      setTimeRemainingForQuestion(null);
    } else {
      // Quiz complete - score is already calculated correctly
      // The score is the sum of all time remaining from correct answers
      onComplete(score, totalPoints);
    }
  };

  const getAnswerColor = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? "blue" : "gray";
    }

    if (index === currentQuestion.correctAnswer) {
      return "green";
    }
    if (index === selectedAnswer && !isCorrect) {
      return "red";
    }
    return "gray";
  };

  return (
    <Container size="3" py="6">
      <Box mb="4">
        <Flex justify="between" align="center" mb="2">
          <Text size="3" weight="medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text 
            size="4" 
            weight="bold" 
            color={timeRemaining <= 10 ? "red" : timeRemaining <= 20 ? "yellow" : "green"}
            style={{ 
              fontFamily: "monospace",
              fontSize: "1.5rem"
            }}
          >
            ⏱️ {timeRemaining}s
          </Text>
        </Flex>
        <Progress value={progress} size="2" />
        <Progress 
          value={(timeRemaining / 60) * 100} 
          size="1" 
          color={timeRemaining <= 10 ? "red" : timeRemaining <= 20 ? "yellow" : "green"}
          mt="2"
        />
      </Box>

      <Card size="3" style={{ minHeight: 400 }}>
        <Box p="6">
          <Heading size="8" mb="6" style={{ textAlign: "center" }}>
            {currentQuestion.question}
          </Heading>

          <Flex direction="column" gap="3" mt="6">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                size="4"
                variant={getAnswerColor(index) === "gray" ? "soft" : "solid"}
                color={getAnswerColor(index)}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                style={{
                  minHeight: 60,
                  fontSize: "1.1rem",
                  cursor: showResult ? "default" : "pointer",
                  opacity: showResult && index !== selectedAnswer && index !== currentQuestion.correctAnswer ? 0.5 : 1,
                }}
              >
                <Text size="4" weight="medium">
                  {option}
                </Text>
              </Button>
            ))}
          </Flex>

          {showResult && (
            <Box mt="4" style={{ textAlign: "center" }}>
              <Text
                size="5"
                weight="bold"
                color={isCorrect ? "green" : "red"}
                mb="4"
              >
                {isCorrect
                  ? `✓ Correct! +${timeRemainingForQuestion ?? 0} points (${timeRemainingForQuestion ?? 0}s remaining)`
                  : `✗ Wrong! The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`}
              </Text>
            </Box>
          )}

          <Flex justify="center" mt="6">
            {!showResult ? (
              <Button
                size="4"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                style={{ minWidth: 200 }}
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                size="4"
                onClick={handleNext}
                style={{ minWidth: 200 }}
              >
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question"
                  : "View Results"}
              </Button>
            )}
          </Flex>
        </Box>
      </Card>
    </Container>
  );
}

