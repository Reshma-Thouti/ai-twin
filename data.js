

const portfolioData = {
  profile: {
    name: "Reshma Thouti",
    role: "Full-Stack Developer & CS Engineer",
    alias: "T.E.S.A", 
    subheadings: [
      "Full Stack Developer",
      "CS Engineer @ SR University",
      "LeetCode Solver",
      "Extension Developer"
    ],
    bio: "Computer Science student at SR University specializing in Python Development, Full-Stack Web architectures, Browser Extensions, and Java Applications. Passionate about constructing logical systems and automation.",
    welcomeMessage: "Yo! I'm T.E.S.A, Reshma's AI Twin. 🕸️ Ask me anything about her skills, projects, certifications, or even try to roast her coding habits! 😉",
    fromDeveloperNote: "Hey there! I'm probably grinding on DSA or writing some backend code in Python right now. So I configured my AI Twin to handle recruiter chats. Ask it anything—it knows my work better than I do. (Seriously!)",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop", // Abstract technical background
    wireframeAvatar: "assets/wireframe_avatar.png"
  },
  stats: {
    projectsCount: "06+",
    techStacksCount: "10+",
    commitsCount: "500+",
    caffeineLevel: 120,
    webSlingerStats: {
      "LeetCode Problems": "300+",
      "CGPA": "9.52 / 10",
      "Academic Year": "2023 - Present",
      "Projects Built": "06"
    }
  },
  aboutMe: {
    text: "I am a B.Tech Computer Science & Engineering student at SR University, Warangal. I focus on backend engineering (primarily with Python and Java), full-stack web architectures, and browser API integrations. I love constructing logical systems, from automated Python data scripts to session-based Java servlet backends and service worker sync scripts. Currently seeking software developer internships and full-stack opportunities.",
    education: {
      degree: "Bachelor of Technology in Computer Science & Engineering",
      institution: "SR University, Warangal",
      duration: "Aug 2023 - Present",
      cgpa: "9.52/10"
    }
  },
  skills: {
    categories: [
      {
        name: "Languages",
        items: [
          { name: "Python", level: 90 },
          { name: "JavaScript / ES6", level: 85 },
          { name: "Java", level: 80 },
          { name: "C / C++", level: 80 },
          { name: "PHP", level: 70 }
        ]
      },
      {
        name: "Web Development",
        items: [
          { name: "HTML5 & CSS3", level: 95 },
          { name: "DOM Manipulation", level: 90 },
          { name: "Servlets / JDBC", level: 85 },
          { name: "MVC Architecture", level: 85 }
        ]
      },
      {
        name: "Databases & Tools",
        items: [
          { name: "MySQL", level: 85 },
          { name: "Git & GitHub", level: 90 },
          { name: "VS Code", level: 90 },
          { name: "Apache Tomcat", level: 80 }
        ]
      },
      {
        name: "Browser & APIs",
        items: [
          { name: "Manifest V3 Extensions", level: 95 },
          { name: "Service Workers", level: 90 },
          { name: "MutationObserver API", level: 88 },
          { name: "Browser Storage APIs", level: 90 }
        ]
      }
    ]
  },
  projects: [
    {
      id: "leetsync",
      title: "LeetSync",
      description: "A developer productivity browser extension automating LeetCode & GeeksforGeeks solutions syncing to GitHub. Employs DOM observers to capture successful code submissions, formatting, and committing in the background.",
      techStack: ["JavaScript", "Chrome Extensions API", "GitHub REST API", "MutationObserver", "Service Workers"],
      features: [
        "Uses MutationObserver DOM detection to parse accepted problem submissions in real-time.",
        "Automatic background repo uploads using Service Workers and Chrome Manifest V3.",
        "Custom statistics dashboard, daily streak trackers, and account-locked sync protection.",
        "Organizes repository directories into automated folders by difficulty level."
      ],
      impact: "Maintains code synchronicity for 300+ DSA solutions, bypassing manual GitHub uploads.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti/LeetSync-Extension"
    },
    {
      id: "jobtrackerpro",
      title: "Job Tracker Pro",
      description: "A full-stack job application tracker with robust session security, dual User/Admin roles, and analytical tracking features. Developed with Java servlet frameworks and custom relational databases.",
      techStack: ["Java", "Servlets", "JDBC", "MySQL", "HTML/CSS"],
      features: [
        "Built securely using Model-View-Controller (MVC) architecture deployed on Tomcat 11.",
        "CRUD operations handled via JDBC connections utilizing PreparedStatements to prevent SQL injection.",
        "Dual portal login dashboard sorting roles and tracking active job pipeline status.",
        "Session-based credentials verification maintaining private client spaces."
      ],
      impact: "Created under mentorship to centralize application tracking logs in a clean MVC container.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti"
    },
    {
      id: "onlinesareeshopping",
      title: "Online Saree Shopping",
      description: "A specialized e-commerce web application with customizable filters, interactive shopping cart, wishlist, and integrated user preferences backend, built for local retail concepts.",
      techStack: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
      features: [
        "Unique Saree Customization dashboard allowing color, fabric, and boundary design selects.",
        "Dynamic client catalog filter query bindings dynamically built using JavaScript.",
        "Structured PHP session management storing cart states across page clicks.",
        "Relational product inventory structure managed efficiently on a local MySQL server."
      ],
      impact: "Developed as a student developer at SR University to bridge merchant systems with retail web tech.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti"
    },
    {
      id: "studytaskmanager",
      title: "Study Task Manager",
      description: "A native Java desktop application featuring an interactive graphical user interface (GUI) designed to optimize student tasks and timetable tracking.",
      techStack: ["Java", "Java Swing", "Multi-threading", "File I/O"],
      features: [
        "Interactive desktop UI components structured with Java Swing forms and layouts.",
        "Multi-threaded background reminder alert systems warning users about pending deadlines.",
        "Local file system persistence saving active logs reliably in flat-file structures.",
        "Adherence to Object-Oriented Programming (OOP) architectures for modular component recycling."
      ],
      impact: "Organizes student routines locally without requiring web latency or internet checkouts.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti"
    },
    {
      id: "smartdustbin",
      title: "Smart Dustbin (IoT)",
      description: "A hardware-software automation system built to catalog and sort wet and dry wastes, utilizing sensors to drive environmental recycling workflows.",
      techStack: ["IoT", "Electronics", "Automation", "C++"],
      features: [
        "Automated waste separation leveraging moisture and weight sensors.",
        "Trigger systems routing sorting gates via physical micro-controllers.",
        "Reflects structured logical loops in C++ hardware programming."
      ],
      impact: "Academic engineering design showcasing waste classification and logical hardware integration.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti"
    },
    {
      id: "billingsystem",
      title: "Store Billing System",
      description: "A command-line terminal application constructed to automate cashier and transaction calculations inside cosmetic shops.",
      techStack: ["C", "Structures & Functions", "File Handling"],
      features: [
        "Product inventory mapping utilizing custom structures and pointers.",
        "Receipt writing exports logs directly to the local directory using file handling.",
        "Clean CLI prompts facilitating speed-based manual product checking."
      ],
      impact: "Completed as core systems design training, optimizing struct allocations and terminal flat-files.",
      demoUrl: "#",
      githubUrl: "https://github.com/Reshma-Thouti"
    }
  ],
  experience: [
    {
      role: "Student Developer",
      company: "SR University, Warangal",
      duration: "Ongoing",
      points: [
        "Developed a full-stack Online Saree Shopping Website under university faculty mentorship.",
        "Designed backend database schemas and handled JDBC configurations with local MySQL servers.",
        "Translated real business retail requirements into active, customizable frontend templates.",
        "Ongoing styling updates and enhancements to reduce browser loading times and improve UX."
      ]
    }
  ],
  achievements: [
    {
      title: "Deep Learning Fundamentals Certificate",
      detail: "Certified by NVIDIA Deep Learning Institute, studying core neural network concepts and model logic."
    },
    {
      title: "LeetCode Solver",
      detail: "Solved 300+ data structures and algorithms questions, maintaining a streak profile."
    },
    {
      title: "Academic Honor List",
      detail: "Maintained a top-tier score of 9.52 CGPA in Computer Science & Engineering at SR University."
    }
  ],
  learningJourney: [
    {
      subject: "Advanced Full-Stack Frameworks",
      status: "In Progress",
      description: "Expanding web skills to modern frameworks like React.js, Next.js, and Node backend microservices."
    },
    {
      subject: "Machine Learning & Deep Learning",
      status: "In Progress",
      description: "Building on my NVIDIA training to write customized neural layers and data pipelines in Python."
    },
    {
      subject: "Browser Extension APIs",
      status: "Completed",
      description: "Mastered Manifest V3 background service workers, storage management, and DOM-tracking overlays."
    }
  ],
  filesAndDocs: [
    { name: "Reshma_Thouti_Resume.pdf", size: "124 KB", type: "PDF" },
    { name: "Academic_Transcript.pdf", size: "1.8 MB", type: "PDF" },
    { name: "NVIDIA_DL_Certificate.pdf", size: "640 KB", type: "PDF" }
  ],
  whatICanDo: [
    "Answer anything about Reshma's coursework at SR University.",
    "Explain her projects in detail (like LeetSync's MutationObserver DOM sync logic).",
    "Evaluate her skills for a Python/full-stack developer or extension engineer role.",
    "Provide code-level explanations of her Java servlet MVC architecture.",
    "Roast her DSA habit or 120% caffeine levels! ☕"
  ],
  suggestedQueries: [
    "Tell me about LeetSync",
    "Can she design a database schema?",
    "What did she build for SR University?",
    "Roast Reshma's coding style 🕸️"
  ],
  systemStatus: {
    model: "GEMINI 1.5 FLASH (VIA CLIENT SDK)",
    memoryCore: "ACTIVE",
    webShooters: "READY",
    systemsOperational: true
  }
};


if (typeof window !== 'undefined') {
  window.portfolioData = portfolioData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = portfolioData;
}
