export function ResourcePageHeader({ title, description, action }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-extrabold text-text-primary">{title}</h1>
                {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
