import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, Vector3 } from "three";
import { eagle } from "./eagle";

const modelPath = "/models/apollo.glb";
const decoderPath = "/draco/";

export function EagleModel({ unit, ground, night }: {
  unit: number;
  ground: (x: number, z: number) => number;
  night: number;
}) {
  const { scene } = useEagleModel();
  const stage = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((part) => {
      if (part instanceof Mesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const scale = eagle.footpadSpan / Math.max(size.x, size.z);
    object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    object.scale.setScalar(scale);
    return object;
  }, [scene]);

  return (
    <group position={[0, ground(0, 0), 0]} scale={unit}>
      <primitive object={stage} />
      <pointLight position={[8, 10, 8]} color="#fff0d7" intensity={(110 + 390 * night) * unit ** 2} distance={36 * unit} />
      <pointLight position={[-7, 6, -7]} color="#c6ddff" intensity={(55 + 180 * night) * unit ** 2} distance={30 * unit} />
    </group>
  );
}

export function useEagleModel() {
  return useGLTF(modelPath, decoderPath);
}
