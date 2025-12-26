'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Caveat } from 'next/font/google';
import type { Lang } from '@/lib/lang';

type Props = {
    lang: Lang;

    /**
     * "Destinote" vai ficar no H1 e aqui a gente só faz o subtítulo quântico.
     * Prefixo fixo (ex: "1000 coisas para fazer") + sufixo permuta.
     */
    prefixFixed?: string;


    /** Alinhamento do título completo */
    align?: 'left' | 'center' | 'right';


    /** Fonte manuscrita por padrão (você curtiu 😈) */
    handDefault?: boolean;

    /** Se true, não anima e mostra o âncora */
    reduceMotion?: boolean;

    storageKeySuffix?: string;
};

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '600', '700'] });

const SEEN_KEY_BASE = 'destinote_quantum_subtitle_seen_v1';
const HAND_KEY_BASE = 'destinote_quantum_subtitle_hand_v1';

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFeaturedYear(now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth();
    return m >= 10 ? y + 1 : y;
}

/**
 * Ideia: reduzir “pisca” de artigos (na/no/em/num/à/às/ao…)
 * -> mantemos o mesmo grupo por alguns passos (streak),
 *    rodando frases do mesmo grupo antes de trocar de grupo.
 */
type Group = {
    key: string; // ex: "na", "no", "nas", "num", "ao", "à", "às", "em", "quando"
    weight?: number; // prob. de escolher esse grupo ao trocar
    items: string[]; // sufixos completos (ex: "na vida")
    anchor?: boolean; // se contém o âncora semântico
};

function weightedPickGroup(groups: Group[]) {
    const weights = groups.map((g) => Math.max(0, g.weight ?? 1));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return groups[0];

    let r = Math.random() * total;
    for (let i = 0; i < groups.length; i++) {
        r -= weights[i];
        if (r <= 0) return groups[i];
    }
    return groups[groups.length - 1];
}

function buildGroups(lang: Lang): { prefix: string; anchorSuffix: string; groups: Group[] } {
    const year = getFeaturedYear();

    if (lang === 'en') {
        const prefix = '1000 things to do';
        const anchorSuffix = 'in life';

        const groups: Group[] = [
            { key: 'in', weight: 6, anchor: true, items: ['in life', 'in love', 'in the beach', 'in school', 'in spring', `in ${year}`] },
            { key: 'on', weight: 5, items: ['on vacation', 'on the internet', 'on a Sunday', 'on Earth'] },
            { key: 'at', weight: 4, items: ['at night', 'at 3 a.m.', 'at work'] },
            { key: 'with', weight: 3, items: ['with friends', 'with a date'] },
            { key: 'when', weight: 2, items: ['when you are rich', 'when you get married'] },
            { key: 'by', weight: 2, items: ['by the sea', 'by sunrise'] },
        ];

        return { prefix, anchorSuffix, groups };
    }

    // pt-BR
    const prefix = '1000 coisas para fazer';
    const anchorSuffix = 'na vida';

    const groups: Group[] = [
        {
            key: 'na',
            weight: 7,
            anchor: true,
            items: [
                'na vida',
            ],
        },
        {
            key: 'na',
            weight: 6,
            anchor: true,
            items: [
                'namorando',
                'na praia',
                'na escola',
                'na primavera',
                'na cidade',
                'na internet',
            ],
        },
        {
            key: 'nas',
            weight: 6,
            items: [
                'nas férias',
                'nas horas livres',
                'nascido otário',
            ],
        },
        {
            key: 'no',
            weight: 6,
            items: [
                'noivo',
                'no trabalho',
                'no corpo',
                'no verão',
                'no interior',
                'no silêncio',
            ],
        },
        {
            key: 'num',
            weight: 5,
            items: [
                'num carro',
                'num mochilão',
                'num dia lindo',
                'num domingo',
                'num rolê aleatório',
            ],
        },
        {
            key: 'em',
            weight: 4,
            items: [
                `em ${year}`,
                'em casa',
                'em paz',
                'emocionar',
            ],
        },
        {
            key: 'ao',
            weight: 3,
            items: [
                'ao vivo',
                'ao som de música',
                'ao escorregar',
            ],
        },
        {
            key: 'à',
            weight: 3,
            items: [
                'à noite',
                'à beira-mar',
                'à moda antiga',
            ],
        },
        {
            key: 'às',
            weight: 2,
            items: [
                'às 3 da manhã',
                'às escondidas',
                'às pressas',
                'às vezes',
            ],
        },
        {
            key: 'quando',
            weight: 2,
            items: [
                'quando eu casar',
                'quando for rico',
                'quando estiver triste',
            ],
        },
    ];

    return { prefix, anchorSuffix, groups };
}

