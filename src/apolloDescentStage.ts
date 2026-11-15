import type { Object3D } from "three";

const descentParts = new Set([
  "group13 p2", "group13 pC", "pCylinder1", "pCylinder3",
  "pCylinder6", "pCylinder7", "polySurfa1", "pPlane1", "pPlane2",
]);

export function keepApolloDescentStage(model: Object3D) {
  const module = model.getObjectByProperty("name", "lunarlande");
  if (!module) return;

  for (const part of [...module.children]) {
    const name: string = part.userData.name ?? part.name;
    if (!descentParts.has(name) && !name.startsWith("group31 ")) {
      module.remove(part);
    }
  }
}
