const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const db = require('../db');

const router = express.Router();
const generatedDir = path.join(__dirname, '..', 'generated');

// Middleware: require authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get user's videos
router.get('/', requireAuth, async (req, res) => {
  try {
    const videos = await db.query(
      'SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.session.userId]
    );
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single video
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const video = await db.queryOne(
      'SELECT * FROM videos WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate video
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { prompt, style = 'cinematic', duration = 8 } = req.body;

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const videoId = randomUUID();
    const userId = req.session.userId;

    // Save to database
    await db.run(
      'INSERT INTO videos (id, user_id, prompt, style, duration, status) VALUES (?, ?, ?, ?, ?, ?)',
      [videoId, userId, prompt, style, duration, 'processing']
    );

    // Generate video asynchronously (non-blocking)
    generateVideoAsync(videoId, prompt, style, duration, userId);

    res.status(202).json({
      success: true,
      message: 'Video generation started',
      videoId,
      status: 'processing'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate video asynchronously
async function generateVideoAsync(videoId, prompt, style, duration, userId) {
  try {
    const durationNum = Number(duration) || 8;
    const styleMap = {
      cinematic: { background: '#0f172a', accent: '#f8fafc', glow: '#60a5fa', mode: 'cinematic' },
      nature: { background: '#064e3b', accent: '#ecfeff', glow: '#34d399', mode: 'nature' },
      futuristic: { background: '#111827', accent: '#e0f2fe', glow: '#a78bfa', mode: 'futuristic' },
      fantasy: { background: '#3b0764', accent: '#fdf4ff', glow: '#f472b6', mode: 'fantasy' },
      product: { background: '#1f2937', accent: '#fef3c7', glow: '#f59e0b', mode: 'product' }
    };

    const chosenStyle = styleMap[style] || styleMap.cinematic;
    const outputDir = path.join(generatedDir, videoId);
    const outputFile = path.join(outputDir, 'video.mp4');

    fs.mkdirSync(outputDir, { recursive: true });

    const filter = buildFilter(String(prompt), chosenStyle, durationNum);

    const cmdArgs = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=${chosenStyle.background}:s=1280x720:d=${durationNum}`,
      '-vf', filter,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputFile
    ];

    const ffmpeg = spawn(ffmpegPath, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    ffmpeg.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        const videoUrl = `/generated/${videoId}/video.mp4`;
        await db.run(
          'UPDATE videos SET status = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', videoUrl, videoId]
        );
        console.log(`✅ Video generated: ${videoId}`);
      } else {
        await db.run(
          'UPDATE videos SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['failed', stderr, videoId]
        );
        console.error(`❌ Video generation failed: ${videoId}`);
      }
    });
  } catch (error) {
    console.error('Error in generateVideoAsync:', error);
    await db.run(
      'UPDATE videos SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['failed', error.message, videoId]
    );
  }
}

function buildFilter(prompt, style, duration) {
  const safePrompt = prompt.trim().slice(0, 180).replace(/'/g, "\\'");
  const subtitle = `${style.mode.toUpperCase()} // ${safePrompt.toUpperCase()}`;

  return [
    `drawbox=x=0:y=0:width=iw:height=ih:color=${style.background}@0.94:t=fill`,
    `drawbox=x=60:y=60:width=iw-120:height=ih-120:color=${style.glow}@0.18:t=fill`,
    `drawtext=text='${subtitle}':fontcolor=${style.accent}:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=18`,
    `drawtext=text='AI VIDEO GENERATION':fontcolor=#fbbf24:fontsize=22:x=80:y=90:box=1:boxcolor=black@0.35:boxborderw=10`,
    `fade=t=in:st=0:d=0.8,fade=t=out:st=${Math.max(duration - 1.2, 1)}:d=0.8`
  ].join(',');
}

module.exports = router;
