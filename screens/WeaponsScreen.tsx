import React, { useState, useMemo } from 'react';
import { RPGData, Weapon } from '../types';
import { generateImage, generateWeapon, enhanceDescription, generateWeaponDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';

interface WeaponsScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const WeaponForm: React.FC<{ 
    onSave: (weapon: Omit<Weapon, 'id'>) => void, 
    onCancel: () => void, 
    existingWeapon?: Weapon | null 
}> = ({ onSave, onCancel, existingWeapon }) => {
    const { t, languageFullName } = useLanguage();
    const [weapon, setWeapon] = useState({ name: '', type: '', damage: '', description: '' });
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [descriptionAiPrompt, setDescriptionAiPrompt] = useState('');
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

    React.useEffect(() => {
        if (existingWeapon) {
            setWeapon({
                name: existingWeapon.name,
                type: existingWeapon.type,
                damage: existingWeapon.damage,
                description: existingWeapon.description,
            });
            setImage(existingWeapon.image);
        } else {
            setWeapon({ name: '', type: '', damage: '', description: '' });
            setImage(undefined);
            setAiPrompt('');
        }
    }, [existingWeapon]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setWeapon({ ...weapon, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateWeapon(aiPrompt, languageFullName);
        if (generatedData) {
            setWeapon(generatedData);
        }
        setIsGenerating(false);
    };

    const handleEnhanceDescription = async () => {
        if (!weapon.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('weapon', weapon.name || 'this weapon', weapon.description, languageFullName);
            if (enhanced) {
                setWeapon(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!descriptionAiPrompt) return;
        setIsGeneratingDescription(true);
        try {
            const generatedDescription = await generateWeaponDescription(descriptionAiPrompt, weapon.name, weapon.type, languageFullName);
            if (generatedDescription) {
                setWeapon(prev => ({ ...prev, description: generatedDescription }));
            }
        } catch (e) {
            console.error("Failed to generate weapon description", e);
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!weapon.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG weapon, a "${weapon.name}". Type: ${weapon.type}. Description: ${weapon.description}. Style: detailed, realistic concept art, inventory icon, on a neutral background.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate weapon image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...weapon, image });
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-white">{existingWeapon ? t('edit_weapon') : t('add_new_weapon')}</h2>
            
            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('weapon_ai_placeholder')}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300">{t('name')}</label>
                        <input name="name" value={weapon.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('type')}</label>
                            <input name="type" value={weapon.type} onChange={handleChange} placeholder={t('weapon_type_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('damage')}</label>
                            <input name="damage" value={weapon.damage} onChange={handleChange} placeholder={t('weapon_damage_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`desc-weapon-${existingWeapon?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="bg-zinc-800/50 p-2 rounded-md border border-zinc-700 my-2">
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t('generate_description_with_ai')}</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={descriptionAiPrompt}
                                    onChange={(e) => setDescriptionAiPrompt(e.target.value)}
                                    placeholder={t('weapon_description_ai_placeholder')}
                                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-md p-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500"
                                    disabled={isGeneratingDescription}
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGeneratingDescription || !descriptionAiPrompt}
                                    className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
                                >
                                    {isGeneratingDescription ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-100"></div> : t('generate')}
                                </button>
                            </div>
                        </div>
                        <div className="relative mt-1">
                            <textarea
                                id={`desc-weapon-${existingWeapon?.id}`}
                                name="description" 
                                value={weapon.description} 
                                onChange={handleChange} 
                                required rows={6} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !weapon.description.trim()}
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
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm text-slate-300 mb-2">{t('weapon_image')}</label>
                     <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                        {isGeneratingImage && <LoadingSpinner />}
                        {!isGeneratingImage && image && <img src={image} alt={weapon.name} className="w-full h-full object-cover" />}
                        {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || isGenerating || !weapon.name}
                        className="w-full mt-2 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isGeneratingImage ? <LoadingSpinner/> : t('generate_image')}
                    </button>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_weapon')}</button>
            </div>
        </form>
    );
};


const WeaponsScreen: React.FC<WeaponsScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingWeapon, setDeletingWeapon] = useState<Weapon | null>(null);

    const weaponTypes = useMemo(() => [...new Set(rpgData.weapons.map(w => w.type).filter(Boolean).sort())], [rpgData.weapons]);

    const filteredWeapons = useMemo(() => {
        return rpgData.weapons.filter(weapon => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = weapon.name.toLowerCase().includes(searchLower) ||
                                weapon.description.toLowerCase().includes(searchLower) ||
                                weapon.type.toLowerCase().includes(searchLower);

            const matchesType = filterType === 'all' || weapon.type === filterType;

            return matchesSearch && matchesType;
        });
    }, [rpgData.weapons, searchQuery, filterType]);

    const handleSaveWeapon = (weaponData: Omit<Weapon, 'id'>) => {
        if (editingWeapon) {
            setRpgData(prev => ({
                ...prev,
                weapons: prev.weapons.map(w => w.id === editingWeapon.id ? { ...editingWeapon, ...weaponData } : w)
            }));
        } else {
            const newWeapon = { ...weaponData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, weapons: [...prev.weapons, newWeapon] }));
        }
        setShowForm(false);
        setEditingWeapon(null);
    };

    const handleEdit = (weapon: Weapon) => {
        setEditingWeapon(weapon);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (weapon: Weapon) => {
        setDeletingWeapon(weapon);
    };

    const handleConfirmDelete = () => {
        if (!deletingWeapon) return;
        const weaponId = deletingWeapon.id;

        setRpgData(prev => {
            const newWeapons = prev.weapons.filter(w => w.id !== weaponId);

            const newCharacters = prev.characters.map(char => {
                const migratedWeaponIds = (char.weaponIds || []).map(w => (typeof w === 'string' ? { weaponId: w, quantity: 1 } : w));
                const newWeaponIds = migratedWeaponIds.filter(item => item.weaponId !== weaponId);

                const newEquippedWeapons = { ...(char.equippedWeapons || {}) };
                Object.keys(newEquippedWeapons).forEach(slot => {
                    if (newEquippedWeapons[slot] === weaponId) {
                        newEquippedWeapons[slot] = null;
                    }
                });

                return {
                    ...char,
                    weaponIds: newWeaponIds,
                    equippedWeapons: newEquippedWeapons,
                };
            });

            return {
                ...prev,
                weapons: newWeapons,
                characters: newCharacters,
            };
        });
        setDeletingWeapon(null);
    };
    
    const handleAddNew = () => {
        setEditingWeapon(null);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
    };

    const weaponDependencies = useMemo(() => {
        if (!deletingWeapon) return [];
        return rpgData.characters
            .filter(char => 
                Object.values(char.equippedWeapons || {}).includes(deletingWeapon.id) ||
                (char.weaponIds || []).some(item => (typeof item === 'string' ? item : item.weaponId) === deletingWeapon.id)
            )
            .map(c => c.name);
    }, [deletingWeapon, rpgData.characters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('weapons')}</h1>
                <div className="flex space-x-2">
                     <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_weapon')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_weapon')}
                    </button>
                </div>
            </div>

             {rpgData.weapons.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_weapons')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500"
                        />
                         <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                        >
                            <option value="all">{t('all_types')}</option>
                            {weaponTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button onClick={handleClearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">{t('clear')}</button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-3xl border border-zinc-800 animate-fadeInScaleUp">
                        <WeaponForm 
                            onSave={handleSaveWeapon} 
                            onCancel={() => { setShowForm(false); setEditingWeapon(null); }} 
                            existingWeapon={editingWeapon}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingWeapon}
                onClose={() => setDeletingWeapon(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingWeapon?.name || ''}
                dependencies={weaponDependencies}
                isBlocked={false}
                entityType="weapon"
            />

            {rpgData.weapons.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_weapons_created')}</p>
                    <p className="text-slate-500">{t('start_creating_weapons')}</p>
                </div>
            ) : filteredWeapons.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredWeapons.map(weapon => (
                        <div 
                            key={weapon.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                             {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(weapon)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(weapon)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                             {weapon.image && (
                                <img src={weapon.image} alt={weapon.name} className="w-full h-40 object-cover"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{weapon.name}</h3>
                                <p className="text-sm text-slate-400">{weapon.type} | <span className="font-semibold text-slate-300">{weapon.damage}</span></p>
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{weapon.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeaponsScreen;