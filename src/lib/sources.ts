// Shared source registry. The edge function keeps its own copy of the
// fetch config to stay within Deno module rules — keep them in sync.

export type Topic = { value: string; label: string };

export type FetchConfig =
  | { type: "arxiv"; categories: string[] }
  | { type: "rss"; url: string }
  | { type: "firecrawl"; url: string; limit?: number };

export type Source = {
  id: string;
  name: string;
  org: string;
  description: string;
  topics: Topic[];
  fetch: FetchConfig;
};

const TS_TOPICS: Topic[] = [
  { value: "content moderation", label: "Content Moderation" },
  { value: "misinformation", label: "Misinformation & Disinformation" },
  { value: "deepfakes", label: "Deepfakes & Synthetic Media" },
  { value: "election integrity", label: "Election Integrity" },
  { value: "child safety", label: "Online Child Safety" },
  { value: "hate speech", label: "Hate Speech & Extremism" },
  { value: "algorithmic bias", label: "Algorithmic Bias & Fairness" },
  { value: "transparency", label: "Transparency & Reporting" },
  { value: "platform governance", label: "Platform Governance & Policy" },
  { value: "online harassment", label: "Online Harassment & Abuse" },
  { value: "user wellbeing", label: "User Wellbeing & Mental Health" },
];

const SECURITY_TOPICS: Topic[] = [
  { value: "bot detection", label: "Bot Detection" },
  { value: "browser fingerprinting", label: "Browser Fingerprinting" },
  { value: "anti-scraping", label: "Anti-Scraping" },
  { value: "CAPTCHA", label: "CAPTCHA & Challenges" },
  { value: "account takeover", label: "Account Takeover" },
  { value: "credential stuffing", label: "Credential Stuffing" },
  { value: "automated traffic", label: "Automated Traffic Analysis" },
  { value: "device intelligence", label: "Device Intelligence" },
  { value: "adversarial machine learning", label: "Adversarial ML for Abuse" },
  { value: "web automation", label: "Web Automation Detection" },
];

const CLTC_TOPICS: Topic[] = [
  { value: "AI risk management", label: "AI Risk Management" },
  { value: "digital harms", label: "Digital Harms" },
  { value: "cybersecurity policy", label: "Cybersecurity Policy" },
  { value: "privacy", label: "Privacy & Data Protection" },
  { value: "AI safety", label: "AI Safety" },
];

const ARXIV_TOPICS: Topic[] = [
  ...TS_TOPICS,
  ...SECURITY_TOPICS,
  { value: "AI safety", label: "AI Safety" },
  { value: "ML robustness", label: "ML Robustness" },
];

export const SOURCES: Source[] = [
  {
    id: "jots",
    name: "Journal of Online Trust and Safety",
    org: "Stanford Internet Observatory",
    description: "Premier peer-reviewed journal covering content moderation, transparency, deepfakes, and misinformation.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://tsjournal.org/index.php/jots/issue/archive", limit: 20 },
  },
  {
    id: "tspa",
    name: "TSPA Trust & Safety Library",
    org: "Trust and Safety Professional Association",
    description: "Curated white papers, podcasts, and journal articles for practitioners.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://www.tspa.org/library/", limit: 20 },
  },
  {
    id: "arxiv",
    name: "ArXiv.org (CS.HC / CS.CY / CS.CR)",
    org: "arXiv",
    description: "Latest technical research on content moderation, algorithmic safety, and platform governance.",
    topics: ARXIV_TOPICS,
    fetch: { type: "arxiv", categories: ["cs.CY", "cs.HC", "cs.CR"] },
  },
  {
    id: "stanford",
    name: "Stanford Internet Observatory",
    org: "Stanford University",
    description: "Rapid-response white papers on election integrity and platform abuse.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://cyber.fsi.stanford.edu/io/publications", limit: 20 },
  },
  {
    id: "berkman",
    name: "Berkman Klein Center",
    org: "Harvard University",
    description: "Technology, law, and society — digital child safety and social media reform.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://cyber.harvard.edu/publications", limit: 20 },
  },
  {
    id: "cltc",
    name: "Center for Long-Term Cybersecurity",
    org: "UC Berkeley",
    description: "AI risk management, digital harms, and public interest cybersecurity.",
    topics: CLTC_TOPICS,
    fetch: { type: "firecrawl", url: "https://cltc.berkeley.edu/publications/", limit: 20 },
  },
  {
    id: "csmap",
    name: "Center for Social Media and Politics",
    org: "NYU",
    description: "Data-heavy research on social media's impact on political discourse.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://csmapnyu.org/research/publications", limit: 20 },
  },
  {
    id: "tsrc",
    name: "Trust & Safety Research Conference",
    org: "Stanford (Annual)",
    description: "Cutting-edge findings presented annually, with archived proceedings.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://tsrc.stanford.edu/", limit: 20 },
  },
  {
    id: "facct",
    name: "ACM FAccT Conference",
    org: "ACM",
    description: "Top-tier academic conference on algorithmic safety, fairness, and bias.",
    topics: TS_TOPICS,
    fetch: { type: "firecrawl", url: "https://facctconference.org/2024/acceptedpapers", limit: 30 },
  },
  {
    id: "usenix",
    name: "USENIX Security Symposium",
    org: "USENIX Association",
    description: "Premier academic venue for bot detection, web security, and anti-scraping research.",
    topics: SECURITY_TOPICS,
    fetch: { type: "firecrawl", url: "https://www.usenix.org/conference/usenixsecurity24/technical-sessions", limit: 30 },
  },
  {
    id: "ieee-sp",
    name: "IEEE Symposium on Security & Privacy",
    org: "IEEE",
    description: "Leading conference on network security, fingerprinting, and automated traffic analysis.",
    topics: SECURITY_TOPICS,
    fetch: { type: "firecrawl", url: "https://www.ieee-security.org/TC/SP2024/program-papers.html", limit: 30 },
  },
  {
    id: "ccs",
    name: "ACM CCS Conference",
    org: "ACM",
    description: "Research on web automation detection, CAPTCHA systems, and adversarial bot mitigation.",
    topics: SECURITY_TOPICS,
    fetch: { type: "firecrawl", url: "https://www.sigsac.org/ccs/CCS2024/program/accepted-papers.html", limit: 30 },
  },
  {
    id: "ndss",
    name: "NDSS Symposium",
    org: "Internet Society",
    description: "Network and Distributed System Security — browser fingerprinting and scraping countermeasures.",
    topics: SECURITY_TOPICS,
    fetch: { type: "firecrawl", url: "https://www.ndss-symposium.org/ndss2024/accepted-papers/", limit: 30 },
  },
  {
    id: "bot-research",
    name: "Bot Detection & Mitigation Research",
    org: "Cloudflare / F5 / HUMAN",
    description: "Industry research on bot management, device fingerprinting, and web scraping defense.",
    topics: SECURITY_TOPICS,
    fetch: { type: "firecrawl", url: "https://blog.cloudflare.com/tag/bots/", limit: 20 },
  },
];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function getTopicsForSource(id: string): Topic[] {
  return getSource(id)?.topics ?? [];
}
