import * as THREE from 'three/webgpu';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleBurst {
  readonly group = new THREE.Group();

  private readonly particles: Particle[] = [];

  constructor(poolSize = 40) {
    const geometry = new THREE.TetrahedronGeometry(0.08, 0);

    for (let index = 0; index < poolSize; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1
      });
    }
  }

  emit(
    position: THREE.Vector3,
    color: THREE.ColorRepresentation,
    count: number,
    strong = false
  ): void {
    let emitted = 0;

    for (const particle of this.particles) {
      if (particle.life > 0) {
        continue;
      }

      const speed = strong ? 2.8 + Math.random() * 2.2 : 1.8 + Math.random() * 1.6;
      const verticalLift = strong ? 0.75 : 0.45;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 0.75;

      particle.mesh.position.copy(position);
      particle.mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      particle.mesh.scale.setScalar(strong ? 1.25 : 0.9);
      particle.mesh.visible = true;
      particle.life = strong ? 0.65 + Math.random() * 0.2 : 0.36 + Math.random() * 0.14;
      particle.maxLife = particle.life;
      particle.velocity.set(
        Math.cos(angle) * radius * speed,
        (Math.random() - 0.2) * verticalLift,
        Math.sin(angle) * radius * speed
      );

      const material = particle.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.color.set(color);
        material.opacity = 1;
      }

      emitted += 1;
      if (emitted >= count) {
        return;
      }
    }
  }

  update(delta: number): void {
    for (const particle of this.particles) {
      if (particle.life <= 0) {
        continue;
      }

      particle.life = Math.max(0, particle.life - delta);
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += delta * 7;
      particle.mesh.rotation.y += delta * 5;

      const normalizedLife = particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(Math.max(0, normalizedLife));

      const material = particle.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = normalizedLife;
      }

      if (particle.life <= 0) {
        particle.mesh.visible = false;
      }
    }
  }

  clear(): void {
    for (const particle of this.particles) {
      particle.life = 0;
      particle.mesh.visible = false;
      particle.mesh.scale.setScalar(0);
    }
  }
}
