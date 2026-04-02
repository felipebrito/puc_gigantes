// SpriteCharacter.jsx
// Versão 4: Sem flicker — geometry inicializada com valores corretos,
// textures preloaded via Suspense, config lida via ref no useFrame

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULTS = {
    fps:         14,
    bodyH:       2.0,
    headYRatio:  0.82,
    headSize:    0.54,
    headXOffset: 0.0,
    headBob:     true,
    headBobAmp:  0.005,
};

const META = { cols: 4, rows: 3, frameCount: 12, frameWidth: 256, frameHeight: 512 };

export function SpriteCharacter({
    position        = [0, 0, 0],
    faceUrl,
    sheetUrl        = '/sprites/character_walk_new_character_4x3_12f.png',
    meta            = META,
    scale           = 1,
    direction       = 1,
    phaseOffset     = 0,    // fase única por personagem — evita sincronismo do head bob
    spriteConfigRef,
    spriteConfig    = {},
}) {
    const getCfg = () => ({ ...DEFAULTS, ...(spriteConfigRef?.current ?? spriteConfig) });

    const frameRef = useRef(0);
    const headRef  = useRef();
    const bodyRef  = useRef();

    // Texturas carregadas via Suspense — prontas antes do primeiro frame
    const sheetTex = useTexture(sheetUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1 / meta.cols, 1 / meta.rows);
        tex.needsUpdate = true;
    });
    const faceTex = useTexture(faceUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    // Dimensões iniciais — calculadas uma vez com o cfg do momento do mount
    const aspect  = meta.frameWidth / meta.frameHeight;
    const initCfg = getCfg();

    const initBodyW    = initCfg.bodyH * aspect;
    const initHeadY    = initCfg.bodyH * initCfg.headYRatio;
    const initHeadSize = initBodyW * initCfg.headSize;

    // prevCfg pré-inicializado com os valores atuais → nunca rebuilds no frame 1
    const prevRef = useRef({
        bodyH:       initCfg.bodyH,
        headYRatio:  initCfg.headYRatio,
        headSize:    initCfg.headSize,
        headXOffset: initCfg.headXOffset,
    });

    useFrame((state) => {
        const cfg = getCfg();
        const t   = state.clock.getElapsedTime();

        // Anima sprite sheet
        const frame = Math.floor(t * cfg.fps) % meta.frameCount;
        if (frameRef.current !== frame) {
            frameRef.current = frame;
            const col = frame % meta.cols;
            const row = meta.rows - 1 - Math.floor(frame / meta.cols);
            sheetTex.offset.set(col / meta.cols, row / meta.rows);
        }

        // Atualiza geometria apenas se os parâmetros mudaram
        const prev = prevRef.current;
        if (
            prev.bodyH       !== cfg.bodyH ||
            prev.headYRatio  !== cfg.headYRatio ||
            prev.headSize    !== cfg.headSize ||
            prev.headXOffset !== cfg.headXOffset
        ) {
            prevRef.current = { bodyH: cfg.bodyH, headYRatio: cfg.headYRatio, headSize: cfg.headSize, headXOffset: cfg.headXOffset };
            const bodyW    = cfg.bodyH * aspect;
            const headY    = cfg.bodyH * cfg.headYRatio;
            const headSize = bodyW * cfg.headSize;

            if (bodyRef.current) {
                bodyRef.current.position.y = cfg.bodyH / 2;
                bodyRef.current.geometry.dispose();
                bodyRef.current.geometry = new THREE.PlaneGeometry(bodyW, cfg.bodyH);
            }
            if (headRef.current) {
                headRef.current.position.x = cfg.headXOffset;
                headRef.current.position.y = headY;
                headRef.current.geometry.dispose();
                headRef.current.geometry = new THREE.PlaneGeometry(headSize, headSize);
            }
        }

        // Head bob com fase única por personagem
        if (cfg.headBob && headRef.current) {
            const cycleDuration = meta.frameCount / cfg.fps;
            const bobFreq       = 2 / cycleDuration;
            const bob           = Math.sin(t * Math.PI * 2 * bobFreq + phaseOffset) * cfg.headBobAmp;
            headRef.current.position.y = cfg.bodyH * cfg.headYRatio + bob;
        }
    });

    return (
        <group position={position} scale={[scale * direction, scale, 1]}>
            <mesh ref={bodyRef} position={[0, initCfg.bodyH / 2, 0]}>
                <planeGeometry args={[initBodyW, initCfg.bodyH]} />
                <meshBasicMaterial map={sheetTex} transparent alphaTest={0.1} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh ref={headRef} position={[initCfg.headXOffset, initHeadY, 0.02]}>
                <planeGeometry args={[initHeadSize, initHeadSize]} />
                <meshBasicMaterial map={faceTex} transparent alphaTest={0.06} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
        </group>
    );
}
