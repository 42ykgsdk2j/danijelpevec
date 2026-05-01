// Family Business Readiness Assessment — questions, dimensions, scoring,
// and profile narratives. Bilingual (EN/HR). 18 questions across 6
// dimensions, 3 questions each, scored 0–3 per option (max 9 per dimension,
// max 54 overall).

const ASSESSMENT_DIMENSIONS = [
  {
    id: "founder",
    en: { name: "Founder Readiness", short: "Founder", desc: "Your readiness to step back, your relationship to control, and the existence of a defined next chapter for yourself." },
    hr: { name: "Spremnost osnivača", short: "Osnivač", desc: "Vaša spremnost da se povučete, odnos prema kontroli i postojanje definiranog sljedećeg poglavlja za vas." },
  },
  {
    id: "nextgen",
    en: { name: "Next Generation", short: "Next-gen", desc: "Whether the next generation is willing, capable and prepared to take on responsibility." },
    hr: { name: "Sljedeća generacija", short: "Nasljednici", desc: "Je li sljedeća generacija voljna, sposobna i pripremljena preuzeti odgovornost." },
  },
  {
    id: "governance",
    en: { name: "Governance", short: "Governance", desc: "Formal structures — board, family council, family constitution — that survive the founder." },
    hr: { name: "Upravljanje", short: "Upravljanje", desc: "Formalne strukture — uprava, obiteljsko vijeće, obiteljski ustav — koje nadživljavaju osnivača." },
  },
  {
    id: "communication",
    en: { name: "Family Communication", short: "Communication", desc: "How openly the family discusses succession, wealth, expectations and disagreement." },
    hr: { name: "Obiteljska komunikacija", short: "Komunikacija", desc: "Koliko otvoreno obitelj raspravlja o sukcesiji, imovini, očekivanjima i neslaganjima." },
  },
  {
    id: "ownership",
    en: { name: "Ownership & Legal", short: "Ownership", desc: "Shareholders' agreements, transfer rules, divorce / death contingencies, separation of ownership and management." },
    hr: { name: "Vlasništvo i pravo", short: "Vlasništvo", desc: "Dioničarski sporazumi, pravila prijenosa, scenariji razvoda / smrti, razdvajanje vlasništva i menadžmenta." },
  },
  {
    id: "legacy",
    en: { name: "Legacy & Purpose", short: "Legacy", desc: "Articulated purpose for the wealth beyond financial return; vehicles like foundations; long-term vision." },
    hr: { name: "Nasljeđe i svrha", short: "Nasljeđe", desc: "Artikulirana svrha imovine iznad financijskog povrata; vozila poput zaklada; dugoročna vizija." },
  },
];

