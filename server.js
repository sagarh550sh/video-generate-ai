const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 3000;
const appRoot = __dirname;
const generatedDir = path.join(appRoot, 'generated');

if (!ffmpegPath) {
  console.error('ffmpeg-static binary was not found. Please reinstall dependencies.');
  process.exit(1);
}

fs.mkdirSync(generatedDir, { recursive: true });

app.use(express.json({ limit: '5mb' }));
app.use('/generated', express.static(generatedDir));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Video AI app is running.' });
});

function buildPromptText(prompt) {
  return prompt.trim().slice(0, 180).replace(/\s+/g, ' ');
}

function buildFilter(prompt, style, duration) {
  const safePrompt = buildPromptText(prompt).replace(/'/g, "\\'");
  const background = style.background || '#0f172a';
  const accent = style.accent || '#f8fafc';
  const mode = style.mode || 'cinematic';

  const subtitle = `${mode.toUpperCase()} // ${safePrompt.toUpperCase()}`;

  return [
    `drawbox=x=0:y=0:width=iw:height=ih:color=${background}@0.94:t=fill`,
    `drawbox=x=60:y=60:width=iw-120:height=ih-120:color=${style.glow || '#1d4ed8'}@0.18:t=fill`,
    `drawtext=text='${subtitle}':fontcolor=${accent}:fontsize=40:fontcolor=${accent}:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=18`,
    `drawtext=text='AI VIDEO GENERATION':fontcolor=#fbbf24:fontsize=22:x=80:y=90:box=1:boxcolor=black@0.35:boxborderw=10`,
    `fade=t=in:st=0:d=0.8,fade=t=out:st=${Math.max(duration - 1.2, 1)}:d=0.8`
  ].join(',');
}

app.post('/api/generate', (req, res) => {
  const { prompt, style = 'cinematic', duration = 8 } = req.body || {};

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'Please enter a video prompt.' });
  }

  const durationNum = Number(duration) || 8;
  const styleMap = {
    cinematic: { background: '#0f172a', accent: '#f8fafc', glow: '#60a5fa', mode: 'cinematic' },
    nature: { background: '#064e3b', accent: '#ecfeff', glow: '#34d399', mode: 'nature' },
    futuristic: { background: '#111827', accent: '#e0f2fe', glow: '#a78bfa', mode: 'futuristic' },
    fantasy: { background: '#3b0764', accent: '#fdf4ff', glow: '#f472b6', mode: 'fantasy' },
    product: { background: '#1f2937', accent: '#fef3c7', glow: '#f59e0b', mode: 'product' }
  };

  const chosenStyle = styleMap[style] || styleMap.cinematic;
  const projectId = randomUUID();
  const outputDir = path.join(generatedDir, projectId);
  const outputFile = path.join(outputDir, 'video.mp4');

  fs.mkdirSync(outputDir, { recursive: true });

  const cmdArgs = [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=${chosenStyle.background}:s=1280x720:d=${durationNum}`,
    '-vf', buildFilter(String(prompt), chosenStyle, durationNum),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputFile
  ];

  const ffmpeg = spawn(ffmpegPath, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  ffmpeg.on('error', (error) => {
    console.error('FFmpeg error:', error.message);
    return res.status(500).json({
      error: 'Video generation failed. Please check ffmpeg or try again.',
      detail: error.message
    });
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      console.error('FFmpeg exited with code', code);
      console.error(stderr);
      return res.status(500).json({
        error: 'Video generation failed.',
        detail: stderr
      });
    }

    const videoUrl = `/generated/${projectId}/video.mp4`;
    res.json({
      success: true,
      videoUrl,
      prompt: buildPromptText(prompt),
      style: chosenStyle.mode,
      duration: durationNum,
      resolution: '1280x720'
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Video AI app listening on http://localhost:${PORT}`);
});
