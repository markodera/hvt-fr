const fs = require('fs');
const content = fs.readFileSync('src/pages/runtime/RuntimeCommerceDemoPage.jsx', 'utf8');

// Fix Header
let newContent = content.replace(
    /<div>\s*<div className="flex items-center gap-3">\s*<Logo \/>\s*<div>\s*<p className="text-\[11px\] font-semibold uppercase tracking-\[0\.22em\] text-\[#8b8b94\]">Runtime Demo<\/p>\s*<h1 className="text-3xl font-semibold tracking-\[-0\.03em\] text-white">Dynamic role reference build<\/h1>\s*<\/div>\s*<\/div>\s*<p className="mt-3 max-w-3xl text-sm text-\[#a1a1aa\]">/m,
    `<div className="flex flex-col items-start gap-4">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                            Back to hvts.app
                        </Link>
                        <Logo />
                    </div>
                    <div className="mt-8">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b8b94]">Runtime Demo</p>
                            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Dynamic role reference build</h1>
                        </div>
                        <p className="mt-3 max-w-3xl text-sm text-[#a1a1aa]">`
);

// Remove the old "Runtime playground" back link button from the header right column
newContent = newContent.replace(
    /<Link\s*to="\/runtime-playground"\s*className="inline-flex items-center gap-2 rounded-full border border-\[#2f2f35\] px-4 py-2 text-sm text-\[#d4d4d8\] transition hover:border-\[#4c1d95\] hover:text-white"\s*>\s*<ArrowLeft className="h-4 w-4" \/>\s*Runtime playground\s*<\/Link>/m,
    ''
);

// We replace the "App" and "Blueprint" sections
const s = newContent.indexOf('<SectionCard\\n                            eyebrow="Blueprint"'.replace(/\\n/g, '\n'));
const e = newContent.indexOf('<SectionCard\\n                            eyebrow="Debug"'.replace(/\\n/g, '\n'));

if (s !== -1 && e !== -1) {
    const replacement = `<SectionCard
                            eyebrow="App"
                            title="Dynamic feature gates"
                            description="This UI is dynamically rendered from the specific permission slugs embedded inside your active token. It proves that the UI can adapt flexibly without hardcoding specific roles."
                        >
                            {session ? (
                                <div className="space-y-6">
                                    <div className="grid gap-4 xl:grid-cols-2">
                                        {permissions.length > 0 ? permissions.map((slug) => (
                                            <div key={slug} className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-5">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#93c5fd]">
                                                        <Boxes className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-white">Feature: {slug}</h3>
                                                        <p className="text-xs text-[#8b8b94]">Unlocked because your token contains the <span className="font-mono text-[#d4d4d8]">{slug}</span> permission.</p>
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl border border-[#1f1f24] bg-[#141419] p-4 text-sm text-[#a1a1aa]">
                                                    This module is fully interactive and secured by <code className="text-[#c4b5fd]">{slug}</code>.
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full rounded-2xl border border-dashed border-[#3f3f46] bg-[#0f0f12] p-8 text-center text-sm text-[#a1a1aa]">
                                                Your token has zero permissions. Create permissions in the dashboard, assign them to your role, and issue a new token.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[#8b8b94]">No session active.</p>
                            )}
                        </SectionCard>\n\n                        `;
    newContent = newContent.substring(0, s) + replacement + newContent.substring(e);
}

fs.writeFileSync('src/pages/runtime/RuntimeCommerceDemoPage.jsx', newContent);
console.log("Refactor complete!");
