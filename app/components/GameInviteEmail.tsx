import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface GameInviteEmailProps {
  inviterName?: string;
  inviterEmail?: string;
  gameName?: string;
  gameUrl?: string;
  recipientEmail?: string;
}

export const GameInviteEmail = ({
  inviterName,
  inviterEmail,
  recipientEmail,
  gameName,
  gameUrl,
}: GameInviteEmailProps) => {
  const previewText = `You've been invited to join ${gameName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-gradient-to-br from-blue-50 to-indigo-100 px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded-xl border border-gray-200 border-solid bg-white shadow-lg">
            {/* Header Section */}
            <Section
              className="rounded-t-xl p-[32px] text-center"
              style={{
                backgroundColor: "#2563eb",
                borderRadius: "12px 12px 0 0",
                padding: "32px",
                textAlign: "center",
              }}
            >
              <Heading
                className="mx-0 my-0 p-0 font-bold text-[24px]"
                style={{
                  margin: "0",
                  padding: "0",
                  fontWeight: "bold",
                  fontSize: "24px",
                  color: "#ffffff",
                  lineHeight: "1.2",
                }}
              >
                🎮 Game Invitation
              </Heading>
              <Text
                className="text-[14px] mt-[8px] mb-0"
                style={{
                  color: "#dbeafe",
                  fontSize: "14px",
                  margin: "8px 0 0 0",
                  lineHeight: "1.4",
                }}
              >
                You've been invited to join an exciting game!
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="p-[32px]">
              <Heading className="mx-0 mt-0 mb-[24px] p-0 text-center font-semibold text-[20px] text-gray-800">
                Hi there! 👋
              </Heading>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px] text-center">
                <strong>{inviterName}</strong> (
                <Link
                  href={`mailto:${inviterEmail}`}
                  className="text-blue-600 no-underline"
                >
                  {inviterEmail}
                </Link>
                ) has invited you to join their game:
              </Text>

              {/* Game Name Highlight */}
              <Section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-[20px] mb-[32px] text-center border border-indigo-100">
                <Heading className="mx-0 my-0 p-0 font-bold text-[22px] text-indigo-600">
                  🎯 {gameName}
                </Heading>
              </Section>

              {/* CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={gameUrl}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "16px",
                    display: "inline-block",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  🚀 Join Game Now
                </Button>
              </Section>

              {/* Instructions */}
              <Section className="bg-gray-50 rounded-lg p-[20px] mb-[24px]">
                <Text className="text-[14px] text-gray-600 leading-[20px] text-center mb-[8px] font-semibold">
                  How to Access:
                </Text>
                <Text className="text-[14px] text-gray-600 leading-[20px] text-center">
                  Sign in with <strong>{recipientEmail}</strong> to access your
                  game score
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 rounded-b-xl p-[24px] text-center border-t border-gray-100">
              <Text className="text-[12px] text-gray-500 leading-[18px] mb-[8px]">
                This invitation was sent from <strong>ScoreKeeper</strong>
              </Text>
              <Text className="text-[12px] text-gray-400 leading-[16px]">
                If you didn't expect this email, you can safely ignore it.
              </Text>
              <Hr className="border border-gray-200 my-[16px]" />
              <Text className="text-[11px] text-gray-400 leading-[16px]">
                © 2024 ScoreKeeper. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default GameInviteEmail;