export default function QuantumTitle({
    lang,
    prefixFixed,
    align = 'center',
    handDefault = true,
    reduceMotion,
    storageKeySuffix,
}: Props) {
    const suffix = storageKeySuffix ? `_${storageKeySuffix}` : '';
    const SEEN_KEY = `${SEEN_KEY_BASE}${suffix}`;
    const HAND_KEY = `${HAND_KEY_BASE}${suffix}`;

    const { prefix, anchorSuffix, groups } = useMemo(() => buildGroups(lang), [lang]);
    const fixedPrefix = prefixFixed ?? prefix;

    // ======== Fonte manuscrita (default ON + persistência)
    const [hand, setHand] = useState(handDefault);
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HAND_KEY);
            if (saved === '1') setHand(true);
            if (saved === '0') setHand(false);
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function toggleHand() {
        setHand((v) => {
            const next = !v;
            try {
                localStorage.setItem(HAND_KEY, next ? '1' : '0');
            } catch { }
            return next;
        });
    }

    // ======== “Fit” por pior caso (font-size), sem empurrar layout
    const containerRef = useRef<HTMLSpanElement | null>(null);
    const rulerRef = useRef<HTMLSpanElement | null>(null);
    const [fitEm, setFitEm] = useState(1);

    const longestSuffix = useMemo(() => {
        let longest = anchorSuffix;
        for (const g of groups) {
            for (const it of g.items) if (it.length > longest.length) longest = it;
        }
        return longest;
    }, [groups, anchorSuffix]);

    useEffect(() => {
        const updateFit = () => {
            const c = containerRef.current;
            const r = rulerRef.current;
            if (!c || !r) return;

            const cw = c.getBoundingClientRect().width;
            const rw = r.getBoundingClientRect().width;
            if (cw <= 0 || rw <= 0) return;

            const next = Math.min(1, (cw * 0.98) / rw);
            setFitEm(Math.max(0.62, next));
        };

        updateFit();
        const ro = new ResizeObserver(updateFit);
        if (containerRef.current) ro.observe(containerRef.current);

        const t = window.setTimeout(updateFit, 250);
        return () => {
            ro.disconnect();
            window.clearTimeout(t);
        };
    }, [lang, fixedPrefix, longestSuffix, hand]);

    // ======== Estado exibido (só sufixo muda)
    const [suffixText, setSuffixText] = useState(anchorSuffix);

    // ======== Controle de grupos / streak
    const groupKeyRef = useRef<string>('na');
    const streakLeftRef = useRef<number>(0);
    const indexInGroupRef = useRef<number>(0);

    // Rajadas raras (rápidas) + desacelera + repousa no âncora
    const nextBurstAtRef = useRef<number>(Date.now() + randInt(20_000, 30_000));
    const nextAnchorPauseAtRef = useRef<number>(Date.now() + randInt(10_000, 18_000));

    const timeoutsRef = useRef<number[]>([]);
    const phaseRef = useRef<'cinematic' | 'live' | 'burst'>('cinematic');

    function clearTimers() {
        timeoutsRef.current.forEach((t) => window.clearTimeout(t));
        timeoutsRef.current = [];
    }

    function getGroupByKey(key: string) {
        return groups.find((g) => g.key === key) ?? groups[0];
    }

    function pickNewGroup() {
        // âncora com “gravidade” extra: chance maior de cair no grupo que contém âncora
        const roll = randInt(1, 10);
        if (roll <= 3) {
            const anchorGroup = groups.find((g) => g.anchor);
            if (anchorGroup) return anchorGroup;
        }
        return weightedPickGroup(groups);
    }

    function nextFromGroup(group: Group) {
        // gira pelo grupo sem repetir sempre o mesmo item
        const idx = indexInGroupRef.current % group.items.length;
        indexInGroupRef.current = (indexInGroupRef.current + 1) % group.items.length;
        return group.items[idx];
    }

    function tickNormal(forceAnchor = false) {
        if (forceAnchor) {
            setSuffixText(anchorSuffix);
            return;
        }

        if (streakLeftRef.current <= 0) {
            const g = pickNewGroup();
            groupKeyRef.current = g.key;
            streakLeftRef.current = randInt(3, 6); // mantém o mesmo artigo por alguns ticks
            indexInGroupRef.current = randInt(0, Math.max(0, g.items.length - 1));
        }

        const g = getGroupByKey(groupKeyRef.current);
        setSuffixText(nextFromGroup(g));
        streakLeftRef.current -= 1;
    }

    function scheduleLive() {
        phaseRef.current = 'live';

        const loop = () => {
            if (phaseRef.current !== 'live') return;

            const now = Date.now();

            if (now >= nextBurstAtRef.current) {
                nextBurstAtRef.current = now + randInt(20_000, 40_000);
                runBurst();
                return;
            }

            const forceAnchor = now >= nextAnchorPauseAtRef.current;
            if (forceAnchor) nextAnchorPauseAtRef.current = now + randInt(10_000, 18_000);

            tickNormal(forceAnchor);

            // Mais legível no subtítulo (não “metralhadora”)
            const dwell = forceAnchor ? randInt(900, 1400) : randInt(220, 360);

            const t = window.setTimeout(loop, dwell);
            timeoutsRef.current.push(t);
        };

        const t0 = window.setTimeout(loop, 250);
        timeoutsRef.current.push(t0);
    }

    function runBurst() {
        phaseRef.current = 'burst';

        // IMPORTANTE: na rajada, a gente NÃO troca de artigo toda hora:
        // escolhe um grupo e fica nele durante a rajada.
        const burstGroup = pickNewGroup();
        groupKeyRef.current = burstGroup.key;
        indexInGroupRef.current = randInt(0, Math.max(0, burstGroup.items.length - 1));

        const stepsFast = 8;
        const stepsSlow = 8;

        let i = 0;
        const doFast = () => {
            if (phaseRef.current !== 'burst') return;

            setSuffixText(nextFromGroup(burstGroup));
            i += 1;
            if (i >= stepsFast) {
                let j = 0;
                const doSlow = () => {
                    if (phaseRef.current !== 'burst') return;

                    setSuffixText(nextFromGroup(burstGroup));

                    j += 1;
                    if (j >= stepsSlow) {
                        // repouso no âncora
                        setSuffixText(anchorSuffix);
                        const tRest = window.setTimeout(() => {
                            scheduleLive();
                        }, 1100);
                        timeoutsRef.current.push(tRest);
                        return;
                    }

                    const ms = 160 + Math.round((420 * j) / stepsSlow);
                    const t = window.setTimeout(doSlow, ms);
                    timeoutsRef.current.push(t);
                };

                const t = window.setTimeout(doSlow, 220);
                timeoutsRef.current.push(t);
                return;
            }

            const t = window.setTimeout(doFast, 70);
            timeoutsRef.current.push(t);
        };

        const t = window.setTimeout(doFast, 120);
        timeoutsRef.current.push(t);
    }

    function runCinematicFirstVisit() {
        phaseRef.current = 'cinematic';
        setSuffixText(anchorSuffix);

        const t0 = window.setTimeout(() => {
            runBurst();
            try {
                localStorage.setItem(SEEN_KEY, '1');
            } catch { }
        }, 800);

        timeoutsRef.current.push(t0);
    }

    useEffect(() => {
        clearTimers();
        setSuffixText(anchorSuffix);

        if (reduceMotion) return;

        let seen = false;
        try {
            seen = localStorage.getItem(SEEN_KEY) === '1';
        } catch { }

        if (!seen) runCinematicFirstVisit();
        else scheduleLive();

        return () => clearTimers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, reduceMotion]);

    const fade = { duration: 0.08 };

    const alignClass =
        align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

    // largura fixa do sufixo (em ch) pra não “dançar”
    const suffixSlotCh = Math.min(Math.max(longestSuffix.length, 12), 32);

    return (
        <span
            ref={containerRef}
            className={`inline-block w-full max-w-full ${hand ? caveat.className : ''}`}
            onClick={(e) => {
                if (e.shiftKey) toggleHand();
            }}
            title="Shift+Click: alternar fonte manuscrita"
        >
            {/* RULER fora da tela: não empurra layout */}
            <span
                ref={rulerRef}
                aria-hidden
                style={{
                    position: 'fixed',
                    left: '-10000px',
                    top: '-10000px',
                    pointerEvents: 'none',
                    opacity: 0,
                    whiteSpace: 'nowrap',
                    fontSize: '1em',
                }}
            >
                {fixedPrefix} {longestSuffix}
            </span>

            <span className={`flex ${alignClass}pl-7 md:pl-14`}>
                <span
                    className="inline-grid items-baseline whitespace-nowrap leading-tight"
                    style={{
                        gridTemplateColumns: `auto ${suffixSlotCh}ch`,
                        fontSize: `${fitEm}em`,
                    }}
                >
                    {/* Prefixo fixo, sempre no mesmo X */}
                    <span className="pr-2">{fixedPrefix}</span>

                    {/* Slot fixo pro sufixo (não muda largura) */}
                    <span className="relative block w-full">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={`${lang}:${suffixText}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.08 }}
                                className="block w-full text-left"
                            >
                                {suffixText}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </span>
            </span>
        </span>
    );

}
