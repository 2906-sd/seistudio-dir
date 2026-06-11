/**
 * Shimeji Controller - Chiikawa mascot for SEI STUDIO
 * Manages sprite animation, physics, and user interactions
 */

class ShimejiMascot {
  constructor(config = {}) {
    this.config = {
      basePath: config.basePath || 'sprites/',
      spriteCount: config.spriteCount || 70,
      spriteSize: config.spriteSize || 512,
      animationSchema: config.animationSchema || {},
      ...config
    };

    this.state = {
      x: window.innerWidth - 150,
      y: window.innerHeight - 200,
      velocityX: 0,
      velocityY: 0,
      currentAnimation: 'fall',
      currentFrame: 0,
      frameTimer: 0,
      facing: 'RIGHT',
      isDragging: false,
      isZoomed: false
    };

    this.animations = config.animationSchema.animations || [];
    this.gravity = 0.5;
    this.friction = 0.95;
    this.maxVelocity = 12;

    this.init();
  }

  init() {
    this.createDOM();
    this.loadAnimationSchema();
    this.startGameLoop();
    this.attachEventListeners();
  }

  createDOM() {
    // Container
    this.container = document.createElement('div');
    this.container.id = 'shimeji-container';
    this.container.style.cssText = `
      position: fixed;
      left: ${this.state.x}px;
      top: ${this.state.y}px;
      width: 80px;
      height: 80px;
      z-index: 500;
      pointer-events: auto;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    `;

    // Canvas for sprite rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 80;
    this.canvas.height = 80;
    this.canvas.style.cssText = `
      display: block;
      cursor: grab;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    `;

    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);

    this.ctx = this.canvas.getContext('2d');

    // Preload sprites
    this.sprites = [];
    for (let i = 0; i < this.config.spriteCount; i++) {
      const img = new Image();
      img.src = `${this.config.basePath}${String(i).padStart(4, '0')}.webp`;
      this.sprites.push(img);
    }
  }

  loadAnimationSchema() {
    // You can customize animations here if needed
    // For now, we'll use basic physics-based movement
  }

  attachEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onDragStart(e));
    document.addEventListener('mousemove', (e) => this.onDragMove(e));
    document.addEventListener('mouseup', (e) => this.onDragEnd(e));

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => this.onDragStart(e));
    document.addEventListener('touchmove', (e) => this.onDragMove(e));
    document.addEventListener('touchend', (e) => this.onDragEnd(e));

    // Click events
    this.canvas.addEventListener('click', () => this.onTap());

    // Window resize
    window.addEventListener('resize', () => this.constrainPosition());
  }

  onDragStart(e) {
    if (e.touches) {
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
    } else {
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
    this.state.isDragging = true;
    this.canvas.style.cursor = 'grabbing';
  }

  onDragMove(e) {
    if (!this.state.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    this.state.x += dx;
    this.state.y += dy;

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    this.constrainPosition();
    this.updatePosition();
  }

  onDragEnd() {
    this.state.isDragging = false;
    this.canvas.style.cursor = 'grab';
    this.state.velocityX = 0;
    this.state.velocityY = 0;
  }

  onTap() {
    // Random movement on tap
    this.state.velocityX = (Math.random() - 0.5) * 8;
    this.state.velocityY = -8;
  }

  startGameLoop() {
    this.lastTime = Date.now();
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }

  update() {
    if (this.state.isDragging) return;

    // Apply gravity
    this.state.velocityY += this.gravity;

    // Limit velocity
    this.state.velocityX = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.state.velocityX));
    this.state.velocityY = Math.max(-this.maxVelocity, Math.min(this.maxVelocity * 2, this.state.velocityY));

    // Apply friction
    this.state.velocityX *= this.friction;

    // Update position
    this.state.x += this.state.velocityX;
    this.state.y += this.state.velocityY;

    // Bounce off edges
    const maxX = window.innerWidth - this.canvas.width;
    const maxY = window.innerHeight - this.canvas.height;

    if (this.state.x <= 0) {
      this.state.x = 0;
      this.state.velocityX = Math.abs(this.state.velocityX) * 0.7;
      this.state.facing = 'RIGHT';
    }
    if (this.state.x >= maxX) {
      this.state.x = maxX;
      this.state.velocityX = -Math.abs(this.state.velocityX) * 0.7;
      this.state.facing = 'LEFT';
    }
    if (this.state.y >= maxY) {
      this.state.y = maxY;
      this.state.velocityY *= -0.6;
      
      // Random direction after bounce
      if (Math.random() > 0.7) {
        this.state.velocityX = (Math.random() - 0.5) * 4;
      }
    }
    if (this.state.y <= 0) {
      this.state.y = 0;
      this.state.velocityY = Math.abs(this.state.velocityY) * 0.5;
    }

    // Animation frame timer
    this.state.frameTimer++;
    if (this.state.frameTimer > 6) {
      this.state.frameTimer = 0;
      this.state.currentFrame = (this.state.currentFrame + 1) % this.config.spriteCount;
    }

    this.updatePosition();
  }

  updatePosition() {
    this.container.style.left = Math.round(this.state.x) + 'px';
    this.container.style.top = Math.round(this.state.y) + 'px';
  }

  constrainPosition() {
    const maxX = window.innerWidth - this.canvas.width;
    const maxY = window.innerHeight - this.canvas.height;

    this.state.x = Math.max(0, Math.min(maxX, this.state.x));
    this.state.y = Math.max(0, Math.min(maxY, this.state.y));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sprite = this.sprites[this.state.currentFrame];
    if (!sprite.complete) return;

    // Flip horizontally if facing left
    if (this.state.facing === 'LEFT') {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(sprite, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
      this.ctx.scale(-1, 1);
    } else {
      this.ctx.drawImage(sprite, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'block';
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.shimeji = new ShimejiMascot({
    basePath: 'sprites/',
    spriteCount: 70,
    spriteSize: 512
  });
});
