/**
 * Default website content, shaped exactly like the payload the live site
 * receives from WMS.
 *
 * The nineteen themes read their content from `useTenantStore`, so the studio
 * edits that same shape rather than inventing a parallel one. That is what lets
 * the editor drive a theme without a single change to the theme itself, and it
 * is why the export is already close to an API body.
 *
 * Every value here is sample content for a fictional institution.
 */

import type { SiteRecord, TenantContent } from "@/studio/types";

const IMAGES = {
  campus: "/about.jpg",
  building: "/ict-2019.webp",
  classroom: "/erp-dashboard.webp",
  people: "/preview.png",
  award: "/award_1.jpg",
  award2: "/award_2.png",
  device: "/mobile-01.png",
  laptop: "/laptop.png",
  pattern: "/pattern.png",
  logo: "/logo.png",
};

const MENU = [
  { title: "Home", slug: "/", children: [] },
  {
    title: "About",
    slug: "/about-us",
    children: [
      { title: "Our Story", slug: "/about-us" },
      { title: "Leadership", slug: "/board-members" },
      { title: "Facilities", slug: "/facilities" },
    ],
  },
  {
    title: "Academics",
    slug: "/programs",
    children: [
      { title: "Programs", slug: "/programs" },
      { title: "Faculty", slug: "/team" },
      { title: "Downloads", slug: "/downloads" },
    ],
  },
  { title: "Admissions", slug: "/admission", children: [] },
  { title: "Gallery", slug: "/gallery", children: [] },
  { title: "News", slug: "/news", children: [] },
  { title: "Contact", slug: "/contact", children: [] },
];

const SOCIAL = [
  { name: "Facebook", link: "https://facebook.com" },
  { name: "Instagram", link: "https://instagram.com" },
  { name: "LinkedIn", link: "https://linkedin.com" },
  { name: "YouTube", link: "https://youtube.com" },
];

const post = (
  id: number,
  type: string,
  title: string,
  summary: string,
  image: string | null,
  date: string,
) => ({
  id,
  type,
  title,
  slug: title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  summary,
  description: `<p>${summary}</p>`,
  image,
  date,
  createdAt: date,
  rank: id,
});

/**
 * Builds a complete content payload for a site.
 *
 * @param {{ id: string, schoolName: string, domain: string, estdYear?: string,
 *           address?: string, email?: string, phone?: string,
 *           slogan?: string, themeId?: string }} site
 */
