import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3, Euler } from "three";
import { Monster } from "three-react-character-omnom";

export type MonsterConfig = {
  color?: number;
  origin: Vector3;
  speed: number;
};

export type MonsterState = {
  position: Vector3;
  rotation: Euler;
  phase: number;
};

const monsterCount = 7;

export function AnimatedMonsters() {
  const monsters = useMemo<MonsterConfig[]>(
    () =>
      new Array(monsterCount).fill(null).map((_, _index) => {
        return {
          color: undefined,
          origin: new Vector3(Math.random() * 4 - 2, 0, Math.random() * 4 - 2),
          speed: Math.random() * 0.75 + 0.5,
        };
      }),
    [],
  );
  const monsterStates = useMemo<MonsterState[]>(
    () =>
      monsters.map(() => ({
        position: new Vector3(),
        rotation: new Euler(),
        phase: Math.random() * Math.PI * 2,
      })),
    [monsters],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * 4;
    monsters.forEach((monster, index) => {
      const monsterState = monsterStates[index];
      const tScaled = t * monster.speed;
      monsterState.position.set(
        Math.sin(tScaled * 0.2) * 0.5 + monster.origin.x + 1,
        Math.sin(tScaled * 6.6 + monsterState.phase) * 0.05 - 0.9 + monster.origin.y,
        Math.sin(tScaled * 0.4) * -0.25 + monster.origin.z,
      );
      monsterState.rotation.set(0, Math.sin(tScaled * 0.4) * -1 + 2, 0);
    });
  }, -1);

  return (
    <>
      {monsters.map((monster, index) => (
        <Monster
          key={index}
          color={monster.color}
          position={monsterStates[index].position}
          rotation={monsterStates[index].rotation}
          lookTarget={new Vector3(20, 2, 0)}
          floorHeight={-0.15}
          scale={0.15}
        />
      ))}
    </>
  );
}
