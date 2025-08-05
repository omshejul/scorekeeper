import { Resend } from "resend";
import { GameInviteEmail } from "@/app/components/GameInviteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Note: For production, you should:
// 1. Verify your domain in Resend dashboard
// 2. Update the 'from' email below to use your verified domain
// 3. Example: 'ScoreKeeper <noreply@yourdomain.com>'

export interface SendGameInviteParams {
  to: string;
  inviterName: string;
  inviterEmail: string;
  gameName: string;
  gameUrl: string;
}

export async function sendGameInvite({
  to,
  inviterName,
  inviterEmail,
  gameName,
  gameUrl,
}: SendGameInviteParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "ScoreKeeper <scorekeeper@theom.app>", // Update this with your verified domain for production
      to: [to],
      subject: `${inviterName} invited you to join a game on ScoreKeeper!`,
      react: GameInviteEmail({
        inviterName,
        inviterEmail,
        gameName,
        gameUrl,
        recipientEmail: to,
      }),
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in sendGameInvite:", error);
    throw error;
  }
}

export async function sendGameInvites(
  emails: string[],
  params: Omit<SendGameInviteParams, "to">
) {
  const results = await Promise.allSettled(
    emails.map((email) => sendGameInvite({ ...params, to: email }))
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  ).length;
  const failed = results.filter(
    (result) => result.status === "rejected"
  ).length;

  return {
    successful,
    failed,
    results,
  };
}
