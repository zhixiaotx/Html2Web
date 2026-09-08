export const DEFAULT_HTML = `<div class="welcome-card">
  <div class="badge">100% 免费 & 实时预览</div>
  <h1>🚀 HTMLShare 在线代码托管</h1>
  <p>支持编写 HTML、CSS 和 JavaScript，支持从 GitHub / Bitbucket 提取链接、粘贴代码或上传本地 HTML 文件。</p>
  <div class="actions">
    <button id="counterBtn" class="btn primary">点击互动: <span id="count">0</span></button>
    <button id="particleBtn" class="btn secondary">触发彩带 🎉</button>
  </div>
</div>`;

export const DEFAULT_CSS = `@import "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap";

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #f8fafc;
}

.welcome-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 480px;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #ffffff, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 1.8rem;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: #6366f1;
  color: white;
}

.btn.primary:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}`;

export const DEFAULT_JS = `let count = 0;
const countSpan = document.getElementById('count');
const counterBtn = document.getElementById('counterBtn');
const particleBtn = document.getElementById('particleBtn');

if (counterBtn && countSpan) {
  counterBtn.addEventListener('click', () => {
    count++;
    countSpan.textContent = count;
    counterBtn.style.transform = 'scale(0.95)';
    setTimeout(() => counterBtn.style.transform = '', 100);
  });
}

if (particleBtn) {
  particleBtn.addEventListener('click', () => {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.textContent = ['🎉', '✨', '⚡️', '🚀', '💖'][Math.floor(Math.random() * 5)];
      p.style.position = 'fixed';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = '100vh';
      p.style.fontSize = '24px';
      p.style.pointerEvents = 'none';
      p.style.transition = 'all 1.5s ease-out';
      document.body.appendChild(p);
      
      requestAnimationFrame(() => {
        p.style.transform = \`translateY(-\${Math.random() * 80 + 20}vh) rotate(\${Math.random() * 360}deg)\`;
        p.style.opacity = '0';
      });
      
      setTimeout(() => p.remove(), 1600);
    }
  });
}
`;
