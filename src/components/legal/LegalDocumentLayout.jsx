import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { AuthPageShell } from '@/components/auth/AuthShell';

export function LegalDocumentLayout({ title, summary, updatedOn, children }) {
    useEffect(() => {
        document.title = `${title} | HVT`;
    }, [title]);

    return (
        <AuthPageShell topLeftLogo contentClassName="items-start py-6 sm:py-10">
            <article className="w-full max-w-4xl rounded-[28px] border border-[#27272a] bg-[#111111]/92 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
                <div className="border-b border-[#27272a] pb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors duration-150 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back home
                    </Link>

                    <div className="mt-5 space-y-3">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa]">Legal</div>
                        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">{title}</h1>
                        <p className="max-w-3xl text-sm leading-7 text-[#a1a1aa]">{summary}</p>
                        <div className="inline-flex rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1 text-xs text-[#d4d4d8]">
                            Last updated {updatedOn}
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-8 text-sm leading-7 text-[#d4d4d8]">{children}</div>
            </article>
        </AuthPageShell>
    );
}

export function LegalSection({ title, children }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <div className="space-y-3 text-[#a1a1aa]">{children}</div>
        </section>
    );
}

export function LegalList({ items }) {
    return (
        <ul className="space-y-3 pl-5 text-[#a1a1aa]">
            {items.map((item) => (
                <li key={item} className="list-disc marker:text-[#a78bfa]">
                    {item}
                </li>
            ))}
        </ul>
    );
}
