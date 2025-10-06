import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import TrashIcon from './icons/TrashIcon';

interface DeletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    dependencies: string[];
    isBlocked: boolean;
    entityType: string;
}

const DeletionModal: React.FC<DeletionModalProps> = ({ isOpen, onClose, onConfirm, itemName, dependencies, isBlocked, entityType }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const message = isBlocked 
        ? t('block_delete_dependency', { name: itemName, entity: t(`entity_${entityType}`), character_list: dependencies.join(', ') })
        : dependencies.length > 0
            ? t('warning_delete_dependency', { name: itemName, entity: t(`entity_${entityType}`), character_list: dependencies.join(', ') })
            : t(`confirm_delete_${entityType}`, { name: itemName });

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md border border-zinc-800 animate-fadeInScaleUp"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start space-x-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <TrashIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="mt-0 text-left flex-1">
                        <h3 className="text-lg leading-6 font-bold text-white" id="modal-title">
                            {t('confirm_deletion')}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-700 text-white font-semibold rounded-md hover:bg-zinc-600 transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBlocked}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:bg-red-800/50 disabled:cursor-not-allowed"
                    >
                        {t('delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletionModal;
