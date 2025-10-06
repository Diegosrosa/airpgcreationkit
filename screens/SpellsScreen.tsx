import React, { useState, useEffect, useMemo } from 'react';
import { RPGData, Spell } from '../types';
import { generateSpell, generateImage, enhanceDescription, generateSpellEffect } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';
import TrashIcon from '../components/icons/TrashIcon';

interface SpellsScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const BASE_SPELL_SCHOOLS = [
    'Evocation', 'Illusion', 'Necromancy', 'Conjuration', 'Abjuration',
    'Divination', 'Enchantment', 'Transmutation', 'Artificing', 'Psionics'
];

interface SpellFormProps { 
    onSave: (spell: Omit<Spell, 'id' | 'image'>, image?: string) => void, 
    onCancel: () => void, 
    existingSpell?: Spell | null,
    allSpellSchools: string[],
}

const SpellForm: React.FC<SpellFormProps> = ({ onSave, onCancel, existingSpell, allSpellSchools }) => {
    const { t, languageFullName } = useLanguage();
    const [spell, setSpell] = useState({ name: '', school: '', level: 0, effect: '', manaCost: '', range: '' });
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [effectAiPrompt, setEffectAiPrompt] = useState('');
    const [isGeneratingEffect, setIsGeneratingEffect] = useState(false);

    useEffect(() => {
        if (existingSpell) {
            setSpell({
                name: existingSpell.name,
                school: existingSpell.school,
                level: existingSpell.level,
                effect: existingSpell.effect,
                manaCost: existingSpell.manaCost,
                range: existingSpell.range,
            });
            setImage(existingSpell.image);
        } else {
            setSpell({ name: '', school: allSpellSchools[0] || '', level: 0, effect: '', manaCost: '', range: '' });
            setImage(undefined);
            setAiPrompt('');
        }
    }, [existingSpell, allSpellSchools]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSpell({ ...spell, [name]: name === 'level' ? parseInt(value, 10) : value });
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateSpell(aiPrompt, languageFullName);
        if (generatedData) {
            setSpell(generatedData);
        }
        setIsGenerating(false);
    };

    const handleEnhanceDescription = async () => {
        if (!spell.effect.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('spell', spell.name || 'this spell', spell.effect, languageFullName);
            if (enhanced) {
                setSpell(prev => ({ ...prev, effect: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance effect", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateEffect = async () => {
        if (!effectAiPrompt) return;
        setIsGeneratingEffect(true);
        try {
            const generatedEffect = await generateSpellEffect(effectAiPrompt, languageFullName);
            if (generatedEffect) {
                setSpell(prev => ({ ...prev, effect: generatedEffect }));
            }
        } catch (e) {
            console.error("Failed to generate spell effect", e);
        } finally {
            setIsGeneratingEffect(false);
        }
    };
    
    const handleGenerateImage = async () => {
        if (!spell.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG spell icon for "${spell.name}". School of magic: ${spell.school}. Effect: ${spell.effect}. Style: detailed, vibrant, magical symbol, on a neutral background, game icon.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate spell image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(spell, image);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-white">{existingSpell ? t('edit_spell') : t('add_new_spell')}</h2>

            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('spell_ai_placeholder')}
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
                        <input name="name" value={spell.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('spell_school')}</label>
                            <select name="school" value={spell.school} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1">
                                {allSpellSchools.map(school => (
                                    <option key={school} value={school}>{t(`spell_school_${school.toLowerCase()}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('spell_level')}</label>
                            <input name="level" type="number" min="0" value={spell.level} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('mana_cost')}</label>
                            <input name="manaCost" value={spell.manaCost} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('range')}</label>
                            <input name="range" value={spell.range} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`effect-spell-${existingSpell?.id}`} className="block text-sm text-slate-300">{t('effect')}</label>
                        <div className="bg-zinc-800/50 p-2 rounded-md border border-zinc-700 my-2">
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t('generate_effect_with_ai')}</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={effectAiPrompt}
                                    onChange={(e) => setEffectAiPrompt(e.target.value)}
                                    placeholder={t('spell_effect_ai_placeholder')}
                                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-md p-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500"
                                    disabled={isGeneratingEffect}
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateEffect}
                                    disabled={isGeneratingEffect || !effectAiPrompt}
                                    className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
                                >
                                    {isGeneratingEffect ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-100"></div> : t('generate')}
                                </button>
                            </div>
                        </div>
                         <div className="relative mt-1">
                            <textarea
                                id={`effect-spell-${existingSpell?.id}`}
                                name="effect"
                                value={spell.effect}
                                onChange={handleChange}
                                required
                                rows={6}
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !spell.effect.trim()}
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
                    <label className="block text-sm text-slate-300 mb-2">{t('spell_icon')}</label>
                    <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                        {isGeneratingImage && <LoadingSpinner />}
                        {!isGeneratingImage && image && <img src={image} alt={spell.name} className="w-full h-full object-cover" />}
                        {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || isGenerating || !spell.name}
                        className="w-full mt-2 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isGeneratingImage ? <LoadingSpinner /> : t('generate_spell_icon')}
                    </button>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_spell')}</button>
            </div>
        </form>
    );
};

const SpellsScreen: React.FC<SpellsScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSchool, setFilterSchool] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingSpell, setDeletingSpell] = useState<Spell | null>(null);

    const allSpellSchools = useMemo(() => {
        const userSchools = rpgData.spells.map(s => s.school).filter(Boolean);
        const combined = [...new Set([...BASE_SPELL_SCHOOLS, ...userSchools])];
        return combined.sort();
    }, [rpgData.spells]);
    
    const spellLevels = useMemo(() => [...new Set(rpgData.spells.map(s => s.level.toString()))].sort((a,b) => parseInt(a) - parseInt(b)), [rpgData.spells]);

    const filteredSpells = useMemo(() => {
        return rpgData.spells.filter(spell => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = spell.name.toLowerCase().includes(searchLower) ||
                                spell.effect.toLowerCase().includes(searchLower) ||
                                spell.school.toLowerCase().includes(searchLower);

            const matchesSchool = filterSchool === 'all' || spell.school === filterSchool;
            const matchesLevel = filterLevel === 'all' || spell.level.toString() === filterLevel;

            return matchesSearch && matchesSchool && matchesLevel;
        });
    }, [rpgData.spells, searchQuery, filterSchool, filterLevel]);
    
    const handleSaveSpell = (spellData: Omit<Spell, 'id' | 'image'>, image?: string) => {
        if (editingSpell) {
            setRpgData(prev => ({
                ...prev,
                spells: prev.spells.map(s => s.id === editingSpell.id ? { ...editingSpell, ...spellData, image } : s)
            }));
        } else {
            const newSpell = { ...spellData, image, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, spells: [...prev.spells, newSpell] }));
        }
        setShowForm(false);
        setEditingSpell(null);
    };

    const handleEdit = (spell: Spell) => {
        setEditingSpell(spell);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (spell: Spell) => {
        setDeletingSpell(spell);
    };

    const handleConfirmDelete = () => {
        if (!deletingSpell) return;
        const spellId = deletingSpell.id;

        setRpgData(prev => {
            const newSpells = prev.spells.filter(s => s.id !== spellId);
            
            const newClasses = prev.classes.map(c => ({
                ...c,
                spellIds: (c.spellIds || []).filter(id => id !== spellId)
            }));

            // This ensures characters in state have the updated class definition
            const newCharacters = prev.characters.map(char => {
                if (char.rpgClass && newClasses.some(c => c.id === char.rpgClass!.id)) {
                    return {
                        ...char,
                        rpgClass: newClasses.find(c => c.id === char.rpgClass!.id) || null
                    };
                }
                return char;
            });

            return {
                ...prev,
                spells: newSpells,
                classes: newClasses,
                characters: newCharacters,
            };
        });
        setDeletingSpell(null);
    };

    const handleAddNew = () => {
        setEditingSpell(null);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterSchool('all');
        setFilterLevel('all');
    };

    const spellDependencies = useMemo(() => {
        if (!deletingSpell) return [];
        const spellId = deletingSpell.id;
        const classesWithSpell = rpgData.classes.filter(c => (c.spellIds || []).includes(spellId)).map(c => c.id);
        if (classesWithSpell.length === 0) return [];
        
        return rpgData.characters
            .filter(char => char.rpgClass && classesWithSpell.includes(char.rpgClass.id))
            .map(c => c.name);
    }, [deletingSpell, rpgData.classes, rpgData.characters]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('spells')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_spell')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_spell')}
                    </button>
                </div>
            </div>

            {rpgData.spells.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_spells')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500"
                        />
                         <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                        <select
                            value={filterSchool}
                            onChange={(e) => setFilterSchool(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_schools')}</option>
                            {allSpellSchools.map(school => <option key={school} value={school}>{t(`spell_school_${school.toLowerCase()}`)}</option>)}
                        </select>
                         <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_levels')}</option>
                            {spellLevels.map(level => <option key={level} value={level}>{level === '0' ? t('cantrip') : `${t('level')} ${level}`}</option>)}
                        </select>
                        <button onClick={handleClearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">{t('clear')}</button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-3xl border border-zinc-800 animate-fadeInScaleUp">
                        <SpellForm 
                            onSave={handleSaveSpell} 
                            onCancel={() => { setShowForm(false); setEditingSpell(null); }} 
                            existingSpell={editingSpell}
                            allSpellSchools={allSpellSchools}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingSpell}
                onClose={() => setDeletingSpell(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingSpell?.name || ''}
                dependencies={spellDependencies}
                isBlocked={spellDependencies.length > 0}
                entityType="spell"
            />

            {rpgData.spells.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_spells_created')}</p>
                    <p className="text-slate-500">{t('start_creating_spells')}</p>
                </div>
            ) : filteredSpells.length === 0 && !showForm ? (
                 <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredSpells.map(spell => (
                        <div 
                            key={spell.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                            {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(spell)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(spell)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {spell.image && (
                                <img src={spell.image} alt={spell.name} className="w-full h-40 object-cover"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{spell.name}</h3>
                                <p className="text-sm text-slate-400">{spell.school} | <span className="font-semibold text-slate-300">{spell.level > 0 ? `${t('level')} ${spell.level}` : t('cantrip')}</span></p>
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{spell.effect}</p>
                                <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
                                    <div>
                                        <h4 className="font-semibold text-slate-300 text-xs mb-1">{t('mana_cost')}:</h4>
                                        <p className="text-xs text-slate-400">{spell.manaCost}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-300 text-xs mb-1">{t('range')}:</h4>
                                        <p className="text-xs text-slate-400">{spell.range}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SpellsScreen;