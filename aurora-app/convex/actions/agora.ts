"use node";

/**
 * Agora Token Generation - PRODUCTION READY
 * 
 * Generates RTC tokens for Agora livestreaming using the official agora-access-token package.
 */

import { action } from '../_generated/server';
import { v } from 'convex/values';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

/**
 * Generate Agora RTC Token for livestreaming
 */
export const generateAgoraToken = action({
  args: {
    channelName: v.string(),
    userId: v.string(),
    role: v.union(v.literal('host'), v.literal('audience')),
  },
  handler: async (ctx, args) => {
    // Get Agora credentials from environment
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!appId) {
      console.error('AGORA_APP_ID not configured');
      return {
        success: false,
        error: 'not_configured',
        message: 'Agora App ID is not configured. Please add AGORA_APP_ID to your environment variables.',
        appId: null,
        token: null,
        channelName: args.channelName,
        uid: args.userId,
      };
    }

    // Generate a numeric UID from the userId string (Agora requires numeric UIDs)
    // Use a hash of the userId to get a consistent numeric value
    const uid = Math.abs(hashCode(args.userId)) % 2147483647; // Keep within 32-bit signed int range
    
    // If no certificate, use test mode (no token required)
    if (!appCertificate) {
      console.log('⚠️ Agora running in TEST MODE (no App Certificate)');
      return {
        success: true,
        appId,
        token: null, // null token = test mode
        channelName: args.channelName,
        uid: uid,
        expiresAt: Date.now() + 3600000,
        mode: 'test',
      };
    }

    // PRODUCTION MODE: Generate secure token
    console.log('✅ Generating Agora token for channel:', args.channelName);
    
    try {
      const role = args.role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        args.channelName,
        uid,
        role,
        privilegeExpiredTs
      );

      console.log('✅ Token generated successfully for UID:', uid);

      return {
        success: true,
        appId,
        token,
        channelName: args.channelName,
        uid: uid,
        expiresAt: privilegeExpiredTs * 1000,
        mode: 'secure',
      };
    } catch (error) {
      console.error('Failed to generate Agora token:', error);
      return {
        success: false,
        error: 'token_generation_failed',
        message: 'Failed to generate authentication token. Please try again.',
        appId,
        token: null,
        channelName: args.channelName,
        uid: uid,
      };
    }
  },
});

// Simple hash function to convert string to number
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Validate Agora configuration
 */
export const validateAgoraConfig = action({
  args: {},
  handler: async (ctx, args) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    return {
      hasAppId: !!appId,
      hasAppCertificate: !!appCertificate,
      mode: appCertificate ? 'secure' : 'test',
      message: appCertificate
        ? '✅ Agora is configured for SECURE MODE with token authentication'
        : '⚠️ Agora is in TEST MODE (no App Certificate). Add AGORA_APP_CERTIFICATE for production.',
      appId: appId ? `${appId.substring(0, 8)}...` : 'Not configured',
    };
  },
});
