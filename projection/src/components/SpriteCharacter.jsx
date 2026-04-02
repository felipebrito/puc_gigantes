// SpriteCharacter.jsx
// Versão 2: usa sprite sheet PNG exportado do Unity (via SpriteSheetExporter)
// + overlay da foto do visitante na posição da cabeça

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function SpriteCharacter({
    position    = [0, 0, 0],
    faceUrl,
    sheetUrl    = '/sprites/spritesheet_baked_character_4x3_12f.png',
    // Metadados do sprite sheet (gerado pelo SpriteSheetExporter.cs)
    meta        = { cols: 4, rows: 3, frameCount: 12, fps: 12,
                    frameWidth: 256, frameHeight: 512 },
    scale       = 1,
    direction   = 1,   // 1 = direita, -1 = esquerda
    speed       = 1,
}) {
    const frameRef = useRef(0);

    // ── Sprite sheet ─────────────────────────────────────────────────
    const sheetTex = useTexture(sheetUrl, (tex) => {
        tex.colorSpace  = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1 / meta.cols, 1 / meta.rows);
        tex.needsUpdate = true;
    });

    // ── Foto do visitante ────────────────────────────────────────────
    const faceTex = useTexture(faceUrl || '/models/face_test.png', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    // ── Proporções ───────────────────────────────────────────────────
    const aspect = meta.frameWidth / meta.frameHeight; // 256/512 = 0.5
    const bodyH  = 2.0;
    const bodyW  = bodyH * aspect;
    // Cabeça fica em ~83% do topo do personagem CC2D
    const headY    = bodyH * 0.83;
    const headSize = bodyW * 1.15;

    // ── Animação: avança frame pelo UV offset ────────────────────────
    useFrame((state) => {
        const frame = Math.floor(state.clock.getElapsedTime() * meta.fps * speed) % meta.frameCount;
        if (frameRef.current === frame) return;
        frameRef.current = frame;

        const col = frame % meta.cols;
        // UV y=0 é embaixo no Three.js → inverter linha
        const row = meta.rows - 1 - Math.floor(frame / meta.cols);
        sheetTex.offset.set(col / meta.cols, row / meta.rows);
    });

    return (
        <group position={position} scale={[scale * direction, scale, 1]}>

            {/* ── CORPO: sprite sheet animado ───────────────────────── */}
            {/* pivot na base — personagem cresce para cima */}
            <mesh position={[0, bodyH / 2, 0]}>
                <planeGeometry args={[bodyW, bodyH]} />
                <meshBasicMaterial
                    map={sheetTex}
                    transparent
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* ── FACE: foto do visitante sobreposta ────────────────── */}
            <mesh position={[0, headY, 0.02]}>
                <planeGeometry args={[headSize, headSize]} />
                <meshBasicMaterial
                    map={faceTex}
                    transparent
                    alphaTest={0.06}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

        </group>
    );
}
