import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RPGData, Character, Race, RPGClass, Spell, Item, Gear, Weapon, EffectType } from '../types';
import SparklesIcon from '../components/icons/SparklesIcon';
import { generateImage, generateCharacterPortraitFromPhoto } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import { useLanguage } from '../contexts/LanguageContext';
import BagIcon from '../components/icons/BagIcon';
import PersonIcon from '../components/icons/PersonIcon';
import SwordIcon from '../components/icons/SwordIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import PlayIcon from '../components/icons/PlayIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';


interface CharacterSheetScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const QuantityInput: React.FC<{
    quantity: number;
    onUpdate: (newQuantity: number) => void;
    id: string;
}> = ({ quantity, onUpdate, id }) => {
    const { t } = useLanguage();
    
    const handleIncrement = () => onUpdate(quantity + 1);
    const handleDecrement = () => onUpdate(Math.max(0, quantity - 1));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            onUpdate(value);
        } else if (e.target.value === '') {
            onUpdate(0);
        }
    };
    
    return (
        <div className="flex items-center flex-shrink-0">
            <button
                type="button"
                onClick={handleDecrement}
                className="px-2 py-1 bg-zinc-700 text-white rounded-l-md hover:bg-zinc-600 transition-colors disabled:opacity-50 text-sm font-bold"
                disabled={quantity <= 0}
                aria-label={t('decrease_quantity')}
            >
                &minus;
            </button>
            <input
                id={id}
                type="number"
                min="0"
                value={quantity}
                onChange={handleChange}
                className="w-12 bg-zinc-900 border-y border-zinc-700/80 p-1 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-1 focus:ring-blue-500 focus:outline-none"
                aria-label={t('quantity')}
            />
            <button
                type="button"
                onClick={handleIncrement}
                className="px-2 py-1 bg-zinc-700 text-white rounded-r-md hover:bg-zinc-600 transition-colors text-sm font-bold"
                aria-label={t('increase_quantity')}
            >
                +
            </button>
        </div>
    );
};

const calculateAttributeModifier = (value: number): number => {
    return Math.floor((value - 10) / 2);
};

const CombatStatsDisplay: React.FC<{
  character: Partial<Character>;
  allGear: Gear[];
  allWeapons: Weapon[];
}> = ({ character, allGear, allWeapons }) => {
    const { t } = useLanguage();

    const combatStats = useMemo(() => {
        const attributes = character.attributes || { Strength: 10, Dexterity: 10 };
        const equippedGear = character.equippedGear || {};
        const equippedWeapons = character.equippedWeapons || {};

        const strModifier = calculateAttributeModifier(attributes.Strength || 10);
        const dexModifier = calculateAttributeModifier(attributes.Dexterity || 10);

        // Armor Class Calculation
        let armorClass = 10 + dexModifier; // Default unarmored

        const chestId = equippedGear['Chest'];
        if (chestId) {
            const chestArmor = allGear.find(g => g.id === chestId);
            if (chestArmor) {
                const baseArmor = parseInt(chestArmor.armorValue.match(/\d+/)?.[0] || '10', 10);
                armorClass = baseArmor;
                if (/dex/i.test(chestArmor.armorValue)) {
                    armorClass += dexModifier;
                }
            }
        }
        
        // Add bonuses from other gear, like shields
        Object.entries(equippedGear).forEach(([slot, gearId]) => {
            if (!gearId || slot === 'Chest') return;
            const gearItem = allGear.find(g => g.id === gearId);
            // Add bonus if it's a shield
            if (gearItem && gearItem.type.toLowerCase().includes('shield')) {
                armorClass += parseInt(gearItem.armorValue.match(/\d+/)?.[0] || '0', 10);
            }
        });


        // Attack Bonus & Damage Calculation
        let attackBonus = strModifier; // Default to unarmed strike with STR
        let damage = `1 ${strModifier >= 0 ? '+' : '-'} ${Math.abs(strModifier)}`; // Unarmed damage

        const mainHandId = equippedWeapons['Main Hand'];
        if (mainHandId) {
            const weapon = allWeapons.find(w => w.id === mainHandId);
            if (weapon) {
                // Simple assumption: use STR modifier for all weapons for now.
                attackBonus = strModifier;
                const sign = strModifier >= 0 ? '+' : '-';
                const modValue = Math.abs(strModifier);
                damage = modValue !== 0 ? `${weapon.damage} ${sign} ${modValue}` : weapon.damage;
            }
        }

        return { armorClass, attackBonus, damage };

    }, [character.attributes, character.equippedGear, character.equippedWeapons, allGear, allWeapons]);

    return (
        <div className="mt-4 pt-3 border-t border-zinc-800">
            <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('calculated_combat_stats')}:</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-800/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">{t('armor_class')}</p>
                    <p className="text-lg font-bold text-white">{combatStats.armorClass}</p>
                </div>
                <div className="bg-zinc-800/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">{t('attack_bonus')}</p>
                    <p className="text-lg font-bold text-white">{combatStats.attackBonus >= 0 ? `+${combatStats.attackBonus}` : combatStats.attackBonus}</p>
                </div>
                <div className="bg-zinc-800/50 p-2 rounded-md">
                    <p className="text-xs text-slate-400">{t('damage_output')}</p>
                    <p className="text-lg font-bold text-white truncate" title={combatStats.damage}>{combatStats.damage}</p>
                </div>
            </div>
        </div>
    );
};

interface DragItem {
    type: 'gear' | 'weapon';
    id: string;
    origin: 'slot' | 'backpack';
    slotName?: string;
}

const FilterButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex-grow ${
            active 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-700/50 text-slate-300 hover:bg-zinc-700'
        }`}
    >
        {children}
    </button>
);

const CharacterForm: React.FC<{
    onSave: (character: Omit<Character, 'id'>) => void,
    onCancel: () => void,
    existingCharacter?: Character | null,
    rpgData: RPGData,
}> = ({ onSave, onCancel, existingCharacter, rpgData }) => {
    const { races, classes, spells, items, gear, weapons } = rpgData;
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [level, setLevel] = useState(1);
    const [hp, setHp] = useState({ current: 10, max: 10 });
    const [mp, setMp] = useState({ current: 10, max: 10 });
    const [raceId, setRaceId] = useState<string | null>(null);
    const [classId, setClassId] = useState<string | null>(null);
    const [physicalAppearance, setPhysicalAppearance] = useState('');
    const [background, setBackground] = useState('');
    const [attributes, setAttributes] = useState<{ [key: string]: number }>({});
    const [spellSlots, setSpellSlots] = useState<{ [level: string]: { current: number; max: number } }>({});
    const [newAttrName, setNewAttrName] = useState('');
    
    // Inventory State
    const [inventory, setInventory] = useState<{itemId: string, quantity: number}[]>([]);
    const [gearIds, setGearIds] = useState<{gearId: string, quantity: number}[]>([]);
    const [weaponIds, setWeaponIds] = useState<{weaponId: string, quantity: number}[]>([]);
    const [equippedGear, setEquippedGear] = useState<{ [key: string]: string | null }>({});
    const [equippedWeapons, setEquippedWeapons] = useState<{ [key: string]: string | null }>({});
    
    const [image, setImage] = useState<string | undefined>(undefined);
    const [userPhoto, setUserPhoto] = useState<{ data: string; mimeType: string } | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const portraitFileInputRef = useRef<HTMLInputElement>(null);
    const userPhotoInputRef = useRef<HTMLInputElement>(null);
    
    const [itemSearch, setItemSearch] = useState('');
    const [gearSearch, setGearSearch] = useState('');
    const [weaponSearch, setWeaponSearch] = useState('');
    
    const [backpackSearch, setBackpackSearch] = useState('');
    const [backpackFilter, setBackpackFilter] = useState<'all' | 'items' | 'gear' | 'weapon'>('all');

    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

    const { gearSlots, weaponSlots } = useMemo(() => {
        const selectedRace = races.find(r => r.id === raceId);
        const slots = selectedRace?.bodySlots;

        if (slots && slots.length > 0) {
            const gearSlots = slots.filter(s => !s.isWeaponSlot).map(s => s.name);
            const weaponSlots = slots.filter(s => s.isWeaponSlot).map(s => s.name);
            return { gearSlots, weaponSlots };
        }

        // Fallback for old data or races without slots defined
        return {
            gearSlots: ['Head', 'Chest', 'Legs', 'Hands', 'Feet', 'Accessory'],
            weaponSlots: ['Main Hand', 'Off Hand']
        };
    }, [raceId, races]);
    
     const availableSpellLevels = useMemo(() => {
        const selectedClass = classes.find(c => c.id === classId);
        if (!selectedClass || !selectedClass.spellIds) return [];
        const levels = new Set<number>();
        selectedClass.spellIds.forEach(spellId => {
            const spell = spells.find(s => s.id === spellId);
            if (spell) {
                levels.add(spell.level);
            }
        });
        return Array.from(levels).filter(l => l > 0).sort((a, b) => a - b);
    }, [classId, classes, spells]);


    useEffect(() => {
        if (existingCharacter) {
            setName(existingCharacter.name);
            setLevel(existingCharacter.level);
            setHp(existingCharacter.hp || { current: 10, max: 10 });
            setMp(existingCharacter.mp || { current: 10, max: 10 });
            setRaceId(existingCharacter.race?.id || null);
            setClassId(existingCharacter.rpgClass?.id || null);
            setPhysicalAppearance(existingCharacter.physicalAppearance || '');
            setBackground(existingCharacter.background || '');
            setAttributes(existingCharacter.attributes);
            setSpellSlots(existingCharacter.spellSlots || {});
            setInventory(existingCharacter.inventory || []);
            
            const migratedGearIds = (existingCharacter.gearIds || []).map(g => 
                typeof g === 'string' ? { gearId: g, quantity: 1 } : g
            );
            const migratedWeaponIds = (existingCharacter.weaponIds || []).map(w => 
                typeof w === 'string' ? { weaponId: w, quantity: 1 } : w
            );
            setGearIds(migratedGearIds);
            setWeaponIds(migratedWeaponIds);

            setEquippedGear(existingCharacter.equippedGear || {});
            setEquippedWeapons(existingCharacter.equippedWeapons || {});
            setImage(existingCharacter.image);
            setUserPhoto(null);
        } else {
            setName('');
            setLevel(1);
            setHp({ current: 10, max: 10 });
            setMp({ current: 10, max: 10 });
            setRaceId(races[0]?.id || null);
            setClassId(classes[0]?.id || null);
            setPhysicalAppearance('');
            setBackground('');
            setAttributes({ 'Strength': 10, 'Dexterity': 10, 'Constitution': 10 });
            setSpellSlots({});
            setInventory([]);
            setGearIds([]);
            setWeaponIds([]);
            
            const initialEquippedGear: { [key: string]: string | null } = {};
            gearSlots.forEach(slot => initialEquippedGear[slot] = null);
            setEquippedGear(initialEquippedGear);

            const initialEquippedWeapons: { [key: string]: string | null } = {};
            weaponSlots.forEach(slot => initialEquippedWeapons[slot] = null);
            setEquippedWeapons(initialEquippedWeapons);

            setImage(undefined);
            setUserPhoto(null);
        }
    }, [existingCharacter, races, classes, gearSlots, weaponSlots]);

    useEffect(() => {
        if (!classId) return;

        const selectedClass = classes.find(c => c.id === classId);
        if (!selectedClass || !selectedClass.spellIds) return;

        const classSpellLevels = new Set<number>();
        selectedClass.spellIds.forEach(spellId => {
            const spell = spells.find(s => s.id === spellId);
            if (spell && spell.level > 0) {
                classSpellLevels.add(spell.level);
            }
        });

        setSpellSlots(prevSlots => {
            const newSlots = { ...prevSlots };
            classSpellLevels.forEach(level => {
                const levelStr = level.toString();
                if (!newSlots[levelStr]) {
                    newSlots[levelStr] = { current: 0, max: 0 };
                }
            });
            return newSlots;
        });

    }, [classId, classes, spells]);


    // --- Core Stats Handlers ---
    const handleHpChange = (field: 'current' | 'max', value: string) => {
        const numValue = parseInt(value, 10);
        setHp(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    };
    const handleMpChange = (field: 'current' | 'max', value: string) => {
        const numValue = parseInt(value, 10);
        setMp(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    };

    // --- Attribute Handlers ---
    const handleAttributeChange = (key: string, value: string) => {
        const numValue = parseInt(value, 10);
        setAttributes(prev => ({ ...prev, [key]: isNaN(numValue) ? 0 : numValue }));
    };
    const handleAddAttribute = () => {
        if (newAttrName && !attributes.hasOwnProperty(newAttrName)) {
            setAttributes(prev => ({ ...prev, [newAttrName]: 10 }));
            setNewAttrName('');
        }
    };
    const handleRemoveAttribute = (key: string) => {
        setAttributes(prev => {
            const newAttrs = { ...prev };
            delete newAttrs[key];
            return newAttrs;
        });
    };
    
    // --- Spell Slot Handlers ---
    const handleSpellSlotChange = (level: string, field: 'max' | 'current', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        setSpellSlots(prev => ({
            ...prev,
            [level]: {
                current: prev[level]?.current ?? 0,
                max: prev[level]?.max ?? 0,
                ...prev[level],
                [field]: numValue
            }
        }));
    };
    
    const handleAdjustCurrentSlots = (level: string, amount: number) => {
        setSpellSlots(prev => {
            const currentLevel = prev[level] || { current: 0, max: 0 };
            const newCurrent = Math.max(0, Math.min(currentLevel.max, currentLevel.current + amount));
            return {
                ...prev,
                [level]: { ...currentLevel, current: newCurrent }
            };
        });
    };


    // --- Inventory Handlers ---
    const handleAddItem = (itemId: string) => {
        setInventory(prev => {
            const existing = prev.find(i => i.itemId === itemId);
            if (existing) {
                return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { itemId, quantity: 1 }];
        });
    };
    
    const handleUseItem = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            const effectDescriptions = item.effects.map(e => e.description).join(', ');
            alert(`Used ${item.name}! Effect: ${effectDescriptions || 'No defined effect.'}`);
        }

        handleUpdateItemQuantity(itemId, (inventory.find(i => i.itemId === itemId)?.quantity || 1) - 1);
    };

    const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setInventory(prev => prev.filter(i => i.itemId !== itemId));
        } else {
            setInventory(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity } : i));
        }
    };
    
    const handleAddGearToBackpack = (gearId: string) => {
        if (Object.values(equippedGear).includes(gearId)) return;
        setGearIds(prev => {
            const existing = prev.find(g => g.gearId === gearId);
            if (existing) {
                return prev.map(g => g.gearId === gearId ? { ...g, quantity: g.quantity + 1 } : g);
            }
            return [...prev, { gearId: gearId, quantity: 1 }];
        });
    };

    const handleAddWeaponToBackpack = (weaponId: string) => {
         if (Object.values(equippedWeapons).includes(weaponId)) return;
         setWeaponIds(prev => {
            const existing = prev.find(w => w.weaponId === weaponId);
            if (existing) {
                return prev.map(w => w.weaponId === weaponId ? { ...w, quantity: w.quantity + 1 } : w);
            }
            return [...prev, { weaponId, quantity: 1 }];
        });
    };
    
    const handleUpdateGearQuantity = (gearId: string, quantity: number) => {
        if (quantity <= 0) {
            setGearIds(prev => prev.filter(g => g.gearId !== gearId));
        } else {
            setGearIds(prev => prev.map(g => g.gearId === gearId ? { ...g, quantity } : g));
        }
    };

    const handleUpdateWeaponQuantity = (weaponId: string, quantity: number) => {
        if (quantity <= 0) {
            setWeaponIds(prev => prev.filter(w => w.weaponId !== weaponId));
        } else {
            setWeaponIds(prev => prev.map(w => w.weaponId === weaponId ? { ...w, quantity } : w));
        }
    };
    
    const handleUpdateBackpackQuantity = (category: 'items' | 'gear' | 'weapon', id: string, quantity: number) => {
        switch (category) {
            case 'items':
                handleUpdateItemQuantity(id, quantity);
                break;
            case 'gear':
                handleUpdateGearQuantity(id, quantity);
                break;
            case 'weapon':
                handleUpdateWeaponQuantity(id, quantity);
                break;
        }
    };

    const handleEquipGear = (gearIdToEquip: string) => {
        const gearItem = gear.find(g => g.id === gearIdToEquip);
        if (!gearItem) return;

        const { slot } = gearItem;
        if (!gearSlots.includes(slot)) {
            alert(`This character's race cannot equip items in the "${slot}" slot.`);
            return;
        }
        const currentlyEquippedId = equippedGear[slot];
        
        setEquippedGear(prev => ({ ...prev, [slot]: gearIdToEquip }));
        
        setGearIds(prevGearIds => {
            let nextGearIds = [...prevGearIds];
            const itemInBackpackIdx = nextGearIds.findIndex(g => g.gearId === gearIdToEquip);
            if (itemInBackpackIdx > -1) {
                if (nextGearIds[itemInBackpackIdx].quantity > 1) {
                    nextGearIds[itemInBackpackIdx] = { ...nextGearIds[itemInBackpackIdx], quantity: nextGearIds[itemInBackpackIdx].quantity - 1 };
                } else {
                    nextGearIds.splice(itemInBackpackIdx, 1);
                }
            }

            if (currentlyEquippedId) {
                const existingIdx = nextGearIds.findIndex(g => g.gearId === currentlyEquippedId);
                if (existingIdx > -1) {
                    nextGearIds[existingIdx] = { ...nextGearIds[existingIdx], quantity: nextGearIds[existingIdx].quantity + 1 };
                } else {
                    nextGearIds.push({ gearId: currentlyEquippedId, quantity: 1 });
                }
            }
            
            return nextGearIds;
        });
    };

    const handleUnequipGear = (slot: string) => {
        const equippedId = equippedGear[slot];
        if (equippedId) {
            setEquippedGear(prev => ({...prev, [slot]: null }));
            setGearIds(prev => {
                const existing = prev.find(g => g.gearId === equippedId);
                if (existing) {
                    return prev.map(g => g.gearId === equippedId ? { ...g, quantity: g.quantity + 1 } : g);
                }
                return [...prev, { gearId: equippedId, quantity: 1 }];
            });
        }
    };

    const handleEquipWeapon = (weaponIdToEquip: string, slot: string) => {
        if (!weaponSlots.includes(slot)) {
             alert(`This character's race cannot equip weapons in the "${slot}" slot.`);
            return;
        }
        const currentlyEquippedId = equippedWeapons[slot];
        setEquippedWeapons(prev => ({...prev, [slot]: weaponIdToEquip}));
        
        setWeaponIds(prevWeaponIds => {
            let nextWeaponIds = [...prevWeaponIds];
            const itemInBackpackIdx = nextWeaponIds.findIndex(w => w.weaponId === weaponIdToEquip);
            if (itemInBackpackIdx > -1) {
                if (nextWeaponIds[itemInBackpackIdx].quantity > 1) {
                    nextWeaponIds[itemInBackpackIdx] = { ...nextWeaponIds[itemInBackpackIdx], quantity: nextWeaponIds[itemInBackpackIdx].quantity - 1 };
                } else {
                    nextWeaponIds.splice(itemInBackpackIdx, 1);
                }
            }
            
            if(currentlyEquippedId) {
                const existingIdx = nextWeaponIds.findIndex(w => w.weaponId === currentlyEquippedId);
                if (existingIdx > -1) {
                    nextWeaponIds[existingIdx] = { ...nextWeaponIds[existingIdx], quantity: nextWeaponIds[existingIdx].quantity + 1 };
                } else {
                    nextWeaponIds.push({ weaponId: currentlyEquippedId, quantity: 1 });
                }
            }

            return nextWeaponIds;
        });
    };

    const handleUnequipWeapon = (slot: string) => {
        const equippedId = equippedWeapons[slot];
        if (equippedId) {
            setEquippedWeapons(prev => ({...prev, [slot]: null}));
            setWeaponIds(prev => {
                const existing = prev.find(w => w.weaponId === equippedId);
                if (existing) {
                    // FIX: Changed 'g' to 'w'
                    return prev.map(w => w.weaponId === equippedId ? { ...w, quantity: w.quantity + 1 } : w);
                }
                return [...prev, { weaponId: equippedId, quantity: 1 }];
            });
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, item: DragItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, target: string) => {
        e.preventDefault();
        setDragOverTarget(target);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setDragOverTarget(null);
    };

    const handleDrop = (e: React.DragEvent, dropTarget: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        const [targetType, targetSlot] = dropTarget.split('-');

        if (targetType === 'slot') {
            if (draggedItem.type === 'gear') {
                const gearItem = gear.find(g => g.id === draggedItem.id);
                if (gearItem && gearItem.slot === targetSlot) {
                    handleEquipGear(draggedItem.id);
                }
            } else if (draggedItem.type === 'weapon') {
                if (weaponSlots.includes(targetSlot)) {
                    handleEquipWeapon(draggedItem.id, targetSlot);
                }
            }
        } else if (targetType === 'backpack' && draggedItem.origin === 'slot' && draggedItem.slotName) {
            if (draggedItem.type === 'gear') {
                handleUnequipGear(draggedItem.slotName);
            } else if (draggedItem.type === 'weapon') {
                handleUnequipWeapon(draggedItem.slotName);
            }
        }

        handleDragEnd();
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverTarget(null);
    };


    // --- Image Handlers ---
    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
    
        const selectedRace = races.find(r => r.id === raceId);
        const selectedClass = classes.find(c => c.id === classId);
        
        const basePrompt = `A fantasy RPG character portrait of ${name}, a level ${level} ${selectedRace?.name} ${selectedClass?.name}. Physical appearance: ${physicalAppearance}. Style: detailed fantasy painting, character concept art.`;
    
        try {
            let result: string | null = null;
            if (userPhoto) {
                const photoPrompt = `Transform this photo into a fantasy character portrait. Use the following description as a guide: ${basePrompt}`;
                const base64Data = userPhoto.data.split(',')[1];
                result = await generateCharacterPortraitFromPhoto(base64Data, userPhoto.mimeType, photoPrompt);
            } else {
                result = await generateImage(basePrompt);
            }
    
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate character image:", e);
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
                    setUserPhoto(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    setUserPhoto({ data: loadEvent.target.result as string, mimeType: file.type });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerPortraitFileUpload = () => portraitFileInputRef.current?.click();
    const triggerUserPhotoUpload = () => userPhotoInputRef.current?.click();

    // --- Submit ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedRace = races.find(r => r.id === raceId) || null;
        const selectedClass = classes.find(c => c.id === classId) || null;
        onSave({ 
            name, level, race: selectedRace, rpgClass: selectedClass, 
            hp, mp,
            attributes, physicalAppearance, background, spellSlots,
            spellIds: [], image,
            inventory, gearIds, weaponIds, equippedGear, equippedWeapons
        });
    };

    // --- Render Helpers ---
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()));
    const filteredGear = gear.filter(g => g.name.toLowerCase().includes(gearSearch.toLowerCase()));
    const filteredWeapons = weapons.filter(w => w.name.toLowerCase().includes(weaponSearch.toLowerCase()));

    const formCharacterState = useMemo(() => ({
        attributes,
        equippedGear,
        equippedWeapons
    }), [attributes, equippedGear, equippedWeapons]);

    const combinedBackpack = useMemo(() => {
        const allItems = inventory.map(({ itemId, quantity }) => {
            const item = items.find(i => i.id === itemId);
            return item ? { ...item, quantity, category: 'items' as const } : null;
        });
        const allGear = gearIds.map(({ gearId, quantity }) => {
            const item = gear.find(g => g.id === gearId);
            return item ? { ...item, quantity, category: 'gear' as const } : null;
        });
        const allWeapons = weaponIds.map(({ weaponId, quantity }) => {
            const item = weapons.find(w => w.id === weaponId);
            return item ? { ...item, quantity, category: 'weapon' as const } : null;
        });
        return [...allItems, ...allGear, ...allWeapons].filter((item): item is NonNullable<typeof item> => item !== null);
    }, [inventory, gearIds, weaponIds, items, gear, weapons]);

    const filteredBackpack = useMemo(() => {
        return combinedBackpack.filter(item => {
            const matchesFilter = backpackFilter === 'all' || item.category === backpackFilter;
            const matchesSearch = item.name.toLowerCase().includes(backpackSearch.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [combinedBackpack, backpackFilter, backpackSearch]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-white">{t(existingCharacter ? 'edit_character' : 'create_new_character')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('name')}</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('level')}</label>
                            <input type="number" min="1" value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10))} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('health_points')}</label>
                            <div className="flex items-center mt-1">
                                <input type="number" value={hp.current} onChange={(e) => handleHpChange('current', e.target.value)} className="w-full bg-zinc-800 p-2 rounded-l-md" placeholder={t('current')} />
                                <span className="bg-zinc-700 p-2 text-slate-400">/</span>
                                <input type="number" value={hp.max} onChange={(e) => handleHpChange('max', e.target.value)} className="w-full bg-zinc-800 p-2 rounded-r-md" placeholder={t('max')} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('mana_points')}</label>
                            <div className="flex items-center mt-1">
                                <input type="number" value={mp.current} onChange={(e) => handleMpChange('current', e.target.value)} className="w-full bg-zinc-800 p-2 rounded-l-md" placeholder={t('current')} />
                                <span className="bg-zinc-700 p-2 text-slate-400">/</span>
                                <input type="number" value={mp.max} onChange={(e) => handleMpChange('max', e.target.value)} className="w-full bg-zinc-800 p-2 rounded-r-md" placeholder={t('max')} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('race')}</label>
                            <select value={raceId || ''} onChange={(e) => setRaceId(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mt-1">
                                {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('classes')}</label>
                            <select value={classId || ''} onChange={(e) => setClassId(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mt-1">
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('physical_appearance')}</label>
                            <textarea value={physicalAppearance} onChange={e => setPhysicalAppearance(e.target.value)} rows={3} className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('background_history')}</label>
                            <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3} className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-200 mb-2">{t('attributes')}</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-zinc-900/50 p-2 rounded-md border border-zinc-700">
                                {Object.entries(attributes).map(([key, value]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <input value={t(key)} disabled className="w-1/2 bg-zinc-700 p-2 rounded-md text-sm" />
                                        <input type="number" value={value} onChange={(e) => handleAttributeChange(key, e.target.value)} className="w-1/2 bg-zinc-800 p-2 rounded-md text-sm" />
                                        <button type="button" onClick={() => handleRemoveAttribute(key)} className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs transition-colors">{t('remove')}</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <input value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} placeholder={t('new_attribute_name')} className="flex-grow bg-zinc-800 p-2 rounded-md text-sm" />
                                <button type="button" onClick={handleAddAttribute} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 text-sm">{t('add')}</button>
                            </div>
                        </div>
                         <div>
                            <h3 className="text-base font-semibold text-slate-200 mb-2">{t('spell_slots')}</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-zinc-900/50 p-2 rounded-md border border-zinc-700">
                                {availableSpellLevels.length > 0 ? availableSpellLevels.map(level => {
                                    const levelStr = level.toString();
                                    const slots = spellSlots[levelStr] || { current: 0, max: 0 };
                                    return (
                                        <div key={level} className="flex items-center space-x-2">
                                            <label className="w-1/3 text-sm text-slate-300">{t('level_n_slots', {level: levelStr})}</label>
                                            <div className="flex items-center">
                                                <button type="button" onClick={() => handleAdjustCurrentSlots(levelStr, -1)} className="px-2 py-1 bg-zinc-700 rounded-l-md hover:bg-zinc-600 text-sm">-</button>
                                                <span className="bg-zinc-800 p-2 text-sm w-12 text-center">{slots.current}</span>
                                                <button type="button" onClick={() => handleAdjustCurrentSlots(levelStr, 1)} className="px-2 py-1 bg-zinc-700 rounded-r-md hover:bg-zinc-600 text-sm">+</button>
                                            </div>
                                            <span className="text-slate-400">/</span>
                                            <input type="number" value={slots.max} onChange={(e) => handleSpellSlotChange(levelStr, 'max', e.target.value)} className="w-16 bg-zinc-800 p-2 rounded-md text-sm" placeholder={t('max')} />
                                        </div>
                                    )
                                }) : <p className="text-sm text-slate-500">{t('no_spell_slots')}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1 space-y-4">
                    <input type="file" ref={portraitFileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <input type="file" ref={userPhotoInputRef} onChange={handleUserPhotoUpload} className="hidden" accept="image/*" />

                    <div>
                        <label className="block text-sm text-slate-300 mb-2">{t('character_portrait')}</label>
                        <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                            {isGeneratingImage && <LoadingSpinner />}
                            {!isGeneratingImage && image && <img src={image} alt={name} className="w-full h-full object-cover" />}
                            {!isGeneratingImage && !image && <PersonIcon className="w-20 h-20 text-slate-500" />}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage || !name} className="w-full px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center">
                            {isGeneratingImage ? <LoadingSpinner/> : userPhoto ? t('generate_from_photo') : t('generate_image')}
                        </button>
                        <button type="button" onClick={triggerPortraitFileUpload} disabled={isGeneratingImage} className="w-full px-4 py-2 bg-zinc-700 text-white font-semibold rounded-md hover:bg-zinc-600 transition-all disabled:bg-zinc-600 disabled:cursor-not-allowed">
                            {t('upload_portrait')}
                        </button>
                    </div>

                    <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('ai_generation_reference')}</h4>
                        <p className="text-xs text-slate-400 mb-3">{t('upload_photo_for_ai')}</p>
                        {userPhoto ? (
                            <div className="flex items-center space-x-2">
                                <img src={userPhoto.data} alt="Reference" className="w-12 h-12 rounded-md object-cover" />
                                <div className="text-xs">
                                    <button type="button" onClick={triggerUserPhotoUpload} className="text-blue-400 hover:text-blue-300">{t('change_photo')}</button>
                                    <button type="button" onClick={() => setUserPhoto(null)} className="text-red-400 hover:text-red-300 ml-2">{t('remove_photo')}</button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={triggerUserPhotoUpload} className="w-full text-sm px-3 py-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
                                {t('upload_reference_photo')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="border-t border-zinc-700 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">{t('inventory_management')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Paper Doll & Backpack --- */}
                    <div className="space-y-6" onDragEnd={handleDragEnd}>
                        {/* Equipped Gear */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('equipped_gear')}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {gearSlots.map(slotName => (
                                    <EquipmentSlot 
                                        key={slotName}
                                        slotName={slotName}
                                        equippedId={equippedGear[slotName]}
                                        allGear={gear}
                                        onUnequip={handleUnequipGear}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        dragOverTarget={dragOverTarget}
                                        draggedItem={draggedItem}
                                    />
                                ))}
                            </div>
                            {weaponSlots.length > 0 && (
                                <>
                                <h4 className="font-semibold text-slate-200 mb-2 mt-4">{t('equipped_weapons')}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {weaponSlots.map(slotName => (
                                            <EquipmentSlot
                                                key={slotName}
                                                slotName={slotName}
                                                equippedId={equippedWeapons[slotName]}
                                                allWeapons={weapons}
                                                onUnequip={handleUnequipWeapon}
                                                isWeapon
                                                onDragStart={handleDragStart}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                dragOverTarget={dragOverTarget}
                                                draggedItem={draggedItem}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <CombatStatsDisplay 
                            character={formCharacterState}
                            allGear={rpgData.gear}
                            allWeapons={rpgData.weapons}
                        />

                        {/* Backpack */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('backpack')}</h4>
                             <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder={t('search_in_backpack')}
                                        value={backpackSearch}
                                        onChange={e => setBackpackSearch(e.target.value)}
                                        className="w-full bg-zinc-800 p-2 rounded-md border border-zinc-700 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-1 mb-3">
                                    <FilterButton active={backpackFilter === 'all'} onClick={() => setBackpackFilter('all')}>{t('all')}</FilterButton>
                                    <FilterButton active={backpackFilter === 'items'} onClick={() => setBackpackFilter('items')}>{t('items')}</FilterButton>
                                    <FilterButton active={backpackFilter === 'gear'} onClick={() => setBackpackFilter('gear')}>{t('gear')}</FilterButton>
                                    <FilterButton active={backpackFilter === 'weapon'} onClick={() => setBackpackFilter('weapon')}>{t('weapons')}</FilterButton>
                                </div>
                                <div
                                    onDragOver={(e) => handleDragOver(e, 'backpack-main')}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, 'backpack-main')}
                                    className={`min-h-[120px] max-h-[250px] overflow-y-auto space-y-2 pr-2 transition-colors duration-200 ${dragOverTarget === 'backpack-main' && draggedItem?.origin === 'slot' ? 'bg-blue-500/10 border-blue-500 rounded-md p-2' : ''}`}
                                >
                                    {filteredBackpack.map((item) => (
                                        <BackpackItem 
                                            key={`${item.category}-${item.id}`}
                                            item={item}
                                            quantity={item.quantity}
                                            category={item.category}
                                            onEquipGear={handleEquipGear}
                                            onEquipWeapon={handleEquipWeapon}
                                            onUseItem={handleUseItem}
                                            onUpdateQuantity={handleUpdateBackpackQuantity}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                    {filteredBackpack.length === 0 && (
                                        <div className="text-sm text-slate-500 text-center py-4 flex items-center justify-center h-full">
                                            {dragOverTarget === 'backpack-main' && draggedItem?.origin === 'slot' ? t('drop_to_unequip') : t('backpack') + " " + t('is_empty').toLowerCase() + "."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Item, Gear, Weapon Selection --- */}
                    <div className="space-y-6">
                        {/* Items */}
                         <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('items')}</h4>
                            <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                                <input type="text" placeholder={t('search_placeholder_items_character')} value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mb-2 border border-zinc-700 text-sm" />
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                    {filteredItems.map(item => <button key={item.id} type="button" onClick={() => handleAddItem(item.id)} className="w-full text-left p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 text-sm">{item.name}</button>)}
                                </div>
                            </div>
                        </div>
                        {/* Gear */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('gear')}</h4>
                            <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                                <input type="text" placeholder={t('search_placeholder_gear_character')} value={gearSearch} onChange={e => setGearSearch(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mb-2 border border-zinc-700 text-sm" />
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                    {filteredGear.map(g => <button key={g.id} type="button" onClick={() => handleAddGearToBackpack(g.id)} className="w-full text-left p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 text-sm">{g.name} ({g.slot})</button>)}
                                </div>
                            </div>
                        </div>
                        {/* Weapons */}
                         <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('weapons')}</h4>
                            <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-700">
                                <input type="text" placeholder={t('search_placeholder_weapons_character')} value={weaponSearch} onChange={e => setWeaponSearch(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mb-2 border border-zinc-700 text-sm" />
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                    {filteredWeapons.map(w => <button key={w.id} type="button" onClick={() => handleAddWeaponToBackpack(w.id)} className="w-full text-left p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 text-sm">{w.name}</button>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t(existingCharacter ? 'save_changes' : 'create_character')}</button>
            </div>
        </form>
    );
};

const EquipmentSlot: React.FC<{
    slotName: string;
    equippedId: string | null;
    allGear?: Gear[];
    allWeapons?: Weapon[];
    onUnequip: (slot: string) => void;
    isWeapon?: boolean;
    onDragStart: (e: React.DragEvent, item: DragItem) => void;
    onDragOver: (e: React.DragEvent, target: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, target: string) => void;
    dragOverTarget: string | null;
    draggedItem: DragItem | null;
}> = ({ slotName, equippedId, allGear, allWeapons, onUnequip, isWeapon, onDragStart, onDragOver, onDragLeave, onDrop, dragOverTarget, draggedItem }) => {
    const { t } = useLanguage();
    const item = isWeapon 
        ? allWeapons?.find(w => w.id === equippedId) 
        : allGear?.find(g => g.id === equippedId);

    const dropTargetId = `slot-${slotName}`;
    const isBeingDraggedOver = dragOverTarget === dropTargetId;
    
    // Check if the dragged item is valid for this slot
    let isValidDrop = false;
    if (draggedItem && isBeingDraggedOver) {
        if (draggedItem.type === 'gear' && !isWeapon) {
            const gearItem = allGear?.find(g => g.id === draggedItem.id);
            if (gearItem && gearItem.slot === slotName) {
                isValidDrop = true;
            }
        } else if (draggedItem.type === 'weapon' && isWeapon) {
            isValidDrop = true;
        }
    }
    
    return (
        <div
            draggable={!!item}
            onDragStart={(e) => item && onDragStart(e, { type: isWeapon ? 'weapon' : 'gear', id: item.id, origin: 'slot', slotName })}
            onDragOver={(e) => onDragOver(e, dropTargetId)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dropTargetId)}
            className={`bg-zinc-800/50 border rounded-md p-2 h-20 flex flex-col justify-between text-center group relative transition-all duration-200 ${item ? 'cursor-grab' : ''} ${isValidDrop ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500' : 'border-zinc-700'}`}
        >
            <span className="text-xs text-slate-400 font-semibold truncate">{t(slotName.toLowerCase().replace(/ /g, '_'))}</span>
            {item ? (
                 <div className="flex-grow flex items-center justify-center min-h-0">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain pointer-events-none" />
                    ) : (
                        <p className="text-sm font-bold truncate pointer-events-none" title={item.name}>{item.name}</p>
                    )}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <span className="text-sm text-slate-500">{isValidDrop ? t('drop_to_equip') : 'Empty'}</span>
                </div>
            )}
            {item && (
                 <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                     <p className="text-sm font-bold text-white text-center px-1" title={item.name}>{item.name}</p>
                     <button type="button" onClick={() => onUnequip(slotName)} className="mt-2 text-xs text-red-400 hover:text-red-300 bg-zinc-900 px-2 py-1 rounded transition-transform transform active:scale-95">{t('unequip')}</button>
                 </div>
            )}
        </div>
    );
};

const BackpackItem: React.FC<{
    item: Item | Gear | Weapon;
    quantity: number;
    category: 'items' | 'gear' | 'weapon';
    onEquipGear: (id: string) => void;
    onEquipWeapon: (id: string, slot: string) => void;
    onUseItem: (id: string) => void;
    onUpdateQuantity: (category: 'items' | 'gear' | 'weapon', id: string, quantity: number) => void;
    onDragStart: (e: React.DragEvent, item: DragItem) => void;
}> = ({ item, quantity, category, onEquipGear, onEquipWeapon, onUseItem, onUpdateQuantity, onDragStart }) => {
    const { t } = useLanguage();
    const isDraggable = category === 'gear' || category === 'weapon';
    const isConsumable = category === 'items' && ('effects' in item && (item.type.toLowerCase() === 'potion' || item.effects.some(e => e.type === EffectType.HEALING)));

    const handleUpdate = (newQuantity: number) => {
        onUpdateQuantity(category, item.id, newQuantity);
    };

    return (
        <div
            draggable={isDraggable}
            onDragStart={(e) => isDraggable && onDragStart(e, { type: category, id: item.id, origin: 'backpack' })}
            className={`flex items-center justify-between p-1.5 rounded-md bg-zinc-800/80 ${isDraggable ? 'cursor-grab' : ''}`}
        >
            <div className="flex items-center gap-2 flex-grow min-w-0">
                <span className="text-sm truncate flex-grow">{item.name}</span>
                <QuantityInput
                    id={`quantity-${item.id}`}
                    quantity={quantity}
                    onUpdate={handleUpdate}
                />
            </div>
            <div className="flex-shrink-0 ml-2">
                {category === 'items' && isConsumable && (
                    <button type="button" onClick={() => onUseItem(item.id)} className="p-1.5 text-slate-300 hover:text-white bg-green-600/50 hover:bg-green-600 rounded-md transition-colors" title={t('use')}>
                        <PlayIcon className="w-4 h-4"/>
                    </button>
                )}
                {category === 'gear' && (
                    <button type="button" onClick={() => onEquipGear(item.id)} className="text-xs bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-500 transition-transform transform active:scale-95 hover:-translate-y-px">{t('equip')}</button>
                )}
                {category === 'weapon' && (
                    <>
                        <button type="button" onClick={() => onEquipWeapon(item.id, 'Main Hand')} className="text-xs bg-blue-600 px-2 py-1 rounded-l-md hover:bg-blue-500 transition-transform transform active:scale-95 hover:-translate-y-px">{t('equip_main')}</button>
                        <button type="button" onClick={() => onEquipWeapon(item.id, 'Off Hand')} className="text-xs bg-blue-700 px-2 py-1 rounded-r-md hover:bg-blue-600 transition-transform transform active:scale-95 hover:-translate-y-px">{t('equip_off')}</button>
                    </>
                )}
            </div>
        </div>
    );
};

const CharacterCard: React.FC<{
    character: Character;
    spells: Spell[];
    items: Item[];
    gear: Gear[];
    weapons: Weapon[];
    onEdit: (character: Character) => void;
    onDelete: (character: Character) => void;
    isDeleteMode: boolean;
}> = ({ character: char, spells, items, gear, weapons, onEdit, onDelete, isDeleteMode }) => {
    const { t } = useLanguage();
    
    const equippedGearList = Object.entries(char.equippedGear || {}).map(([slot, id]) => {
        if (!id) return null;
        const gearItem = gear.find(g => g.id === id);
        return gearItem ? { ...gearItem, slot } : null;
    }).filter(Boolean);

    const equippedWeaponList = Object.entries(char.equippedWeapons || {}).map(([slot, id]) => {
        if (!id) return null;
        const weaponItem = weapons.find(w => w.id === id);
        return weaponItem ? { ...weaponItem, slot } : null;
    }).filter(Boolean);
    
    const spellSlotLevels = Object.keys(char.spellSlots || {}).sort((a, b) => parseInt(a) - parseInt(b));


    return (
        <div className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}>
            {isDeleteMode ? (
                <button onClick={() => onDelete(char)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                    <TrashIcon className="w-4 h-4" />
                </button>
            ) : (
                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button type="button" onClick={() => onEdit(char)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            {char.image && (
                <img src={char.image} alt={char.name} className="w-full h-48 object-cover object-top" />
            )}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-blue-400">{char.name}</h3>
                    <p className="text-sm text-slate-400">{t('level')} {char.level} {char.race?.name} {char.rpgClass?.name}</p>
                    
                    <div className="mt-3 space-y-2">
                        <div>
                            <div className="flex justify-between items-baseline text-xs">
                                <span className="font-bold text-red-400">HP</span>
                                <span className="text-slate-300">{char.hp?.current || 0} / {char.hp?.max || 0}</span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${((char.hp?.current || 0) / (char.hp?.max || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline text-xs">
                                <span className="font-bold text-blue-400">MP</span>
                                <span className="text-slate-300">{char.mp?.current || 0} / {char.mp?.max || 0}</span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${((char.mp?.current || 0) / (char.mp?.max || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800">
                        <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('attributes')}:</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                            {Object.entries(char.attributes).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span>{t(key)}</span>
                                    <span className="font-bold text-slate-200">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <CombatStatsDisplay 
                        character={char}
                        allGear={gear}
                        allWeapons={weapons}
                    />

                    {spellSlotLevels.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-800">
                            <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('spell_slots')}:</h4>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                {spellSlotLevels.map(level => {
                                    const slots = char.spellSlots[level];
                                    if (!slots || slots.max === 0) return null;
                                    return (
                                        <div key={level} className="flex items-center space-x-1">
                                            <span className="font-bold text-slate-400">{t('level')} {level}:</span>
                                            <span className="text-white font-mono">{slots.current}/{slots.max}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}


                    {(equippedGearList.length > 0 || equippedWeaponList.length > 0) && (
                         <div className="mt-4 pt-3 border-t border-zinc-800">
                            <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('equipped_gear')}:</h4>
                            <div className="flex flex-wrap gap-2">
                                {equippedWeaponList.map(item => (
                                     <div key={item!.id} className="flex items-center space-x-2 bg-zinc-800/50 px-2 py-1 rounded-md" title={item!.description}>
                                        <SwordIcon className="w-4 h-4 text-orange-400" />
                                        <span className="text-xs text-slate-300">{item!.name}</span>
                                    </div>
                                ))}
                                {equippedGearList.map(item => (
                                     <div key={item!.id} className="flex items-center space-x-2 bg-zinc-800/50 px-2 py-1 rounded-md" title={item!.description}>
                                        <ShieldCheckIcon className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs text-slate-300">{item!.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {char.inventory && char.inventory.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-800">
                            <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('inventory')}:</h4>
                            <div className="flex flex-wrap gap-2">
                                {char.inventory.map(({itemId, quantity}) => {
                                    const item = items.find(i => i.id === itemId);
                                    if (!item) return null;
                                    return (
                                        <div key={itemId} className="flex items-center space-x-2 bg-zinc-800/50 px-2 py-1 rounded-md" title={item.description}>
                                            <BagIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs text-slate-300">{item.name}</span>
                                            {quantity > 1 && <span className="text-xs font-bold text-slate-400">x{quantity}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CharacterSheetScreen: React.FC<CharacterSheetScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null);

    const handleSaveCharacter = (characterData: Omit<Character, 'id'>) => {
        if (editingCharacter) {
            setRpgData(prev => ({
                ...prev,
                characters: prev.characters.map(c => c.id === editingCharacter.id ? { ...editingCharacter, ...characterData } : c)
            }));
        } else {
            const newCharacter = { ...characterData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, characters: [...prev.characters, newCharacter] }));
        }
        setShowForm(false);
        setEditingCharacter(null);
    };

    const handleEdit = (character: Character) => {
        setEditingCharacter(character);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (character: Character) => {
        setDeletingCharacter(character);
    };

    const handleConfirmDelete = () => {
        if (!deletingCharacter) return;
        setRpgData(prev => ({ ...prev, characters: prev.characters.filter(c => c.id !== deletingCharacter.id) }));
        setDeletingCharacter(null);
    };

    const handleAddNew = () => {
        setEditingCharacter(null);
        setShowForm(true);
        closeDeleteMode();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('characters')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_character')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('create_character')}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-7xl border border-zinc-800 animate-fadeInScaleUp max-h-[90vh] overflow-y-auto">
                        <CharacterForm
                            onSave={handleSaveCharacter}
                            onCancel={() => { setShowForm(false); setEditingCharacter(null); }}
                            existingCharacter={editingCharacter}
                            rpgData={rpgData}
                        />
                    </div>
                </div>
            )}
            
            <DeletionModal
                isOpen={!!deletingCharacter}
                onClose={() => setDeletingCharacter(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingCharacter?.name || ''}
                dependencies={[]}
                isBlocked={false}
                entityType="character"
            />

            {rpgData.characters.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_characters_created')}</p>
                    <p className="text-slate-500">{t('start_creating_characters')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {rpgData.characters.map(character => (
                        <CharacterCard
                            key={character.id}
                            character={character}
                            spells={rpgData.spells}
                            items={rpgData.items}
                            gear={rpgData.gear}
                            weapons={rpgData.weapons}
                            onEdit={handleEdit}
                            onDelete={handleOpenDeleteModal}
                            isDeleteMode={isDeleteMode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
{/* FIX: Add default export for CharacterSheetScreen component */}
export default CharacterSheetScreen;