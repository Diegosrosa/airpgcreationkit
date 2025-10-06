import React, { useState, useMemo, useRef } from 'react';
import { RPGData, Item, StructuredEffect, EffectType } from '../types';
import { generateItem, generateImage, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import XIcon from '../components/icons/XIcon';
import PencilIcon from '../components/icons/PencilIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';
import TrashIcon from '../components/icons/TrashIcon';

interface ItemsScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const getEffectTagColor = (type: EffectType) => {
    switch (type) {
        case EffectType.HEALING: return 'bg-green-500/20 text-green-300 border-green-500/30';
        case EffectType.DAMAGE: return 'bg-red-500/20 text-red-300 border-red-500/30';
        case EffectType.BUFF: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case EffectType.DEBUFF: return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
        case EffectType.UTILITY: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        default: return 'bg-zinc-700/50 text-slate-300 border-zinc-700/80';
    }
};

const ItemForm: React.FC<{ 
    onSave: (item: Omit<Item, 'id'>) => void, 
    onCancel: () => void, 
    existingItem?: Item | null 
}> = ({ onSave, onCancel, existingItem }) => {
    const { t, languageFullName } = useLanguage();
    const [item, setItem] = useState<{ name: string; type: string; description: string; effects: StructuredEffect[] }>({ name: '', type: '', description: '', effects: [] });
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (existingItem) {
            // Backwards compatibility for items with a single `effect` string
            const effects = existingItem.effects || ((existingItem as any).effect ? [{ type: EffectType.OTHER, description: (existingItem as any).effect }] : []);
            
            setItem({
                name: existingItem.name,
                type: existingItem.type,
                description: existingItem.description,
                effects: effects.length > 0 ? effects : [{ type: EffectType.OTHER, description: '' }],
            });
            setImage(existingItem.image);
        } else {
            setItem({ name: '', type: '', description: '', effects: [{ type: EffectType.OTHER, description: '' }] });
            setAiPrompt('');
            setImage(undefined);
        }
    }, [existingItem]);

    const handleEffectChange = (index: number, field: keyof StructuredEffect, value: string) => {
        const newEffects = [...item.effects];
        newEffects[index] = { ...newEffects[index], [field]: value };
        setItem(prev => ({ ...prev, effects: newEffects }));
    };

    const handleAddEffect = () => {
        setItem(prev => ({ ...prev, effects: [...prev.effects, { type: EffectType.OTHER, description: '' }] }));
    };

    const handleRemoveEffect = (index: number) => {
        const newEffects = item.effects.filter((_, i) => i !== index);
        setItem(prev => ({ ...prev, effects: newEffects }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setItem({ ...item, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateItem(aiPrompt, languageFullName);
        if (generatedData) {
            setItem(generatedData);
        }
        setIsGenerating(false);
    };
    
    const handleEnhanceDescription = async () => {
        if (!item.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('item', item.name || 'this item', item.description, languageFullName);
            if (enhanced) {
                setItem(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!item.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG item, "${item.name}". Description: ${item.description}. Style: detailed, realistic concept art, inventory icon, on a neutral background.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate item image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    setImage(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
         const finalItem = {
            ...item,
            effects: item.effects.filter(e => e.description.trim() !== '')
        };
        onSave({ ...finalItem, image });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                 <h2 className="text-xl font-bold text-white mb-4">{t(existingItem ? 'edit_item' : 'add_new_item')}</h2>
                <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={t('item_ai_placeholder')}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('name')}</label>
                            <input name="name" value={item.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('type')}</label>
                            <input name="type" value={item.type} onChange={handleChange} placeholder={t('item_type_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor={`desc-item-${existingItem?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="relative mt-1">
                            <textarea 
                                id={`desc-item-${existingItem?.id}`}
                                name="description" 
                                value={item.description} 
                                onChange={handleChange} 
                                required rows={3} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                             <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !item.description.trim()}
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
                        <label className="block text-sm text-slate-300 mb-2">{t('effects')}</label>
                        <div className="space-y-3 bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                            {item.effects.map((effect, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <select 
                                        value={effect.type} 
                                        onChange={(e) => handleEffectChange(index, 'type', e.target.value)}
                                        className="bg-zinc-800 p-2 rounded-md text-sm w-32 border border-zinc-700"
                                    >
                                        {Object.values(EffectType).map(et => <option key={et} value={et}>{t('effect_type_' + et.toLowerCase())}</option>)}
                                    </select>
                                    <input 
                                        type="text" 
                                        value={effect.description} 
                                        onChange={(e) => handleEffectChange(index, 'description', e.target.value)}
                                        placeholder={t('effect_description_placeholder')}
                                        className="flex-1 bg-zinc-800 p-2 rounded-md text-sm border border-zinc-700"
                                    />
                                    <button type="button" onClick={() => handleRemoveEffect(index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddEffect} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                                {t('add_effect')}
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="md:col-span-1">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/svg+xml"
                    />
                    <label className="block text-sm text-slate-300 mb-2">{t('item_icon')}</label>
                    <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                        {isGeneratingImage && <LoadingSpinner />}
                        {!isGeneratingImage && image && <img src={image} alt={item.name} className="w-full h-full object-cover" />}
                        {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={triggerFileUpload}
                            disabled={isGeneratingImage || isGenerating}
                            className="w-full px-4 py-2 bg-zinc-700 text-white font-semibold rounded-md hover:bg-zinc-600 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {t('upload')}
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || isGenerating || !item.name}
                            className="w-full px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGeneratingImage ? <LoadingSpinner/> : t('generate_image')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_item')}</button>
            </div>
        </form>
    );
};


const ItemsScreen: React.FC<ItemsScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);

    const itemTypes = useMemo(() => [...new Set(rpgData.items.map(i => i.type).filter(Boolean).sort())], [rpgData.items]);

    const filteredItems = useMemo(() => {
        return rpgData.items.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const effectText = (item.effects || []).map(e => e.description).join(' ');
            const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                                item.description.toLowerCase().includes(searchLower) ||
                                effectText.toLowerCase().includes(searchLower);

            const matchesType = filterType === 'all' || item.type === filterType;

            return matchesSearch && matchesType;
        });
    }, [rpgData.items, searchQuery, filterType]);

    const handleSaveItem = (itemData: Omit<Item, 'id'>) => {
        if (editingItem) {
            setRpgData(prev => ({
                ...prev,
                items: prev.items.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i)
            }));
        } else {
            const newItem = { ...itemData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        }
        setShowForm(false);
        setEditingItem(null);
    };
    
    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setShowForm(true);
        closeDeleteMode();
    };
    
    const handleOpenDeleteModal = (item: Item) => {
        setDeletingItem(item);
    };

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        const itemId = deletingItem.id;
        
        setRpgData(prev => {
            const newItems = prev.items.filter(i => i.id !== itemId);

            const newCharacters = prev.characters.map(char => {
                const newInventory = (char.inventory || []).filter(invItem => invItem.itemId !== itemId);
                return { ...char, inventory: newInventory };
            });

            return {
                ...prev,
                items: newItems,
                characters: newCharacters,
            };
        });
        setDeletingItem(null);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setShowForm(true);
        closeDeleteMode();
    }

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
    };

    const itemDependencies = useMemo(() => {
        if (!deletingItem) return [];
        return rpgData.characters
            .filter(char => (char.inventory || []).some(invItem => invItem.itemId === deletingItem.id))
            .map(c => c.name);
    }, [deletingItem, rpgData.characters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('items')}</h1>
                 <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_item')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_item')}
                    </button>
                </div>
            </div>

            {rpgData.items.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_items')}
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
                            {itemTypes.map(type => (
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
                        <ItemForm 
                            onSave={handleSaveItem} 
                            onCancel={() => { setShowForm(false); setEditingItem(null); }}
                            existingItem={editingItem}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingItem?.name || ''}
                dependencies={itemDependencies}
                isBlocked={itemDependencies.length > 0}
                entityType="item"
            />

            {rpgData.items.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_items_created')}</p>
                    <p className="text-slate-500">{t('start_creating_items')}</p>
                </div>
            ) : filteredItems.length === 0 && !showForm ? (
                 <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                            {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(item)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                            {item.image && (
                                <img src={item.image} alt={item.name} className="w-full h-40 object-cover"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{item.name}</h3>
                                <p className="text-sm text-slate-400 font-semibold">{item.type}</p>
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{item.description}</p>
                                {item.effects && item.effects.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-zinc-800">
                                        <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('effects')}:</h4>
                                        <div className="space-y-1">
                                            {item.effects.map((effect, index) => (
                                                <div key={index} className={`text-xs p-2 rounded-md border ${getEffectTagColor(effect.type)}`}>
                                                    <strong className="font-bold">{t('effect_type_' + effect.type.toLowerCase())}:</strong> {effect.description}
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

export default ItemsScreen;