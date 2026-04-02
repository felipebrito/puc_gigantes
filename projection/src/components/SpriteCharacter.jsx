// SpriteCharacter.jsx
// Versão 2: usa sprite sheet PNG exportado do Unity (via SpriteSheetExporter)
// + overlay da foto do visitante na posição da cabeça

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULTS = {
    fps:        8,
    bodyH:      2.0,
    headYRatio: 0.80,
    headSize:   0.44,
    headXOffset: 0.0,
};

export function SpriteCharacter({
    position     = [0, 0, 0],
    faceUrl,
    sheetUrl     = '/sprites/character_walk_new_character_4x3_12f.png',
    meta         = { cols: 4, rows: 3, frameCount: 12, frameWidth: 256, frameHeight: 512 },
    scale        = 1,
    direction    = 1,
    spriteConfig = {},
}) {
    const cfg      = { ...DEFAULTS, ...spriteConfig };
    const frameRef = useRef(0);
    const headRef  = useRef();

    const sheetTex = useTexture(sheetUrl, (tex) => {
        tex.colorSpace  = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1 / meta.cols, 1 / meta.rows);
        tex.needsUpdate = true;
    });

    const faceTex = useTexture(faceUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    const aspect   = meta.frameWidth / meta.frameHeight;
    const bodyW    = cfg.bodyH * aspect;
    const headY    = cfg.bodyH * cfg.headYRatio;
    const headSize = bodyW * cfg.headSize;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Avança frame — fps fixo, sem multiplicador de velocidade
        const frame = Math.floor(t * cfg.fps) % meta.frameCount;
        if (frameRef.current !== frame) {
            frameRef.current = frame;
            const col = frame % meta.cols;
            const row = meta.rows - 1 - Math.floor(frame / meta.cols);
            sheetTex.offset.set(col / meta.cols, row / meta.rows);
        }

        // Head bob: 2 bobs por ciclo de caminhada (frequência natural)
        if (cfg.headBob && headRef.current) {
            const cycleDuration = meta.frameCount / cfg.fps; // segundos por ciclo
            const bobFreq       = 2 / cycleDuration;         // 2 bobs por ciclo
            const bob           = Math.sin(t * Math.PI * 2 * bobFreq) * cfg.headBobAmp;
            headRef.current.position.y = headY + bob;
        }
    });

    return (
        <group position={position} scale={[scale * direction, scale, 1]}>
            <mesh position={[0, cfg.bodyH / 2, 0]}>
                <planeGeometry args={[bodyW, cfg.bodyH]} />
                <meshBasicMaterial map={sheetTex} transparent alphaTest={0.1} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh ref={headRef} position={[cfg.headXOffset, headY, 0.02]}>
                <planeGeometry args={[headSize, headSize]} />
                <meshBasicMaterial map={faceTex} transparent alphaTest={0.06} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
        </group>
    );
}
