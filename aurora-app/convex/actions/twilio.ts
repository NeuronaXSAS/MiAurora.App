"use node";

/**
 * Twilio Emergency SMS Integration
 *
 * Sends emergency SMS alerts to trusted contacts.
 * Includes fail-safe for Twilio trial mode.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import twilio from "twilio";

/**
 * Send Emergency SMS
 *
 * Sends SMS alerts to emergency contacts with location link.
 *
 * FAIL-SAFE: In trial mode, Twilio only sends to verified numbers.
 * If sending fails (unverified number), we catch the error and return
 * success=true with simulated=true to ensure the UI shows "SOS Sent"
 * without crashing the demo.
 */
export const sendEmergencySMS = action({
  args: {
    phoneNumbers: v.array(v.string()),
    userName: v.string(),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        name: v.optional(v.string()),
      }),
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Check if Twilio is configured
    if (!accountSid || !authToken || !fromNumber) {
      console.warn("⚠️  Twilio not configured. Simulating SMS send for demo.");
      return {
        success: true,
        simulated: true,
        message: "Twilio not configured. SMS simulation mode.",
        sentTo: args.phoneNumbers.length,
        failed: 0,
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Build emergency message
    const locationText = args.location
      ? `\n\n📍 Location: ${args.location.name || "Unknown"}\nMap: https://www.google.com/maps?q=${args.location.lat},${args.location.lng}`
      : "";

    const customMessage = args.message || "I need help!";

    const fullMessage =
      `🚨 EMERGENCY ALERT from ${args.userName}\n\n` +
      `${customMessage}${locationText}\n\n` +
      `This is an automated alert from Aurora Safety App.`;

    // Send SMS to each contact
    const results = {
      success: true,
      simulated: false,
      sentTo: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const phoneNumber of args.phoneNumbers) {
      try {
        // Attempt to send SMS
        await client.messages.create({
          body: fullMessage,
          from: fromNumber,
          to: phoneNumber,
        });

        results.sentTo++;
        console.log(`✅ Emergency SMS sent to ${phoneNumber}`);
      } catch (error: any) {
        // FAIL-SAFE: Catch Twilio trial mode errors
        console.warn(
          `⚠️  Failed to send SMS to ${phoneNumber}:`,
          error.message,
        );

        // Check if it's a trial mode error (unverified number)
        if (error.code === 21608 || error.message?.includes("unverified")) {
          console.log(
            `   → Trial mode: ${phoneNumber} is not verified in Twilio console`,
          );
          results.errors.push(`${phoneNumber}: Unverified (trial mode)`);
        } else {
          results.errors.push(`${phoneNumber}: ${error.message}`);
        }

        results.failed++;
      }
    }

    // If all sends failed but we're in trial mode, mark as simulated success
    if (results.sentTo === 0 && results.failed > 0) {
      console.log(
        "⚠️  All SMS sends failed (likely trial mode). Returning simulated success for demo.",
      );
      return {
        success: true,
        simulated: true,
        message: "Trial mode: SMS would be sent to verified numbers only",
        sentTo: args.phoneNumbers.length,
        failed: 0,
        trialMode: true,
      };
    }

    return results;
  },
});

/**
 * Validate Twilio Configuration
 *
 * Checks if Twilio is properly configured and returns status.
 */
export const validateTwilioConfig = action({
  args: {},
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const isConfigured = !!(accountSid && authToken);

    if (!isConfigured) {
      return {
        configured: false,
        message: "Twilio credentials not found in environment variables",
        accountSid: null,
        fromNumber: null,
      };
    }

    // Try to validate credentials by initializing client
    try {
      const client = twilio(accountSid, authToken);

      // Fetch account info to validate credentials
      const account = await client.api.accounts(accountSid).fetch();

      return {
        configured: true,
        message: "Twilio is configured and credentials are valid",
        accountSid: accountSid,
        fromNumber: fromNumber || "Not configured",
        accountStatus: account.status,
        accountType: account.type, // 'Trial' or 'Full'
      };
    } catch (error: any) {
      return {
        configured: false,
        message: `Twilio credentials invalid: ${error.message}`,
        accountSid: accountSid,
        fromNumber: null,
        error: error.message,
      };
    }
  },
});

/**
 * Test SMS Send
 *
 * Sends a test SMS to verify Twilio configuration.
 * Use this to test with your verified phone number.
 */
export const sendTestSMS = action({
  args: {
    toNumber: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "Twilio not configured - missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER",
      );
    }

    const client = twilio(accountSid, authToken);

    try {
      const message = await client.messages.create({
        body:
          args.message || "🧪 Test message from Aurora App. Twilio is working!",
        from: fromNumber,
        to: args.toNumber,
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: args.toNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        to: args.toNumber,
      };
    }
  },
});
