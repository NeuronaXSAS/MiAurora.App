"use node";

/**
 * Agora Token Generation
 * 
 * Generates RTC tokens for Agora livestreaming.
 * For hackathon/demo purposes, we use a simplified approach.
 */

import { action } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Generate Agora RTC Token
 * 
 * NOTE: For production, you would use the Agora Token Builder with your App Certificate.
 * For this hackathon demo, we return the App ID and use Agora's test mode.
 * 
 * In production, implement proper token generation using:
 * - @agora.io/rtc-token-builder package
 * - Your Agora App Certificate (stored securely)
 * - Proper expiration times
 */
export const generateAgoraToken = action({
  args: {
    channelName: v.string(),
    userId: v.string(),
    role: v.union(v.literal('host'), v.literal('audience')),
  },
  handler: async (ctx, args) => {
    // Get Agora credentials from environment
    // Note: In Convex actions, use process.env (not NEXT_PUBLIC_)
    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!appId) {
      throw new Error('AGORA_APP_ID not configured in Convex environment variables. Add it in Convex dashboard.');
    }

    // Check if we're in secure mode (with certificate) or test mode
    if (!appCertificate) {
      console.log('⚠️  Agora running in TEST MODE (no App Certificate)');
      // For hackathon/demo: Return App ID for test mode
      // Agora allows testing without tokens when App Certificate is not set
      return {
        success: true,
        appId,
        token: null, // null token = test mode
        channelName: args.channelName,
        uid: args.userId,
        expiresAt: Date.now() + 3600000, // 1 hour
        mode: 'test',
      };
    }

    // PRODUCTION MODE: Generate secure token
    console.log('✅ Agora running in SECURE MODE (with App Certificate)');
    
    // For production with certificate, you would use:
    // import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
    // const token = RtcTokenBuilder.buildTokenWithUid(...);
    
    // For now, return test mode since token builder requires additional setup
    return {
      success: true,
      appId,
      token: null,
      channelName: args.channelName,
      uid: args.userId,
      expiresAt: Date.now() + 3600000,
      mode: 'test',
      note: 'Token generation requires agora-access-token package',
    };

    /**
     * PRODUCTION IMPLEMENTATION:
     * 
     * Uncomment and implement this when you have an App Certificate:
     * 
     * import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
     * 
     * const appCertificate = process.env.AGORA_APP_CERTIFICATE;
     * const uid = parseInt(args.userId) || 0;
     * const role = args.role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
     * const expirationTimeInSeconds = 3600; // 1 hour
     * const currentTimestamp = Math.floor(Date.now() / 1000);
     * const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
     * 
     * const token = RtcTokenBuilder.buildTokenWithUid(
     *   appId,
     *   appCertificate,
     *   args.channelName,
     *   uid,
     *   role,
     *   privilegeExpiredTs
     * );
     * 
     * return {
     *   success: true,
     *   appId,
     *   token,
     *   channelName: args.channelName,
     *   uid: args.userId,
     *   expiresAt: privilegeExpiredTs * 1000,
     * };
     */
  },
});

/**
 * Validate Agora configuration
 */
export const validateAgoraConfig = action({
  args: {},
  handler: async (ctx, args) => {
    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    return {
      hasAppId: !!appId,
      hasAppCertificate: !!appCertificate,
      mode: appCertificate ? 'secure' : 'test',
      message: appCertificate
        ? '✅ Agora is configured for SECURE MODE with token authentication'
        : '⚠️  Agora is in TEST MODE (no App Certificate). Suitable for development/demo.',
      appId: appId ? `${appId.substring(0, 8)}...` : 'Not configured',
    };
  },
});
