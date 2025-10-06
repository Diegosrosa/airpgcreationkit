import React, { useState, useMemo } from 'react';
import { RPGData, Race } from '../types';
import { generateRace, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import SwordIcon from '../components/icons/SwordIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';

interface RacesScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const RaceForm: React.FC<{ onSave: (race: Omit<Race, 'id'>) => void, onCancel: () => void, existingRace?: Race | null }> = ({ onSave, onCancel, existingRace }) => {
    const { t, languageFullName } = useLanguage();
    const [race, setRace] = useState<Omit<Race, 'id'>>({ name: '', description: '', traits: [''], bodySlots: [] });
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const defaultSlots = [
        { name: 'Head', isWeaponSlot: false },
        { name: 'Chest', isWeaponSlot: false },
        { name: 'Legs', isWeaponSlot: false },
        { name: 'Hands', isWeaponSlot: false },
        { name: 'Feet', isWeaponSlot: false },
        { name: 'Accessory', isWeaponSlot: false },
        { name: 'Main Hand', isWeaponSlot: true },
        { name: 'Off Hand', isWeaponSlot: true },
    ];

    React.useEffect(() => {
        if (existingRace) {
            setRace({
                name: existingRace.name,
                description: existingRace.description,
                traits: existingRace.traits.length > 0 ? existingRace.traits : [''],
                bodySlots: existingRace.bodySlots && existingRace.bodySlots.length > 0 ? existingRace.bodySlots : defaultSlots
            });
        } else {
            setRace({ name: '', description: '', traits: [''], bodySlots: defaultSlots });
            setAiPrompt('');
        }
    }, [existingRace]);

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const generatedData = await generateRace(aiPrompt, languageFullName);
            if (generatedData) {
                setRace(prev => ({
                    ...prev,
                    name: generatedData.name,
                    description: generatedData.description,
                    traits: generatedData.traits.length > 0 ? generatedData.traits : [''],
                }));
            }
        } catch (e) {
            console.error("Failed to generate race", e);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleEnhanceDescription = async () => {
        if (!race.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('race', race.name || 'this race', race.description, languageFullName);
            if (enhanced) {
                setRace(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTraits = race.traits.map(t => t.trim()).filter(t => t);
        const finalSlots = (race.bodySlots || []).map(s => ({...s, name: s.name.trim()})).filter(s => s.name);
        onSave({ ...race, traits: finalTraits, bodySlots: finalSlots });
    };

    const handleFieldChange = (field: 'name' | 'description', value: string) => {
        setRace(prev => ({ ...prev, [field]: value }));
    };

    const handleTraitChange = (index: number, value: string) => {
        setRace(prev => {
            const newTraits = [...prev.traits];
            newTraits[index] = value;
            return { ...prev, traits: newTraits };
        });
    };

    const handleAddTrait = () => {
        setRace(prev => ({ ...prev, traits: [...prev.traits, ''] }));
    };

    const handleRemoveTrait = (index: number) => {
        setRace(prev => ({ ...prev, traits: prev.traits.filter((_, i) => i !== index) }));
    };

    const handleSlotChange = (index: number, field: 'name' | 'isWeaponSlot', value: string | boolean) => {
        setRace(prev => {
            const newSlots = [...(prev.bodySlots || [])];
            const slotToUpdate = { ...newSlots[index] };
            
            if (field === 'name') {
                slotToUpdate.name = value as string;
            } else if (field === 'isWeaponSlot') {
                slotToUpdate.isWeaponSlot = value as boolean;
            }
            
            newSlots[index] = slotToUpdate;
            return { ...prev, bodySlots: newSlots };
        });
    };
    
    const handleAddSlot = () => {
        setRace(prev => ({ ...prev, bodySlots: [...(prev.bodySlots || []), { name: '', isWeaponSlot: false }] }));
    };

    const handleRemoveSlot = (index: number) => {
        setRace(prev => ({ ...prev, bodySlots: (prev.bodySlots || []).filter((_, i) => i !== index) }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">{t(existingRace ? 'edit_race' : 'add_new_race')}</h2>

            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('race_ai_placeholder')}
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

            <div className="border-t border-zinc-700 my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300">{t('race_name')}</label>
                        <input value={race.name} onChange={(e) => handleFieldChange('name', e.target.value)} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                    </div>
                    <div>
                        <label htmlFor={`desc-race-${existingRace?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="relative mt-1">
                            <textarea 
                                id={`desc-race-${existingRace?.id}`}
                                value={race.description} 
                                onChange={(e) => handleFieldChange('description', e.target.value)} 
                                required rows={3} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !race.description.trim()}
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
                        <label className="block text-sm text-slate-300 mb-2">{t('traits_and_abilities')}</label>
                        <div className="space-y-2">
                            {race.traits.map((trait, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        value={trait}
                                        onChange={(e) => handleTraitChange(index, e.target.value)}
                                        placeholder={t('trait_placeholder', {index: (index+1).toString()})}
                                        className="w-full bg-zinc-800 p-2 rounded-md"
                                    />
                                    <button type="button" onClick={() => handleRemoveTrait(index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddTrait} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                            {t('add_trait')}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-2">Body Slots</label>
                    <div className="space-y-2 bg-zinc-900/50 p-3 rounded-md border border-zinc-700 max-h-80 overflow-y-auto">
                        {(race.bodySlots || []).map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    value={slot.name}
                                    onChange={(e) => handleSlotChange(index, 'name', e.target.value)}
                                    placeholder={`Slot name #${index + 1}`}
                                    className="flex-grow bg-zinc-800 p-2 rounded-md text-sm border border-zinc-700"
                                />
                                <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!slot.isWeaponSlot}
                                        onChange={(e) => handleSlotChange(index, 'isWeaponSlot', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 bg-zinc-900 border-zinc-700 rounded focus:ring-blue-500"
                                    />
                                    <span>Weapon</span>
                                </label>
                                <button type="button" onClick={() => handleRemoveSlot(index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddSlot} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                            + Add Slot
                        </button>
                    </div>
                </div>
            </div>


            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_race')}</button>
            </div>
        </form>
    );
};


const RacesScreen: React.FC<RacesScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingRace, setEditingRace] = useState<Race | null>(null);
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingRace, setDeletingRace] = useState<Race | null>(null);

    const handleSaveRace = (raceData: Omit<Race, 'id'>) => {
        if (editingRace) {
            setRpgData(prev => ({
                ...prev,
                races: prev.races.map(r => r.id === editingRace.id ? { ...editingRace, ...raceData } : r)
            }));
        } else {
            const newRace = { ...raceData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, races: [...prev.races, newRace] }));
        }
        setShowForm(false);
        setEditingRace(null);
    };
    
    const handleEdit = (race: Race) => {
        setEditingRace(race);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (race: Race) => {
        setDeletingRace(race);
    };
    
    const handleConfirmDelete = () => {
        if (!deletingRace) return;
        setRpgData(prev => ({
            ...prev,
            races: prev.races.filter(r => r.id !== deletingRace.id),
        }));
        setDeletingRace(null);
    };

    const handleAddNew = () => {
        setEditingRace(null);
        setShowForm(true);
        closeDeleteMode();
    }

    const charactersUsingRace = useMemo(() => {
        if (!deletingRace) return [];
        return rpgData.characters.filter(char => char.race?.id === deletingRace.id);
    }, [deletingRace, rpgData.characters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('races')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_race')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_race')}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-3xl border border-zinc-800 animate-fadeInScaleUp max-h-[90vh] overflow-y-auto">
                        <RaceForm 
                            onSave={handleSaveRace} 
                            onCancel={() => { setShowForm(false); setEditingRace(null); }}
                            existingRace={editingRace}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingRace}
                onClose={() => setDeletingRace(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingRace?.name || ''}
                dependencies={charactersUsingRace.map(c => c.name)}
                isBlocked={charactersUsingRace.length > 0}
                entityType="race"
            />

            {rpgData.races.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_races_created')}</p>
                    <p className="text-slate-500">{t('start_creating_races')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {rpgData.races.map(race => (
                        <div
                            key={race.id}
                            className={`bg-zinc-900 p-4 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                             {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(race)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(race)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{race.name}</h3>
                                <p className="mt-2 text-slate-300 text-sm whitespace-pre-wrap">{race.description}</p>
                                <div className="mt-4 pt-3 border-t border-zinc-800">
                                    <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('traits')}:</h4>
                                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                        {race.traits.map((trait, index) => (
                                            <li key={index}>{trait}</li>
                                        ))}
                                    </ul>
                                </div>
                                {race.bodySlots && race.bodySlots.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-zinc-800">
                                        <h4 className="font-semibold text-slate-300 text-sm mb-2">Body Slots:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {race.bodySlots.map(slot => (
                                                <div key={slot.name} className="flex items-center space-x-1.5 bg-zinc-800/50 px-2 py-1 rounded-md" title={slot.isWeaponSlot ? 'Weapon Slot' : 'Gear Slot'}>
                                                    {slot.isWeaponSlot ? <SwordIcon className="w-3 h-3 text-orange-400" /> : <ShieldCheckIcon className="w-3 h-3 text-cyan-400" />}
                                                    <span className="text-xs text-slate-300">{slot.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RacesScreen;