import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { ErrorHandler } from '../utils/ErrorHandler';
import { Validation } from '../utils/Validation';
import { LoadingManager, LoadingKeys } from '../utils/LoadingManager';

export default function SimpleGoalCreation() {
  const { refreshGoals } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingManager] = useState(() => LoadingManager.getInstance());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((states) => {
      setIsLoading(states[LoadingKeys.GOAL_CREATE] || false);
    });

    return unsubscribe;
  }, [loadingManager]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    motivation: '',
    difficulty: 3,
    targetEndDate: null as Date | null,
  });

  const categories = [
    '健康・運動',
    '学習・スキルアップ',
    '仕事・キャリア',
    '趣味・娯楽',
    '人間関係',
    '家事・生活',
    'その他',
  ];

  const handleNext = () => {
    // Step 1 validation
    if (currentStep === 1) {
      const titleResult = Validation.validateField(formData.title, Validation.rules.goalTitle, 'タイトル');
      const categoryResult = Validation.validateField(formData.category, Validation.rules.category, 'カテゴリ');
      
      const errors = [...titleResult.errors, ...categoryResult.errors];
      if (errors.length > 0) {
        Validation.showValidationErrors(errors);
        return;
      }
    }
    
    // Step 2 validation
    if (currentStep === 2) {
      const descriptionResult = Validation.validateField(
        formData.description, 
        Validation.rules.goalDescription, 
        '目標の詳細'
      );
      
      if (!descriptionResult.isValid) {
        Validation.showValidationErrors(descriptionResult.errors);
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation
    const validationResult = Validation.validateGoal(formData);
    if (!validationResult.isValid) {
      Validation.showValidationErrors(validationResult.errors);
      return;
    }

    const loadingManager = LoadingManager.getInstance();
    
    const result = await loadingManager.withLoading(
      LoadingKeys.GOAL_CREATE,
      async () => {
        const { getDatabase } = await import('../database/database');
        const database = getDatabase();
        const goalCollection = database.collections.get('goals');
        
        await database.write(async () => {
          await goalCollection.create((goal: any) => {
            goal.title = formData.title;
            goal.category = formData.category;
            goal.targetDescription = formData.description;
            goal.motivation = formData.motivation;
            goal.difficulty = formData.difficulty;
            goal.isActive = true;
            goal.totalStamps = 0;
            goal.currentStreak = 0;
            goal.bestStreak = 0;
            goal.targetEndDate = formData.targetEndDate;
          });
        });

        // データを更新
        await refreshGoals();
        return true;
      },
      {
        successMessage: `🎉 目標を作成しました！\n「${formData.title}」\n今日から一緒にがんばりましょう！`,
        errorHandler: (error) => {
          const appError = ErrorHandler.handleError(error, 'goal_creation');
          ErrorHandler.showUserError(appError, '目標作成エラー');
        }
      }
    );

    if (result) {
      // リセット
      setFormData({
        title: '',
        category: '',
        description: '',
        motivation: '',
        difficulty: 3,
        targetEndDate: null,
      });
      setCurrentStep(1);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>どんな目標ですか？</Text>
      
      <Text style={styles.label}>目標タイトル *</Text>
      <TextInput
        style={styles.input}
        placeholder="例: 毎日30分読書する"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
      />

      <Text style={styles.label}>カテゴリ *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              formData.category === category && styles.selectedCategory
            ]}
            onPress={() => setFormData({ ...formData, category })}
          >
            <Text style={[
              styles.categoryText,
              formData.category === category && styles.selectedCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>目標の詳細を教えてください</Text>
      
      <Text style={styles.label}>具体的な目標 *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="何を、どのくらい、いつまでに達成したいですか？"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>モチベーションを教えてください</Text>
      
      <Text style={styles.label}>なぜこの目標を達成したいですか？ *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="この目標を達成することで、どんな良いことがありますか？"
        value={formData.motivation}
        onChangeText={(text) => setFormData({ ...formData, motivation: text })}
        multiline
        numberOfLines={4}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>設定確認</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>目標:</Text>
          <Text style={styles.summaryValue}>{formData.title}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>カテゴリ:</Text>
          <Text style={styles.summaryValue}>{formData.category}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={currentStep > 1 ? handlePrevious : undefined}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            {currentStep > 1 ? '← 戻る' : ''}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>新しい目標</Text>
          <Text style={styles.headerSubtitle}>ステップ {currentStep} / 3</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* プログレスバー */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              step <= currentStep && styles.progressStepActive
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* フッターボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={currentStep === 3 ? handleSubmit : handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {currentStep === 3 ? '目標を作成' : '次へ'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 34,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});