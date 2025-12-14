import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { ConnectButton } from "@mysten/dapp-kit";

interface WalletGateProps {
  children: React.ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const currentAccount = useCurrentAccount();

  if (!currentAccount) {
    return (
      <Container size="3" py="8">
        <Card size="3" style={{ minHeight: 400 }}>
          <Box p="8" style={{ textAlign: "center" }}>
            <Heading size="9" mb="4">
              Connect Your Wallet 🔐
            </Heading>
            <Text size="6" color="gray" mb="6">
              Please connect your Sui wallet to continue
            </Text>
            
            <Flex justify="center" align="center" direction="column" gap="5">
              <ConnectButton />
              <Text size="2" color="gray" mt="4">
                Connect with Sui Wallet
              </Text>
            </Flex>
          </Box>
        </Card>
      </Container>
    );
  }

  return <>{children}</>;
}


