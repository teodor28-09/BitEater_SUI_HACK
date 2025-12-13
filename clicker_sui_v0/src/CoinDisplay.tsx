import { Coins } from "lucide-react";
import "./coinDisplay.css";

export function CoinDisplay({
  coins,
  tier,
}: {
  coins: number;
  tier: "free" | "pro";
}) {
  return (
    <div className="coinDisplay">
      <Coins className={`coinIcon ${tier === "pro" ? "coinGold" : "coinSilver"}`} />
      <span className="coinAmount">{coins}</span>
      <span className="coinLabel">coins</span>
    </div>
  );
}
