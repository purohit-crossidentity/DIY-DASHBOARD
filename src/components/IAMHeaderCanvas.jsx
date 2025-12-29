/**
 * IAMHeaderCanvas Component
 *
 * Network topology animation - nodes connected by lines with data packets
 */

import { useEffect, useRef } from 'react';
import '../styles/IAMHeaderCanvas.css';

const IAMHeaderCanvas = ({ title }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Network node class
    class NetworkNode {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.type = type; // 'router', 'server', 'endpoint'
        this.size = type === 'server' ? 3 : type === 'router' ? 2.5 : 1.5;
        this.connections = [];
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.01;
      }

      update() {
        this.phase += this.pulseSpeed;
        // Subtle breathing motion
        this.x = this.baseX + Math.sin(this.phase * 0.3) * 1.5;
        this.y = this.baseY + Math.cos(this.phase * 0.4) * 1;
      }

      draw(ctx) {
        const pulse = Math.sin(this.phase) * 0.2 + 1;

        // Main node - smaller, more subtle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'server'
          ? 'rgba(100, 116, 139, 0.5)'
          : this.type === 'router'
          ? 'rgba(100, 116, 139, 0.4)'
          : 'rgba(100, 116, 139, 0.3)';
        ctx.fill();
      }
    }

    // Data packet traveling along connections
    class DataPacket {
      constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.progress = 0;
        this.speed = 0.006 + Math.random() * 0.004;
        this.size = 1 + Math.random() * 0.5;
      }

      update() {
        this.progress += this.speed;
        return this.progress < 1;
      }

      draw(ctx) {
        const x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
        const y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

        // Packet dot - small and subtle
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.fill();
      }
    }

    // Create network topology
    const nodes = [];
    const packets = [];

    // Create main server nodes (larger, fewer)
    const serverCount = 12;
    for (let i = 0; i < serverCount; i++) {
      const x = width * 0.05 + (width * 0.9) * (i / (serverCount - 1));
      const y = height * 0.35 + Math.sin(i * 1.2) * height * 0.15;
      nodes.push(new NetworkNode(x, y, 'server'));
    }

    // Create router nodes (medium) - two rows
    const routerCount = 20;
    for (let i = 0; i < routerCount; i++) {
      const x = width * 0.03 + (width * 0.94) * (i / (routerCount - 1));
      const y = height * 0.6 + Math.cos(i * 0.8) * height * 0.2;
      nodes.push(new NetworkNode(x, y, 'router'));
    }

    // Second row of routers
    for (let i = 0; i < 15; i++) {
      const x = width * 0.08 + (width * 0.84) * (i / 14);
      const y = height * 0.2 + Math.sin(i * 0.6) * height * 0.1;
      nodes.push(new NetworkNode(x, y, 'router'));
    }

    // Create endpoint nodes (smaller, more numerous)
    const endpointCount = 80;
    for (let i = 0; i < endpointCount; i++) {
      const x = 15 + Math.random() * (width - 30);
      const y = 10 + Math.random() * (height - 20);

      // Avoid overlapping with existing nodes
      const tooClose = nodes.some(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (!tooClose) {
        nodes.push(new NetworkNode(x, y, 'endpoint'));
      }
    }

    // Create connections between nearby nodes
    const connections = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(other => {
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Connect based on distance and node types
        const maxDist = (node.type === 'endpoint' || other.type === 'endpoint') ? 70 : 120;

        if (dist < maxDist && dist > 15) {
          connections.push({ from: node, to: other, dist });
          node.connections.push(other);
          other.connections.push(node);
        }
      });
    });

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      connections.forEach(conn => {
        const opacity = Math.max(0.04, 0.15 - (conn.dist / 120) * 0.1);

        ctx.beginPath();
        ctx.moveTo(conn.from.x, conn.from.y);
        ctx.lineTo(conn.to.x, conn.to.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Spawn packets occasionally
        if (Math.random() < 0.001 && packets.length < 15) {
          const direction = Math.random() > 0.5;
          packets.push(new DataPacket(
            direction ? conn.from : conn.to,
            direction ? conn.to : conn.from
          ));
        }
      });

      // Update and draw packets
      for (let i = packets.length - 1; i >= 0; i--) {
        if (!packets[i].update()) {
          packets.splice(i, 1);
        } else {
          packets[i].draw(ctx);
        }
      }

      // Update and draw nodes
      nodes.forEach(node => {
        node.update();
        node.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="iam-header">
      <canvas ref={canvasRef} className="iam-header-canvas" />
      <div className="iam-header-content">
        <h1>{title}</h1>
      </div>
    </div>
  );
};

export default IAMHeaderCanvas;
