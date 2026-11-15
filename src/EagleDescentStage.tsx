import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { eagle } from "./eagle";

const modelPath = "/models/apollo.glb";
const decoderPath = "/draco/";

// Mesh names in the NASA/Michael D. Carbajal GLB for the landing gear,
// descent body and engine, ladder, forward platform, and descent-stage hardware.
const descentParts = /^(group31 |group13 p2$|group13 pC$|pCylinder[12367]$|pCube3$|pCylinde11$|polySurfa1$|pPlane[12]$)/;

export function EagleDescentStage({ unit, ground, night }: {
  unit: number;
  ground: (x: number, z: number) => number;
  night: number;
}) {
  const { scene } = useEagleModel();
  const stage = useMemo(() => {
    const object = scene.clone(true);
    const ascentParts: Object3D[] = [];
    object.traverse((part) => {
      // GLTFLoader wraps nodes with multiple material primitives in a Group.
      // The original part name is on that group, above its renderable meshes.
      const originalName = part.userData.name;
      if (typeof originalName === "string" && originalName !== "lunarlande" && !descentParts.test(originalName)) {
        ascentParts.push(part);
      }
    });
    ascentParts.forEach((part) => part.removeFromParent());
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
