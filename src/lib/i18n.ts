export type LanguageCode = "en" | "sw"

interface TranslationTree {
  [key: string]: string | TranslationTree
}

const translations: Record<LanguageCode, TranslationTree> = {
  en: {
    app: {
      name: "Community Hub",
      subtitle: "VICOBA Virtual Banking Platform",
    },
    actions: {
      signIn: "Sign in",
      signOut: "Log out",
      guide: "Guide",
      profile: "Profile",
      dashboard: "Dashboard",
      users: "Users",
      groups: "Groups",
      settings: "Settings",
      notifications: "Notifications",
      home: "Home",
      myGroups: "My Groups",
      wallet: "Wallet",
      savings: "Savings",
      loans: "Loans",
      fines: "Fines",
      meetings: "Meetings",
      analytics: "Financial Analytics",
      members: "Members",
      language: "Language",
      english: "English",
      swahili: "Swahili",
      toggleTheme: "Toggle theme",
      lightMode: "Light mode",
      darkMode: "Dark mode",
    },
    roles: {
      admin: "Admin",
      staff: "Staff",
      member: "Member",
      chairperson: "Chairperson",
      secretary: "Secretary",
      treasurer: "Treasurer",
      error: "Error",
    },
    breadcrumb: {
      home: "Home",
      dashboard: "Dashboard",
      guide: "Guide",
      wallet: "Wallet",
      savings: "Savings",
      loans: "Loans",
      fines: "Fines",
      meetings: "Meetings",
      members: "Members",
      settings: "Settings",
      profile: "Profile",
      notifications: "Notifications",
      users: "Users",
      groups: "Groups",
    },
    landing: {
      navFeatures: "Platform Features",
      navWorkflow: "Meeting Flow",
      navTrust: "Trust & Safety",
      navGuide: "Guide",
      signIn: "Sign in",
      startPlatform: "Start Platform",
      heroBadge: "Collaborative Banking Meets Structured Group Video",
      heroTitleStart: "Cooperative banking that runs on",
      heroTitleHighlight: "structured meetings",
      heroLead:
        "Community Hub combines secure video-conferencing with real-time VICOBA banking operations, letting groups save, borrow, fine, and record verified minutes inside a single secure virtual space.",
      createGroup: "Create VICOBA Group",
      accessDashboard: "Access Dashboard",
      metricCapital: "Village Banking Capital Pools",
      metricLoan: "Active Loan Disbursement",
      metricAttendance: "Live Meeting Attendance",
      highlightSavingsTitle: "Synchronous Savings (Hisa)",
      highlightSavingsBody:
        "Members buy shares and log savings contributions live during structured meetings. Treasurers verify transaction references on the spot.",
      highlightLoanTitle: "Structured Live Loan Desk",
      highlightLoanBody:
        "Submit loan applications live during virtual sessions. Chairpersons approve or reject requests with real-time interest calculation.",
      highlightRoleTitle: "Granular Role-Based Spaces",
      highlightRoleBody:
        "Run secure VICOBA groups with dedicated interfaces and permissions for Chairperson, Treasurer, Secretary, and Members.",
      workflowTitle: "How the system works",
      workflow01Title: "Schedule & Convene Sessions",
      workflow01Body:
        "The Chairperson schedules recurring savings and loan meetings. Members receive instant email invites with custom calendar links.",
      workflow02Title: "Transact & Collaborate Live",
      workflow02Body:
        "Meet via high-fidelity audio/video. Record contributions, request emergency loans, pay outstanding fines, and log roll-call in one view.",
      workflow03Title: "Ledger Audit & Session Wrap",
      workflow03Body:
        "The Treasurer audits payment references, the Secretary publishes live meeting minutes, and the group balance sheet updates automatically.",
      transparencyTitle: "Trust & Transparency",
      transparencyBody:
        "Every financial action is recorded, reviewed, and reflected in wallets, reports, and group-led processes.",
    },
    guide: {
      title: "How to use the VICOBA system, from first login to leadership workflows.",
      lead:
        "This guide explains what members, leaders, and finance roles should do in the system, how money moves through the group wallet, and how to keep records clean for reporting and accountability.",
      publicAccess: "Public and member access",
      quickStartTitle: "Quick Start",
      step1Title: "1. Join or sign in",
      step1Body:
        "Register or sign in, request to join with the group code, then wait for leadership approval and activation.",
      step2Title: "2. Open your workspace",
      step2Body:
        "Open the group workspace to access members, savings, wallet, loans, fines, meetings, and analytics.",
      step3Title: "3. Follow the process",
      step3Body:
        "Follow transaction status, retry only your own pending savings, and use filtered analytics exports for reconciliation.",
      sectionMembers: "Members",
      sectionLeadership: "Leadership",
      sectionFinance: "Finance Flow",
      sectionSavings: "Savings Process",
      sectionLoans: "Loan Process",
      sectionFines: "Fine Process",
      sectionMeetings: "Meetings",
      sectionAnalytics: "Analytics and Exports",
      walletTitle: "Wallet and reporting rules",
      walletGroupTitle: "Group wallet",
      walletGroupBody:
        "This is the real cash position of the group. Verified savings, loan repayments, and fine payments increase it. Loan disbursements reduce it.",
      walletMemberTitle: "Member wallet",
      walletMemberBody:
        "Every member also has a wallet summary for reporting and analysis. It shows savings, loan exposure, fine exposure, and net balance.",
      leadershipTitle: "Leadership process",
      leadershipChecklistTitle: "Leadership checklist",
      leadershipChecklist1:
        "Confirm member identity before issuing fines or approving requests.",
      leadershipChecklist2:
        "Use the wallet report to verify cash before lending.",
      leadershipChecklist3:
        "Review outstanding member balances before each session ends.",
      leadershipChecklist4:
        "Keep meeting minutes and actions aligned with financial records.",
      loansTitle: "Loans",
      loansBody:
        "Loan requests should come from members inside a group. The system checks verified savings and the current group wallet balance before disbursement. Only the group wallet funds the loan, and repayments return cash back to that wallet.",
      finesTitle: "Fines and penalties",
      finesBody:
        "Leadership can issue fines to a specific member. The member can pay only their own fine, and once paid the money is recorded back into the group wallet and reflected in reports.",
      meetingsTitle: "Meetings",
      meetingsBody:
        "Meetings are where leadership runs the group session, reviews financial activity, records minutes, and keeps the group aligned. Members can use meeting actions as the main place to participate in live group processes.",
      helpTitle: "Need help?",
      helpBody:
        "Start with the dashboard, then move into your group workspace. If you are a leader, focus on the wallet, loans, fines, and meetings pages. If you are a member, use your group dashboard and wallet pages to understand your balances and actions.",
      quickLinkDashboard: "Dashboard",
      quickLinkAnalytics: "Analytics",
      quickLinkWallet: "Wallet",
      quickLinkLoans: "Loans",
      quickLinkFines: "Fines",
      quickLinkMeetings: "Meetings",
    },
  },
  sw: {
    app: {
      name: "Community Hub",
      subtitle: "Jukwaa la Benki ya VICOBA Mtandaoni",
    },
    actions: {
      signIn: "Ingia",
      signOut: "Toka",
      guide: "Mwongozo",
      profile: "Wasifu",
      dashboard: "Dashibodi",
      users: "Watumiaji",
      groups: "Vikundi",
      settings: "Mipangilio",
      notifications: "Taarifa",
      home: "Nyumbani",
      myGroups: "Vikundi Vyangu",
      wallet: "Mkoba",
      savings: "Akiba",
      loans: "Mikopo",
      fines: "Faini",
      meetings: "Vikao",
      analytics: "Uchambuzi wa Fedha",
      members: "Wanachama",
      language: "Lugha",
      english: "Kiingereza",
      swahili: "Kiswahili",
      toggleTheme: "Badilisha mandhari",
      lightMode: "Mandhari nyepesi",
      darkMode: "Mandhari ya giza",
    },
    roles: {
      admin: "Msimamizi",
      staff: "Mfanyakazi",
      member: "Mwanachama",
      chairperson: "Mwenyekiti",
      secretary: "Katibu",
      treasurer: "Mweka Hazina",
      error: "Hitilafu",
    },
    breadcrumb: {
      home: "Nyumbani",
      dashboard: "Dashibodi",
      guide: "Mwongozo",
      wallet: "Mkoba",
      savings: "Akiba",
      loans: "Mikopo",
      fines: "Faini",
      meetings: "Vikao",
      members: "Wanachama",
      settings: "Mipangilio",
      profile: "Wasifu",
      notifications: "Taarifa",
      users: "Watumiaji",
      groups: "Vikundi",
    },
    landing: {
      navFeatures: "Vipengele vya Mfumo",
      navWorkflow: "Mtiririko wa Kikao",
      navTrust: "Uaminifu na Usalama",
      navGuide: "Mwongozo",
      signIn: "Ingia",
      startPlatform: "Anza Mfumo",
      heroBadge: "Ubadilishanaji wa Akiba na Mikutano ya Vikundi",
      heroTitleStart: "Ushirika wa kifedha unaoendeshwa na",
      heroTitleHighlight: "mikutano iliyopangwa",
      heroLead:
        "Community Hub inaunganisha mikutano ya video salama na shughuli za benki za VICOBA kwa wakati halisi, ikiwezesha vikundi kuweka akiba, kukopa, kutoa faini, na kuhifadhi kumbukumbu zilizothibitishwa ndani ya nafasi moja salama.",
      createGroup: "Unda Kikundi cha VICOBA",
      accessDashboard: "Fungua Dashibodi",
      metricCapital: "Mitaji ya Vikundi vya Benki ya Kijamii",
      metricLoan: "Mikopo Iliyotolewa",
      metricAttendance: "Uwepo wa Kikao Hai",
      highlightSavingsTitle: "Akiba ya Pamoja (Hisa)",
      highlightSavingsBody:
        "Wanachama hununua hisa na kurekodi michango ya akiba wakati wa mikutano iliyopangwa. Mweka hazina hukagua marejeo ya miamala papo hapo.",
      highlightLoanTitle: "Dirisha la Mikopo Hai",
      highlightLoanBody:
        "Omba mikopo moja kwa moja wakati wa vikao vya mtandaoni. Mwenyekiti hukubali au kukataa maombi kwa hesabu ya riba ya wakati halisi.",
      highlightRoleTitle: "Nafasi za Majukumu Mahsusi",
      highlightRoleBody:
        "Endesha vikundi salama vya VICOBA vyenye mazingira na ruhusa tofauti kwa Mwenyekiti, Mweka Hazina, Katibu, na Wanachama.",
      workflowTitle: "Jinsi mfumo unavyofanya kazi",
      workflow01Title: "Panga na kuitisha vikao",
      workflow01Body:
        "Mwenyekiti hupanga mikutano ya akiba na mikopo inayojirudia. Wanachama hupokea mialiko ya barua pepe papo hapo yenye viungo maalum vya kalenda.",
      workflow02Title: "Fanya miamala na kushirikiana papo hapo",
      workflow02Body:
        "Kutana kupitia sauti/video ya ubora wa juu. Rekodi michango, omba mikopo ya dharura, lipa faini, na fanya uhakiki wa mahudhurio katika mwonekano mmoja.",
      workflow03Title: "Kagua daftari na kufunga kikao",
      workflow03Body:
        "Mweka Hazina hukagua marejeo ya malipo, Katibu huchapisha kumbukumbu za kikao, na jedwali la mizania ya kikundi husasishwa moja kwa moja.",
      transparencyTitle: "Uaminifu na Uwazi",
      transparencyBody:
        "Kila kitendo cha kifedha kinarekodiwa, hukaguliwa, na kuonekana katika vikoba, ripoti, na michakato inayoendeshwa na kikundi.",
    },
    guide: {
      title: "Jinsi ya kutumia mfumo wa VICOBA, kuanzia kuingia hadi majukumu ya uongozi.",
      lead:
        "Mwongozo huu unaeleza wanachama, viongozi, na majukumu ya fedha wanapaswa kufanya nini ndani ya mfumo, jinsi pesa zinavyopita kwenye mkoba wa kikundi, na jinsi ya kuweka kumbukumbu safi kwa ripoti na uwajibikaji.",
      publicAccess: "Ufikiaji wa umma na wanachama",
      quickStartTitle: "Mwongozo wa Haraka",
      step1Title: "1. Jiunge au ingia",
      step1Body:
        "Jisajili au ingia, omba kujiunga kwa msimbo wa kikundi, kisha subiri idhini na uanzishaji wa uongozi.",
      step2Title: "2. Fungua nafasi yako ya kazi",
      step2Body:
        "Fungua nafasi ya kikundi kupata wanachama, akiba, mkoba, mikopo, faini, vikao, na uchambuzi.",
      step3Title: "3. Fuata taratibu",
      step3Body:
        "Fuatilia hali ya miamala, rudia akiba yako mwenyewe inayosubiri, na tumia ripoti za uchambuzi zilizochujwa kufanya usawazishaji.",
      sectionMembers: "Wanachama",
      sectionLeadership: "Uongozi",
      sectionFinance: "Mtiririko wa Fedha",
      sectionSavings: "Mchakato wa Akiba",
      sectionLoans: "Mchakato wa Mkopo",
      sectionFines: "Mchakato wa Faini",
      sectionMeetings: "Vikao",
      sectionAnalytics: "Uchambuzi na Upakuaji",
      walletTitle: "Kanuni za mkoba na ripoti",
      walletGroupTitle: "Mkoba wa kikundi",
      walletGroupBody:
        "Huu ndio fedha halisi ya kikundi. Akiba zilizothibitishwa, marejesho ya mikopo, na malipo ya faini huongeza mkoba huu. Utoaji wa mikopo hupunguza fedha hizi.",
      walletMemberTitle: "Mkoba wa mwanachama",
      walletMemberBody:
        "Kila mwanachama pia ana muhtasari wa mkoba kwa ripoti na uchambuzi. Unaonyesha akiba, madeni ya mkopo, faini, na salio la mwisho.",
      leadershipTitle: "Mchakato wa uongozi",
      leadershipChecklistTitle: "Orodha ya ukaguzi ya uongozi",
      leadershipChecklist1:
        "Thibitisha utambulisho wa mwanachama kabla ya kutoa faini au kuidhinisha maombi.",
      leadershipChecklist2:
        "Tumia ripoti ya mkoba kuthibitisha pesa kabla ya kukopesha.",
      leadershipChecklist3:
        "Kagua salio la wanachama kabla ya kikao kuisha.",
      leadershipChecklist4:
        "Kumbukumbu za kikao na vitendo ziendane na rekodi za kifedha.",
      loansTitle: "Mikopo",
      loansBody:
        "Maombi ya mkopo yanapaswa kutoka kwa wanachama wa kikundi. Mfumo hukagua akiba iliyothibitishwa na salio la sasa la mkoba wa kikundi kabla ya kutoa fedha. Mkoba wa kikundi pekee ndio hutoa mkopo, na marejesho hurudisha fedha humo.",
      finesTitle: "Faini na adhabu",
      finesBody:
        "Uongozi unaweza kutoa faini kwa mwanachama maalum. Mwanachama anaweza kulipa faini yake pekee, na baada ya kulipa fedha huingia tena kwenye mkoba wa kikundi na kuonekana kwenye ripoti.",
      meetingsTitle: "Vikao",
      meetingsBody:
        "Vikao ndivyo uongozi unavyoendesha kikao cha kikundi, kukagua shughuli za fedha, kurekodi kumbukumbu, na kuhakikisha kikundi kinaendelea kwa mwelekeo mmoja. Wanachama wanaweza kutumia vitendo vya kikao kushiriki moja kwa moja.",
      helpTitle: "Unahitaji msaada?",
      helpBody:
        "Anza na dashibodi, kisha nenda kwenye nafasi yako ya kikundi. Ukiwa kiongozi, zingatia kurasa za mkoba, mikopo, faini, na vikao. Ukiwa mwanachama, tumia dashibodi na ukurasa wa mkoba kuelewa salio na vitendo vyako.",
      quickLinkDashboard: "Dashibodi",
      quickLinkAnalytics: "Uchambuzi",
      quickLinkWallet: "Mkoba",
      quickLinkLoans: "Mikopo",
      quickLinkFines: "Faini",
      quickLinkMeetings: "Vikao",
    },
  },
}

