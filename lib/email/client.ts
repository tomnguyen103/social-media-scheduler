/**
 * Lightweight email client utility using standard fetch to communicate with Resend API,
 * avoiding extra third-party SDK dependencies in Next.js serverless route/worker contexts.
 */

export async function sendFailureEmail(
  toAddress: string,
  postContent: string,
  failedTargets: Array<{ platform: string; error: string }>
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const subject = `⚠️ Social Copilot: Post Publishing Failed`;
  
  const contentSnippet = postContent.length > 60 
    ? `${postContent.substring(0, 57)}...` 
    : postContent;

  const bodyText = `Hello,

One or more platform targets failed to publish for your scheduled post.

Post Content:
"${postContent}"

Failures:
${failedTargets.map((t) => `- ${t.platform.toUpperCase()}: ${t.error}`).join("\n")}

Please log in to your Social Copilot dashboard to review, edit, or retry publishing this post.

Best regards,
The Social Copilot Team
https://socialcopilot.dev`;

  console.log(`[Email Client] Dispatching alert email to: ${toAddress}`);
  console.log(`[Email Client] Subject: ${subject}`);
  console.log(`[Email Client] Body:\n${bodyText}`);

  if (!apiKey || apiKey === "replace_me") {
    console.log("[Email Client] No RESEND_API_KEY set. Simulated email delivery complete (logged above).");
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Social Copilot <notifications@socialcopilot.dev>",
        to: [toAddress],
        subject: subject,
        text: bodyText,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Email Client] Resend API response error: ${res.status}`, errorText);
      return false;
    }

    console.log(`[Email Client] Email successfully sent to ${toAddress} via Resend.`);
    return true;
  } catch (error) {
    console.error("[Email Client] Failed to deliver email via Resend:", error);
    return false;
  }
}