export function createDefaultContent(site: SiteRecord): TenantContent {
  const name = site.schoolName;
  const shortName = name.split(" ")[0];

  return {
    domain: site.domain,

    layout: {
      profile: {
        name,
        schoolName: name,
        slogan: site.slogan || "Learning that lasts a lifetime",
        description: `${name} has been educating students since ${site.estdYear || "1998"}, combining rigorous academics with the space to grow.`,
        metaDescription: `${name} — admissions, programmes, faculty and campus life.`,
        logo: IMAGES.logo,
        whiteLogo: IMAGES.logo,
        banner: IMAGES.building,
        address: site.address || "Lalitpur, Bagmati Province, Nepal",
        email: site.email || `info@${site.domain}`,
        phone: site.phone || "+977-1-5555555",
        mobileNumber: site.mobile || "+977-9800000000",
        estdYear: site.estdYear || "1998",
        officeTime: "Sun – Fri, 7:00 AM – 4:00 PM",
        officeHour: "Sun – Fri, 7:00 AM – 4:00 PM",
        domainName: site.domain,
        onlineApplicationUrl: `https://${site.domain}/apply`,
        onlineEntranceLoginUrl: `https://${site.domain}/entrance`,
        virtualTourLink: "",
        mapUrl: "https://maps.google.com/?q=Lalitpur",
        googleMap: "https://maps.google.com/?q=Lalitpur",
      },
      menu: MENU,
      socialMedias: SOCIAL,
      adminThemes: { uniqueCode: site.themeId || "theme-1" },
    },

    home: {
      title: `Welcome to ${name}`,
      summary: `${name} prepares students for university and for the work that follows it.`,
      image: IMAGES.campus,
    },

    slider: [
      {
        id: 1,
        title: `Welcome to ${name}`,
        summary: "A campus built around curiosity, rigour and the confidence to ask better questions.",
        image: IMAGES.campus,
        link: "/about-us",
        buttonText: "Discover the campus",
      },
      {
        id: 2,
        title: "Admissions open for the new session",
        summary: "Applications for Grade XI and undergraduate programmes close at the end of the month.",
        image: IMAGES.building,
        link: "/admission",
        buttonText: "Apply now",
      },
      {
        id: 3,
        title: "Learning that goes beyond the classroom",
        summary: "Laboratories, studios, playing fields and a library that stays open when you need it.",
        image: IMAGES.classroom,
        link: "/facilities",
        buttonText: "See facilities",
      },
    ],

    aboutUs: {
      id: 1,
      title: `About ${shortName}`,
      summary: `Founded in ${site.estdYear || "1998"}, ${name} grew from a single building into a campus of more than two thousand students. What has not changed is the belief that a good school is measured by what its students do next.`,
      description: `<p>Founded in ${site.estdYear || "1998"}, ${name} grew from a single building into a campus of more than two thousand students.</p>`,
      image: IMAGES.campus,
      buttonText: "Read our story",
      buttonLink: "/about-us",
    },

    statistics: [
      { id: 1, name: "Students", figure: "2,400", icon: "users" },
      { id: 2, name: "Teachers", figure: "180", icon: "graduation-cap" },
      { id: 3, name: "Programs", figure: "24", icon: "book" },
      { id: 4, name: "Graduates", figure: "12,000", icon: "award" },
    ],

    program: [
      post(1, "program", "Science (Physics, Chemistry, Biology)", "A laboratory-led programme for students heading into medicine, engineering and research.", IMAGES.classroom, "2026-01-12"),
      post(2, "program", "Management and Economics", "Case-based teaching in accounting, economics and business studies.", IMAGES.building, "2026-01-12"),
      post(3, "program", "Computer Science", "Programming, systems and data, taught on the machines students will actually use.", IMAGES.laptop, "2026-01-12"),
      post(4, "program", "Humanities and Social Sciences", "History, sociology and political science for students who want to argue well.", IMAGES.campus, "2026-01-12"),
    ],

    service: [
      { id: 1, key: "library", title: "Library", summary: "40,000 volumes and a quiet floor that stays open until nine.", icon: "book-open", href: "/facilities" },
      { id: 2, key: "transport", title: "Transport", summary: "Eighteen routes across the valley, tracked live.", icon: "bus", href: "/facilities" },
      { id: 3, key: "hostel", title: "Hostel", summary: "Separate residences with resident tutors and a study hour.", icon: "home", href: "/facilities" },
      { id: 4, key: "counselling", title: "Counselling", summary: "Academic and university guidance from Grade IX onward.", icon: "heart-handshake", href: "/contact" },
    ],

    facility: [
      { id: 1, title: "Science Laboratories", summary: "Six laboratories for physics, chemistry and biology.", image: IMAGES.classroom },
      { id: 2, title: "Library", summary: "A reading room, a reference collection and forty thousand volumes.", image: IMAGES.building },
      { id: 3, title: "Sports Complex", summary: "Courts, a field and an indoor hall used year round.", image: IMAGES.campus },
      { id: 4, title: "Computer Labs", summary: "Two hundred workstations with campus-wide fibre.", image: IMAGES.laptop },
    ],

    testimonial: [
      { id: 1, title: "Anisha Shrestha", summary: "Class of 2021, now at Kathmandu University", description: "The teachers here expected more of me than I did, and that turned out to be the point.", image: IMAGES.people, rating: 5 },
      { id: 2, title: "Bikash Gurung", summary: "Parent", description: "Reports arrive on time, calls get answered, and my daughter actually wants to go in the morning.", image: IMAGES.people, rating: 5 },
      { id: 3, title: "Dr. Sunita Rai", summary: "Head of Science", description: "We were given real laboratories and then trusted to use them. That is rarer than it should be.", image: IMAGES.people, rating: 5 },
    ],

    team: [
      { id: 1, title: "Rajan Maharjan", subtitle: "Principal", designation: "Principal", category: "Leadership", image: IMAGES.people },
      { id: 2, title: "Sunita Rai", subtitle: "Head of Science", designation: "Head of Science", category: "Academics", image: IMAGES.people },
      { id: 3, title: "Prakash Thapa", subtitle: "Head of Mathematics", designation: "Head of Mathematics", category: "Academics", image: IMAGES.people },
      { id: 4, title: "Meera Karki", subtitle: "Student Counsellor", designation: "Student Counsellor", category: "Student Life", image: IMAGES.people },
    ],

    board: [
      {
        id: 1,
        name: "Board of Directors",
        members: [
          { id: 1, name: "Hari Prasad Sharma", title: "Hari Prasad Sharma", designation: "Chairperson", image: IMAGES.people, message: "Our responsibility is to keep this a place where teaching comes first." },
          { id: 2, name: "Nirmala Adhikari", title: "Nirmala Adhikari", designation: "Vice Chairperson", image: IMAGES.people, message: "We measure ourselves by what our graduates go on to do." },
        ],
      },
    ],

    boardMessage: [
      post(1, "board", "A message from the Principal", "Every year we ask the same question: are our students leaving more capable than they arrived? The answer is what shapes the year ahead.", IMAGES.people, "2026-02-01"),
    ],

    album: [
      { id: 1, name: "Annual Day 2026", thumbnail: IMAGES.campus, galleries: [{ id: 1, image: IMAGES.campus }, { id: 2, image: IMAGES.building }] },
      { id: 2, name: "Science Exhibition", thumbnail: IMAGES.classroom, galleries: [{ id: 3, image: IMAGES.classroom }] },
      { id: 3, name: "Sports Week", thumbnail: IMAGES.award, galleries: [{ id: 4, image: IMAGES.award }] },
    ],

    news: [
      post(1, "news", "Admissions open for the 2026 session", "Applications for Grade XI and undergraduate programmes are now open.", IMAGES.building, "2026-03-02"),
      post(2, "news", "Students win the national science olympiad", "Three of our Grade XII students placed in the top ten nationally.", IMAGES.award, "2026-02-18"),
      post(3, "news", "New computer laboratory opens", "Two hundred workstations and campus-wide fibre went live this month.", IMAGES.laptop, "2026-02-04"),
    ],

    event: [
      post(1, "event", "Open House", "Tour the campus, meet the faculty and sit in on a class.", IMAGES.campus, "2026-04-12"),
      post(2, "event", "Annual Sports Day", "Track, field and inter-house finals across a single afternoon.", IMAGES.award2, "2026-04-26"),
      post(3, "event", "Parents' Evening", "Term reports, one-to-one meetings and a look at next term's plan.", IMAGES.building, "2026-05-09"),
    ],

    notice: [
      post(1, "notice", "Term examination schedule published", "The full timetable is available in the downloads section.", IMAGES.pattern, "2026-03-10"),
      post(2, "notice", "Holiday notice", "The campus will remain closed for the national holiday.", IMAGES.pattern, "2026-03-04"),
      post(3, "notice", "Scholarship applications close Friday", "Merit and need-based applications must be submitted by 4:00 PM.", IMAGES.pattern, "2026-02-25"),
    ],

    blog: [
      post(1, "blog", "How we teach mathematics differently", "Fewer worked examples, more time spent being stuck productively.", IMAGES.classroom, "2026-02-20"),
      post(2, "blog", "What a good school library looks like in 2026", "It is quieter than you expect, and busier.", IMAGES.building, "2026-01-30"),
    ],

    client: [
      { id: 1, title: "Kathmandu University", image: IMAGES.logo },
      { id: 2, title: "Tribhuvan University", image: IMAGES.logo },
      { id: 3, title: "British Council", image: IMAGES.logo },
      { id: 4, title: "NIST", image: IMAGES.logo },
    ],

    faq: [
      post(1, "faq", "When do admissions open?", "Applications open in Falgun and close at the end of Chaitra each year.", null, "2026-01-01"),
      post(2, "faq", "Is transport available?", "Eighteen routes cover the Kathmandu valley, tracked live from the parent app.", null, "2026-01-01"),
      post(3, "faq", "Are scholarships available?", "Both merit and need-based scholarships are offered every session.", null, "2026-01-01"),
    ],

    downloads: [
      post(1, "downloads", "Admission form 2026", "PDF, 240 KB", null, "2026-01-15"),
      post(2, "downloads", "Academic calendar", "PDF, 180 KB", null, "2026-01-15"),
    ],

    portfolio: [],
    career: [],
    privacyPolicy: post(1, "privacy", "Privacy Policy", "How we handle student and parent data.", null, "2026-01-01"),
    terms: post(1, "terms", "Terms of Use", "Terms governing use of this website.", null, "2026-01-01"),
    copyright: [post(1, "copyright", `© ${new Date().getFullYear()} ${name}`, `All rights reserved. ${name}, ${site.address || "Lalitpur, Nepal"}.`, null, "2026-01-01")],
  };
}
