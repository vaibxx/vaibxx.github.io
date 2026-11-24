/* ==========================================================================
   EDIT THIS FILE — all portfolio content lives here.
   Everything in the 3D world is generated from this data.
   ========================================================================== */
window.PORTFOLIO = {
  firstName: "Vaibhav",
  lastName: "Bhatt",
  initials: "VB",
  role: "AI Engineer",
  location: "Open to AI engineering roles",
  tagline: "I build AI agents and LLM tools that show their work: traced to evidence, tested, and built to ship.",

  // Leave "" to show a GitHub button on the contact page instead of an email.
  email: "",

  socials: [
    { label: "GitHub", url: "https://github.com/vaibxx" },
    { label: "Live demos", url: "https://vaibxx.github.io/Vaibhav-Portfolio/" }
  ],

  about: {
    // Wrap words in *asterisks* to highlight them.
    statement:
      "I build *AI agents* that show their work: every answer traced to evidence, every run checked, every result something you can *inspect*.",
    stats: [
      { value: 2021, suffix: "", label: "Shipping code since" },
      { value: 5, suffix: "", label: "Featured builds" },
      { value: 3, suffix: "", label: "AI agent systems" }
    ],
    skills: [
      "Python", "TypeScript", "LLM Agents", "Tool Use", "Evals", "Gemini",
      "PostgreSQL", "Streamlit", "React", "Node.js", "Docker", "Playwright", "FFmpeg"
    ]
  },

  // 3 colours per scene: [deep, main, highlight]
  theme: {
    hero: ["#3a0cff", "#00d9ff", "#ff2bd6"],
    about: ["#ff4d1f", "#ffc400", "#ff2b6a"],
    contact: ["#00ff9d", "#3a0cff", "#e8ff00"]
  },

  /* Projects. `image` is optional: leave "" for generated shader artwork,
     or point it at a file like "images/agentreel.jpg" (16:10 looks best). */
  projects: [
    {
      title: "AgentReel",
      category: "Multi-agent AI",
      year: "2026",
      description:
        "A team of agents (researcher, scriptwriter, storyboarder, critic, editor) turns a brief and source documents into a narrated 30–60 second video. Every run saves its evidence, fact IDs, storyboard, captions and QA results next to the MP4.",
      stack: ["Python", "Gemini", "Multi-agent", "FFmpeg", "Text-to-speech", "GitHub Actions"],
      links: [
        { label: "Watch demo", url: "https://raw.githubusercontent.com/vaibxx/AgentReel/main/demo/rainbow.mp4" },
        { label: "Source", url: "https://github.com/vaibxx/AgentReel" }
      ],
      colors: ["#2b1bff", "#00e1ff", "#ff3df2"],
      image: ""
    },
    {
      title: "ContextFlow",
      category: "Developer Tool",
      year: "2026",
      description:
        "Never lose a coding session to a usage limit. ContextFlow runs your coding agent, and when it hits its limit it writes a handoff brief and starts the next agent on the same repo, with git checkpoints in between.",
      stack: ["TypeScript", "Node.js", "CLI", "Git", "Agent orchestration"],
      links: [],
      colors: ["#00ff9d", "#00796b", "#d4ff00"],
      image: ""
    },
    {
      title: "Signal Investigator",
      category: "AI Evals",
      year: "2026",
      description:
        "A bounded, tool-using agent that works out why an AI product's eval pass rate dropped. Did answer quality really fall, or did the release just get a harder mix of questions? It shows every action and the evidence behind its verdict.",
      stack: ["Python", "LLM tool use", "Evals", "OpenAI-compatible APIs", "Unit tests"],
      links: [
        { label: "Live demo", url: "https://vaibxx.github.io/Vaibhav-Portfolio/#signal" },
        { label: "Source", url: "https://github.com/vaibxx/signal-investigator" }
      ],
      colors: ["#ff3b1f", "#ffb800", "#fff3b0"],
      image: ""
    },
    {
      title: "Smart SQL",
      category: "Text-to-SQL",
      year: "2025",
      description:
        "Chat with a PostgreSQL database in plain English. Gemini writes the SQL, charts are generated automatically, and destructive writes need confirmation with a data preview. An automated UI test runs on every push.",
      stack: ["Python", "Streamlit", "Gemini", "PostgreSQL", "Plotly"],
      links: [
        { label: "Try it", url: "https://vaibxx.github.io/Vaibhav-Portfolio/#work" },
        { label: "Source", url: "https://github.com/vaibxx/SMART-SQL-ASSISTANT" }
      ],
      colors: ["#6a5cff", "#ff6ad5", "#c3f0ff"],
      image: ""
    },
    {
      title: "Remote Browser",
      category: "Full-stack",
      year: "2026",
      description:
        "Launch an isolated Chromium inside Docker and control it live from any browser. The backend spins up a container per session and drives it with Playwright, while noVNC streams the screen.",
      stack: ["React", "TypeScript", "Socket.IO", "Docker", "Playwright", "noVNC"],
      links: [{ label: "Source", url: "https://github.com/vaibxx/Vaib-Browser-Teamviewer" }],
      colors: ["#ff007a", "#7a00ff", "#00f0ff"],
      image: ""
    }
  ]
};
