
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from '@google/genai';
import { RPGData, Message } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import MagicIcon from '../components/icons/MagicIcon';
import PersonIcon from '../components/icons/PersonIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { generateImage } from '../services/geminiService';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generateSceneImageTool: FunctionDeclaration = {
  name: 'generateSceneImage',
  description: 'Generates an image of the current scene, character, or object to visually represent it for the player. Use this for key moments, dramatic scenes, or important locations to enhance the storytelling.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'A detailed, descriptive prompt for the image generation model. Describe the scene as if you were painting a picture. For example: "A colossal red dragon sleeping on a mountain of gold coins in a dark, cavernous lair."',
      },
    },
    required: ['description'],
  },
};

interface CampaignTheme {
  id: string;
  nameKey: string;
  descriptionKey: string;
  promptFragment: string;
}

const campaignThemes: CampaignTheme[] = [
  { id: 'high-fantasy', nameKey: 'theme_high_fantasy', descriptionKey: 'theme_high_fantasy_desc', promptFragment: 'An epic high fantasy adventure about saving the world from a great evil' },
  { id: 'grimdark', nameKey: 'theme_grimdark', descriptionKey: 'theme_grimdark_desc', promptFragment: 'A grimdark story in a morally ambiguous world where choices have heavy consequences' },
  { id: 'mystery', nameKey: 'theme_mystery', descriptionKey: 'theme_mystery_desc', promptFragment: 'A detective-style mystery involving a strange crime in a major city' },
  { id: 'intrigue', nameKey: 'theme_intrigue', descriptionKey: 'theme_intrigue_desc', promptFragment: 'A political intrigue campaign filled with spies, nobles, and conspiracies' },
  { id: 'exploration', nameKey: 'theme_exploration', descriptionKey: 'theme_exploration_desc', promptFragment: 'A journey of exploration into uncharted territories, discovering lost ruins and new civilizations' },
  { id: 'custom', nameKey: 'theme_custom', descriptionKey: 'theme_custom_desc', promptFragment: '' }
];


