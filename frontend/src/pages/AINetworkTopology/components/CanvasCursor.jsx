/* CanvasCursor — cursify-inspired flowing trail effect */

import { useEffect, useRef } from 'react';

function Node() { this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; }

const CFG = { friction: 0.5, trails: 20, size: 50, dampening: 0.25, tension: 0.98 };

function Line(pos, spring) {
  this.spring = spring + 0.1 * Math.random() - 0.02;
  this.friction = CFG.friction + 0.01 * Math.random() - 0.002;
  this.nodes = [];
  for (let i = 0; i < CFG.size; i++) {
    const n = new Node(); n.x = pos.x; n.y = pos.y;
    this.nodes.push(n);
  }
}
Line.prototype.update = function (pos) {
  let sp = this.spring, t = this.nodes[0];
  t.vx += (pos.x - t.x) * sp; t.vy += (pos.y - t.y) * sp;
  for (let i = 0; i < this.nodes.length; i++) {
    t = this.nodes[i];
    if (i > 0) {
      const p = this.nodes[i - 1];
      t.vx += (p.x - t.x) * sp; t.vy += (p.y - t.y) * sp;
      t.vx += p.vx * CFG.dampening; t.vy += p.vy * CFG.dampening;
    }
    t.vx *= this.friction; t.vy *= this.friction;
    t.x += t.vx; t.y += t.vy;
    sp *= CFG.tension;
  }
};
Line.prototype.draw = function (ctx) {
  let n0 = this.nodes[0], x = n0.x, y = n0.y;
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let i = 1, len = this.nodes.length - 2; i < len; i++) {
    const a = this.nodes[i], b = this.nodes[i + 1];
    x = 0.5 * (a.x + b.x); y = 0.5 * (a.y + b.y);
    ctx.quadraticCurveTo(a.x, a.y, x, y);
  }
  const a = this.nodes[this.nodes.length - 2], b = this.nodes[this.nodes.length - 1];
  ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
  ctx.stroke(); ctx.closePath();
};

export default function CanvasCursor() {
  const canvasRef = useRef(null);
  const runRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = { x: 0, y: 0 };
    let lines = [], phase = Math.random() * Math.PI * 2, inited = false;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();

    const initLines = () => {
      lines = [];
      for (let i = 0; i < CFG.trails; i++) lines.push(new Line(pos, 0.4 + (i / CFG.trails) * 0.025));
      inited = true;
    };

    const onMove = (e) => {
      if (e.touches) { pos.x = e.touches[0].pageX; pos.y = e.touches[0].pageY; }
      else { pos.x = e.clientX; pos.y = e.clientY; }
      if (!inited) initLines();
    };

    const render = () => {
      if (!runRef.current) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      phase += 0.0015;
      ctx.strokeStyle = `hsla(${Math.round(285 + Math.sin(phase) * 85)},50%,50%,0.2)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < lines.length; i++) { lines[i].update(pos); lines[i].draw(ctx); }
      requestAnimationFrame(render);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove);
    window.addEventListener('resize', resize);
    runRef.current = true;
    render();

    return () => {
      runRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none' }} />;
}
