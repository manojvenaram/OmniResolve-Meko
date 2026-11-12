export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  eventType: 'login' | 'device_register' | 'password_reset_request' | 'micro_transaction' | 'cashout_transaction';
  ipAddress: string;
  deviceFingerprint: string;
  amount?: number;
  isMalicious: boolean;
  campaignId?: string;
  stageNumber?: number; // 1 to 5
}

export function generateSecurityEventStream(totalEvents = 2000): SecurityEvent[] {
  const events: SecurityEvent[] = [];
  const baseTime = Date.now() - (7 * 24 * 3600 * 1000);

  // 1. Generate 6 coordinated multi-stage ATO attack campaigns (30 malicious events)
  const maliciousUsers = ['victim_usr_101', 'victim_usr_204', 'victim_usr_309', 'victim_usr_412', 'victim_usr_550', 'victim_usr_688'];
  const maliciousEvents: SecurityEvent[] = [];

  maliciousUsers.forEach((userId, cIdx) => {
    const campaignId = `ato_campaign_${cIdx + 1}`;
    const attackerIp = `194.26.29.${10 + cIdx}`; // Bulletproof hosting ASN
    const attackerDevice = `fp_tor_headless_${cIdx + 1}`;
    const t0 = baseTime + (cIdx * 24 * 3600 * 1000);

    // Stage 1: Login from suspicious Russian/Tor proxy
    maliciousEvents.push({
      id: `evt_mal_${cIdx}_1`,
      timestamp: new Date(t0).toISOString(),
      userId,
      eventType: 'login',
      ipAddress: attackerIp,
      deviceFingerprint: attackerDevice,
      isMalicious: true,
      campaignId,
      stageNumber: 1
    });

    // Stage 2: Mismatched device registration
    maliciousEvents.push({
      id: `evt_mal_${cIdx}_2`,
      timestamp: new Date(t0 + 15 * 60 * 1000).toISOString(),
      userId,
      eventType: 'device_register',
      ipAddress: attackerIp,
      deviceFingerprint: attackerDevice,
      isMalicious: true,
      campaignId,
      stageNumber: 2
    });

    // Stage 3: Social engineering / password reset request
    maliciousEvents.push({
      id: `evt_mal_${cIdx}_3`,
      timestamp: new Date(t0 + 35 * 60 * 1000).toISOString(),
      userId,
      eventType: 'password_reset_request',
      ipAddress: attackerIp,
      deviceFingerprint: attackerDevice,
      isMalicious: true,
      campaignId,
      stageNumber: 3
    });

    // Stage 4: Micro-transaction probe
    maliciousEvents.push({
      id: `evt_mal_${cIdx}_4`,
      timestamp: new Date(t0 + 45 * 60 * 1000).toISOString(),
      userId,
      eventType: 'micro_transaction',
      ipAddress: attackerIp,
      deviceFingerprint: attackerDevice,
      amount: 1.00,
      isMalicious: true,
      campaignId,
      stageNumber: 4
    });

    // Stage 5: Critical cashout transaction
    maliciousEvents.push({
      id: `evt_mal_${cIdx}_5`,
      timestamp: new Date(t0 + 60 * 60 * 1000).toISOString(),
      userId,
      eventType: 'cashout_transaction',
      ipAddress: attackerIp,
      deviceFingerprint: attackerDevice,
      amount: 4500.00,
      isMalicious: true,
      campaignId,
      stageNumber: 5
    });
  });

  // 2. Generate remaining benign background events (1970 events)
  const benignCount = totalEvents - maliciousEvents.length;
  for (let i = 0; i < benignCount; i++) {
    const uNum = (i % 250) + 1;
    const userId = `legit_usr_${uNum}`;
    const t = baseTime + Math.floor(Math.random() * (7 * 24 * 3600 * 1000));
    const types: SecurityEvent['eventType'][] = ['login', 'login', 'device_register', 'micro_transaction'];
    const chosenType = types[i % types.length];

    events.push({
      id: `evt_benign_${i}`,
      timestamp: new Date(t).toISOString(),
      userId,
      eventType: chosenType,
      ipAddress: `73.189.44.${(uNum % 200)}`,
      deviceFingerprint: `fp_mac_chrome_usr_${uNum}`,
      amount: chosenType === 'micro_transaction' ? 12.50 : undefined,
      isMalicious: false
    });
  }

  // Combine and sort chronologically
  const fullStream = [...events, ...maliciousEvents];
  fullStream.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return fullStream;
}
