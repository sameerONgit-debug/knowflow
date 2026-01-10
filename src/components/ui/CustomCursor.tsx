// src/components/ui/CustomCursor.tsx
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CursorProps {
    color?: string;
}

export const CustomCursor: React.FC<CursorProps> = ({ color = 'cyan' }) => {
    const [isPointer, setIsPointer] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // RAW Mouse Values (Instant)
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Smooth spring for ONLY the outer ring (Optimized physics)
    // Higher stiffness = less "floaty", faster response
    const springConfig = { damping: 25, stiffness: 450, mass: 0.1 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        // 1. Lightest possible mouse move listener
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        // 2. Optimized Hover Check (No getComputedStyle!)
        const handleMouseOver = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);

            const target = e.target as HTMLElement;

            // Fast tag check only - complex logic removed
            const isClickable =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                (target.parentElement && target.parentElement.tagName === 'A') || // Simple 1-level check
                (target.parentElement && target.parentElement.tagName === 'BUTTON');

            setIsPointer(Boolean(isClickable));
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', moveCursor, { passive: true });
        window.addEventListener('mouseover', handleMouseOver, { passive: true });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [cursorX, cursorY, isVisible]);

    const colorVariants = {
        cyan: {
            primary: '#22d3ee',
            secondary: 'rgba(34, 211, 238, 0.3)',
            glow: 'rgba(34, 211, 238, 0.15)',
        },
        indigo: {
            primary: '#818cf8',
            secondary: 'rgba(129, 140, 248, 0.3)',
            glow: 'rgba(129, 140, 248, 0.15)',
        },
    };

    const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.cyan;

    // Render nothing until mouse moves (prevents glitch at 0,0)
    if (!isVisible) return null;

    return (
        <>
            {/* Outer Glow Ring - Follows with Physics */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full mix-blend-screen will-change-transform" // Hardware acceleration hint
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                animate={{
                    width: isPointer ? 60 : 32,
                    height: isPointer ? 60 : 32,
                    opacity: isClicking ? 0.8 : 0.6,
                    backgroundColor: isPointer ? colors.glow : 'transparent',
                    border: `1px solid ${isPointer ? colors.primary : colors.secondary}`,
                }}
                transition={{
                    type: 'tween',
                    ease: 'backOut',
                    duration: 0.2 // Faster morph
                }}
            />

            {/* Central Sharp Dot - INSTANT FOLLOW (No Spring) */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[10000] rounded-full will-change-transform"
                style={{
                    x: cursorX, // Direct binding = No Lag
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    backgroundColor: colors.primary,
                }}
                animate={{
                    width: isClicking ? 4 : 8,
                    height: isClicking ? 4 : 8,
                    opacity: isPointer ? 0.5 : 1, // Keep visible but dim on hover
                }}
                transition={{ duration: 0.1 }}
            />
        </>
    );
};
