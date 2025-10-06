
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RPGData, Item, Gear, RPGClass, Weapon, NPC, Race, Spell, EffectType, Creature } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the magical item." },
        type: { type: Type.STRING, description: "The type of item (e.g., Potion, Scroll, Ring, Amulet)." },
        description: { type: Type.STRING, description: "A detailed visual and lore-based description of the item." },
        effects: {
            type: Type.ARRAY,
            description: "A list of mechanical effects or abilities the item grants.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: `The category of the effect. Must be one of: ${Object.values(EffectType).join(', ')}.`,
                        enum: Object.values(EffectType)
                    },
                    description: {
                        type: Type.STRING,
                        description: "A clear and concise description of the effect's mechanics (e.g., 'Restores 2d4+2 health', '+1 to Strength for 1 minute')."
                    }
                },
                required: ["type", "description"]
            }
        }
    },
    required: ["name", "type", "description", "effects"]
};

const gearSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the piece of clothing or gear." },
        type: { type: Type.STRING, description: "The type of gear (e.g., Light Armor, Heavy Armor, Clothing, Accessory)." },
        slot: { type: Type.STRING, description: "The body slot the gear is worn on (e.g., Head, Chest, Legs, Hands, Feet, Accessory)." },
        armorValue: { type: Type.STRING, description: "The protective value of the gear. Can be a number or a formula (e.g., '14 + Dex modifier', '5', 'None')." },
        description: { type: Type.STRING, description: "A detailed visual and lore-based description of the gear." },
    },
    required: ["name", "type", "slot", "armorValue", "description"]
};

const classSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the RPG class." },
        description: { type: Type.STRING, description: "A detailed description of the class, its role, and its flavor." },
        abilities: {
            type: Type.ARRAY,
            description: "A list of unique abilities or skills the class possesses.",
            items: { type: Type.STRING },
        },
        traits: {
            type: Type.ARRAY,
            description: "A list of passive traits or characteristics of the class.",
            items: { type: Type.STRING },
        }
    },
    required: ["name", "description", "abilities", "traits"]
};

const weaponSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the weapon." },
        type: { type: Type.STRING, description: "The type of weapon (e.g., Sword, Axe, Bow)." },
        damage: { type: Type.STRING, description: "The weapon's damage, including dice and type (e.g., '1d8 slashing', '2d6 piercing')." },
        description: { type: Type.STRING, description: "A detailed visual and lore-based description of the weapon." },
    },
    required: ["name", "type", "damage", "description"]
};

const npcSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the NPC." },
        race: { type: Type.STRING, description: "The race of the NPC (e.g., Human, Elf, Dwarf)." },
        role: { type: Type.STRING, description: "The NPC's role in the world (e.g., Merchant, Quest Giver, Blacksmith)." },
        description: { type: Type.STRING, description: "A detailed description of the NPC's appearance, personality, and backstory." },
    },
    required: ["name", "race", "role", "description"]
};

const creatureSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the creature or monster." },
        type: { type: Type.STRING, description: "The type of creature (e.g., Beast, Monstrosity, Undead, Fiend)." },
        challengeRating: { type: Type.STRING, description: "The creature's challenge rating, which indicates its threat level (e.g., '1/4', '5 (1,800 XP)')." },
        hp: { type: Type.STRING, description: "The creature's hit points, often including the dice formula (e.g., '45 (6d10 + 12)')." },
        armorClass: { type: Type.STRING, description: "The creature's armor class, including the source if applicable (e.g., '15 (Natural Armor)')." },
        attackBonus: { type: Type.STRING, description: "The creature's primary attack bonus (e.g., '+5')." },
        abilities: {
            type: Type.ARRAY,
            description: "A list of unique abilities, skills, or special attacks the creature possesses.",
            items: { type: Type.STRING },
        },
        description: { type: Type.STRING, description: "A detailed description of the creature's appearance, behavior, and lore." },
    },
    required: ["name", "type", "challengeRating", "hp", "armorClass", "attackBonus", "abilities", "description"]
};

const raceSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the RPG race." },
        description: { type: Type.STRING, description: "A detailed description of the race, its culture, and its appearance." },
        traits: {
            type: Type.ARRAY,
            description: "A list of unique traits or abilities the race possesses.",
            items: { type: Type.STRING },
        }
    },
    required: ["name", "description", "traits"]
};

const spellSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the spell." },
        school: { type: Type.STRING, description: "The school of magic (e.g., Evocation, Illusion, Necromancy)." },
        level: { type: Type.INTEGER, description: "The spell's level (0 for cantrips, 1 for 1st-level, etc.)." },
        effect: { type: Type.STRING, description: "A detailed description of the spell's mechanical and narrative effects." },
        manaCost: { type: Type.STRING, description: "The cost to cast the spell (e.g., '10 Mana', '1 Action Point', 'Varies')." },
        range: { type: Type.STRING, description: "The spell's effective range (e.g., 'Self', 'Touch', '30 feet')." },
    },
    required: ["name", "school", "level", "effect", "manaCost", "range"]
};

export const generateItem = async (prompt: string, language: string): Promise<Omit<Item, 'id' | 'image'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG item based on the following idea: "${prompt}". IMPORTANT: Respond in ${language}. All output fields (name, type, description, effects) must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: itemSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const itemData = JSON.parse(jsonText);
        return itemData as Omit<Item, 'id' | 'image'>;

    } catch (error) {
        console.error("Error generating item:", error);
        return null;
    }
};

