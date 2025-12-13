import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text, Heading, Box } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "./networkConfig";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import "./clicker.css";

const REWARD_THRESHOLD = 50;

interface ClickerGameProps {
  availableTime: number; // Time in seconds from quiz score
  onTimeUsed: (secondsUsed: number) => void; // Callback when time is used
  onTimeUpdate?: (remainingTime: number) => void; // Callback for live time updates
}

export function ClickerGame({ availableTime, onTimeUsed, onTimeUpdate }: ClickerGameProps) {
  const counterPackageId = useNetworkVariable("counterPackageId");
  const gameBankId = "0x811fcedcb7a67bfc32de73f0f5bd1eb7abb2d3f87b9368e447ff930e8c313b04";
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // GAME STATE
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  // TX / UI STATE
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState("");

  const coinRef = useRef<HTMLButtonElement | null>(null);

  // TIMER
  useEffect(() => {
    if (!isRunning || waiting) return;

    if (timeLeft <= 0) {
      setIsRunning(false);
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setIsRunning(false);
          // Notify parent of remaining time (0)
          if (onTimeUpdate) {
            onTimeUpdate(0);
          }
          return 0;
        }
        const newTime = s - 1;
        // Notify parent of remaining time in real-time
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isRunning, timeLeft, waiting, onTimeUpdate]);

  // Track time used when game stops - calculate from initial vs remaining time
  const hasReportedTime = useRef(false);
  
  useEffect(() => {
    if (isRunning) {
      hasReportedTime.current = false; // Reset when starting
    } else if (!isRunning && initialTime > 0 && !hasReportedTime.current) {
      // Calculate time used as difference between initial and remaining time
      const timeUsed = initialTime - timeLeft;
      if (timeUsed > 0) {
        hasReportedTime.current = true; // Mark as reported to prevent double deduction
        onTimeUsed(timeUsed);
        setInitialTime(0); // Reset
      }
    }
  }, [isRunning, initialTime, timeLeft, onTimeUsed]);

  const canClick = isRunning && timeLeft > 0 && !waiting;
  const rewardEligible = useMemo(() => score >= REWARD_THRESHOLD, [score]);

  function animateCoin() {
    const el = coinRef.current;
    if (!el) return;
    el.classList.remove("coin-press");
    void el.offsetWidth;
    el.classList.add("coin-press");
  }

  function click() {
    if (!canClick) return;
    setScore((s) => s + 1);
    animateCoin();
  }

  function start() {
    if (!currentAccount || availableTime <= 0) return;

    setScore(0);
    const startTime = Math.min(availableTime, availableTime);
    setInitialTime(startTime); // Store initial time for calculation
    setTimeLeft(startTime); // Use available time
    setStatus("");
    setIsRunning(true);
    // Notify parent of initial remaining time
    if (onTimeUpdate) {
      onTimeUpdate(startTime);
    }
  }

  function stop() {
    if (!isRunning) return;
    setIsRunning(false);
    setStatus("Game stopped");
  }

  // function createCounter(): Promise<string | null> {
  //   setWaiting(true);
  //   setStatus("Creating on-chain object…");

  //   const tx = new Transaction();
  //   tx.moveCall({
  //     target: `${counterPackageId}::counter::create`,
  //     arguments: [],
  //   });

  //   return new Promise((resolve) => {
  //     signAndExecute(
  //       { transaction: tx },
  //       {
  //         onSuccess: async ({ digest }) => {
  //           const { effects } = await suiClient.waitForTransaction({
  //             digest,
  //             options: { showEffects: true },
  //           });

  //           const id = effects?.created?.[0]?.reference?.objectId ?? null;
  //           setCounterId(id);
  //           setWaiting(false);
  //           setStatus(id ? "Counter created. Press Submit again." : "");
  //           resolve(id);
  //         },
  //         onError: () => {
  //           setWaiting(false);
  //           setStatus("");
  //           resolve(null);
  //         },
  //       },
  //     );
  //   });
  // }

  // async function submitScoreOnChain() {
  //   if (!currentAccount || !rewardEligible) return;

  //   setIsRunning(false);

  //   if (!counterId) {
  //     await createCounter();
  //     return;
  //   }

  //   setWaiting(true);
  //   setStatus("Submitting score on-chain…");

  //   const tx = new Transaction();
  //   tx.moveCall({
  //     target: `${counterPackageId}::counter::set_value`,
  //     arguments: [tx.object(counterId), tx.pure.u64(score)],
  //   });

  //   signAndExecute(
  //     { transaction: tx },
  //     {
  //       onSuccess: async ({ digest }) => {
  //         await suiClient.waitForTransaction({ digest });
  //         setWaiting(false);
  //         setStatus("Score submitted ✅");
  //       },
  //       onError: () => {
  //         setWaiting(false);
  //         setStatus("");
  //       },
  //     },
  //   );
  // }

  async function claimRewardOnChain() {
    if (!currentAccount || !rewardEligible) return;

    if (!counterPackageId) {
      setStatus("Missing package ID: cannot build transaction");
      setWaiting(false);
      return;
    }

    setWaiting(true);
    setStatus("Claiming reward on-chain…");

    // 1. Prepare the data (The "Struct")
    const payload = {
        userAddress: currentAccount.address, // This comes from the connected wallet
        points: score
    };

    try {
      const response = await fetch('http://localhost:5000/claim', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Claim server returned non-OK:', response.status, text);
        setStatus('Claim server error: ' + response.status);
        setWaiting(false);
        return;
      }

      const data = await response.json();
      console.log("Server Response:", data);
      
      if (data.status !== "success" || !data.signature) {
        console.log("Server Error:", data);
        setWaiting(false);
        setStatus("Failed to claim reward: invalid server response.");
        return; 
      }

      const signatureBytes = fromHex(data.signature);
      const amountInMints = score * 20_000_00;
      
      const tx = new Transaction();
      tx.moveCall({
        target: `${counterPackageId}::clicker::claim_reward`,
        arguments: [
          tx.object(gameBankId),
          tx.pure.u64(amountInMints),
          tx.pure.vector('u8', signatureBytes)
        ],
      });

      // Submitting transaction

      signAndExecute({ transaction: tx }, {
        onSuccess: async ({ digest }) => {
          await suiClient.waitForTransaction({ digest });
          setStatus("Success! Rewards claimed.");
          setWaiting(false);
          console.log('tx success, digest:', digest);
        },
        onError: (err) => {
          console.log(err);
          setStatus("Transaction Failed on-chain: " + (err?.message ?? 'unknown'));
          setWaiting(false);
        }
      });
    } catch (err) {
      console.error('Claim flow error:', err);
      setStatus('Claim flow failed: ' + (err instanceof Error ? err.message : String(err)));
      setWaiting(false);
    }
}

  const startDisabled = waiting || !currentAccount || availableTime <= 0;
  const submitDisabled = waiting || !currentAccount || !rewardEligible;

  return (
    <Box className="page">
      {/* TOP BAR */}
      <Flex className="topbar" align="center" justify="between" gap="3" wrap="wrap">
        <Heading size="4">Proof of CLICK</Heading>

        <Flex align="center" gap="3" wrap="wrap" className="stats">
          {isRunning ? (
            <Button size="2" onClick={stop} color="red" variant="solid">
              Stop
            </Button>
          ) : (
            <Button size="2" onClick={start} disabled={startDisabled}>
              {!currentAccount ? "Connecting..." : "Start"}
            </Button>
          )}

          <Text className="pill">⏱ {timeLeft}s</Text>
          <Text className="pill">⭐ {score}</Text>

          <Button size="2" onClick={claimRewardOnChain} disabled={submitDisabled}>
            {waiting ? <ClipLoader size={16} /> : "Submit"}
          </Button>

          <Text className={`hint ${rewardEligible ? "hint-ok" : ""}`}>
            {rewardEligible
              ? "Threshold reached!"
              : `Reach ${REWARD_THRESHOLD} to submit`}
          </Text>
        </Flex>
      </Flex>

      {status && (
        <Text size="2" color="gray" style={{ marginTop: 10 }}>
          {status}
        </Text>
      )}

      {/* CENTER COIN */}
      <Flex className="center" direction="column" align="center" justify="center" gap="3">
        <button
          ref={coinRef}
          className={`coin coin-icon ${canClick ? "" : "coin-disabled"}`}
          onClick={click}
          disabled={!canClick}
          aria-label="Coin clicker"
        >
          <span className="coin-svg" style={{ fontSize: "4rem" }}>🪙</span>
        </button>

        <Text size="2" color="gray">
          {isRunning
            ? "Click the coin!"
            : !currentAccount
            ? "Wallet is connecting…"
            : availableTime <= 0
            ? "No time available! Complete the quiz first."
            : `Press Start to begin (${availableTime}s available)`}
        </Text>
      </Flex>
    </Box>
  );
}
