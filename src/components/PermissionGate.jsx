/**
 * Render children only when the caller has the required permission set.
 * `allOf` means every slug must be present. `anyOf` means at least one must be present.
 */
export function PermissionGate({
    permissions = [],
    allOf = [],
    anyOf = [],
    children,
    fallback = null,
}) {
    const hasAll = allOf.every((permission) => permissions.includes(permission));
    const hasAny = anyOf.length === 0 || anyOf.some((permission) => permissions.includes(permission));

    if (!hasAll || !hasAny) {
        return fallback;
    }

    return children;
}
