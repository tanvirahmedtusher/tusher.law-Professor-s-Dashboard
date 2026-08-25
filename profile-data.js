/**
 * Academic Researcher Profile - Master Seed Data
 * Source of Truth: Tusher_CV.md
 */

const DEFAULT_PROFILE_DATA = {
  name: "Tanvir Ahmed Tusher",
  degreeStatus: "Bachelor of Laws (LL.B.) — Ongoing (Final Year)",
  degreeProgressPct: 88, // Final year completion
  tagline: "Tanvir Ahmed Tusher researches how law responds when the ground shifts under it. AI systems making decisions no statute anticipated, climate change pushing people out of their homes, human rights frameworks built for a world that no longer quite exists. He thinks accountability has to be part of a system's design, not something bolted on after the harm is done. Most of his work asks the same question in different settings: who gets left out when new governance gets written, and how do you write them back in.",
  institution: "Noakhali Science and Technology University",
  department: "Department of Law",
  location: "Maijdee, Noakhali, Bangladesh",
  email: "tusher.law@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/tanvir-ahmed77",
    orcid: "https://orcid.org/0009-0001-1764-9178",
    googleScholar: "https://scholar.google.com/citations?user=t9cr7sQAAAAJ&hl=en&authuser=3"
  },
  
  researchAreas: [
    "Public International Law (Human Rights, Environmental)",
    "Artificial Intelligence & Digital Governance",
    "Climate Change Law & Policy"
  ],
  
  highlights: [
    {
      icon: "star",
      title: "Featured & 'Recommended' by Prof. Lawrence B. Solum",
      detail: "IGI Global book chapter on AI infrastructure and TWAIL energy-water nexus featured on Legal Theory Blog (Texas A&M University School of Law)."
    },
    {
      icon: "award",
      title: "Outstanding Paper Award (2026)",
      detail: "Awarded at the 3rd IUB Undergraduate Law Students' Research Conference for AI integration research in Bangladesh summary trials."
    },
    {
      icon: "target",
      title: "Top 14th Scorer Nationally among 716 (2025)",
      detail: "Ranked 14th out of 716 nationwide participants in the Climate Olympiad Round at CPD Climate Week 2025."
    }
  ],
  
  relevantCourses: {
    undergraduate: [
      "Constitutional Law of Bangladesh",
      "Constitutions of the UK, USA & India",
      "Public International Law",
      "Law of the Sea"
    ],
    esdrSessions: [
      {
        title: "Climate Change, the Right to Food, and the Digital Turn: Emerging Legal Challenges",
        instructor: "Mr. Amiel Ian Valdez",
        affiliation: "Research Fellow, Centre for International Law, National University of Singapore"
      },
      {
        title: "Introduction to Digital Technology, Right to Science and Digital Technology & Privacy, Personal Data and ESDR",
        instructor: "Dr. Mohammad Ershadul Karim",
        affiliation: "Faculty of Law, University of Malaya"
      },
      {
        title: "Artificial Intelligence and Legal Personality & AI and International Law: Human Rights Perspective",
        instructor: "Dr. Bhanu Pratap",
        affiliation: "Assistant Professor, University of Lucknow"
      },
      {
        title: "AI and Artificial Wombs: A New Era of Reproduction or a violation of Natural Laws?",
        instructor: "Dr. Pyali Chatterjee",
        affiliation: "Faculty of Law"
      },
      {
        title: "State Responsibility for the Infringement of International Human Rights in Cyberspace: Question of Attribution",
        instructor: "Asst. Prof. Md. Mostafa Hosain",
        affiliation: "Department of Law"
      },
      {
        title: "AI and Human Rights Governance",
        instructor: "Asst. Prof. Puja Silwal, Dr. Amritha V. Shenoy",
        affiliation: "Kathmandu School of Law"
      }
    ]
  },
  
  leadership: [
    {
      role: "Team Researcher",
      org: "Philip C. Jessup, Dr. Paras Diwan, Henry Dunant & NILS Mooting School Competitions",
      detail: "Prepared memorials and complex legal research under competitive academic conditions (2024–2025).",
      years: "2024–2025"
    },
    {
      role: "Memorial Evaluator",
      org: "LEX SUPRIMA (Rajshahi University) & JKKNIU NILS Chapter",
      detail: "Evaluated competitive moot court memorials and doctrinal submissions.",
      years: "2025"
    },
    {
      role: "Adjudicator",
      org: "SCLS Intra Moot Court Competition, Chittagong University",
      detail: "Adjudicated oral arguments in intra-university rounds.",
      years: "2025–2026"
    },
    {
      role: "Workshop Facilitator",
      org: "Leading University Moot Court Society (LUMCS)",
      detail: "Conducted “The Art of Mooting” workshop, designing and delivering training for junior mooters (Oct 2025).",
      years: "October 2025"
    },
    {
      role: "Campus Envoy",
      org: "NILS-LEB National Model Legislative Assembly",
      detail: "Represented NSTU Department of Law and coordinated parliamentary delegation.",
      years: "2025"
    },
    {
      role: "Active Member",
      org: "NILS Bangladesh",
      detail: "Participated in national legal advocacy, research symposiums, and mooting schools.",
      years: "2024–Present"
    }
  ],
  
  researchExperience: [
    {
      title: "A Field Research Report on the Problem of Access to Justice for Marginalized Communities in Bangladesh",
      context: "Year 2, Term II | Department of Law, NSTU",
      methodology: "Qualitative field inquiry",
      detail: "Investigated structural access-to-justice impediments among marginalized socio-economic communities in coastal Bangladesh."
    },
    {
      title: "Institutional Legal Literacy Among Law Students at NSTU: A Survey-Based Study on Awareness of the NSTU Act 2001",
      context: "Year 3, Term II | Department of Law, NSTU",
      methodology: "Mixed-methods survey",
      detail: "Conducted a pilot empirical survey across 5 year cohorts assessing institutional awareness of governing university legislation."
    },
    {
      title: "Ecological Thinking in Post-Liberation Bangladesh: Modernization, Environmental Law, and the Roots of Present Vulnerability",
      context: "Mentor: Meghna Guhathakurta (Emeritus Prof., Dept of IR, Dhaka University), Liberation War Museum",
      methodology: "Archival-interpretive; close reading of state planning documents through path dependence and political ecology frameworks",
      detail: "Historical-institutional analysis tracing Bangladesh's contemporary environmental fragility to post-liberation reconstruction logics in Five-Year Plans (1973–2025)."
    },
    {
      title: "Draft Convention 'SAARC Convention On Economic, Social, Cultural And Development Rights And Digital Technology'",
      context: "17th International Residential School on ESDR, Kathmandu School of Law",
      methodology: "Multilateral treaty drafting and diplomatic simulation",
      detail: "Drafted regional human rights convention text with mock SAARC Summit negotiation and plenary presentation."
    }
  ],
  
  publications: [
    {
      id: "pub-1",
      title: "The Deleted Registry: TWAIL, UNGA Resolution A/80/L.65, and the Subversion of Climate Reparations",
      venue: "Research & Policy Integration for Development (RAPID) ISSN: 3079-7934 (Vol. 07, Issue 02)",
      type: "Journal Article",
      status: "Under Revision",
      stage: "under_revision", // 'under_revision' | 'in_review' | 'minor_revision' | 'forthcoming' | 'published'
      year: "2026",
      note: "Under revision with moderate review"
    },
    {
      id: "pub-2",
      title: "Governing the Invisible Giant: TWAIL, the Energy-Water Nexus, and the International Legal Void in AI Infrastructure",
      venue: "IGI Global Scientific Publications (Book Chapter)",
      type: "Book Chapter",
      status: "Forthcoming",
      stage: "forthcoming",
      year: "Oct–Nov 2026",
      note: "Featured & marked 'Recommended' by Prof. Lawrence B. Solum (Texas A&M University School of Law, Legal Theory Blog)"
    },
    {
      id: "pub-3",
      title: "The UNFCCC Loss and Damage Regime, the ICJ Advisory Opinion, and the Structural Limits of Climate Accountability: A South Asian TWAIL Perspective",
      venue: "Daengku: Journal of Humanities and Social Sciences Innovation ISSN: 2775-6165 (Vol. 6 No. 3)",
      type: "Journal Article",
      status: "Minor Revision",
      stage: "minor_revision",
      year: "2026",
      note: "Reviewed with minor revision"
    },
    {
      id: "pub-4",
      title: "Navigating the Legal Architecture of AI: Governance and Liability for Disaster Mitigation",
      venue: "IGI Global Scientific Publications (Book Chapter)",
      type: "Book Chapter",
      status: "Forthcoming",
      stage: "forthcoming",
      year: "Oct–Nov 2026",
      note: "Forthcoming Book Chapter"
    },
    {
      id: "pub-5",
      title: "Cost-Effective and Accessible Justice: AI Integration in Bangladesh's Summary Trials",
      venue: "Conference Proceedings (3rd IUB Undergraduate Law Students' Research Conference)",
      type: "Conference Proceedings",
      status: "Forthcoming",
      stage: "forthcoming",
      year: "Sept–Oct 2026",
      note: "Proceedings forthcoming"
    }
  ],
  
  conferencePresentations: [
    {
      title: "Governance by design: path dependence and development failure in Bhasan Char's refugee relocation",
      venue: "1st JURS International Conference on Interdisciplinary Research for Sustainability, Innovation and Global Challenges (JICIRSIGC 2026), Jahangirnagar University Research Society",
      date: "29th August 2026",
      upcoming: true
    },
    {
      title: "De Facto Displacement, De Jure Silence: The Climate-Refugee Nexus in South Asia Through a TWAIL Lens",
      venue: "International Conference on Evolving Protection Architectures in South Asia 2026 (ICERPASA 2026), University of Chittagong & BCRLS",
      date: "2026",
      upcoming: false
    },
    {
      title: "Cost-Effective and Accessible Justice: AI Integration in Bangladesh's Summary Trials",
      venue: "3rd IUB Undergraduate Law Students' Research Conference 2026, Independent University Bangladesh",
      date: "2026",
      upcoming: false
    },
    {
      title: "From Teraflops to Thirst: Governing the Resource Footprint of AI through the Prism of Human Rights",
      venue: "International Conference on Artificial Intelligence and Digital Governance 2025, CDIPR",
      date: "2025",
      upcoming: false
    },
    {
      title: "The Governance Lacuna in Climate Adaptation: Repositioning Waste Management as Critical Resilience Infrastructure",
      venue: "Environment & Changing Climate Conference 2025 (ECC 2025)",
      date: "2025",
      upcoming: false
    },
    {
      title: "Towards Climate Justice after Post-Revolution: Reconstructing Legal Pathways Through the Prism of International Norms",
      venue: "LEB-BSIL-UAP International Law Conference 2025, University of Asia Pacific",
      date: "2025",
      upcoming: false
    }
  ],
  
  awards: [
    {
      title: "Outstanding Paper Award",
      context: "3rd IUB Undergraduate Law Students' Research Conference",
      year: "2026"
    },
    {
      title: "Grade A — Diploma in ESDR & Digital Technology",
      context: "17th International Residential School, Kathmandu School of Law, Nepal",
      year: "2026"
    },
    {
      title: "Best Participant",
      context: "4th Research Methodology Course, Liberation War Museum",
      year: "2026"
    },
    {
      title: "Top 10 Research Article",
      context: "Article/Blog Writing Competition, BD Opinion Juris",
      year: "2025"
    },
    {
      title: "Top 14th Scorer among 716 Participants",
      context: "Climate Olympiad Round (CPD Climate Week 2025)",
      year: "2025"
    },
    {
      title: "Most Promising Member of Parliament Award",
      context: "NILS-LEB National Model Legislative Assembly",
      year: "2025"
    },
    {
      title: "Best Reviewer Award",
      context: "8th NILS Mooting School",
      year: "2024"
    },
    {
      title: "3rd on Researcher's Test",
      context: "Dr. Paras Diwan Memorial International Energy Law Moot Court Competition",
      year: "2025"
    },
    {
      title: "6th Ranked Memorial (Prosecution)",
      context: "Philip C. Jessup International Law Moot Court Competition (Bangladesh Rounds)",
      year: "2025"
    },
    {
      title: "7th Best Team Award",
      context: "Philip C. Jessup International Law Moot Court Competition (Bangladesh Rounds)",
      year: "2025"
    },
    {
      title: "Best New Team Award",
      context: "Philip C. Jessup International Law Moot Court Competition (Bangladesh Rounds)",
      year: "2025"
    }
  ],
  
  coursesCertifications: [
    {
      title: "Energy Transition School 2026",
      org: "Coastal Livelihood and Environmental Action Network (CLEAN) & Bangladesh Working Group on Ecology and Development (BWGED)",
      year: "2026",
      note: "Energy transition, fossil fuel phaseout and climate justice."
    },
    {
      title: "Spring School on International Law (2026)",
      org: "International Institute for Strategic Research",
      year: "2026",
      note: "Public international law paradigms and regional security."
    },
    {
      title: "17th International Residential School on Economic Social and Development Rights (ESDR) & Digital Technology",
      org: "Kathmandu School of Law, Nepal",
      year: "2025–2026",
      note: "Completed with Grade A distinction."
    },
    {
      title: "4th Research Methodology Course",
      org: "Liberation War Museum",
      year: "2026",
      note: "Awarded Best Participant."
    },
    {
      title: "10th Winter School on “Re-imagining Peace Education: A Changing World of Atrocities”",
      org: "Center for Study of Genocide and Justice (CSGJ), Liberation War Museum",
      year: "2025",
      note: "Transitional justice and humanitarian law."
    },
    {
      title: "8th NILS Mooting School (2024)",
      org: "NILS Bangladesh",
      year: "2024",
      note: "Memorial drafting and oral advocacy."
    },
    {
      title: "National Moot Workshop (2024)",
      org: "Society for Critical Legal Studies (SCLS)",
      year: "2024",
      note: "Critical jurisprudence and appellate advocacy."
    }
  ],
  
  skills: {
    soft: ["Advocacy", "Public Speaking", "Team Leadership", "Moot Court Adjudication", "Workshop Facilitation"],
    research: ["Legal Research", "Doctrinal Analysis", "Qualitative Field Inquiry", "Survey-Based Empirical Research", "Archival-Interpretive Analysis", "Treaty Drafting"]
  },
  
  languages: [
    { language: "Bengali", level: "Native / Bilingual Proficiency" },
    { language: "English", level: "Full Professional Proficiency" }
  ],
  
  references: [
    {
      name: "Badsha Mia",
      title: "Associate Professor",
      org: "Department of Law, Noakhali Science and Technology University",
      email: "badsha.law@nstu.edu.bd"
    },
    {
      name: "Ashfaque Ahmed",
      title: "Asst. Registrar (Admin)",
      org: "High Court Division, Supreme Court of Bangladesh",
      email: "ashfaque1071@gmail.com"
    }
  ]
};

if (typeof window !== 'undefined') {
  window.PROFILE_DATA = DEFAULT_PROFILE_DATA;
}
