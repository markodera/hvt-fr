import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useWatch, type Control, type FieldValues, type Path, type UseFormSetValue } from 'react-hook-form';

import { generateSlug } from '@/lib/utils/slug';

type UseSlugSyncResult = {
    userEditedSlug: MutableRefObject<boolean>;
    notifySlugEdited: () => void;
    resetSlugSync: () => void;
};

export function useSlugSync<TFieldValues extends FieldValues>(
    control: Control<TFieldValues>,
    nameField: Path<TFieldValues>,
    slugField: Path<TFieldValues>,
    setValue: UseFormSetValue<TFieldValues>
): UseSlugSyncResult {
    const userEditedSlug = useRef(false);
    const [, forceUpdate] = useState(0);
    const watchedName = useWatch({ control, name: nameField });

    useEffect(() => {
        if (userEditedSlug.current) {
            return;
        }

        const generated = generateSlug(typeof watchedName === 'string' ? watchedName : '');
        setValue(slugField, generated, { shouldValidate: true });
    }, [setValue, slugField, watchedName]);

    const notifySlugEdited = useCallback(() => {
        forceUpdate((value) => value + 1);
    }, []);

    const resetSlugSync = useCallback(() => {
        userEditedSlug.current = false;
        forceUpdate((value) => value + 1);
    }, []);

    return {
        userEditedSlug,
        notifySlugEdited,
        resetSlugSync,
    };
}