export const generateGear = async (prompt: string, language: string): Promise<Omit<Gear, 'id'> | null> => {
    try {
        const fullPrompt = `Generate a piece of fantasy RPG clothing or armor based on the following idea: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: gearSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const gearData = JSON.parse(jsonText);
        return gearData as Omit<Gear, 'id'>;

    } catch (error) {
        console.error("Error generating gear:", error);
        return null;
    }
};

export const generateClass = async (prompt: string, language: string): Promise<Omit<RPGClass, 'id'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG class based on the following concept: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: classSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const classData = JSON.parse(jsonText);
        return classData as Omit<RPGClass, 'id'>;

    } catch (error) {
        console.error("Error generating class:", error);
        return null;
    }
};

export const generateWeapon = async (prompt: string, language: string): Promise<Omit<Weapon, 'id' | 'image'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG weapon based on the following idea: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: weaponSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const weaponData = JSON.parse(jsonText);
        return weaponData as Omit<Weapon, 'id' | 'image'>;

    } catch (error) {
        console.error("Error generating weapon:", error);
        return null;
    }
};

export const generateNpc = async (prompt: string, language: string): Promise<Omit<NPC, 'id' | 'image'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG Non-Player Character (NPC) based on the following idea: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: npcSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const npcData = JSON.parse(jsonText);
        return npcData as Omit<NPC, 'id' | 'image'>;

    } catch (error) {
        console.error("Error generating NPC:", error);
        return null;
    }
};

export const generateCreature = async (prompt: string, language: string): Promise<Omit<Creature, 'id' | 'image'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG creature or monster based on the following idea: "${prompt}". Based on its description, type, and challenge rating, also generate appropriate combat stats like Hit Points (HP), Armor Class, and a primary Attack Bonus. IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: creatureSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const creatureData = JSON.parse(jsonText);
        return creatureData as Omit<Creature, 'id' | 'image'>;

    } catch (error) {
        console.error("Error generating creature:", error);
        return null;
    }
};

export const generateRace = async (prompt: string, language: string): Promise<Omit<Race, 'id'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG race based on the following concept: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: raceSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const raceData = JSON.parse(jsonText);
        return raceData as Omit<Race, 'id'>;

    } catch (error) {
        console.error("Error generating race:", error);
        return null;
    }
};

export const generateSpell = async (prompt: string, language: string): Promise<Omit<Spell, 'id' | 'image'> | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG spell based on the following idea: "${prompt}". IMPORTANT: Respond in ${language}. All output fields must be in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: spellSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const spellData = JSON.parse(jsonText);
        return spellData as Omit<Spell, 'id' | 'image'>;

    } catch (error) {
        console.error("Error generating spell:", error);
        return null;
    }
};

export const generateSpellEffect = async (prompt: string, language: string): Promise<string | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG spell effect based on the following idea: "${prompt}".
        Describe the mechanical and narrative effects clearly and concisely.
        Respond ONLY with the text of the effect, as a single paragraph. Do not include any preamble like "Here is the effect:".
        IMPORTANT: Respond in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                temperature: 0.7,
            },
        });

        let text = response.text.trim();
        // Clean up markdown in case it's returned
        if (text.startsWith('```') && text.endsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }

        return text;
    } catch (error) {
        console.error("Error generating spell effect:", error);
        return null;
    }
};

export const generateWeaponDescription = async (prompt: string, weaponName: string, weaponType: string, language: string): Promise<string | null> => {
    try {
        const fullPrompt = `Generate a fantasy RPG weapon description based on the following idea: "${prompt}".
        The weapon is a ${weaponType || 'weapon'} named "${weaponName || 'this weapon'}".
        The description should include rich visual details, some lore, and any magical properties or effects.
        Respond ONLY with the text of the description, as a single paragraph. Do not include any preamble like "Here is the description:".
        IMPORTANT: Respond in ${language}.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                temperature: 0.75,
            },
        });

        let text = response.text.trim();
        // Clean up markdown in case it's returned
        if (text.startsWith('```') && text.endsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }
        
        return text;
    } catch (error) {
        console.error("Error generating weapon description:", error);
        return null;
    }
};

export const enhanceDescription = async (
    entityType: string, 
    entityName: string, 
    currentDescription: string,
    language: string
): Promise<string | null> => {
    try {
        const prompt = `
            You are a creative writer for a fantasy RPG. Your task is to enhance the description of a game entity.
            Take the following information and expand upon the description, adding 2-3 sentences of rich lore, visual detail, or in-world context.
            Make it more engaging and flavorful. Do not repeat the original description verbatim; build upon it.
            IMPORTANT: Respond ONLY with the new, enhanced description text, which should be a single paragraph. Do not include any preamble like "Here is the enhanced description:".
            The final response must be in ${language}.

            Entity Type: ${entityType}
            Entity Name: ${entityName}
            Original Description: "${currentDescription}"

            Enhanced Description:
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.75,
            },
        });

        let text = response.text.trim();
        if (text.startsWith('```') && text.endsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }

        return text;

    } catch (error) {
        console.error(`Error enhancing description for ${entityType}:`, error);
        return null;
    }
};


export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "1:1",
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const generateCharacterPortraitFromPhoto = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string
): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64ImageData,
                  mimeType: mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
          }
        }
        return null;

    } catch (error) {
        console.error("Error generating character portrait from photo:", error);
        return null;
    }
};