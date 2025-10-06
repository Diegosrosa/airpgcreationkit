
import React, { useState, useEffect } from 'react';
import { Screen, RPGData } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import SettingScreen from './screens/SettingScreen';
import WeaponsScreen from './screens/WeaponsScreen';
import NpcsScreen from './screens/NpcsScreen';
import ClassesScreen from './screens/ClassesScreen';
import RacesScreen from './screens/RacesScreen';
import ItemsScreen from './screens/ItemsScreen';
import GearScreen from './screens/GearScreen';
import SpellsScreen from './screens/SpellsScreen';
import CharacterSheetScreen from './screens/CharacterSheetScreen';
import CampaignGeneratorScreen from './screens/CampaignGeneratorScreen';
import ImageGeneratorScreen from './screens/ImageGeneratorScreen';
import CreaturesScreen from './screens/CreaturesScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const initialData: RPGData = {
  setting: {
    worldName: "",
    lore: "",
    history: ""
  },
  weapons: [],
  items: [],
  gear: [],
  spells: [],
  npcs: [],
  creatures: [],
  classes: [],
  races: [],
  characters: []
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [rpgData, setRpgData] = useState<RPGData>(() => {
    try {
      const savedData = localStorage.getItem('rpgData');
      return savedData ? JSON.parse(savedData) : initialData;
    } catch (error) {
      console.error("Failed to parse RPG data from localStorage:", error);
      return initialData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rpgData', JSON.stringify(rpgData));
    } catch (error) {
      console.error("Failed to save RPG data to localStorage:", error);
    }
  }, [rpgData]);

  const handleNewProject = () => {
    if (window.confirm(t('confirm_new_project'))) {
      setRpgData(initialData);
      setActiveScreen('dashboard');
    }
  };

  const handleSaveProject = () => {
    const dataStr = JSON.stringify(rpgData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const fileName = `${rpgData.setting.worldName.replace(/\s+/g, '_') || 'my_rpg_project'}.rpgproject`;
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedData: RPGData = JSON.parse(content);
        // Basic validation
        if (loadedData.setting && Array.isArray(loadedData.weapons)) {
          setRpgData(loadedData);
          setActiveScreen('dashboard');
          alert(t('project_loaded_successfully'));
        } else {
          throw new Error("Invalid project file format.");
        }
      } catch (err) {
        console.error("Error loading or parsing project file", err);
        alert(t('error_loading_project'));
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow loading the same file again
    event.target.value = '';
  };


  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard rpgData={rpgData} />;
      case 'setting':
        return <SettingScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'weapons':
        return <WeaponsScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'items':
        return <ItemsScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'gear':
        return <GearScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'spells':
        return <SpellsScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'npcs':
        return <NpcsScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'creatures':
        return <CreaturesScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'classes':
        return <ClassesScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'races':
        return <RacesScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'characters':
        return <CharacterSheetScreen rpgData={rpgData} setRpgData={setRpgData} />;
      case 'analytics':
        return <AnalyticsScreen rpgData={rpgData} />;
      case 'campaign-generator':
        return <CampaignGeneratorScreen rpgData={rpgData} />;
      case 'image-generator':
        return <ImageGeneratorScreen rpgData={rpgData} />;
      default:
        return <Dashboard rpgData={rpgData} />;
    }
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onNewProject={handleNewProject}
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-zinc-950/80">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App;