const LANGUAGE_STORAGE_KEY = "community-hub-language"

const getValue = (tree: TranslationTree, path: string): string | undefined => {
  return path.split(".").reduce<string | TranslationTree | undefined>((acc, part) => {
    if (!acc || typeof acc === "string") {
      return undefined
    }
    return acc[part]
  }, tree) as string | undefined
}

export function resolveLanguage(value: string | null | undefined): LanguageCode {
  return value === "sw" ? "sw" : "en"
}

export function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return "en"
  }

  return resolveLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
}

export function setDocumentLanguage(language: LanguageCode) {
  if (typeof document === "undefined") {
    return
  }

  document.documentElement.lang = language
}

export function getTranslation(language: LanguageCode, key: string): string {
  return (
    getValue(translations[language], key) ??
    getValue(translations.en, key) ??
    key
  )
}

const swValidationMessages: Record<string, string> = {
  "Email must contain only letters, numbers, dots or underscores and be a valid email":
    "Barua pepe lazima iwe sahihi na itumie herufi, namba, nukta, au alama ya chini pekee",
  "Phone number must start with 06 or 07 (or +2556/+2557) and be valid":
    "Namba ya simu lazima ianze na 06 au 07 (au +2556/+2557) na iwe sahihi",
  "Password is required": "Nenosiri linahitajika",
  "Password must be at least 8 characters long": "Nenosiri lazima liwe na angalau herufi 8",
  "Password is too long": "Nenosiri ni refu sana",
  "Password must contain at least one lowercase letter":
    "Nenosiri lazima liwe na angalau herufi moja ndogo",
  "Password must contain at least one uppercase letter":
    "Nenosiri lazima liwe na angalau herufi moja kubwa",
  "Password must contain at least one number": "Nenosiri lazima liwe na angalau namba moja",
  "Password must contain at least one special character":
    "Nenosiri lazima liwe na angalau alama moja maalum",
  "Confirm password is required": "Uthibitisho wa nenosiri unahitajika",
  "Passwords do not match": "Manenosiri hayalingani",
  "Invalid email address": "Anwani ya barua pepe si sahihi",
  Required: "Sehemu hii inahitajika",
}

export function translateValidationMessage(language: LanguageCode, message: string): string {
  return language === "sw" ? swValidationMessages[message] ?? message : message
}

export const languageScript = `
  (function () {
    try {
      var storageKey = "${LANGUAGE_STORAGE_KEY}";
      var storedLanguage = window.localStorage.getItem(storageKey);
      var resolvedLanguage = storedLanguage === "sw" ? "sw" : "en";
      document.documentElement.lang = resolvedLanguage;
    } catch (error) {
      document.documentElement.lang = "en";
    }
  })();
`

export { LANGUAGE_STORAGE_KEY }
export { translations }
