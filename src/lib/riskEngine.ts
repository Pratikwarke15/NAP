// NAP Trust Gravity Score Engine
// Implements weighted evaluation with Haversine distance formula

export interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface UserProfile {
  user_id: string;
  name: string; 
  balance: number;
  trust_score: number;
  account_age_days: number;
  home_lat: number;
  home_lng: number;
  workplace_lat: number;
  workplace_lng: number;
  travel_route: Location[];
  recent_locations: Location[];
  flagged_exposure_score: number;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface RiskFactors {
  accountAgeScore: number;
  historyFrequencyScore: number;
  sharedTransactionScore: number;
  amountAnomalyScore: number;
  timeAnomalyScore: number;
  networkExposureScore: number;
  addressProximityScore: number;
  workplaceProximityScore: number;
  travelRouteSimilarityScore: number;
  locationOverlapScore: number;
  distanceFromUsualBehaviorScore: number;
  deviceIpChangeScore: number;
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string[];
}

// Weights for each factor (adjusted for stability)
const WEIGHTS = {
  accountAge: 0.07,
  historyFrequency: 0.12,
  sharedTransaction: 0.12,
  amountAnomaly: 0.14,
  timeAnomaly: 0.05,
  networkExposure: 0.10,
  addressProximity: 0.08,
  workplaceProximity: 0.07,
  travelRouteSimilarity: 0.10,
  locationOverlap: 0.10,
  distanceFromUsualBehavior: 0.05,
  deviceIpChange: 0.05,
};

// Haversine distance in km
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Score: 0 = high risk, 100 = low risk (trust score)
function scoreAccountAge(days: number): number {
  if (days > 365) return 100;
  if (days > 180) return 80;
  if (days > 90) return 60;
  if (days > 30) return 40;
  if (days > 7) return 20;
  return 5; // New account = high risk
}

function scoreHistoryFrequency(transactionCount: number): number {
  if (transactionCount > 50) return 100;
  if (transactionCount > 20) return 80;
  if (transactionCount > 10) return 60;
  if (transactionCount > 3) return 40;
  if (transactionCount > 0) return 20;
  return 0; // No history
}

function scoreSharedTransactions(sharedCount: number): number {
  if (sharedCount > 20) return 100;
  if (sharedCount > 10) return 85;
  if (sharedCount > 5) return 65;
  if (sharedCount > 2) return 45;
  if (sharedCount > 0) return 25;
  return 0;
}

function scoreAmountAnomaly(amount: number, avgAmount: number, maxAmount: number): number {
  if (avgAmount === 0) return 10; // No history, risky
  const ratio = amount / avgAmount;
  if (ratio <= 1.5) return 100;
  if (ratio <= 3) return 70;
  if (ratio <= 5) return 40;
  if (ratio <= 10) return 15;
  return 0; // Extreme anomaly
}

function scoreTimeAnomaly(hour: number): number {
  // Transactions between 2am-5am are suspicious
  if (hour >= 9 && hour <= 21) return 100;
  if (hour >= 6 && hour <= 23) return 70;
  return 20; // Late night transactions
}

function scoreNetworkExposure(senderExposure: number, receiverExposure: number): number {
  const combined = (senderExposure + receiverExposure) / 2;
  if (combined <= 5) return 100;
  if (combined <= 15) return 70;
  if (combined <= 30) return 40;
  if (combined <= 50) return 15;
  return 0;
}

function scoreAddressProximity(senderHome: Location, receiverHome: Location): number {
  const dist = haversineDistance(senderHome.lat, senderHome.lng, receiverHome.lat, receiverHome.lng);
  if (dist <= 5) return 100;
  if (dist <= 20) return 80;
  if (dist <= 50) return 60;
  if (dist <= 100) return 35;
  return 10;
}

function scoreStructuredAddressMatch(
  sender: UserProfile,
  receiver: UserProfile
): number {
  let score = 0;

  if (sender.pincode && receiver.pincode && sender.pincode === receiver.pincode) {
    return 100; // Same pincode = very strong trust
  }

  if (sender.city && receiver.city && sender.city.toLowerCase() === receiver.city.toLowerCase()) {
    score += 70;
  }

  if (sender.state && receiver.state && sender.state.toLowerCase() === receiver.state.toLowerCase()) {
    score += 20;
  }

  if (sender.country && receiver.country && sender.country.toLowerCase() === receiver.country.toLowerCase()) {
    score += 10;
  }

  return Math.min(score, 100);
}

function scoreWorkplaceProximity(senderWork: Location, receiverWork: Location): number {
  const dist = haversineDistance(senderWork.lat, senderWork.lng, receiverWork.lat, receiverWork.lng);
  if (dist <= 3) return 100;
  if (dist <= 10) return 80;
  if (dist <= 30) return 55;
  if (dist <= 80) return 30;
  return 10;
}

function scoreTravelRouteSimilarity(route1: Location[], route2: Location[]): number {
  if (route1.length === 0 || route2.length === 0) return 30;

  let matchCount = 0;
  const threshold = 3; // 3km

  for (const p1 of route1) {
    for (const p2 of route2) {
      if (haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng) <= threshold) {
        matchCount++;
        break;
      }
    }
  }

  const similarity = matchCount / Math.max(route1.length, 1);
  if (similarity > 0.6) return 100;
  if (similarity > 0.4) return 70;
  if (similarity > 0.2) return 45;
  if (similarity > 0) return 25;
  return 5;
}

