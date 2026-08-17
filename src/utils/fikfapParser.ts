/**
 * FikFap HTML & Data Parser Utility
 * Matches the exact selectors and HTML structure from FikFap:
 * 
 * 1. Profile Page: https://fikfap.com/user/{username}
 *    - Clips:     <div class="font-bold">33</div><div class="text-xs text-accent-300">Clips</div>
 *    - Followers: <div class="font-bold">279</div><div class="text-xs text-accent-300">Followers</div>
 *    - Views:     <div class="font-bold">31.9K</div><div class="text-xs text-accent-300">Views</div>
 * 
 * 2. Statistics Page: https://fikfap.com/settings/profile/statistics
 *    - Clicks:    <p class="text-base mb-4 last:mb-0">In the last two weeks, your profile links received a total of 98 clicks. We are working on improving this section.</p>
 */

export interface ParsedFikFapData {
  username?: string;
  totalVideos: number;       // Clips
  totalFollowers: number;    // Followers
  totalViews: number;        // Views
  totalViewsFormatted?: string;
  totalLinkClicks: number;   // Link Clicks from statistics
  targetBioLink?: string;
  rawFound: {
    clipsFound?: string;
    followersFound?: string;
    viewsFound?: string;
    clicksFound?: string;
  };
}

/**
 * Converts formatted metrics string (e.g. "31.9K", "1.2M", "279", "33") to a numeric value
 */
export function parseFikFapNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim().toUpperCase();
  if (!str) return 0;

  // Clean commas and spaces
  const clean = str.replace(/,/g, '');

  // Check multiplier suffix
  if (clean.endsWith('K')) {
    const num = parseFloat(clean.replace('K', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  if (clean.endsWith('M')) {
    const num = parseFloat(clean.replace('M', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }
  if (clean.endsWith('B')) {
    const num = parseFloat(clean.replace('B', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000000000);
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Formats numbers into clean compact strings (e.g. 31900 -> 31.9K, 279 -> 279)
 */
export function formatMetricNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

/**
 * Extracts username from URL like https://fikfap.com/user/Link-in-Bio
 */
export function extractUsernameFromUrl(urlOrText: string): string {
  if (!urlOrText) return '';
  const trimmed = urlOrText.trim();
  
  // If it's a full URL
  const match = trimmed.match(/fikfap\.com\/user\/([a-zA-Z0-9_\-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  // If user pasted just "user/Link-in-Bio"
  const matchSub = trimmed.match(/user\/([a-zA-Z0-9_\-]+)/i);
  if (matchSub && matchSub[1]) {
    return matchSub[1];
  }

  // If it's already a plain username
  return trimmed.replace(/^@/, '');
}

/**
 * Parses FikFap HTML string and extracts all available metrics
 */
export function parseFikFapHtml(html: string): ParsedFikFapData {
  const result: ParsedFikFapData = {
    totalVideos: 0,
    totalFollowers: 0,
    totalViews: 0,
    totalLinkClicks: 0,
    rawFound: {},
  };

  if (!html || typeof html !== 'string') {
    return result;
  }

  // 1. Extract Clips (Total Videos)
  // Pattern: <div class="font-bold">33</div><div class="text-xs text-accent-300">Clips</div>
  const clipsRegex = /<div[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*>\s*Clips\s*<\/div>/i;
  const clipsFallback = /([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*class="[^"]*text-accent-300[^"]*"[^>]*>\s*Clips/i;
  const clipsGeneral = /<div[^>]*>([0-9\.]+[kKmMbB]?)<\/div>[^<]*<div[^>]*>\s*Clips\s*<\/div>/i;
  
  const clipsMatch = html.match(clipsRegex) || html.match(clipsFallback) || html.match(clipsGeneral);
  if (clipsMatch && clipsMatch[1]) {
    result.rawFound.clipsFound = clipsMatch[1];
    result.totalVideos = parseFikFapNumber(clipsMatch[1]);
  }

  // 2. Extract Followers
  // Pattern: <div class="font-bold">279</div><div class="text-xs text-accent-300">Followers</div>
  const followersRegex = /<div[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*>\s*Followers\s*<\/div>/i;
  const followersFallback = /([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*class="[^"]*text-accent-300[^"]*"[^>]*>\s*Followers/i;
  const followersGeneral = /<div[^>]*>([0-9\.]+[kKmMbB]?)<\/div>[^<]*<div[^>]*>\s*Followers\s*<\/div>/i;

  const followersMatch = html.match(followersRegex) || html.match(followersFallback) || html.match(followersGeneral);
  if (followersMatch && followersMatch[1]) {
    result.rawFound.followersFound = followersMatch[1];
    result.totalFollowers = parseFikFapNumber(followersMatch[1]);
  }

  // 3. Extract Views
  // Pattern: <div class="font-bold">31.9K</div><div class="text-xs text-accent-300">Views</div>
  const viewsRegex = /<div[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*>\s*Views\s*<\/div>/i;
  const viewsFallback = /([0-9\.]+[kKmMbB]?)\s*<\/div>\s*<div[^>]*class="[^"]*text-accent-300[^"]*"[^>]*>\s*Views/i;
  const viewsGeneral = /<div[^>]*>([0-9\.]+[kKmMbB]?)<\/div>[^<]*<div[^>]*>\s*Views\s*<\/div>/i;

  const viewsMatch = html.match(viewsRegex) || html.match(viewsFallback) || html.match(viewsGeneral);
  if (viewsMatch && viewsMatch[1]) {
    result.rawFound.viewsFound = viewsMatch[1];
    result.totalViewsFormatted = viewsMatch[1];
    result.totalViews = parseFikFapNumber(viewsMatch[1]);
  }

  // 4. Extract Total Link Clicks from Statistics
  // Pattern: In the last two weeks, your profile links received a total of 98 clicks.
  const clicksRegex = /received a total of\s*([0-9,]+)\s*clicks/i;
  const clicksFallback = /total of\s*([0-9,]+)\s*clicks/i;
  const clicksGeneral = /([0-9,]+)\s*clicks/i;

  const clicksMatch = html.match(clicksRegex) || html.match(clicksFallback) || html.match(clicksGeneral);
  if (clicksMatch && clicksMatch[1]) {
    result.rawFound.clicksFound = clicksMatch[1];
    result.totalLinkClicks = parseFikFapNumber(clicksMatch[1]);
  }

  // 5. Try extracting target bio link if present in HTML
  const bioMatch = html.match(/href="([^"]*(?:onlyfans\.com|fansly\.com|linktr\.ee|beacons\.ai|t\.me|t\.co)[^"]*)"/i);
  if (bioMatch && bioMatch[1]) {
    result.targetBioLink = bioMatch[1];
  }

  // 6. Try extracting username if present in title or meta tags
  const usernameMatch = html.match(/fikfap\.com\/user\/([a-zA-Z0-9_\-]+)/i) || html.match(/@([a-zA-Z0-9_\-]+)/);
  if (usernameMatch && usernameMatch[1]) {
    result.username = usernameMatch[1];
  }

  return result;
}
