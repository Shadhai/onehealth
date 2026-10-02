import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

const TENTACLES = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return {
    angle,
    x: Math.cos(angle) * 0.42,
    z: Math.sin(angle) * 0.42,
    rotation: [0.18 * Math.sin(angle), 0, -angle],
  };
});

function Octopus() {
  const group = useRef(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group ref={group} rotation={[0.08, 0, 0]} scale={0.72}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.65, 12, 8]} />
        <meshStandardMaterial color="#29c7b4" roughness={0.42} metalness={0.12} />
      </mesh>

      {TENTACLES.map(({ angle, x, z, rotation }) => (
        <mesh key={angle} position={[x, -0.22, z]} rotation={rotation} castShadow>
          <capsuleGeometry args={[0.12, 0.62, 4, 8]} />
          <meshStandardMaterial color="#168f88" roughness={0.52} metalness={0.08} />
        </mesh>
      ))}

      <mesh position={[-0.23, 0.48, 0.58]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#eaf5f2" roughness={0.3} />
      </mesh>
      <mesh position={[0.23, 0.48, 0.58]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#eaf5f2" roughness={0.3} />
      </mesh>
      <mesh position={[-0.23, 0.48, 0.68]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#071210" roughness={0.25} />
      </mesh>
      <mesh position={[0.23, 0.48, 0.68]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#071210" roughness={0.25} />
      </mesh>
    </group>
  );
}

function Bubbles() {
  const bubbles = [
    [-0.95, 0.7, -0.2, 0.06],
    [0.95, 0.9, -0.15, 0.04],
    [0.72, -0.4, 0.1, 0.035],
    [-0.8, -0.55, 0.2, 0.045],
  ];

  return bubbles.map(([x, y, z, size], index) => (
    <mesh key={index} position={[x, y, z]}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshStandardMaterial color="#5eead4" transparent opacity={0.6} roughness={0.2} />
    </mesh>
  ));
}

export default function BioIndicator() {
  return (
    <div className="bio-container" aria-label="Animated 3D octopus bio-indicator" role="img">
      <Canvas camera={{ position: [0, 0.1, 3.4], fov: 38 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[2, 3, 4]} intensity={2.4} color="#b8fff4" />
        <pointLight position={[-2, -1, 2]} intensity={1.2} color="#0ea5a0" />
        <Octopus />
        <Bubbles />
      </Canvas>
    </div>
  );
}