// MANDATORY: 5-location verification
function scoreLocationOverlap(
  senderLocations: Location[],
  receiverLocations: Location[],
  senderTravelRoute: Location[],
  senderHome: Location,
  senderWork: Location
): { score: number; overlapCount: number; details: string[] } {
  const details: string[] = [];
  const PROXIMITY_THRESHOLD = 3; // 3km radius

  // Ensure we check exactly 5 locations (pad if needed)
  const sLocs = senderLocations.slice(0, 5);
  const rLocs = receiverLocations.slice(0, 5);

  if (sLocs.length < 5) {
    details.push(`Sender has only ${sLocs.length}/5 recent locations`);
  }
  if (rLocs.length < 5) {
    details.push(`Receiver has only ${rLocs.length}/5 recent locations`);
  }

  // Count overlaps
  let overlapCount = 0;
  for (const sl of sLocs) {
    for (const rl of rLocs) {
      const dist = haversineDistance(sl.lat, sl.lng, rl.lat, rl.lng);
      if (dist <= PROXIMITY_THRESHOLD) {
        overlapCount++;
        break;
      }
    }
  }

  details.push(`Location overlaps: ${overlapCount}`);

  // Check if sender location is outside normal behavior
  let outsidePattern = false;
  if (sLocs.length > 0) {
    const lastLoc = sLocs[0];
    const distFromHome = haversineDistance(lastLoc.lat, lastLoc.lng, senderHome.lat, senderHome.lng);
    const distFromWork = haversineDistance(lastLoc.lat, lastLoc.lng, senderWork.lat, senderWork.lng);

    let onRoute = false;
    for (const rp of senderTravelRoute) {
      if (haversineDistance(lastLoc.lat, lastLoc.lng, rp.lat, rp.lng) <= PROXIMITY_THRESHOLD) {
        onRoute = true;
        break;
      }
    }

    if (distFromHome > 50 && distFromWork > 50 && !onRoute) {
      outsidePattern = true;
      details.push('Sender location outside normal behavioral pattern - HIGH ANOMALY');
    }
  }

  // Scoring based on overlap count
  let score: number;
  if (overlapCount >= 3) {
    score = 100;
    details.push('Strong location trust: 3+ overlaps');
  } else if (overlapCount === 2) {
    score = 70;
    details.push('Moderate location trust: 2 overlaps');
  } else if (overlapCount === 1) {
    score = 45;
    details.push('Weak location familiarity: 1 overlap');
  } else if (outsidePattern) {
    score = 5;
    details.push('Outside behavioral pattern detected');
  } else {
    score = 20;
    details.push('No direct overlaps but within acceptable geography');
  }

  return { score, overlapCount, details };
}

