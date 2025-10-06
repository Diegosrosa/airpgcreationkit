import React, { useState, useMemo } from 'react';
import { RPGData, NPC } from '../types';
import { generateImage, generateNpc, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';

interface NpcsScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const NpcForm: React.FC<{ 
    onSave: (npc: Omit<NPC, 'id'>) => void, 
    onCancel: () => void, 
    existingNpc?: NPC | null 
}> = ({ onSave, onCancel, existingNpc }) => {
    const { t, languageFullName } = useLanguage();
    const [npc, setNpc] = useState({ name: '', race: '', role: '', description: '' });
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [imageStyle, setImageStyle] = useState('fantasy painting');
    
    const imageStyles = ['fantasy painting', 'photorealistic', 'anime', 'cartoon', 'pixel art'];

    React.useEffect(() => {
        if (existingNpc) {
            setNpc({
                name: existingNpc.name,
                race: existingNpc.race,
                role: existingNpc.role,
                description: existingNpc.description,
            });
            setImage(existingNpc.image);
        } else {
            setNpc({ name: '', race: '', role: '', description: '' });
            setImage(undefined);
            setAiPrompt('');
        }
    }, [existingNpc]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNpc({ ...npc, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateNpc(aiPrompt, languageFullName);
        if (generatedData) {
            setNpc(generatedData);
        }
        setIsGenerating(false);
    };
    
    const handleEnhanceDescription = async () => {
        if (!npc.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('npc', npc.name || 'this npc', npc.description, languageFullName);
            if (enhanced) {
                setNpc(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!npc.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG character portrait of an NPC named "${npc.name}". Race: ${npc.race}, Role: ${npc.role}. Description: ${npc.description}. Style: ${imageStyle}.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate NPC image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...npc, image });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-white">{existingNpc ? t('edit_npc') : t('add_new_npc')}</h2>
            
            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('npc_ai_placeholder')}
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
                        <input name="name" value={npc.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('race')}</label>
                            <input name="race" value={npc.race} onChange={handleChange} placeholder={t('npc_race_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('role')}</label>
                            <input name="role" value={npc.role} onChange={handleChange} placeholder={t('npc_role_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`desc-npc-${existingNpc?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="relative mt-1">
                            <textarea 
                                id={`desc-npc-${existingNpc?.id}`}
                                name="description" 
                                value={npc.description} 
                                onChange={handleChange} 
                                required rows={6} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                             <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !npc.description.trim()}
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
                <div className="md:col-span-1 space-y-2">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">{t('character_portrait')}</label>
                        <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                            {isGeneratingImage && <LoadingSpinner />}
                            {!isGeneratingImage && image && <img src={image} alt={npc.name} className="w-full h-full object-cover" />}
                            {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">{t('portrait_style')}</label>
                         <select
                            value={imageStyle}
                            onChange={(e) => setImageStyle(e.target.value)}
                            className="w-full bg-zinc-800 p-2 rounded-md border border-zinc-700 focus:ring-2 focus:ring-fuchsia-500"
                            disabled={isGeneratingImage || isGenerating}
                        >
                            {imageStyles.map(style => (
                                <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || isGenerating || !npc.name}
                        className="w-full !mt-4 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isGeneratingImage ? <LoadingSpinner/> : t('generate_image')}
                    </button>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_npc')}</button>
            </div>
        </form>
    );
};


const NpcsScreen: React.FC<NpcsScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingNpc, setEditingNpc] = useState<NPC | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRace, setFilterRace] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingNpc, setDeletingNpc] = useState<NPC | null>(null);

    const npcRaces = useMemo(() => [...new Set(rpgData.npcs.map(n => n.race).filter(Boolean).sort())], [rpgData.npcs]);
    const npcRoles = useMemo(() => [...new Set(rpgData.npcs.map(n => n.role).filter(Boolean).sort())], [rpgData.npcs]);

    const filteredNpcs = useMemo(() => {
        return rpgData.npcs.filter(npc => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = npc.name.toLowerCase().includes(searchLower) ||
                                npc.description.toLowerCase().includes(searchLower);
            const matchesRace = filterRace === 'all' || npc.race === filterRace;
            const matchesRole = filterRole === 'all' || npc.role === filterRole;

            return matchesSearch && matchesRace && matchesRole;
        });
    }, [rpgData.npcs, searchQuery, filterRace, filterRole]);

    const handleSaveNpc = (npcData: Omit<NPC, 'id'>) => {
        if (editingNpc) {
            setRpgData(prev => ({
                ...prev,
                npcs: prev.npcs.map(n => n.id === editingNpc.id ? { ...editingNpc, ...npcData } : n)
            }));
        } else {
            const newNpc = { ...npcData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, npcs: [...prev.npcs, newNpc] }));
        }
        setShowForm(false);
        setEditingNpc(null);
    };

    const handleEdit = (npc: NPC) => {
        setEditingNpc(npc);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (npc: NPC) => {
        setDeletingNpc(npc);
    };

    const handleConfirmDelete = () => {
        if (!deletingNpc) return;
        setRpgData(prev => ({ ...prev, npcs: prev.npcs.filter(n => n.id !== deletingNpc.id) }));
        setDeletingNpc(null);
    };

    const handleAddNew = () => {
        setEditingNpc(null);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterRace('all');
        setFilterRole('all');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('npcs')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_npc')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_new_npc')}
                    </button>
                </div>
            </div>

            {rpgData.npcs.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_npcs')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                        <select
                            value={filterRace}
                            onChange={(e) => setFilterRace(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_races')}</option>
                            {npcRaces.map(race => <option key={race} value={race}>{race}</option>)}
                        </select>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_roles')}</option>
                            {npcRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <button onClick={handleClearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">{t('clear')}</button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-3xl border border-zinc-800 animate-fadeInScaleUp">
                        <NpcForm 
                            onSave={handleSaveNpc} 
                            onCancel={() => { setShowForm(false); setEditingNpc(null); }} 
                            existingNpc={editingNpc}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingNpc}
                onClose={() => setDeletingNpc(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingNpc?.name || ''}
                dependencies={[]}
                isBlocked={false}
                entityType="npc"
            />

            {rpgData.npcs.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_npcs_created')}</p>
                    <p className="text-slate-500">{t('start_creating_npcs')}</p>
                </div>
             ) : filteredNpcs.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredNpcs.map(npc => (
                        <div
                            key={npc.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                            {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(npc)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(npc)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                            {npc.image && (
                                <img src={npc.image} alt={npc.name} className="w-full h-40 object-cover"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{npc.name}</h3>
                                <p className="text-sm text-slate-400">{npc.race} | <span className="font-semibold text-slate-300">{npc.role}</span></p>
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{npc.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NpcsScreen;