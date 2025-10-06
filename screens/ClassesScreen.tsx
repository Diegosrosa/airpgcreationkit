import React, { useState, useMemo } from 'react';
import { RPGData, RPGClass, Spell } from '../types';
import { generateClass, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';

interface ClassesScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const ClassForm: React.FC<{ 
    onSave: (rpgClass: Omit<RPGClass, 'id'>) => void, 
    onCancel: () => void, 
    existingClass?: RPGClass | null,
    spells: Spell[],
}> = ({ onSave, onCancel, existingClass, spells }) => {
    const { t, languageFullName } = useLanguage();
    const [rpgClass, setRpgClass] = useState<Omit<RPGClass, 'id'>>({
        name: '', description: '', abilities: [''], traits: [''], spellIds: []
    });
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [spellSearch, setSpellSearch] = useState('');

    React.useEffect(() => {
        if (existingClass) {
            setRpgClass({
                name: existingClass.name,
                description: existingClass.description,
                abilities: existingClass.abilities.length > 0 ? existingClass.abilities : [''],
                traits: existingClass.traits.length > 0 ? existingClass.traits : [''],
                spellIds: existingClass.spellIds || []
            });
        } else {
            setRpgClass({ name: '', description: '', abilities: [''], traits: [''], spellIds: [] });
        }
    }, [existingClass]);

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const generatedData = await generateClass(aiPrompt, languageFullName);
            if (generatedData) {
                setRpgClass(prev => ({
                    ...prev,
                    name: generatedData.name,
                    description: generatedData.description,
                    abilities: generatedData.abilities.length > 0 ? generatedData.abilities : [''],
                    traits: generatedData.traits.length > 0 ? generatedData.traits : [''],
                }));
            }
        } catch (e) {
            console.error("Failed to generate class", e);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleEnhanceDescription = async () => {
        if (!rpgClass.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('class', rpgClass.name || 'this class', rpgClass.description, languageFullName);
            if (enhanced) {
                setRpgClass(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSpellToggle = (spellId: string) => {
        setRpgClass(prev => ({
            ...prev,
            spellIds: prev.spellIds?.includes(spellId)
                ? prev.spellIds.filter(id => id !== spellId)
                : [...(prev.spellIds || []), spellId]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAbilities = rpgClass.abilities.map(ab => ab.trim()).filter(ab => ab);
        const finalTraits = rpgClass.traits.map(t => t.trim()).filter(t => t);
        onSave({ ...rpgClass, abilities: finalAbilities, traits: finalTraits });
    };

    const handleFieldChange = (field: keyof Omit<RPGClass, 'id' | 'abilities' | 'traits' | 'spellIds'>, value: string) => {
        setRpgClass(prev => ({...prev, [field]: value}));
    };

    const handleListChange = (field: 'abilities' | 'traits', index: number, value: string) => {
        setRpgClass(prev => {
            const newList = [...prev[field]];
            newList[index] = value;
            return {...prev, [field]: newList};
        });
    };

    const handleAddListItem = (field: 'abilities' | 'traits') => {
        setRpgClass(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const handleRemoveListItem = (field: 'abilities' | 'traits', index: number) => {
        setRpgClass(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const filteredSpells = spells.filter(spell =>
        spell.name.toLowerCase().includes(spellSearch.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">{t(existingClass ? 'edit_class' : 'add_new_class')}</h2>
                <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={t('class_ai_placeholder')}
                            className="flex-1 bg-zinc-700 border border-zinc-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                            disabled={isGenerating}
                        />
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating || !aiPrompt}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[110px]"
                        >
                            {isGenerating ? <LoadingSpinner /> : t('generate')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-zinc-700 my-4"></div>

            <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-slate-300">{t('class_name')}</label>
                    <input value={rpgClass.name} onChange={(e) => handleFieldChange('name', e.target.value)} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                </div>
                <div>
                    <label htmlFor={`desc-class-${existingClass?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                    <div className="relative mt-1">
                        <textarea 
                            id={`desc-class-${existingClass?.id}`}
                            value={rpgClass.description} 
                            onChange={(e) => handleFieldChange('description', e.target.value)} 
                            required rows={3} 
                            className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                        />
                         <button
                            type="button"
                            onClick={handleEnhanceDescription}
                            disabled={isEnhancing || !rpgClass.description.trim()}
                            title={t('enhance_description')}
                            className="absolute top-2 right-2 p-1.5 bg-zinc-700/50 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEnhancing ? 
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div> :
                                <SparklesIcon className="w-4 h-4" />
                            }
                        </button>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm text-slate-300 mb-2">{t('abilities')}</label>
                    <div className="space-y-2">
                        {rpgClass.abilities.map((ability, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    value={ability}
                                    onChange={(e) => handleListChange('abilities', index, e.target.value)}
                                    placeholder={t('ability_placeholder', {index: (index + 1).toString()})}
                                    className="w-full bg-zinc-800 p-2 rounded-md"
                                />
                                <button type="button" onClick={() => handleRemoveListItem('abilities', index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={() => handleAddListItem('abilities')} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                        {t('add_ability')}
                    </button>
                </div>
                <div>
                    <label className="block text-sm text-slate-300 mb-2">{t('traits')}</label>
                    <div className="space-y-2">
                        {rpgClass.traits.map((trait, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    value={trait}
                                    onChange={(e) => handleListChange('traits', index, e.target.value)}
                                    placeholder={t('trait_placeholder', {index: (index + 1).toString()})}
                                    className="w-full bg-zinc-800 p-2 rounded-md"
                                />
                                <button type="button" onClick={() => handleRemoveListItem('traits', index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={() => handleAddListItem('traits')} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                        {t('add_trait')}
                    </button>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">{t('spells')}</h3>
                    {spells.length === 0 ? (
                        <p className="text-sm text-slate-400">{t('no_spells_for_class')}</p>
                    ) : (
                        <div>
                             <input
                                type="text"
                                placeholder={t('search_placeholder_spells_class')}
                                value={spellSearch}
                                onChange={(e) => setSpellSearch(e.target.value)}
                                className="w-full bg-zinc-900/50 p-2 rounded-md mb-2 border border-zinc-700 text-slate-300 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 rounded-md bg-zinc-900/50 p-2 border border-zinc-700">
                                {filteredSpells.map(spell => (
                                  <label key={spell.id} className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-md cursor-pointer hover:bg-zinc-700">
                                    <input
                                      type="checkbox"
                                      checked={(rpgClass.spellIds || []).includes(spell.id)}
                                      onChange={() => handleSpellToggle(spell.id)}
                                      className="form-checkbox h-4 w-4 text-blue-600 bg-zinc-900 border-zinc-700 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-300">{spell.name}</span>
                                  </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_class')}</button>
            </div>
        </form>
    );
};

const ClassesScreen: React.FC<ClassesScreenProps> = ({ rpgData, setRpgData }) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<RPGClass | null>(null);
  const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
  const [deletingClass, setDeletingClass] = useState<RPGClass | null>(null);

  const handleSaveClass = (rpgClassData: Omit<RPGClass, 'id'>) => {
      if (editingClass) {
        setRpgData(prev => ({
            ...prev,
            classes: prev.classes.map(c => c.id === editingClass.id ? { ...editingClass, ...rpgClassData } : c)
        }));
      } else {
        const newClass = { ...rpgClassData, id: Date.now().toString() };
        setRpgData(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
      }
      setShowForm(false);
      setEditingClass(null);
  };

    const handleAddNew = () => {
        setEditingClass(null);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleEdit = (rpgClass: RPGClass) => {
        setEditingClass(rpgClass);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (rpgClass: RPGClass) => {
        setDeletingClass(rpgClass);
    };

    const handleConfirmDelete = () => {
        if (!deletingClass) return;
        setRpgData(prev => ({
            ...prev,
            classes: prev.classes.filter(c => c.id !== deletingClass.id),
        }));
        setDeletingClass(null);
    };

    const charactersUsingClass = useMemo(() => {
        if (!deletingClass) return [];
        return rpgData.characters.filter(char => char.rpgClass?.id === deletingClass.id);
    }, [deletingClass, rpgData.characters]);


  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">{t('classes')}</h1>
             <div className="flex space-x-2">
                <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                    {isDeleteMode ? t('cancel_deletion') : t('delete_class')}
                </button>
                <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                    + {t('add_class')}
                </button>
            </div>
        </div>

        {showForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-zinc-800 animate-fadeInScaleUp">
                    <ClassForm 
                        onSave={handleSaveClass} 
                        onCancel={() => { setShowForm(false); setEditingClass(null); }} 
                        existingClass={editingClass}
                        spells={rpgData.spells}
                    />
                </div>
            </div>
        )}

        <DeletionModal
            isOpen={!!deletingClass}
            onClose={() => setDeletingClass(null)}
            onConfirm={handleConfirmDelete}
            itemName={deletingClass?.name || ''}
            dependencies={charactersUsingClass.map(c => c.name)}
            isBlocked={charactersUsingClass.length > 0}
            entityType="class"
        />

        {rpgData.classes.length === 0 && !showForm ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                <p className="text-slate-400">{t('no_classes_created')}</p>
                <p className="text-slate-500">{t('start_creating_classes')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                {rpgData.classes.map(rpgClass => (
                    <div
                        key={rpgClass.id}
                        className={`bg-zinc-900 p-4 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                    >
                        {isDeleteMode ? (
                            <button onClick={() => handleOpenDeleteModal(rpgClass)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                         ) : (
                            <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button type="button" onClick={() => handleEdit(rpgClass)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-blue-400">{rpgClass.name}</h3>
                        <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{rpgClass.description}</p>
                        <div className="mt-4 pt-3 border-t border-zinc-800">
                            <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('abilities')}:</h4>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                {rpgClass.abilities.map((ability, index) => (
                                    <li key={index}>{ability}</li>
                                ))}
                            </ul>
                        </div>
                        {rpgClass.traits && rpgClass.traits.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-zinc-800">
                                <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('traits')}:</h4>
                                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                    {rpgClass.traits.map((trait, index) => (
                                        <li key={index}>{trait}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {rpgClass.spellIds && rpgClass.spellIds.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-zinc-800">
                                <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('spells')}:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {rpgClass.spellIds.map(spellId => {
                                        const spell = rpgData.spells.find(s => s.id === spellId);
                                        if (!spell) return null;
                                        return (
                                            <div key={spellId} className="flex items-center space-x-2 bg-zinc-800/50 px-2 py-1 rounded-md" title={spell.effect}>
                                                {spell.image ? (
                                                    <img src={spell.image} alt={spell.name} className="w-5 h-5 rounded-sm object-cover" />
                                                ) : (
                                                    <div className="w-5 h-5 bg-zinc-700 rounded-sm flex items-center justify-center">
                                                        <SparklesIcon className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                )}
                                                <span className="text-xs text-slate-300">{spell.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ClassesScreen;