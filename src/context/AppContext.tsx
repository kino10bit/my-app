import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase } from '../database/database';
import { GoalModel, TrainerModel } from '../database/models';
import { AudioService } from '../services/AudioService';
import { MemoryOptimizer, PerformanceMonitor } from '../utils/PerformanceOptimizer';

interface AppContextType {
  // Trainer state
  selectedTrainer: TrainerModel | null;
  trainers: TrainerModel[];
  setSelectedTrainer: (trainer: TrainerModel | null) => void;
  
  // Goals state
  goals: GoalModel[];
  refreshGoals: () => Promise<void>;
  
  // Audio service
  audioService: AudioService;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  selectTrainer: (trainer: TrainerModel) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerModel | null>(null);
  const [trainers, setTrainers] = useState<TrainerModel[]>([]);
  const [goals, setGoals] = useState<GoalModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [audioService] = useState(() => new AudioService());

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // まずデータベースを初期化
      const { initializeDatabase } = await import('../database/database');
      await initializeDatabase();
      console.log('Database initialization completed in AppContext');
      
      // その後でデータローディングとオーディオ初期化を実行
      await Promise.all([
        loadTrainers(),
        loadGoals(),
        audioService.initialize()
      ]);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrainers = useCallback(async () => {
    try {
      // Try cache first
      const cachedTrainers = MemoryOptimizer.getCache<TrainerModel[]>('trainers');
      if (cachedTrainers) {
        setTrainers(cachedTrainers);
        const selected = cachedTrainers.find(t => t.isSelected);
        if (selected) {
          setSelectedTrainer(selected);
        }
        return;
      }

      // Load from database
      await PerformanceMonitor.measureAsync('loadTrainers', async () => {
        const database = getDatabase();
        if (!database) {
          console.warn('Database not available, using empty trainers array');
          setTrainers([]);
          return;
        }
        
        const trainerCollection = database.collections.get<TrainerModel>('trainers');
        const allTrainers = await trainerCollection.query().fetch();
        
        // Cache the result
        MemoryOptimizer.setCache('trainers', allTrainers);
        setTrainers(allTrainers);
        
        const selected = allTrainers.find(t => t.isSelected);
        if (selected) {
          setSelectedTrainer(selected);
        }
      });
    } catch (error) {
      console.error('Failed to load trainers:', error);
      setTrainers([]);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      // Try cache first
      const cachedGoals = MemoryOptimizer.getCache<GoalModel[]>('goals');
      if (cachedGoals) {
        setGoals(cachedGoals);
        return;
      }

      // Load from database
      await PerformanceMonitor.measureAsync('loadGoals', async () => {
        const database = getDatabase();
        if (!database) {
          console.warn('Database not available, using empty goals array');
          setGoals([]);
          return;
        }
        
        const goalCollection = database.collections.get<GoalModel>('goals');
        const activeGoals = await goalCollection.query().fetch();
        
        // Cache the result
        MemoryOptimizer.setCache('goals', activeGoals);
        setGoals(activeGoals);
      });
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    }
  }, []);

  const refreshGoals = useCallback(async () => {
    // Clear cache before refresh
    MemoryOptimizer.clearCache();
    await loadGoals();
  }, [loadGoals]);

  const refreshData = useCallback(async () => {
    // Clear cache before refresh
    MemoryOptimizer.clearCache();
    await Promise.all([
      loadTrainers(),
      loadGoals()
    ]);
  }, [loadTrainers, loadGoals]);

  const selectTrainer = useCallback(async (trainer: TrainerModel) => {
    try {
      await PerformanceMonitor.measureAsync('selectTrainer', async () => {
        await trainer.select();
        setSelectedTrainer(trainer);
        
        // Clear trainer cache and refresh
        MemoryOptimizer.setCache('trainers', null);
        await loadTrainers();
        
        // Play welcome message
        const message = audioService.getTrainerVoiceMessage(trainer.type, 'welcome');
        const fileName = `${trainer.voicePrefix}_welcome`;
        await audioService.playTrainerVoice(fileName, `${trainer.name}：「${message}」`);
      });
    } catch (error) {
      console.error('Failed to select trainer:', error);
      throw error;
    }
  }, [audioService, loadTrainers]);

  const contextValue: AppContextType = useMemo(() => ({
    selectedTrainer,
    trainers,
    setSelectedTrainer,
    goals,
    refreshGoals,
    audioService,
    isLoading,
    refreshData,
    selectTrainer
  }), [
    selectedTrainer,
    trainers,
    goals,
    refreshGoals,
    audioService,
    isLoading,
    refreshData,
    selectTrainer
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};