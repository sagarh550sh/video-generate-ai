const form = document.getElementById('generate-form');
const statusEl = document.getElementById('status');
const videoPlayer = document.getElementById('video-player');
const emptyState = document.getElementById('empty-state');
const generateBtn = document.getElementById('generate-btn');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const prompt = formData.get('prompt')?.toString().trim();
  const style = formData.get('style')?.toString();
  const duration = Number(formData.get('duration')) || 8;

  if (!prompt) {
    statusEl.textContent = 'Please enter a prompt first.';
    return;
  }

  statusEl.textContent = 'Generating your video...';
  generateBtn.disabled = true;
  videoPlayer.classList.remove('visible');
  emptyState.style.display = 'block';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style, duration })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong while generating the video.');
    }

    const src = data.videoUrl;
    videoPlayer.src = src;
    videoPlayer.load();
    videoPlayer.classList.add('visible');
    emptyState.style.display = 'none';
    statusEl.textContent = `Video generated successfully (${data.duration}s • ${data.style})`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message;
  } finally {
    generateBtn.disabled = false;
  }
});