const ASSESSMENT_QUESTIONS = [
  // ===== Founder Readiness =====
  {
    id: "Q1", dim: "founder",
    en: {
      q: "When you imagine stepping back from day-to-day leadership, how clear are you on what your next chapter looks like?",
      options: [
        { score: 0, text: "I haven't really thought about it" },
        { score: 1, text: "I have vague ideas but nothing defined" },
        { score: 2, text: "I have a general direction" },
        { score: 3, text: "I have a clear, defined next chapter" },
      ],
    },
    hr: {
      q: "Kada zamislite da se povlačite iz svakodnevnog vodstva, koliko vam je jasno kako izgleda vaše sljedeće poglavlje?",
      options: [
        { score: 0, text: "Nisam stvarno razmišljao o tome" },
        { score: 1, text: "Imam nejasne ideje, ali ništa definirano" },
        { score: 2, text: "Imam opći smjer" },
        { score: 3, text: "Imam jasno, definirano sljedeće poglavlje" },
      ],
    },
  },
  {
    id: "Q2", dim: "founder",
    en: {
      q: "How comfortable are you when decisions in the business are made differently than you would make them?",
      options: [
        { score: 0, text: "Very uncomfortable — I would step back in" },
        { score: 1, text: "Reluctantly accepting" },
        { score: 2, text: "Mostly comfortable" },
        { score: 3, text: "Fully comfortable — I trust the process" },
      ],
    },
    hr: {
      q: "Koliko vam je ugodno kada se odluke u poslu donose drugačije nego što biste ih vi donijeli?",
      options: [
        { score: 0, text: "Vrlo neugodno — vratio bih se" },
        { score: 1, text: "Nevoljko prihvaćam" },
        { score: 2, text: "Uglavnom ugodno" },
        { score: 3, text: "Potpuno ugodno — vjerujem procesu" },
      ],
    },
  },
  {
    id: "Q3", dim: "founder",
    en: {
      q: "When were you last unavailable from the business for four or more consecutive weeks without a crisis arising?",
      options: [
        { score: 0, text: "Never — that would not be possible" },
        { score: 1, text: "Years ago, with extensive preparation" },
        { score: 2, text: "Within the past two years" },
        { score: 3, text: "Routinely or recently, without disruption" },
      ],
    },
    hr: {
      q: "Kada ste posljednji put bili odsutni iz posla četiri ili više tjedana zaredom bez da je nastupila kriza?",
      options: [
        { score: 0, text: "Nikad — to ne bi bilo moguće" },
        { score: 1, text: "Prije više godina, uz opsežnu pripremu" },
        { score: 2, text: "Unutar zadnje dvije godine" },
        { score: 3, text: "Rutinski ili nedavno, bez ometanja" },
      ],
    },
  },

  // ===== Next Generation =====
  {
    id: "Q4", dim: "nextgen",
    en: {
      q: "How clear is the next generation on whether they want to be involved in the family business?",
      options: [
        { score: 0, text: "We have never discussed it explicitly" },
        { score: 1, text: "It has been hinted at but not decided" },
        { score: 2, text: "Some have expressed clear preferences" },
        { score: 3, text: "All have made considered, informed decisions" },
      ],
    },
    hr: {
      q: "Koliko je sljedećoj generaciji jasno žele li biti uključeni u obiteljski posao?",
      options: [
        { score: 0, text: "Nikad nismo eksplicitno razgovarali o tome" },
        { score: 1, text: "Naznačeno je, ali nije odlučeno" },
        { score: 2, text: "Neki su izrazili jasne preferencije" },
        { score: 3, text: "Svi su donijeli promišljene, informirane odluke" },
      ],
    },
  },
  {
    id: "Q5", dim: "nextgen",
    en: {
      q: "Have any next-generation family members worked outside the family business in real roles for three or more years?",
      options: [
        { score: 0, text: "No" },
        { score: 1, text: "One has, briefly" },
        { score: 2, text: "Some have, with substantial experience" },
        { score: 3, text: "All who plan to be involved have done so" },
      ],
    },
    hr: {
      q: "Jesu li članovi sljedeće generacije radili izvan obiteljskog posla u stvarnim ulogama tri ili više godina?",
      options: [
        { score: 0, text: "Ne" },
        { score: 1, text: "Jedan jest, kratko" },
        { score: 2, text: "Neki jesu, s ozbiljnim iskustvom" },
        { score: 3, text: "Svi koji planiraju biti uključeni" },
      ],
    },
  },
  {
    id: "Q6", dim: "nextgen",
    en: {
      q: "How would you assess the next generation's readiness to lead the business today?",
      options: [
        { score: 0, text: "Not ready — would struggle significantly" },
        { score: 1, text: "Limited — would need close ongoing support" },
        { score: 2, text: "Moderately ready — could lead with mentoring" },
        { score: 3, text: "Ready to lead independently" },
      ],
    },
    hr: {
      q: "Kako biste procijenili spremnost sljedeće generacije da vodi posao danas?",
      options: [
        { score: 0, text: "Nisu spremni — značajno bi se mučili" },
        { score: 1, text: "Ograničeno — trebali bi blisku podršku" },
        { score: 2, text: "Umjereno spremni — mogli bi voditi uz mentorstvo" },
        { score: 3, text: "Spremni voditi samostalno" },
      ],
    },
  },

  // ===== Governance =====
  {
    id: "Q7", dim: "governance",
    en: {
      q: "Do you have a written family constitution or charter?",
      options: [
        { score: 0, text: "No, and we have not discussed it" },
        { score: 1, text: "We have talked about it but not written anything" },
        { score: 2, text: "A draft exists or is in progress" },
        { score: 3, text: "Yes — agreed and reviewed regularly" },
      ],
    },
    hr: {
      q: "Imate li pisani obiteljski ustav ili povelju?",
      options: [
        { score: 0, text: "Ne, i nismo razgovarali o tome" },
        { score: 1, text: "Razgovarali smo, ali ništa nije napisano" },
        { score: 2, text: "Nacrt postoji ili je u izradi" },
        { score: 3, text: "Da — usvojen i redovito pregledavan" },
      ],
    },
  },
  {
    id: "Q8", dim: "governance",
    en: {
      q: "Does the operating business have an active board, including non-family members?",
      options: [
        { score: 0, text: "No formal board" },
        { score: 1, text: "Family-only board" },
        { score: 2, text: "Board with one or two non-family advisors" },
        { score: 3, text: "Independent board with majority non-family directors" },
      ],
    },
    hr: {
      q: "Ima li operativno poslovanje aktivnu upravu koja uključuje članove izvan obitelji?",
      options: [
        { score: 0, text: "Nema formalne uprave" },
        { score: 1, text: "Uprava samo iz obitelji" },
        { score: 2, text: "Uprava s jednim ili dva neobiteljska savjetnika" },
        { score: 3, text: "Nezavisna uprava s većinom neobiteljskih direktora" },
      ],
    },
  },
  {
    id: "Q9", dim: "governance",
    en: {
      q: "How are major business decisions formally made and documented?",
      options: [
        { score: 0, text: "Informally — whoever is in the room decides" },
        { score: 1, text: "The founder decides; others are informed" },
        { score: 2, text: "Through structured discussions with key stakeholders" },
        { score: 3, text: "Through documented governance processes with clear roles" },
      ],
    },
    hr: {
      q: "Kako se važne poslovne odluke formalno donose i dokumentiraju?",
      options: [
        { score: 0, text: "Neformalno — odlučuje tko je u prostoriji" },
        { score: 1, text: "Osnivač odlučuje; ostali su obaviješteni" },
        { score: 2, text: "Strukturiranim raspravama s ključnim dionicima" },
        { score: 3, text: "Dokumentiranim upravljačkim procesima s jasnim ulogama" },
      ],
    },
  },

  // ===== Family Communication =====
  {
    id: "Q10", dim: "communication",
    en: {
      q: "Have you openly discussed succession with the next generation in the past twelve months?",
      options: [
        { score: 0, text: "No — the topic feels too sensitive" },
        { score: 1, text: "Briefly, but not in depth" },
        { score: 2, text: "Yes, in one or two structured conversations" },
        { score: 3, text: "Yes, regularly and openly" },
      ],
    },
    hr: {
      q: "Jeste li u zadnjih dvanaest mjeseci otvoreno razgovarali o sukcesiji sa sljedećom generacijom?",
      options: [
        { score: 0, text: "Ne — tema je preosjetljiva" },
        { score: 1, text: "Kratko, ali ne u dubinu" },
        { score: 2, text: "Da, u jednom ili dva strukturirana razgovora" },
        { score: 3, text: "Da, redovito i otvoreno" },
      ],
    },
  },
  {
    id: "Q11", dim: "communication",
    en: {
      q: "When family members disagree about the business, what typically happens?",
      options: [
        { score: 0, text: "Disagreement is suppressed; tension lingers" },
        { score: 1, text: "The most senior person's view prevails" },
        { score: 2, text: "We discuss but resolution is informal" },
        { score: 3, text: "We have a structured process to surface and resolve disagreement" },
      ],
    },
    hr: {
      q: "Kada se članovi obitelji ne slažu oko posla, što se obično događa?",
      options: [
        { score: 0, text: "Neslaganje se potiskuje; napetost ostaje" },
        { score: 1, text: "Prevladava mišljenje najstarijeg" },
        { score: 2, text: "Razgovaramo, ali rješenje je neformalno" },
        { score: 3, text: "Imamo strukturiran proces za iznošenje i rješavanje neslaganja" },
      ],
    },
  },
  {
    id: "Q12", dim: "communication",
    en: {
      q: "How well does the next generation understand the size and nature of the family wealth?",
      options: [
        { score: 0, text: "They do not know" },
        { score: 1, text: "They know roughly but not specifically" },
        { score: 2, text: "They understand the operating business but not the broader picture" },
        { score: 3, text: "They have a complete and current understanding" },
      ],
    },
    hr: {
      q: "Koliko dobro sljedeća generacija razumije veličinu i prirodu obiteljske imovine?",
      options: [
        { score: 0, text: "Ne znaju" },
        { score: 1, text: "Znaju otprilike, ali ne specifično" },
        { score: 2, text: "Razumiju operativni posao, ali ne širu sliku" },
        { score: 3, text: "Imaju potpuno i aktualno razumijevanje" },
      ],
    },
  },

  // ===== Ownership & Legal =====
  {
    id: "Q13", dim: "ownership",
    en: {
      q: "Is there a shareholders' agreement covering transfers, buyouts, and family member exits?",
      options: [
        { score: 0, text: "No formal agreement" },
        { score: 1, text: "A basic agreement, not recently reviewed" },
        { score: 2, text: "A comprehensive agreement, reviewed within five years" },
        { score: 3, text: "Comprehensive, regularly reviewed and stress-tested" },
      ],
    },
    hr: {
      q: "Postoji li dioničarski sporazum koji pokriva prijenose, otkupe i izlaske članova obitelji?",
      options: [
        { score: 0, text: "Nema formalnog sporazuma" },
        { score: 1, text: "Osnovni sporazum, nije nedavno pregledan" },
        { score: 2, text: "Cjelovit sporazum, pregledan unutar pet godina" },
        { score: 3, text: "Cjelovit, redovito pregledavan i testiran" },
      ],
    },
  },
  {
    id: "Q14", dim: "ownership",
    en: {
      q: "What happens if a family shareholder divorces or dies unexpectedly?",
      options: [
        { score: 0, text: "We have not planned for that" },
        { score: 1, text: "Some informal understanding exists" },
        { score: 2, text: "Documented but not legally airtight" },
        { score: 3, text: "Fully documented, legally robust, family-aligned" },
      ],
    },
    hr: {
      q: "Što se događa ako se član obitelji dioničar razvede ili neočekivano umre?",
      options: [
        { score: 0, text: "Nismo to predvidjeli" },
        { score: 1, text: "Postoji neformalno razumijevanje" },
        { score: 2, text: "Dokumentirano, ali ne pravno čvrsto" },
        { score: 3, text: "Potpuno dokumentirano, pravno čvrsto, obiteljski usklađeno" },
      ],
    },
  },
  {
    id: "Q15", dim: "ownership",
    en: {
      q: "Have ownership and operational leadership been intentionally separated as roles?",
      options: [
        { score: 0, text: "No — the same people own and run the business" },
        { score: 1, text: "We have discussed it but not implemented" },
        { score: 2, text: "Partial separation in some areas" },
        { score: 3, text: "Fully separated with clear governance" },
      ],
    },
    hr: {
      q: "Jesu li vlasništvo i operativno vodstvo namjerno razdvojeni kao uloge?",
      options: [
        { score: 0, text: "Ne — isti ljudi posjeduju i vode posao" },
        { score: 1, text: "Razgovarali smo, ali nismo implementirali" },
        { score: 2, text: "Djelomično razdvojeni u nekim područjima" },
        { score: 3, text: "Potpuno razdvojeni s jasnim upravljanjem" },
      ],
    },
  },

  // ===== Legacy & Purpose =====
  {
    id: "Q16", dim: "legacy",
    en: {
      q: "Have you written down what the family wealth and business are for — beyond financial return?",
      options: [
        { score: 0, text: "No" },
        { score: 1, text: "We have an implicit understanding" },
        { score: 2, text: "Discussed but not written" },
        { score: 3, text: "Yes — articulated and shared with the family" },
      ],
    },
    hr: {
      q: "Jeste li zapisali za što služe obiteljska imovina i posao — iznad financijskog povrata?",
      options: [
        { score: 0, text: "Ne" },
        { score: 1, text: "Imamo implicitno razumijevanje" },
        { score: 2, text: "Razgovarali smo, ali nije zapisano" },
        { score: 3, text: "Da — artikulirano i podijeljeno s obitelji" },
      ],
    },
  },
  {
    id: "Q17", dim: "legacy",
    en: {
      q: "Is there a vehicle (foundation, philanthropic structure, mission-driven entity) that expresses the family's purpose?",
      options: [
        { score: 0, text: "No" },
        { score: 1, text: "We have discussed but not established one" },
        { score: 2, text: "Yes, but lightly used" },
        { score: 3, text: "Yes — active and well-resourced" },
      ],
    },
    hr: {
      q: "Postoji li vozilo (zaklada, filantropska struktura, entitet vođen misijom) koje izražava svrhu obitelji?",
      options: [
        { score: 0, text: "Ne" },
        { score: 1, text: "Razgovarali smo, ali nismo osnovali" },
        { score: 2, text: "Da, ali lagano korišteno" },
        { score: 3, text: "Da — aktivno i dobro resursirano" },
      ],
    },
  },
  {
    id: "Q18", dim: "legacy",
    en: {
      q: "When you imagine the family business in fifty years, how vivid is that picture?",
      options: [
        { score: 0, text: "I have not thought that far" },
        { score: 1, text: "Vague hope it continues" },
        { score: 2, text: "General direction with values" },
        { score: 3, text: "A clear vision shared by the current generation" },
      ],
    },
    hr: {
      q: "Kada zamislite obiteljski posao za pedeset godina, koliko je ta slika živa?",
      options: [
        { score: 0, text: "Nisam razmišljao tako daleko" },
        { score: 1, text: "Maglovita nada da se nastavlja" },
        { score: 2, text: "Opći smjer s vrijednostima" },
        { score: 3, text: "Jasna vizija koju dijeli sadašnja generacija" },
      ],
    },
  },
];