const CampaignGeneratorScreen: React.FC<{ rpgData: RPGData; }> = ({ rpgData }) => {
  const { t, languageFullName } = useLanguage();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaignStarted, setCampaignStarted] = useState(false);
  const [customDetails, setCustomDetails] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CampaignTheme>(campaignThemes[0]);
  
  const [userInput, setUserInput] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const processFunctionCalls = (functionCalls: any[]) => {
      for (const call of functionCalls) {
          if (call.name === 'generateSceneImage') {
              const description = call.args.description;
              const imageId = `image-${Date.now()}`;
              
              setMessages(prev => [...prev, {
                  id: imageId,
                  role: 'model',
                  text: `Generating illustration: "${description.substring(0, 80)}..."`,
                  isLoadingImage: true
              }]);

              generateImage(description).then(imageUrl => {
                  setMessages(prev => prev.map(msg => 
                      msg.id === imageId 
                          ? { ...msg, image: imageUrl, isLoadingImage: false, text: '' }
                          : msg
                  ));
              }).catch(err => {
                  console.error("Image generation failed:", err);
                  setMessages(prev => prev.map(msg => 
                      msg.id === imageId 
                          ? { ...msg, isLoadingImage: false, text: 'Sorry, the illustration could not be created.' }
                          : msg
                  ));
              });
          }
      }
  };


  const handleStartCampaign = async () => {
    const finalInitialPrompt = selectedTheme.id === 'custom' 
        ? customDetails 
        : `${selectedTheme.promptFragment}${customDetails ? `. ${customDetails}`: ''}`;

    if (!finalInitialPrompt || loading) return;

    setLoading(true);
    setError(null);
    setCampaignStarted(true);

    try {
        let playerCharacterContext = '';
        if (rpgData.characters.length > 0) {
            const mainCharacter = rpgData.characters[0];
            playerCharacterContext = `
---
PLAYER CHARACTER:
Name: ${mainCharacter.name}
Race: ${mainCharacter.race?.name || 'Unknown'}
Class: ${mainCharacter.rpgClass?.name || 'Unknown'}
Level: ${mainCharacter.level}
---
The player is controlling ${mainCharacter.name}. They want to start a campaign with this theme: "${finalInitialPrompt}".
Begin the adventure with an exciting introductory scene tailored to this character and the world context.
`;
        } else {
            playerCharacterContext = `
---
PLAYER CHARACTER:
No character has been created yet.
---
The player wants to start a campaign with this theme: "${finalInitialPrompt}".
As part of your first response, set an exciting introductory scene for the adventure, and then ask the player to briefly describe their character (e.g., name, race, and class) so you can tailor the story for them.
`;
        }

        const notableItemsString = [
            ...rpgData.weapons.map(w => w.name), 
            ...rpgData.items.map(i => i.name),
            ...rpgData.gear.map(g => g.name)
        ].join(', ') || 'None defined';

        const contextString = `
        IMPORTANT: You must conduct the entire campaign, including all your descriptions, dialogue, and responses, in ${languageFullName}. Do not switch languages under any circumstances. The player's initial prompt, "${finalInitialPrompt}", should also be understood as being in ${languageFullName}.

        You are an expert Dungeon Master for a tabletop role-playing game. Your goal is to create a dynamic, interactive story. 
        You will describe the world, the scenes, and the non-player characters (NPCs). You will also describe the consequences of the player's actions.
        Always wait for the player's input before continuing the story. Keep your responses engaging but not overly long.
        You have a special ability: you can generate images to illustrate the campaign. To do this, call the 'generateSceneImage' function with a detailed description of the scene you want to show the player. Use this to make the adventure more immersive!
        
        Here is the context of the RPG world you are running:
        ---
        WORLD SETTING:
        Name: ${rpgData.setting.worldName}
        Lore: ${rpgData.setting.lore}
        History: ${rpgData.setting.history}
        ---
        AVAILABLE RACES:
        ${rpgData.races.map(r => r.name).join(', ') || 'None defined'}
        ---
        AVAILABLE CLASSES:
        ${rpgData.classes.map(c => c.name).join(', ') || 'None defined'}
        ---
        KEY NPCS:
        ${rpgData.npcs.map(n => `${n.name} (${n.role})`).join('\n') || 'None defined'}
        ---
        NOTABLE WEAPONS, ITEMS, & GEAR:
        ${notableItemsString}
        ---
        AVAILABLE SPELLS:
        ${rpgData.spells.map(s => s.name).join(', ') || 'None defined'}
        ---
        ${playerCharacterContext}
        `;
        
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: contextString,
                temperature: 0.8,
                tools: [{ functionDeclarations: [generateSceneImageTool] }]
            }
        });

        setChat(newChat);
        const response = await newChat.sendMessage({ message: "Let's begin." });
        
        const responseText = response.text;
        if (responseText) {
          setMessages([{ id: Date.now().toString(), role: 'model', text: responseText }]);
        }

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            processFunctionCalls(functionCalls);
        }

    } catch (e) {
      console.error("Error starting campaign:", e);
      setError(t('error_starting_campaign'));
      setCampaignStarted(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || loading || !chat) return;

    const text = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setLoading(true);
    setError(null);

    try {
      const response = await chat.sendMessage({ message: text });
      
      const responseText = response.text;
      if (responseText) {
         setMessages(prev => [...prev, { id: `text-${Date.now()}`, role: 'model', text: responseText }]);
      }

       const functionCalls = response.functionCalls;
       if (functionCalls && functionCalls.length > 0) {
         processFunctionCalls(functionCalls);
       }

    } catch (e) {
      console.error("Error sending message:", e);
      setError(t('error_sending_message'));
    } finally {
      setLoading(false);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isModel = message.role === 'model';

    return (
      <div className={`flex items-start gap-3 my-4 animate-fadeIn ${isModel ? 'justify-start' : 'justify-end'}`}>
        {isModel && (
          <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <MagicIcon className="w-5 h-5 text-blue-400" />
          </div>
        )}
        <div className={`p-4 rounded-lg max-w-2xl ${isModel ? 'bg-zinc-900 border border-zinc-800' : 'bg-blue-600 text-white'}`}>
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
            
            {message.isLoadingImage && (
                <div className="mt-2 flex items-center justify-center p-4">
                    <LoadingSpinner />
                </div>
            )}

            {message.image && (
                <a href={message.image} target="_blank" rel="noopener noreferrer">
                    <img src={message.image} alt="Generated campaign scene" className="mt-2 rounded-lg max-w-full h-auto cursor-pointer" />
                </a>
            )}
        </div>
        {!isModel && (
            <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
              <PersonIcon className="w-5 h-5 text-slate-300" />
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
        <div className="mb-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-white mb-2">{t('ai_dungeon_master')}</h1>
            <p className="text-slate-400">
                {campaignStarted 
                    ? t('campaign_started_prompt')
                    : t('campaign_not_started_prompt')
                }
            </p>
        </div>

        {!campaignStarted ? (
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 mt-4 animate-fadeInUp space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-3">{t('theme_selection_title')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {campaignThemes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => setSelectedTheme(theme)}
                                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                    selectedTheme.id === theme.id 
                                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-600/10'
                                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
                                }`}
                            >
                                <h3 className="font-bold text-slate-100">{t(theme.nameKey)}</h3>
                                <p className="text-xs text-slate-400 mt-1">{t(theme.descriptionKey)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex space-x-4">
                <input
                    type="text"
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartCampaign()}
                    placeholder={t(selectedTheme.id === 'custom' ? 'campaign_custom_placeholder' : 'campaign_details_placeholder')}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button
                    onClick={handleStartCampaign}
                    disabled={loading || (selectedTheme.id === 'custom' && !customDetails)}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[150px]"
                >
                    {loading ? <LoadingSpinner /> : t('start_campaign')}
                </button>
                </div>
                {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        ) : (
            <>
                <div className="flex-1 overflow-y-auto pr-4 -mr-4 mb-4 border-t border-b border-zinc-800/50 py-4">
                    {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                    {loading && (
                        <div className="flex items-start gap-3 my-4 justify-start animate-fadeIn">
                            <div className="w-8 h-8 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                                <MagicIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="p-4 rounded-lg max-w-2xl bg-zinc-900 border border-zinc-800 flex items-center space-x-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                
                <div className="flex-shrink-0 pt-2">
                    {error && <p className="text-red-400 mb-2 text-center">{error}</p>}
                    <div className="flex space-x-4 items-start bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <textarea
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={t('chat_input_placeholder')}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 resize-none h-12 transition-all focus:h-24"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !userInput}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed self-stretch"
                        >
                            {t('send')}
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default CampaignGeneratorScreen;