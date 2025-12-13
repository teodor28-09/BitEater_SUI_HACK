import { Question } from "./Quiz";

export const quizQuestions: Question[] = [
  {
    id: 1,
    question: "What is Sui?",
    options: ["A Layer 2 blockchain on Ethereum", "A high-performance Layer 1 blockchain", "A centralized database", "A crypto exchange"],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 2,
    question: "Which programming language is used for smart contracts on Sui",
    options: ["Solidy", "Rust", "Move", "JavaScript"],
    correctAnswer: 2,
    points: 10,
  },
  {
    id: 3,
    question: "What is the native token of the Sui blockchain?",
    options: ["SUI", "ETH", "SOL", "MOVE"],
    correctAnswer: 0,
    points: 5,
  },
  {
    id: 4,
    question: "What makes Sui different from many other blockchains?",
    options: ["It runs on private servers", "It uses proof of work", "It is account-based only", "It is centered around objects and assets"],
    correctAnswer: 3,
    points: 15,
  },
  {
    id: 5,
    question: "What does “scalability” mean in a blockchain context?",
    options: ["The ability to increase block size manually", "The ability to hide transactions", "The ability to mine faster", "The ability to handle more users and transactions efficiently"],
    correctAnswer: 3,
    points: 10,
  },
  {
    id: 6,
    question: "What is stored on-chain in an object-centric blockchain like Sui?",
    options: ["Only transaction hashes", "Only wallet balances", "Objects with ownership and state", "Off-chain data bases"],
    correctAnswer: 2,
    points: 15,
  },
  {
    id: 7,
    question: "What is an on-chain object in Sui?",
    options: ["A piece of data with ownership and rules stored on-chain", "A smart contract wallet", "A JSON file", "A UI component"],
    correctAnswer: 0,
    points: 10,
  },
  {
    id: 8,
    question: "What advantage does parallel transaction execution provide?",
    options: ["Higher gas fees", "Faster transaction processing", "Better security", "Slower block times"],
    correctAnswer: 1,
    points: 15,
  },
  {
    id: 9,
    question: "How does Sui identify users in a dApp?",
    options: ["Username and password", "Email address", "Wallet address", "IP address"],
    correctAnswer: 2,
    points: 15,
  },
  {
    id: 10,
    question: "What is the main goal of Sui’s architecture?",
    options: ["To reduce decentralization", "To maximize speed and scalability", "To limit smart contract usage", "To replace all blockchains"],
    correctAnswer: 1,
    points: 15,
  },
];