* {
  box-sizing: border-box;
}

:root {
  --bg: #020817;
  --panel: rgba(15, 23, 42, 0.85);
  --panel-border: rgba(148, 163, 184, 0.2);
  --text: #e2e8f0;
  --muted: #94a3b8;
  --primary: #8b5cf6;
  --primary-2: #38bdf8;
  --success: #34d399;
  --warning: #fbbf24;
  --shadow: rgba(15, 23, 42, 0.5);
}

body {
  margin: 0;
  font-family: Inter, 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.28), transparent 25%),
    radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.25), transparent 30%),
    var(--bg);
  color: var(--text);
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.topbar {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  letter-spacing: 0.18em;
  color: var(--primary-2);
  font-size: 12px;
  font-weight: 700;
}

h1, h2, p {
  margin-top: 0;
}

h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(300px, 420px) minmax(320px, 1fr);
  gap: 24px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 40px var(--shadow);
  backdrop-filter: blur(12px);
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-weight: 600;
}

textarea,
select,
input,
button {
  font: inherit;
}

textarea,
select,
input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.7);
  color: var(--text);
  border-radius: 12px;
  padding: 14px 16px;
  outline: none;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

button {
  width: 100%;
  border: none;
  cursor: pointer;
  padding: 14px 18px;
  border-radius: 12px;
  color: white;
  background: linear-gradient(90deg, var(--primary), var(--primary-2));
  font-weight: 700;
  margin-top: 18px;
  transition: transform 0.2s ease, filter 0.2s ease;
}

button:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.75;
  cursor: wait;
}

.status {
  margin-top: 18px;
  min-height: 24px;
  color: var(--warning);
  font-size: 0.95rem;
}

.video-frame {
  position: relative;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9));
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  min-height: 420px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

video {
  width: 100%;
  max-height: 540px;
  display: none;
  border-radius: 12px;
  background: #020617;
}

video.visible {
  display: block;
}

.empty-state {
  color: var(--muted);
  text-align: center;
  padding: 24px;
}

@media (max-width: 800px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 1fr;
  }
}