// Profile narratives — keyed A (highest) through E (lowest), based on
// overall score percentage thresholds.
const ASSESSMENT_PROFILES = {
  A: {
    threshold: 80,
    en: {
      title: "Well-positioned for the next chapter",
      narrative: "Your responses suggest a family and a business that have done meaningful work across most dimensions. The foundations are in place. The work ahead is less about building from scratch and more about refining, deepening, and stress-testing what you have already built. The next ten years will reveal whether the structures hold under real pressure — succession events, market shifts, family transitions. The most useful conversations now are about sequencing: when to hand over what, how to evolve governance as the next generation matures, and how to prepare for events you cannot yet predict.",
    },
    hr: {
      title: "Dobro pozicionirani za sljedeće poglavlje",
      narrative: "Vaši odgovori sugeriraju obitelj i posao koji su obavili smislen rad u većini dimenzija. Temelji su postavljeni. Posao koji slijedi manje je o izgradnji od nule, a više o usavršavanju, produbljivanju i provjeri onoga što ste već izgradili. Sljedećih deset godina pokazat će drže li se strukture pod stvarnim pritiskom — događaji sukcesije, tržišne promjene, obiteljske tranzicije. Najkorisniji razgovori sada su o redoslijedu: kada predati što, kako razvijati upravljanje kako sljedeća generacija sazrijeva i kako se pripremiti za događaje koje još ne možete predvidjeti.",
    },
  },
  B: {
    threshold: 60,
    en: {
      title: "A solid base, with key dimensions to deepen",
      narrative: "You have built a strong foundation in some areas, while others remain less developed. This is the most common profile we see in successful family businesses — operationally strong, with structural and family-side work still ahead. The priorities are clear from your responses, and the time to address them is now: most of these gaps are easier to close before pressure arrives than during it. The conversations that matter most are usually the ones that have been postponed. The first step is naming what those are.",
    },
    hr: {
      title: "Čvrsta osnova, s ključnim dimenzijama za produbljivanje",
      narrative: "Izgradili ste čvrstu osnovu u nekim područjima, dok druga ostaju manje razvijena. To je najčešći profil koji viđamo u uspješnim obiteljskim tvrtkama — operativno snažan, s rad na strukturama i obiteljskoj strani još uvijek pred sobom. Prioriteti su jasni iz vaših odgovora, a vrijeme za njihovo rješavanje je sada: većinu ovih praznina lakše je zatvoriti prije nego što pritisak dođe nego za vrijeme njega. Razgovori koji najviše vrijede obično su oni koji su odgađani. Prvi korak je imenovati koji su to.",
    },
  },
  C: {
    threshold: 40,
    en: {
      title: "On the path, with important work ahead",
      narrative: "You are at a stage many founders reach: the business is established, the family is engaged, but the formal architecture for what comes next is not yet in place. This is normal — and it is also the most consequential window. The decisions made now compound across decades. The good news from your responses is that you have identified the gaps; the harder news is that closing them takes years, not months. Most of this work happens in conversation rather than documents — but it eventually becomes documents.",
    },
    hr: {
      title: "Na putu, s važnim poslom pred sobom",
      narrative: "Vi ste u fazi koju mnogi osnivači dosegnu: posao je uspostavljen, obitelj je angažirana, ali formalna arhitektura za ono što slijedi još nije postavljena. To je normalno — i to je najznačajniji prozor. Odluke donesene sada akumuliraju se kroz desetljeća. Dobra vijest iz vaših odgovora je da ste identificirali praznine; teža vijest je da njihovo zatvaranje traje godinama, a ne mjesecima. Većina ovog rada događa se u razgovoru, a ne u dokumentima — ali postaju dokumenti.",
    },
  },
  D: {
    threshold: 20,
    en: {
      title: "Early in the journey — but already aware",
      narrative: "Most family businesses at this stage have not yet asked the questions you are asking. The fact that you have engaged with this assessment suggests an awareness that something needs attention, even if the path is not yet clear. From here, the work is to choose where to start — typically with the conversations that most need to be had within the family, then the structures that support those conversations holding over time. Few founders do this work alone, and few succeed without an outside perspective at key moments.",
    },
    hr: {
      title: "Rano na putu — ali već svjesni",
      narrative: "Većina obiteljskih tvrtki u ovoj fazi još nije postavila pitanja koja vi postavljate. Činjenica da ste se angažirali s ovom procjenom sugerira svijest da nešto treba pažnju, čak i ako put još nije jasan. Odavde, posao je odabrati gdje započeti — obično s razgovorima koji najviše trebaju biti vođeni unutar obitelji, zatim sa strukturama koje podržavaju te razgovore kroz vrijeme. Malo osnivača radi ovaj posao sam, a malo njih uspijeva bez vanjske perspektive u ključnim trenucima.",
    },
  },
  E: {
    threshold: 0,
    en: {
      title: "Foundation-laying — the most important phase",
      narrative: "This phase is where most family business futures are quietly determined — for better or worse. The dimensions assessed here are not yet visible in the day-to-day operations, which is precisely what makes them risky to ignore. Almost everything is still possible from here, and almost everything is still preventable. The single highest-leverage action at this stage is starting the family conversations. Structures and documents come later. The conversations come first.",
    },
    hr: {
      title: "Postavljanje temelja — najvažnija faza",
      narrative: "Ova faza je tamo gdje se tiho određuje većina budućnosti obiteljskih tvrtki — bolje ili lošije. Dimenzije procijenjene ovdje još nisu vidljive u svakodnevnim operacijama, što ih čini rizičnima za ignoriranje. Gotovo sve je još moguće odavde, i gotovo sve je još uvijek izbježivo. Najučinkovitija akcija u ovoj fazi je pokrenuti obiteljske razgovore. Strukture i dokumenti dolaze kasnije. Razgovori su prvi.",
    },
  },
};

