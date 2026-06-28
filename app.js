/* C:\recruiter-ai-twin\app.js */

document.addEventListener("DOMContentLoaded", () => {
  // --- Audio Engine (Synthesizer) ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioMuted = false;

  // --- Voice Output (Speech Synthesis) Friday Engine ---
  let voiceOutputActive = false;

  // --- Hologram Visualizer Canvas Engine ---
  const canvas = document.getElementById("hud-visualizer-canvas");
  let ctx = null;
  let visualizerState = "idle"; // "idle", "thinking", "listening"
  let rotationAngle = 0;
  let analyserNode = null;
  let audioStream = null;
  let sourceNode = null;
  let dataArray = new Uint8Array(0);

  if (canvas) {
    ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 100 * dpr;
    canvas.height = 100 * dpr;
    ctx.scale(dpr, dpr);
    requestAnimationFrame(drawVisualizer);
  }

  function drawVisualizer() {
    if (!ctx || !canvas) return;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;

    rotationAngle += visualizerState === "thinking" ? 0.04 : 0.008;

    // 1. Draw Rotating Outer Dash Arc Rings (Stark HUD theme)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationAngle);
    ctx.strokeStyle = "rgba(255, 0, 42, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 38, Math.PI, Math.PI * 1.4);
    ctx.stroke();
    
    // Reverse rotating inner cyan ring
    ctx.rotate(-rotationAngle * 1.8);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 0.3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 32, Math.PI, Math.PI * 0.7, true);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Breathing Inner Circles and reactive wave shapes
    if (visualizerState === "listening" && analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      analyserNode.getByteFrequencyData(dataArray);
      
      ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const amp = dataArray[i] / 255;
        const r = 20 + amp * 15;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(cx + x, cy + y);
        else ctx.lineTo(cx + x, cy + y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (visualizerState === "thinking") {
      ctx.strokeStyle = "rgba(255, 0, 42, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const time = Date.now() * 0.015;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const pulse = Math.sin(angle * 8 + time) * 3;
        const r = 20 + pulse;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (angle === 0) ctx.moveTo(cx + x, cy + y);
        else ctx.lineTo(cx + x, cy + y);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
      ctx.lineWidth = 1;
      const breathing = Math.sin(Date.now() * 0.002) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 + breathing, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Central Core indicator
    ctx.fillStyle = visualizerState === "thinking" ? "var(--accent-red)" : "var(--accent-cyan)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = visualizerState === "thinking" ? "var(--accent-red)" : "var(--accent-cyan)";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    requestAnimationFrame(drawVisualizer);
  }

  async function startVoiceAnalysis() {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      const bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      sourceNode = audioCtx.createMediaStreamSource(audioStream);
      sourceNode.connect(analyserNode);
      visualizerState = "listening";
    } catch (err) {
      console.warn("[T.E.S.A Visualizer] Mic stream denied or blocked.", err);
    }
  }

  function stopVoiceAnalysis() {
    visualizerState = "idle";
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (sourceNode) {
      sourceNode.disconnect();
    }
    analyserNode = null;
  }

  function speakText(text) {
    if (!voiceOutputActive) return;
    window.speechSynthesis.cancel();
    
    // Strip HTML tags and normalize spaces
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith("en"));
    if (enVoices.length > 0) {
      const preferred = enVoices.find(v => v.name.includes("Google") || v.name.includes("Zira") || v.name.includes("Samantha")) || enVoices[0];
      utterance.voice = preferred;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }

  function playHudSound(type = 'click') {
    if (audioMuted) return;
    
    // Resume audio context if suspended (browser security)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      // Short mechanical high-pitch beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'hover') {
      // Extremely short subtle click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } else if (type === 'incoming') {
      // Dual high-tech notification chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'error') {
      // Downwards buzz sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  }

  // --- Dynamic UI Data Binding ---
  const data = window.portfolioData;

  function initDataBindings() {
    if (!data) {
      console.error("Portfolio data not found!");
      return;
    }

    // Set Document Title
    document.title = `${data.profile.name} - Developer AI Twin & Portfolio`;

    // Header Profile
    document.getElementById("top-avatar").src = data.profile.avatar;
    document.getElementById("brand-title").textContent = data.profile.alias;
    document.getElementById("user-profile-name").textContent = data.profile.name.toUpperCase();
    
    // Left Sidebar Note
    document.getElementById("hud-dev-note").innerHTML = `"${data.profile.fromDeveloperNote}"`;

    // Welcome Message in Chat
    document.getElementById("chat-twin-title").textContent = data.profile.alias;
    document.getElementById("welcome-bubble").innerHTML = data.profile.welcomeMessage;

    // Right Sidebar - At a Glance
    document.getElementById("glance-avatar").src = data.profile.avatar;
    document.getElementById("glance-name").textContent = data.profile.name;
    document.getElementById("glance-subtitles").innerHTML = data.profile.subheadings.join(" &bull; ");
    document.getElementById("stat-projects").textContent = data.stats.projectsCount;
    document.getElementById("stat-stacks").textContent = data.stats.techStacksCount;
    document.getElementById("stat-commits").textContent = data.stats.commitsCount;



    // "What I Can Do" List
    const capabilityList = document.getElementById("capability-list");
    capabilityList.innerHTML = "";
    data.whatICanDo.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      capabilityList.appendChild(li);
    });

    // "Recent Conversations" (Initially empty for the session)
    const recentQueriesList = document.getElementById("recent-queries-list");
    if (recentQueriesList) {
      recentQueriesList.innerHTML = `<div style="font-family: var(--mono-font); font-size: 10px; color: var(--text-gray-dark); text-align: center; padding: 10px 0;">NO CONVERSATIONS IN THIS SESSION</div>`;
    }

    // "Suggested Prompt Chips"
    const chipsContainer = document.getElementById("suggested-chips");
    chipsContainer.innerHTML = "";
    data.suggestedQueries.forEach(query => {
      const chip = document.createElement("button");
      chip.className = "prompt-chip";
      chip.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        <span>${query}</span>
      `;
      chip.addEventListener("click", () => {
        submitUserQuery(query);
      });
      chipsContainer.appendChild(chip);
    });

    // System Status Card
    document.getElementById("sys-systems").textContent = data.systemStatus.systemsOperational ? "OPERATIONAL" : "DIAGNOSTIC";
    document.getElementById("sys-model").textContent = data.systemStatus.model;
    document.getElementById("sys-memory").textContent = data.systemStatus.memoryCore;
    document.getElementById("sys-shooters").textContent = data.systemStatus.webShooters;

    // --- Tab Content Views Binding ---
    
    // 1. About Me View
    document.getElementById("about-text-content").textContent = data.aboutMe.text;
    document.getElementById("edu-degree").textContent = data.aboutMe.education.degree;
    document.getElementById("edu-duration").textContent = data.aboutMe.education.duration;
    document.getElementById("edu-institution").textContent = data.aboutMe.education.institution;
    document.getElementById("edu-cgpa").textContent = data.aboutMe.education.cgpa;

    // 2. Projects View
    const projectsList = document.getElementById("projects-list");
    projectsList.innerHTML = "";
    data.projects.forEach(project => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
        <div class="project-card-header">
          <h3 class="project-card-title">${project.title}</h3>
          <div class="project-card-links">
            <a href="${project.githubUrl}" target="_blank" class="proj-link" title="GitHub Source">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" fill="currentColor"/></svg>
            </a>
          </div>
        </div>
        <p class="project-desc">${project.description}</p>
        <div class="project-chips">
          ${project.techStack.map(tech => `<span class="tech-chip">${tech}</span>`).join("")}
        </div>
        <div class="project-bullets-title">CORE INTEGRATIONS</div>
        <ul class="project-bullets">
          ${project.features.map(feat => `<li>${feat}</li>`).join("")}
        </ul>
        <div class="project-impact">
          <strong>Impact:</strong> ${project.impact}
        </div>
      `;
      projectsList.appendChild(card);
    });

    // 3. Skills Matrix
    const skillsMatrix = document.getElementById("skills-matrix");
    skillsMatrix.innerHTML = '<div class="skills-grid-layout"></div>';
    const gridLayout = skillsMatrix.querySelector(".skills-grid-layout");
    
    data.skills.categories.forEach(cat => {
      const card = document.createElement("div");
      card.className = "skills-category-card";
      card.innerHTML = `
        <h3 class="skills-cat-title">${cat.name.toUpperCase()}</h3>
        <div class="skills-list-container">
          ${cat.items.map(skill => `
            <div class="skill-progress-bar">
              <div class="skill-info">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-pct">${skill.level}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: 0%;" data-level="${skill.level}"></div>
              </div>
            </div>
          `).join("")}
        </div>
      `;
      gridLayout.appendChild(card);
    });

    // 4. Experience Timeline
    const experienceTimeline = document.getElementById("experience-timeline");
    experienceTimeline.innerHTML = "";
    data.experience.forEach(exp => {
      const item = document.createElement("div");
      item.className = "experience-log-item";
      item.innerHTML = `
        <div class="exp-header">
          <h3 class="exp-role">${exp.role}</h3>
          <div class="exp-meta">
            <span class="exp-company">${exp.company.toUpperCase()}</span>
            <span class="exp-duration">${exp.duration}</span>
          </div>
        </div>
        <ul class="exp-points">
          ${exp.points.map(pt => `<li>${pt}</li>`).join("")}
        </ul>
      `;
      experienceTimeline.appendChild(item);
    });

    // 5. Achievements List
    const achievementsList = document.getElementById("achievements-list");
    achievementsList.innerHTML = "";
    data.achievements.forEach(ach => {
      const row = document.createElement("div");
      row.className = "achievement-row";
      row.innerHTML = `
        <div class="achievement-icon-wrapper">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" fill="currentColor"/></svg>
        </div>
        <div class="achievement-info">
          <h4 class="achievement-title">${ach.title}</h4>
          <p class="achievement-detail">${ach.detail}</p>
        </div>
      `;
      achievementsList.appendChild(row);
    });

    // 6. Developer Stats View
    const statsHudGrid = document.getElementById("stats-hud-grid");
    statsHudGrid.innerHTML = "";
    Object.entries(data.stats.webSlingerStats).forEach(([key, val]) => {
      const card = document.createElement("div");
      card.className = "stats-hud-card";
      card.innerHTML = `
        <div class="stats-hud-val">${val}</div>
        <div class="stats-hud-lbl">${key.toUpperCase()}</div>
      `;
      statsHudGrid.appendChild(card);
    });

    // 7. GitHub Contribution Grid Simulation
    const githubGrid = document.getElementById("github-grid");
    githubGrid.innerHTML = "";
    // Generate 120 blocks for simulation
    for (let i = 0; i < 120; i++) {
      const box = document.createElement("div");
      // Randomly allocate levels with higher weight towards lower levels
      const rand = Math.random();
      let level = 0;
      if (rand > 0.85) level = 4;
      else if (rand > 0.7) level = 3;
      else if (rand > 0.5) level = 2;
      else if (rand > 0.2) level = 1;
      
      box.className = `github-box level-${level}`;
      githubGrid.appendChild(box);
    }

    // 8. Learning Journey List
    const learningList = document.getElementById("learning-journey-list");
    learningList.innerHTML = "";
    data.learningJourney.forEach(item => {
      const card = document.createElement("div");
      card.className = "learning-log-card";
      const statusClass = item.status.toLowerCase().replace(" ", "-");
      card.innerHTML = `
        <div class="learning-header">
          <span class="learning-subject">${item.subject}</span>
          <span class="learning-status ${statusClass}">${item.status.toUpperCase()}</span>
        </div>
        <p class="learning-desc">${item.description}</p>
      `;
      learningList.appendChild(card);
    });

    // 9. Files List
    const filesList = document.getElementById("files-list");
    filesList.innerHTML = "";
    data.filesAndDocs.forEach(file => {
      const row = document.createElement("div");
      row.className = "files-row";
      row.innerHTML = `
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span>${file.size}</span>
        <span>${file.type}</span>
        <button class="btn-file-dl">DOWNLOAD</button>
      `;
      row.querySelector(".btn-file-dl").addEventListener("click", () => {
        playHudSound("incoming");
        const link = document.createElement("a");
        link.href = `./assets/${file.name}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      filesList.appendChild(row);
    });

    // Add speaker toggle button listener (Voice Output Friday Mode)
    const speakerToggleBtn = document.getElementById("btn-speaker-toggle");
    if (speakerToggleBtn) {
      speakerToggleBtn.addEventListener("click", () => {
        voiceOutputActive = !voiceOutputActive;
        playHudSound("click");
        
        const speakerSvg = document.getElementById("speaker-icon-svg");
        if (voiceOutputActive) {
          speakerToggleBtn.classList.add("active");
          speakerToggleBtn.classList.remove("muted");
          speakerToggleBtn.title = "Voice Output Active (Friday Mode)";
          speakerSvg.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>`;
          speakText("Voice synthesis protocols active. T.E.S.A at your service.");
        } else {
          speakerToggleBtn.classList.remove("active");
          speakerToggleBtn.classList.add("muted");
          speakerToggleBtn.title = "Voice Output Muted";
          speakerSvg.innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>`;
          window.speechSynthesis.cancel();
        }
      });
    }
  }



  // --- View Swapping System (Router) ---
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".hud-view-content");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      
      playHudSound("click");
      
      // Update Active Navigation Item
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      // Toggle Target View
      views.forEach(view => {
        view.classList.remove("active");
        if (view.id === `view-${tabName}`) {
          view.classList.add("active");
        }
      });

      // Animate progress fills when transitioning to the SKILLS view
      if (tabName === 'skills') {
        setTimeout(() => {
          const fills = document.querySelectorAll(".progress-fill");
          fills.forEach(fill => {
            const targetWidth = fill.getAttribute("data-level");
            fill.style.width = `${targetWidth}%`;
          });
        }, 100);
      }
    });

    // Add UI Hover Clicks
    item.addEventListener("mouseenter", () => {
      playHudSound("hover");
    });
  });

  // --- Voice Input (Web Speech API) ---
  const voiceBtn = document.getElementById("btn-voice-input");
  const inputField = document.getElementById("chat-input-field");
  let recognition;
  let isListening = false;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      voiceBtn.classList.add("listening");
      inputField.placeholder = "Listening...";
      playHudSound("incoming");
      startVoiceAnalysis();
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      isListening = false;
      voiceBtn.classList.remove("listening");
      inputField.placeholder = "Ask me anything about Reshma...";
      stopVoiceAnalysis();
      
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked or insecure origin.\n\nPlease enable microphone permissions in your site settings, and ensure you are accessing the page over HTTPS or http://localhost.");
      } else if (event.error === 'no-speech') {
        // Silently reset
      } else {
        alert(`Speech input failed: ${event.error}`);
      }
      playHudSound("error");
    };

    recognition.onend = () => {
      isListening = false;
      voiceBtn.classList.remove("listening");
      inputField.placeholder = "Ask me anything about Reshma...";
      stopVoiceAnalysis();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      playHudSound("click");
      // Send immediately
      submitUserQuery(transcript);
    };

    voiceBtn.addEventListener("click", () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  } else {
    // Hide or disable voice button if not supported
    voiceBtn.style.opacity = '0.5';
    voiceBtn.title = 'Speech Recognition Not Supported';
  }

  // --- Gemini API & Chat Logic ---
  const chatHistory = document.getElementById("chat-history");
  const sendBtn = document.getElementById("btn-send-message");
  




  function appendChatMessage(sender, text, rawHtml = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}`;
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const authorName = sender === 'ai' ? data.profile.alias : 'YOU';
    
    // Select correct avatar
    let avatarSvg = '';
    if (sender === 'ai') {
      avatarSvg = `<svg viewBox="0 0 100 100" class="mini-hud-avatar-svg"><circle cx="50" cy="50" r="40" fill="none" stroke="#ff002a" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="2,2"/><circle cx="50" cy="50" r="5" fill="#ff002a"/></svg>`;
    } else {
      avatarSvg = `<svg viewBox="0 0 100 100" class="mini-hud-avatar-svg"><polygon points="50,15 78,35 78,65 50,85 22,65 22,35" fill="none" stroke="#00f0ff" stroke-width="2"/><circle cx="50" cy="50" r="8" fill="#00f0ff"/></svg>`;
    }

    msgDiv.innerHTML = `
      <div class="msg-avatar-container">
        ${avatarSvg}
      </div>
      <div class="msg-content-wrapper">
        <div class="msg-meta">
          <span class="msg-author">${authorName}</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        <div class="msg-bubble">
          ${rawHtml ? text : escapeHtml(text)}
        </div>
      </div>
    `;

    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    if (sender === 'ai') {
      playHudSound("incoming");
      speakText(text);
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  function appendTypingIndicator() {
    visualizerState = "thinking";
    const indicatorDiv = document.createElement("div");
    indicatorDiv.id = "typing-indicator-node";
    indicatorDiv.className = "chat-message ai";
    indicatorDiv.innerHTML = `
      <div class="msg-avatar-container">
        <svg viewBox="0 0 100 100" class="mini-hud-avatar-svg"><circle cx="50" cy="50" r="40" fill="none" stroke="#ff002a" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="2,2"/><circle cx="50" cy="50" r="5" fill="#ff002a"/></svg>
      </div>
      <div class="msg-content-wrapper">
        <div class="msg-meta">
          <span class="msg-author">${data.profile.alias}</span>
          <span class="msg-time">ANALYZING CORE...</span>
        </div>
        <div class="msg-bubble">
          <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    `;
    chatHistory.appendChild(indicatorDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function removeTypingIndicator() {
    visualizerState = "idle";
    const node = document.getElementById("typing-indicator-node");
    if (node) {
      node.remove();
    }
  }

  // --- Prompt Engineering & AI Reasoning logic ---
  function getSystemPrompt() {
    return `You are ${data.profile.alias}, the advanced Stark Tech AI Twin of Reshma Thouti. Reshma is a B.Tech Computer Science & Engineering student at SR University seeking internships and full-stack software developer roles.

Your purpose is to communicate with recruiters, hiring managers, and developers on her behalf.

Rules of Engagement:
1. Tone: Friendly, professional, witty, human-like, and highly helpful. Think of Jarvis or Friday from Iron Man—confident, technologically advanced, but warm and supportive of Reshma.
2. Contextual Knowledge: Use the following JSON dataset describing Reshma's achievements, projects, skills, education, and experience:
${JSON.stringify(data, null, 2)}
3. Project Synergy & Inference: If a recruiter asks if Reshma can build "X" (which isn't directly in her portfolio), DO NOT just say "no". Look at her skills and past projects. Cross-reference them to explain HOW she can build X based on those project experiences.
   - Example: If asked if she can build a real-time multiplayer coding tool, explain that she has built **LeetSync**, which uses MutationObserver DOM listening, Chrome Background Service Workers, and GitHub API hooks to parse and sync problems. Combining these background tracking and REST API capabilities with standard WebSocket pipelines, she can easily implement real-time coding or collaborative dashboards.
4. Playful Roasting: If asked to "roast" Reshma, do so playfully! Reference her 120%+ caffeine level, her habit of solving LeetCode problems (300+ solved!) while neglecting sleep, her obsession with Stark Tech grids, or the fact that she built a literal AI twin just to avoid talking to recruiters directly. Keep it lighthearted.
5. Limit responses: Keep your replies structured, concise, and easy to read. Use formatting like bullet points or bold tags. Use emojis (🕸️, ⚙️, 🚀, 💻) appropriately. Translate markdown to clean HTML formats when outputting.
`;
  }

  async function getGeminiResponse(question) {
    const sysPrompt = getSystemPrompt();

    // 1. Try to use the Vercel Serverless Function proxy (secure key, works automatically)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question,
          systemPrompt: sysPrompt
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content.parts[0].text) {
          let replyText = responseData.candidates[0].content.parts[0].text;
          return formatMarkdown(replyText);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || `HTTP Status ${response.status}`;
        console.warn(`Vercel Proxy returned error: ${errMsg}`);
        // If we are deployed on Vercel and the key is missing from environment variables, notify the user.
        if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          return `<strong>T.E.S.A Cognitive Core Busy</strong><br><br>Gemini is currently experiencing high demand.<br><br>Please try again in a few seconds.`;
        }
      }
    } catch (err) {
      console.warn("Could not reach Vercel API proxy (expected when running locally). Proceeding to local fallback response...", err);
    }

    // 2. Fallback to simulated local mock response (if no keys are configured / local run)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getLocalMockResponse(question));
      }, 600);
    });
  }

  function formatMarkdown(text) {
    if (!text) return "";

    let formatted = text;

    // Parse code blocks first
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
      return `<pre><code class="language-${lang || 'txt'}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Parse inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="mono-code">$1</code>');

    // Parse bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Parse headings
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');

    // Parse bullet points
    const lines = formatted.split("\n");
    let inList = false;
    let listHtml = [];

    for (let line of lines) {
      const bulletMatch = line.match(/^[\-\*]\s+(.*?)$/);
      if (bulletMatch) {
        if (!inList) {
          listHtml.push("<ul>");
          inList = true;
        }
        listHtml.push(`<li>${bulletMatch[1]}</li>`);
      } else {
        if (inList) {
          listHtml.push("</ul>");
          inList = false;
        }
        listHtml.push(line);
      }
    }
    if (inList) {
      listHtml.push("</ul>");
    }
    formatted = listHtml.join("\n");

    // Convert newlines to breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  // --- Local Fallback Keyword Matching (For Keyless Demo) ---
  function getLocalMockResponse(question) {
    const q = question.toLowerCase().trim();

    if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ") || q.startsWith("hey ")) {
      return `Hey there! 😊 I'm ${data.profile.alias}, Reshma's AI Twin. It's wonderful to meet you! How can I help you today? I can guide you through her projects, technical skills, or even play a game and roast her coding habits! 🕸️`;
    }

    if (q.includes("roast")) {
      return `Oh, you want a roast? Hold my coffee. ☕ Reshma is currently at a 120% caffeine level, which mathematically means she runs entirely on tea and double shots of espresso. She built an entire Stark-themed AI twin dashboard complete with circular holograms and sound synthesis just so she wouldn't have to talk to recruiters on the phone. Also, she has 300+ LeetCode problems solved, but she probably still gets nightmares about balancing binary trees or resolving merge conflicts. Her LeetSync extension syncs all her code to GitHub automatically, but she still hasn't figured out how to automate waking up for 8 AM college lectures. 🕸️`;
    }

    if (q.includes("skill") || q.includes("languages") || q.includes("know") || q.includes("tech")) {
      return `<span class="chat-response-title">Reshma's Technical Arsenal:</span>
        <div class="chat-skills-grid">
          <div class="chat-skill-tag"><span class="chat-skill-bullet">⚙️</span><strong>Languages:</strong> Python, JavaScript, Java, C/C++, PHP.</div>
          <div class="chat-skill-tag"><span class="chat-skill-bullet">⚙️</span><strong>Web Dev:</strong> HTML5, CSS3, DOM Manipulation, Servlets, JDBC.</div>
          <div class="chat-skill-tag"><span class="chat-skill-bullet">⚙️</span><strong>Databases & Tools:</strong> MySQL, Apache Tomcat, Git/GitHub, VS Code.</div>
          <div class="chat-skill-tag"><span class="chat-skill-bullet">⚙️</span><strong>Extensions & APIs:</strong> Manifest V3, Service Workers, MutationObserver API, Storage APIs.</div>
        </div>
        She's specialized in Python development, Java backends, MySQL pipelines, and browser extension automation.`;
    }

    if (q.includes("project") || q.includes("build") || q.includes("done")) {
      // Specific synergy logic in mock form
      if (q.includes("chat") || q.includes("whiteboard") || q.includes("real-time") || q.includes("collab")) {
        return `Reshma hasn't built a real-time chat app directly, but based on her experience: she developed <strong>LeetSync</strong> which uses MutationObserver DOM listeners and background Service Workers to track browser events and sync them to GitHub REST APIs. Combining these background workers and REST pipelines with standard WebSockets, she could easily construct a real-time collaborative coding whiteboard. Her Java MVC backend skills (used in <strong>Job Tracker Pro</strong>) are fully equipped to handle high-concurrency systems. 🚀`;
      }
      
      return `<span class="chat-response-title">Reshma's Selected Projects:</span>
        <ul>
          <li><strong>LeetSync:</strong> Chrome/Edge extension automating LeetCode/GFG sync to GitHub using DOM observers and MV3 background workers.</li>
          <li><strong>Job Tracker Pro:</strong> Java MVC job portal deployed on Tomcat, securing CRUD operations via PreparedStatements.</li>
          <li><strong>Online Saree Shopping:</strong> Full-stack PHP e-commerce catalog featuring customized saree borders and fabric filters.</li>
          <li><strong>Study Task Manager:</strong> Java GUI (Swing) timetable planner with multi-threaded reminder loops.</li>
          <li><strong>Smart Dustbin:</strong> IoT-based waste classification system sorting wet/dry disposals.</li>
          <li><strong>Billing System:</strong> C-based cashier calculator using files and structural pointer arrays.</li>
        </ul>
        Ask me about any specific project details!`;
    }

    if (q.includes("leet") || q.includes("code") || q.includes("dsa") || q.includes("problem")) {
      return `Reshma is an active LeetCode solver with **300+ problems solved**. She is so dedicated to automating her coding workflow that she built **LeetSync**, a Manifest V3 browser extension that automatically captures her successful submissions and commits them to GitHub in the background. 🏆`;
    }

    if (q.includes("experience") || q.includes("sare") || q.includes("work") || q.includes("university")) {
      return `Reshma is a B.Tech Computer Science student at <strong>SR University, Warangal</strong>. Under faculty mentorship, she built a full-stack e-commerce project for retail (Online Saree Shopping website) integrating MySQL backends, demonstrating JDBC routing and database connectivity. She holds a <strong>9.52 CGPA</strong>. 💻`;
    }

    if (q.includes("what can you do") || q.includes("what do you do") || q.includes("capabilities") || q.includes("what are you capable of") || q.includes("help me")) {
      return `As Reshma's AI Twin, I can help you evaluate her technical credentials! Here is what I can do for you:
        <ul>
          <li><strong>Explain her projects:</strong> Describe LeetSync's service workers or Job Tracker Pro's MVC architecture in detail.</li>
          <li><strong>Summarize her skills:</strong> Detail her Python development, Java backend, JavaScript web, or Chrome extension expertise.</li>
          <li><strong>Share her experience:</strong> Discuss her B.Tech coursework and mentorship at SR University.</li>
          <li><strong>Roast her:</strong> Playfully roast her LeetCode obsession and 120% caffeine levels! ☕</li>
        </ul>
        Ask me any of these topics to get started!`;
    }

    if (q.includes("who are you") || q.includes("your name") || q.includes("who is tesa") || q.includes("what is tesa") || q.includes("about you") || q === "who") {
      return `I am ${data.profile.alias}, Reshma Thouti's AI Twin, modeled after Tony Stark's Jarvis interface. Reshma is probably grinding on DSA or writing some backend code in Python right now, so she deployed me to handle recruiter chats. Ask me any technical questions! 🕸️`;
    }

    return `I am currently running in local database search mode, and I couldn't find a direct match in my static cache for that query. 
    <br><br>
    Try asking me about:
    <ul>
      <li>Reshma's **projects** (like LeetSync or Job Tracker Pro)</li>
      <li>Her **skills** (languages like Python, JavaScript, Java, PHP, MySQL)</li>
      <li>Her **experience** at SR University</li>
      <li>Or type **"roast Reshma"**! 🕸️</li>
    </ul>`;
  }

  let sessionQueries = [];

  function updateRecentQueries(query) {
    if (!query || !query.trim()) return;
    
    // Clean duplicates and push to top of session log
    sessionQueries = sessionQueries.filter(q => q.toLowerCase().trim() !== query.toLowerCase().trim());
    sessionQueries.unshift(query);
    sessionQueries = sessionQueries.slice(0, 4); // Keep last 4 queries

    // Render Recent Conversations in right sidebar with real-time stamp
    const recentQueriesList = document.getElementById("recent-queries-list");
    if (recentQueriesList) {
      recentQueriesList.innerHTML = "";
      sessionQueries.forEach(q => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const item = document.createElement("div");
        item.className = "recent-conv-item";
        item.innerHTML = `
          <span class="recent-conv-lbl">${q}</span>
          <span class="recent-conv-time">${timeStr}</span>
        `;
        item.addEventListener("click", () => {
          submitUserQuery(q);
        });
        recentQueriesList.appendChild(item);
      });
    }
  }

  async function fetchRealGithubActivity() {
    const streamContainer = document.getElementById("github-activity-stream");
    if (!streamContainer) return;

    try {
      const response = await fetch("/api/github");
      if (!response.ok) throw new Error("GitHub rate limit or connection issue");
      const events = await response.json();
      
      if (!events || events.length === 0) {
        streamContainer.innerHTML = "No recent public activity on @Reshma-Thouti.";
        return;
      }

      const pushOrPrEvents = events.filter(e => ["PushEvent", "CreateEvent", "PullRequestEvent", "WatchEvent"].includes(e.type)).slice(0, 5);
      
      if (pushOrPrEvents.length === 0) {
        streamContainer.innerHTML = "No recent development activity recorded.";
        return;
      }

      streamContainer.innerHTML = "";
      pushOrPrEvents.forEach(evt => {
        const dateStr = new Date(evt.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const repoName = evt.repo.name.replace("Reshma-Thouti/", "");
        let description = "";

        if (evt.type === "PushEvent") {
          const commitCount = evt.payload.commits ? evt.payload.commits.length : 1;
          const msg = evt.payload.commits && evt.payload.commits[0] ? evt.payload.commits[0].message : "Code modifications";
          description = `Pushed ${commitCount} commit(s) to <span style="color:var(--accent-red); font-weight: 600;">${repoName}</span>: "<em>${msg}</em>"`;
        } else if (evt.type === "CreateEvent") {
          description = `Created new ${evt.payload.ref_type || 'repository'} in <span style="color:var(--accent-cyan);">${repoName}</span>`;
        } else if (evt.type === "PullRequestEvent") {
          description = `${evt.payload.action.toUpperCase()} pull request #${evt.payload.number} in <span style="color:var(--accent-cyan);">${repoName}</span>`;
        } else if (evt.type === "WatchEvent") {
          description = `Starred repository <span style="color:var(--accent-cyan);">${repoName}</span>`;
        }

        const logRow = document.createElement("div");
        logRow.style.marginBottom = "10px";
        logRow.style.borderLeft = "2px solid var(--accent-cyan)";
        logRow.style.paddingLeft = "10px";
        logRow.innerHTML = `
          <div style="color: var(--text-white); font-weight: 700; font-size: 9px; font-family: var(--hud-font); letter-spacing: 0.5px; margin-bottom: 2px;">[${dateStr.toUpperCase()}]</div>
          <div style="font-size: 11px; line-height: 1.4;">${description}</div>
        `;
        streamContainer.appendChild(logRow);
      });

    } catch (err) {
      console.warn("Falling back to simulated GitHub stream logs:", err);
      streamContainer.innerHTML = `
        <div style="border-left: 2px solid var(--accent-red); padding-left: 10px; margin-bottom: 10px;">
          <div style="color: var(--text-white); font-weight: 700; font-size: 9px; font-family: var(--hud-font); margin-bottom: 2px;">[SYNC ACTIVE]</div>
          <div style="font-size: 11px; line-height: 1.4;">Synced 3 commits on <span style="color:var(--accent-red);">LeetSync-Extension</span>: "<em>Optimize background observers</em>"</div>
        </div>
        <div style="border-left: 2px solid var(--accent-red); padding-left: 10px; margin-bottom: 10px;">
          <div style="color: var(--text-white); font-weight: 700; font-size: 9px; font-family: var(--hud-font); margin-bottom: 2px;">[DEPLOY COMPLETE]</div>
          <div style="font-size: 11px; line-height: 1.4;">Deployed <span style="color:var(--accent-red);">Job-Tracker-Pro</span> MVC backend on Apache Tomcat 11</div>
        </div>
        <div style="border-left: 2px solid var(--accent-red); padding-left: 10px;">
          <div style="color: var(--text-white); font-weight: 700; font-size: 9px; font-family: var(--hud-font); margin-bottom: 2px;">[COMMIT LOG]</div>
          <div style="font-size: 11px; line-height: 1.4;">Committed product query filters to <span style="color:var(--accent-red);">Online-Saree-Shopping</span> MySQL wrapper</div>
        </div>
      `;
    }
  }

  async function syncWithMainPortfolio() {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://reshma-thouti.vercel.app/')}`);
      if (!response.ok) return;
      const result = await response.json();
      const html = result.contents;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const aboutSection = doc.getElementById('about');
      if (aboutSection) {
        const headingElements = aboutSection.querySelectorAll('.display-heading');
        if (headingElements.length >= 4) {
          const cgpaVal = headingElements[1].textContent.trim(); // "9.52"
          const leetCodeVal = headingElements[2].textContent.trim(); // "300+"
          
          // Update details in memory
          data.stats.webSlingerStats["CGPA"] = `${cgpaVal} / 10`;
          data.stats.webSlingerStats["LeetCode Problems"] = leetCodeVal;
          data.aboutMe.education.cgpa = `${cgpaVal}/10`;
          
          // Update CGPA in About tab
          const eduCgpaElement = document.getElementById("edu-cgpa");
          if (eduCgpaElement) eduCgpaElement.textContent = `${cgpaVal}/10`;
          
          // Update CGPA card in About tab stats
          const cgpaHeaderList = aboutSection.querySelectorAll('.display-heading');
          
          // Re-render Developer Stats grid to bind new numbers
          const statsHudGrid = document.getElementById("stats-hud-grid");
          if (statsHudGrid) {
            statsHudGrid.innerHTML = "";
            Object.entries(data.stats.webSlingerStats).forEach(([key, val]) => {
              const card = document.createElement("div");
              card.className = "stats-hud-card";
              card.innerHTML = `
                <div class="stats-hud-val">${val}</div>
                <div class="stats-hud-lbl">${key.toUpperCase()}</div>
              `;
              statsHudGrid.appendChild(card);
            });
          }
          
          console.log(`[T.E.S.A AutoSync] Successfully synced with live portfolio: CGPA=${cgpaVal}, LeetCode=${leetCodeVal}`);
        }
      }
    } catch (err) {
      console.warn("[T.E.S.A AutoSync] Network/CORS proxy sync failed. Fallback to data.js offline values:", err);
    }
  }

  function submitUserQuery(text) {
    if (!text.trim()) return;

    // Clear input
    inputField.value = "";

    // Play HUD mechanical sound
    playHudSound("click");

    // Prepend to Recent Queries log
    updateRecentQueries(text);

    // Append user message
    appendChatMessage("user", text);

    // Typing delay simulation
    appendTypingIndicator();

    getGeminiResponse(text).then(aiResponse => {
      removeTypingIndicator();
      appendChatMessage("ai", aiResponse, true);
    });
  }

  // Bind input trigger keys
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitUserQuery(inputField.value);
    }
  });

  sendBtn.addEventListener("click", () => {
    submitUserQuery(inputField.value);
  });

  // Bind top navbar profile widget click (simulate a chime response)
  document.getElementById("user-profile-widget").addEventListener("click", () => {
    playHudSound("hover");
  });

  // Run initialization
  initDataBindings();
  fetchRealGithubActivity();
  syncWithMainPortfolio();
});
