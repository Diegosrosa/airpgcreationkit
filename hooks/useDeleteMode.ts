import { useState, useEffect, useCallback } from 'react';

export const useDeleteMode = () => {
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    const toggleDeleteMode = useCallback(() => {
        setIsDeleteMode(prev => !prev);
    }, []);

    const closeDeleteMode = useCallback(() => {
        setIsDeleteMode(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDeleteMode();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [closeDeleteMode]);

    return { isDeleteMode, toggleDeleteMode, closeDeleteMode };
};