// Gradual trust stabilizer: increases stability with repeated safe interactions
function applyTrustStabilizer(
  baseScore: number,
  historicalCount: number,
  sharedCount: number
): number {
  let stabilityBoost = 0;

  if (sharedCount >= 10) stabilityBoost += 5;
  else if (sharedCount >= 5) stabilityBoost += 3;
  else if (sharedCount >= 2) stabilityBoost += 1.5;

  if (historicalCount >= 50) stabilityBoost += 5;
  else if (historicalCount >= 20) stabilityBoost += 3;

  const stabilized = baseScore + stabilityBoost;
  return Math.min(stabilized, 100);
}

export interface TransactionContext {
  amount: number;
  senderProfile: UserProfile;
  receiverProfile: UserProfile;
  historicalTransactionCount: number;
  sharedTransactionCount: number;
  avgTransactionAmount: number;
  maxTransactionAmount: number;
  dailyTransactionCount: number;
}

export async function computeTrustGravityScore(ctx: TransactionContext): Promise<RiskFactors> {
  const details: string[] = [];
  const now = new Date();
  const hour = now.getHours();

  // 1. Account age
  const accountAgeScore = scoreAccountAge(ctx.senderProfile.account_age_days);
  if (ctx.senderProfile.account_age_days < 7) details.push('⚠ New account detected');

  // 2. History frequency
  const historyFrequencyScore = scoreHistoryFrequency(ctx.historicalTransactionCount);
  if (ctx.historicalTransactionCount === 0) details.push('⚠ No transaction history');

  // 3. Shared transactions
  const sharedTransactionScore = scoreSharedTransactions(ctx.sharedTransactionCount);
  if (ctx.sharedTransactionCount === 0) details.push('⚠ No prior interaction between users');

  // 4. Amount anomaly
  const amountAnomalyScore = scoreAmountAnomaly(ctx.amount, ctx.avgTransactionAmount, ctx.maxTransactionAmount);
  if (ctx.avgTransactionAmount > 0 && ctx.amount > ctx.avgTransactionAmount * 3) {
    details.push('⚠ Amount significantly above average');
  }

  // 5. Time anomaly
  const timeAnomalyScore = scoreTimeAnomaly(hour);
  if (hour >= 0 && hour <= 5) details.push('⚠ Late night transaction');

  // 6. Network exposure
  const networkExposureScore = scoreNetworkExposure(
    ctx.senderProfile.flagged_exposure_score,
    ctx.receiverProfile.flagged_exposure_score
  );
  if (ctx.senderProfile.flagged_exposure_score > 30) details.push('⚠ Sender associated with flagged network');

  // 7. Address proximity (geo + structured familiarity)
  const geoAddressScore = scoreAddressProximity(
    { lat: ctx.senderProfile.home_lat, lng: ctx.senderProfile.home_lng },
    { lat: ctx.receiverProfile.home_lat, lng: ctx.receiverProfile.home_lng }
  );

  const structuredAddressScore = scoreStructuredAddressMatch(
    ctx.senderProfile,
    ctx.receiverProfile
  );

  const addressProximityScore = Math.max(geoAddressScore, structuredAddressScore);

  if (structuredAddressScore === 100) {
    details.push('✅ Same pincode detected - strong address familiarity');
  } else if (structuredAddressScore >= 70) {
    details.push('✅ Same city detected - moderate address familiarity');
  }

  // 8. Workplace proximity
  const workplaceProximityScore = scoreWorkplaceProximity(
    { lat: ctx.senderProfile.workplace_lat, lng: ctx.senderProfile.workplace_lng },
    { lat: ctx.receiverProfile.workplace_lat, lng: ctx.receiverProfile.workplace_lng }
  );

  // 9. Travel route similarity
  const travelRouteSimilarityScore = scoreTravelRouteSimilarity(
    ctx.senderProfile.travel_route,
    ctx.receiverProfile.travel_route
  );

  // 10. MANDATORY 5-location verification
  const locationResult = scoreLocationOverlap(
    ctx.senderProfile.recent_locations,
    ctx.receiverProfile.recent_locations,
    ctx.senderProfile.travel_route,
    { lat: ctx.senderProfile.home_lat, lng: ctx.senderProfile.home_lng },
    { lat: ctx.senderProfile.workplace_lat, lng: ctx.senderProfile.workplace_lng }
  );
  const locationOverlapScore = locationResult.score;
  details.push(...locationResult.details);

  // Calculate dynamic proximity bounds
  const currentLoc = ctx.senderProfile.recent_locations[0] || { lat: ctx.senderProfile.home_lat, lng: ctx.senderProfile.home_lng };
  const dHome = haversineDistance(currentLoc.lat, currentLoc.lng, ctx.senderProfile.home_lat, ctx.senderProfile.home_lng);
  const dWork = haversineDistance(currentLoc.lat, currentLoc.lng, ctx.senderProfile.workplace_lat || 0, ctx.senderProfile.workplace_lng || 0);
  const minDist = Math.min(dHome, dWork);
  
  let distanceFromUsualBehaviorScore = 90;
  if (minDist > 50) distanceFromUsualBehaviorScore = 20;
  else if (minDist > 20) distanceFromUsualBehaviorScore = 50;
  else if (minDist <= 5) distanceFromUsualBehaviorScore = 100;

  // Assuming high exposure correlates slightly with IP change anomaly for mock
  const deviceIpChangeScore = ctx.senderProfile.flagged_exposure_score > 30 ? 50 : 100;

  // Additional fraud detection rules
  if (ctx.senderProfile.account_age_days < 7 && ctx.amount > 5000) {
    details.push('🚨 New account + high amount = FRAUD INDICATOR');
  }
  if (ctx.dailyTransactionCount > 20) {
    details.push('🚨 Abnormally high daily transaction volume');
  }
  if (distanceFromUsualBehaviorScore < 30) {
    details.push('⚠ Operating far from usual geographical bound');
  }

  // Call Python ML API
  let p = 0.5;
  try {
    const { API_BASE_URL } = require('../config');
    const mlResponse = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_age_days: ctx.senderProfile.account_age_days,
        historical_transaction_count: ctx.historicalTransactionCount,
        shared_transaction_count: ctx.sharedTransactionCount,
        amount: ctx.amount,
        avg_transaction_amount: ctx.avgTransactionAmount,
        max_transaction_amount: ctx.maxTransactionAmount,
        time_anomaly_hour: hour,
        sender_exposure_score: ctx.senderProfile.flagged_exposure_score,
        receiver_exposure_score: ctx.receiverProfile.flagged_exposure_score,
        address_proximity_score: addressProximityScore,
        workplace_proximity_score: workplaceProximityScore,
        travel_route_similarity_score: travelRouteSimilarityScore,
        location_overlap_score: locationOverlapScore,
        distance_from_usual_behavior: distanceFromUsualBehaviorScore,
        device_ip_change: 100 - deviceIpChangeScore, // IP change is inverted (0 = good, 100 = bad)
      }),
    });
    
    if (!mlResponse.ok) {
        throw new Error(`API responded with status: ${mlResponse.status}`);
    }

    const mlData = await mlResponse.json();
    p = mlData.probability_score;
    details.push(`🤖 ML Trust Probability: ${(p * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('Detailed Error: Failed to fetch from ML Engine at /predict', error);
    details.push('⚠ ML Engine unreachable: Backend connection failed. using rule-based fallback');
    // Basic fallback rule calculation
    let baseScore =
      accountAgeScore * WEIGHTS.accountAge +
      historyFrequencyScore * WEIGHTS.historyFrequency +
      sharedTransactionScore * WEIGHTS.sharedTransaction +
      amountAnomalyScore * WEIGHTS.amountAnomaly +
      timeAnomalyScore * WEIGHTS.timeAnomaly +
      networkExposureScore * WEIGHTS.networkExposure +
      addressProximityScore * WEIGHTS.addressProximity +
      workplaceProximityScore * WEIGHTS.workplaceProximity +
      travelRouteSimilarityScore * WEIGHTS.travelRouteSimilarity +
      locationOverlapScore * WEIGHTS.locationOverlap +
      distanceFromUsualBehaviorScore * WEIGHTS.distanceFromUsualBehavior +
      deviceIpChangeScore * WEIGHTS.deviceIpChange;
    
    // Fallback penalty modifiers (matching ML engine strictness)
    if (ctx.senderProfile.account_age_days < 7) baseScore -= 10;
    if (distanceFromUsualBehaviorScore < 30) baseScore -= 15;
    if (ctx.amount > 5000 && ctx.senderProfile.account_age_days < 30) baseScore -= 20;

    p = Math.max(0, Math.min(100, baseScore)) / 100;
  }

  // Daily volume penalty (dynamic risk increase)
  if (ctx.dailyTransactionCount > 25) {
    p -= 0.10;
    details.push('🚨 Severe daily volume anomaly');
  } else if (ctx.dailyTransactionCount > 15) {
    p -= 0.05;
    details.push('⚠ Elevated daily transaction volume');
  }

  // Apply gradual trust stabilizer as a small boost
  let overallScore = p * 100;
  overallScore = applyTrustStabilizer(
    overallScore,
    ctx.historicalTransactionCount,
    ctx.sharedTransactionCount
  );

  // 🔒 Deterministic Trust Overrides (Hackathon Stability Rules)

  // Completely new relationship → force HIGH risk
  if (ctx.historicalTransactionCount === 0 && ctx.sharedTransactionCount === 0) {
    details.push('🚨 Completely new user relationship - forcing HIGH risk');
    return {
      accountAgeScore,
      historyFrequencyScore,
      sharedTransactionScore,
      amountAnomalyScore,
      timeAnomalyScore,
      networkExposureScore,
      addressProximityScore,
      workplaceProximityScore,
      travelRouteSimilarityScore,
      locationOverlapScore,
      distanceFromUsualBehaviorScore,
      deviceIpChangeScore,
      overallScore: Math.round(overallScore * 100) / 100,
      riskLevel: 'HIGH',
      details,
    };
  }

  // Mature relationship (5+ shared transactions) → force LOW risk
  if (ctx.sharedTransactionCount >= 5) {
    details.push('✅ Mature trusted relationship (5+ transactions) - forcing LOW risk');
    return {
      accountAgeScore,
      historyFrequencyScore,
      sharedTransactionScore,
      amountAnomalyScore,
      timeAnomalyScore,
      networkExposureScore,
      addressProximityScore,
      workplaceProximityScore,
      travelRouteSimilarityScore,
      locationOverlapScore,
      distanceFromUsualBehaviorScore,
      deviceIpChangeScore,
      overallScore: Math.round(overallScore * 100) / 100,
      riskLevel: 'LOW',
      details,
    };
  }

  // Risk classification perfectly matching specs:
  // p > 0.75 -> LOW
  // 0.45 <= p <= 0.75 -> MEDIUM
  // p < 0.45 -> HIGH
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (p > 0.75) {
    riskLevel = 'LOW';
  } else if (p >= 0.45) {
    riskLevel = 'MEDIUM';
    details.push('→ Transaction moved to Trust Buffer for review');
  } else {
    riskLevel = 'HIGH';
    details.push('→ Transaction held in buffer - sender trust score decreased');
  }

  return {
    accountAgeScore,
    historyFrequencyScore,
    sharedTransactionScore,
    amountAnomalyScore,
    timeAnomalyScore,
    networkExposureScore,
    addressProximityScore,
    workplaceProximityScore,
    travelRouteSimilarityScore,
    locationOverlapScore,
    distanceFromUsualBehaviorScore,
    deviceIpChangeScore,
    overallScore: Math.round(overallScore * 100) / 100,
    riskLevel,
    details,
  };
}

// Generate transaction hash
export function generateTransactionHash(): string {
  const chars = 'abcdef0123456789';
  let hash = 'NAP-';
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
    if (i === 7 || i === 15 || i === 23) hash += '-';
  }
  return hash;
}

// Generate simulated location near a base point
export function generateNearbyLocation(baseLat: number, baseLng: number, radiusKm: number = 5): Location {
  const r = radiusKm / 111;
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.random() * r;
  return {
    lat: Math.round((baseLat + dist * Math.cos(angle)) * 10000) / 10000,
    lng: Math.round((baseLng + dist * Math.sin(angle)) * 10000) / 10000,
    timestamp: new Date().toISOString(),
  };
}