// UI strings for the assessment app
const ASSESSMENT_UI = {
  en: {
    nav: { brand: "Family Business Advisor", back: "Back to home" },
    intro: {
      eyebrow: "Readiness Assessment",
      title: "Where does your family business stand?",
      titleAccent: "A private reflection.",
      lead: "A seven-minute structured reflection on six dimensions that determine whether what you have built will last beyond you.",
      dimensionsLabel: "What this covers",
      privacy: "No registration. Your answers stay in your browser. Results are generated instantly and are not shared.",
      time: "≈ 7 minutes · 18 questions",
      cta: "Begin assessment",
    },
    question: {
      progress: "Question {n} of {total}",
      back: "Back",
      next: "Next",
      complete: "See your results",
    },
    analyzing: {
      eyebrow: "Analyzing",
      messages: [
        "Reading your responses",
        "Weighing each dimension",
        "Identifying patterns",
        "Composing your profile",
      ],
    },
    results: {
      eyebrow: "Your Profile",
      overallLabel: "Overall readiness",
      strengthsTitle: "Where you are strongest",
      prioritiesTitle: "Where to focus next",
      narrativeTitle: "Reading the profile",
      ctaTitle: "These results don't replace a conversation.",
      ctaSub: "If anything here speaks to your situation, the next step is a private conversation about what you've identified.",
      ctaBtn: "Request a private conversation",
      restart: "Take the assessment again",
      disclaimer: "This assessment is a structured reflection, not a substitute for professional advice. It surfaces patterns; it does not provide solutions.",
      scoreOf: "of",
    },
  },
  hr: {
    nav: { brand: "Savjetnik za obiteljske tvrtke", back: "Povratak na početnu" },
    intro: {
      eyebrow: "Procjena spremnosti",
      title: "Gdje stoji vaš obiteljski posao?",
      titleAccent: "Privatna refleksija.",
      lead: "Sedmominutna strukturirana refleksija o šest dimenzija koje određuju hoće li ono što ste izgradili trajati i dalje od vas.",
      dimensionsLabel: "Što ovo pokriva",
      privacy: "Bez registracije. Vaši odgovori ostaju u vašem pregledniku. Rezultati se generiraju trenutno i ne dijele se.",
      time: "≈ 7 minuta · 18 pitanja",
      cta: "Započni procjenu",
    },
    question: {
      progress: "Pitanje {n} od {total}",
      back: "Natrag",
      next: "Dalje",
      complete: "Pogledaj rezultate",
    },
    analyzing: {
      eyebrow: "Analiziram",
      messages: [
        "Čitam vaše odgovore",
        "Vagam svaku dimenziju",
        "Prepoznajem obrasce",
        "Sastavljam vaš profil",
      ],
    },
    results: {
      eyebrow: "Vaš profil",
      overallLabel: "Ukupna spremnost",
      strengthsTitle: "Gdje ste najsnažniji",
      prioritiesTitle: "Na što sljedeće obratiti pažnju",
      narrativeTitle: "Čitanje profila",
      ctaTitle: "Ovi rezultati ne zamjenjuju razgovor.",
      ctaSub: "Ako vam nešto ovdje odgovara situaciji, sljedeći je korak privatni razgovor o onome što ste identificirali.",
      ctaBtn: "Zatraži privatni razgovor",
      restart: "Ponovi procjenu",
      disclaimer: "Ova procjena je strukturirana refleksija, a ne zamjena za stručni savjet. Ona pokazuje obrasce; ne pruža rješenja.",
      scoreOf: "od",
    },
  },
};

