const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  ring.style.left = mx + 'px';
  ring.style.top = my + 'px';
});

// Particle canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', () => {
  resize();
  init();
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.size = Math.random() * 1.5 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3 - 0.1;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.life = 0;
    this.maxLife = Math.random() * 300 + 200;
    this.color = Math.random() > 0.7 ? '#c8f53a' : (Math.random() > 0.5 ? '#3afff5' : '#f0ede6');
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life++;

    // mouse attraction
    const dx = mx - this.x, dy = my - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      this.x += dx * 0.002;
      this.y += dy * 0.002;
    }

    if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
      this.reset();
    }
  }

  draw() {
    const progress = this.life / this.maxLife;
    const fade = progress < 0.1 ? progress * 10 : (progress > 0.8 ? (1 - progress) * 5 : 1);
    ctx.globalAlpha = this.opacity * fade;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function init() {
  particles = Array.from({length: 160}, () => new Particle());
}

init();

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90) {
        ctx.globalAlpha = (1 - d / 90) * 0.08;
        ctx.strokeStyle = '#c8f53a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function loop() {
  ctx.clearRect(0, 0, W, H);
  drawConnections();
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}

loop();
