// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

import { LOCK_COLS, LOCK_ROWS, renderLockFrame, shackleState } from '@/components/landing/asciiLockRenderer';

const MIN_FRAME_MS = 30;
const MAX_STEP_SECONDS = 0.1;
const START_TIME = 1.6;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AsciiLock() {
    const preRef = useRef(null);
    const glowRef = useRef(null);
    const timeRef = useRef(START_TIME);
    const [cellAspect, setCellAspect] = useState(0.6);
    const [playing, setPlaying] = useState(() => !prefersReducedMotion());

    useEffect(() => {
        const style = window.getComputedStyle(preRef.current);
        const font = `${style.fontWeight} 100px ${style.fontFamily}`;
        let active = true;
        const measure = () => {
            const context = document.createElement('canvas').getContext('2d');
            if (!active || !context) {
                return;
            }
            context.font = font;
            const ratio = context.measureText('M').width / 100;
            if (ratio > 0) {
                setCellAspect(ratio);
            }
        };
        // Measure after the webfont loads so the grid matches the real glyph width.
        document.fonts.load(font).then(measure, measure);
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const pre = preRef.current;
        const glow = glowRef.current;
        const draw = () => {
            pre.textContent = renderLockFrame(timeRef.current, cellAspect);
            glow.style.opacity = String(shackleState(timeRef.current).swing);
        };
        draw();
        if (!playing) {
            return undefined;
        }

        let frame = 0;
        let last = 0;
        let onScreen = true;
        const tick = (now) => {
            frame = requestAnimationFrame(tick);
            if (now - last < MIN_FRAME_MS) {
                return;
            }
            if (last) {
                timeRef.current += Math.min((now - last) / 1000, MAX_STEP_SECONDS);
            }
            last = now;
            draw();
        };
        const start = () => {
            if (!frame && onScreen && !document.hidden) {
                last = 0;
                frame = requestAnimationFrame(tick);
            }
        };
        const stop = () => {
            cancelAnimationFrame(frame);
            frame = 0;
        };
        const observer = new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            if (onScreen) {
                start();
            } else {
                stop();
            }
        });
        const onVisibilityChange = () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        };

        observer.observe(pre);
        document.addEventListener('visibilitychange', onVisibilityChange);
        start();
        return () => {
            stop();
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [cellAspect, playing]);

    return (
        <div className="relative mx-auto w-full max-w-[15rem] [container-type:inline-size] sm:max-w-[20rem] lg:max-w-[26rem]">
            <div
                ref={glowRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-[22%] rounded-full bg-emerald-500/25 opacity-0 blur-3xl"
            />
            <pre
                ref={preRef}
                aria-hidden="true"
                className="relative m-0 select-none overflow-hidden whitespace-pre bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-center font-mono font-medium leading-none text-transparent"
                style={{
                    fontSize: `calc(100cqw / ${(LOCK_COLS * cellAspect).toFixed(3)})`,
                    height: `${LOCK_ROWS}em`,
                }}
            />
            <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? 'Pause lock animation' : 'Play lock animation'}
                className="absolute bottom-0 right-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
                {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
        </div>
    );
}