// Calculate per-dimension scores, overall score, and identify the profile
// band, top strengths and top priorities.
function calculateAssessmentResults(answers) {
  const dimScores = {};
  ASSESSMENT_DIMENSIONS.forEach((d) => {
    dimScores[d.id] = { score: 0, max: 0 };
  });

  ASSESSMENT_QUESTIONS.forEach((q) => {
    const ans = answers[q.id];
    if (typeof ans !== "number") return;
    dimScores[q.dim].score += ans;
    dimScores[q.dim].max += 3;
  });

  ASSESSMENT_DIMENSIONS.forEach((d) => {
    const ds = dimScores[d.id];
    ds.pct = ds.max > 0 ? Math.round((ds.score / ds.max) * 100) : 0;
  });

  let totalScore = 0, totalMax = 0;
  Object.values(dimScores).forEach((ds) => { totalScore += ds.score; totalMax += ds.max; });
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  let profile = "E";
  if (overallPct >= 80) profile = "A";
  else if (overallPct >= 60) profile = "B";
  else if (overallPct >= 40) profile = "C";
  else if (overallPct >= 20) profile = "D";

  // Identify top 2 strengths and top 2 priorities by percentage
  const ranked = ASSESSMENT_DIMENSIONS
    .map((d) => ({ id: d.id, pct: dimScores[d.id].pct }))
    .sort((a, b) => b.pct - a.pct);
  const strengths = ranked.slice(0, 2).map((r) => r.id);
  const priorities = ranked.slice(-2).reverse().map((r) => r.id);

  return {
    dimensions: dimScores,
    overall: { score: totalScore, max: totalMax, pct: overallPct },
    profile,
    strengths,
    priorities,
  };
}

window.ASSESSMENT_DIMENSIONS = ASSESSMENT_DIMENSIONS;
window.ASSESSMENT_QUESTIONS = ASSESSMENT_QUESTIONS;
window.ASSESSMENT_PROFILES = ASSESSMENT_PROFILES;
window.ASSESSMENT_UI = ASSESSMENT_UI;
window.calculateAssessmentResults = calculateAssessmentResults;
