export interface UniversityClub {
  id: string; // abbreviation
  name: string; // full club name
  description: string;
  category: 'Career & Business' | 'Science & Academic' | 'Culture & Arts' | 'Social & Service' | 'Media & Leisure';
  portalUrl: string;
}

export const CLUBS_DATA: UniversityClub[] = [
  {
    id: "RUCC",
    name: "Rajshahi University Career Club",
    description: "Bridge between academic departments and professional success, providing skills workshops and job fairs.",
    category: "Career & Business",
    portalUrl: "https://www.facebook.com/club.rucc"
  },
  {
    id: "RUEC",
    name: "Rajshahi University Education Club",
    description: "Promotes accessible coaching, primary education advocacy, and academic mentorship.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruec.official/"
  },
  {
    id: "RURS",
    name: "Rajshahi University Research Society",
    description: "Fosters academic research methodologies, journal publication guidance, and research skill-building.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/rurs.official/"
  },
  {
    id: "RUSC",
    name: "Rajshahi University Science Club",
    description: "Organizes hands-on science workshops, science fairs, and modern astronomical event viewings.",
    category: "Science & Academic",
    portalUrl: "https://www.rusc.org.bd"
  },
  {
    id: "RUBC",
    name: "Rajshahi University Business Club",
    description: "Supports campus entrepreneurs, case-solving competitions, and business communication workshops.",
    category: "Career & Business",
    portalUrl: "https://www.facebook.com/rubc.official"
  },
  {
    id: "RUMUNA",
    name: "Rajshahi University Model United Nation Association",
    description: "Provides debate, geopolitical research, and Model UN training for student delegates.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/rumuna.official"
  },
  {
    id: "RUHSC",
    name: "Rajshahi University Higher Study Club",
    description: "Guides students on international study paths, GRE/IELTS formulation, and research proposals.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruhsc"
  },
  {
    id: "RURF",
    name: "Rajshahi University Readers' Forum",
    description: "Assembles regular book reviewing sessions, literary salons, and reading campaigns.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/rurf.ru/"
  },
  {
    id: "RUB",
    name: "Rajshahi University Education Bondhushava",
    description: "A forum organizing cultural, critical review, and value-based literary initiatives.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/shuvonid.rub"
  },
  {
    id: "BNCC",
    name: "Bangladesh National Cadet Corps",
    description: "Empowers youth with military discipline, civic instruction, physical vigor, and leadership.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/bncc.ru/"
  },
  {
    id: "RURSG",
    name: "Rajshahi University Rover Scout Group",
    description: "Scout exercises, leadership expansion camps, and disaster response preparedness.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/rurovers/"
  },
  {
    id: "BYCWF",
    name: "Bangladesh Youth Column Writer Forum",
    description: "Builds skills in newspaper editorial writing, layout mapping, and creative publications.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/bycwf.ru/"
  },
  {
    id: "RUWS",
    name: "Rajshahi University Writer Society",
    description: "Connects students through poetry readings, short story workshops, and creative writing.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/ruws14/"
  },
  {
    id: "RUDC",
    name: "Rajshahi University Dance Club",
    description: "Preserves traditional Bengali dances and promotes modern choreography across campus.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/rudc.official/"
  },
  {
    id: "RUPC",
    name: "Rajshahi University Photography Club",
    description: "Explores digital exposure formulas, composition mechanics, and annual photo exhibits.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/rupc.official/"
  },
  {
    id: "RUAC",
    name: "Rajshahi University Agriculture Club",
    description: "Teaches modern soil maintenance techniques, climate resilience, and crop engineering.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruac.official/"
  },
  {
    id: "RUFC",
    name: "Rajshahi University Fitness Club",
    description: "Encourages students in physical wellness, gym safety, nutrition, and body conditioning.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/rufc.official/"
  },
  {
    id: "RUDA",
    name: "Rajshahi University Drama Association",
    description: "Nurtures creative playwriting, stage delivery, theatrical scripts, and public performances.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/rudadrama"
  },
  {
    id: "RUTC",
    name: "Rajshahi University Tourist Club",
    description: "Adventures across the country with focus on low-cost travels, trekking, and heritage respect.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/rutc93"
  },
  {
    id: "RURJC",
    name: "Rajshahi University Research and Journal Club",
    description: "Peer discussion networks reviewing academic journals and building data analyses plans.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/rurjc/"
  },
  {
    id: "RUFAC",
    name: "Rajshahi University Fine Arts Club",
    description: "Watercolor galleries, canvas painting camps, and artistic design guidance sessions.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/rufac/"
  },
  {
    id: "GVRU",
    name: "Green Voice Rajshahi University",
    description: "Eco-advocacy campaigns, campus gardening operations, and plastic reuse plans.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/gvrubd/"
  },
  {
    id: "RUDF",
    name: "Rajshahi University Debating Forum",
    description: "Trains students in British parliamentary and Asian format debates to build analytical power.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/rudf.official/"
  },
  {
    id: "GBRU",
    name: "Gold Bangladesh Rajshahi University",
    description: "Focuses on active citizenship, blood donation networks, and moral leadership training.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/gbrajshahi/"
  },
  {
    id: "RUDO",
    name: "Rajshahi University Debating Organisation",
    description: "Encourages logical debate formats, persuasive writing, and national tournament participations.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/rudo.official/"
  },
  {
    id: "CISR",
    name: "Center for Innovation Sustainable Research",
    description: "Researches ecological projects and engineering designs that support green targets.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/cisr.ru/"
  },
  {
    id: "CYB",
    name: "Consumer Youth Bangladesh",
    description: "Promotes awareness on consumer rights, hygienic foods, and public goods validation.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/cybru/"
  },
  {
    id: "RUESC",
    name: "Rajshahi University English Speaking Club",
    description: "Language workshops and conversation circles to advance fluency and general interview confidence.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruesc/"
  },
  {
    id: "RUELC",
    name: "Rajshahi University English Language Club",
    description: "Supports IELTS prep courses, structural syntax drills, and literature studies.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruelc/"
  },
  {
    id: "RUMC",
    name: "Rajshahi University Marketing Club",
    description: "Direct branding hackathons, marketing mock campaigns, and graphic design workshops.",
    category: "Career & Business",
    portalUrl: "https://www.facebook.com/rumc.official/"
  },
  {
    id: "RUAsC",
    name: "Rajshahi University Astronomy Club",
    description: "Features space telescopes alignments, model-making, and stargazing sessions, sparking curiosity for science.",
    category: "Science & Academic",
    portalUrl: "https://www.facebook.com/ruasc/"
  },
  {
    id: "NGF",
    name: "Nobojagoron Foundation",
    description: "A development foundation supporting the education of underprivileged and street children at Rajshahi.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/Nobojagoron/"
  },
  {
    id: "RUDwC",
    name: "Rajshahi University Dawah Community",
    description: "Promotes moral values, peer harmony, interfaith understanding, and ethical guidelines on campus.",
    category: "Social & Service",
    portalUrl: "https://www.facebook.com/rudawah/"
  },
  {
    id: "RUC",
    name: "Rajshahi University Cyclist",
    description: "Bicycle rallies, environment conservation runs, and daily active commuting campaigns.",
    category: "Media & Leisure",
    portalUrl: "https://www.facebook.com/rucyclist/"
  },
  {
    id: "BULF",
    name: "Bangla Urdu Literary Forum",
    description: "Explores combined Bengali and Urdu histories, translation cycles, and classic lyric analyses.",
    category: "Culture & Arts",
    portalUrl: "https://www.facebook.com/bulf.ru/"
  }
];
