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
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { ErrorHandler } from '../utils/ErrorHandler';
import { Validation } from '../utils/Validation';
import { LoadingManager, LoadingKeys } from '../utils/LoadingManager';

export default function SimpleGoalCreation() {
  const router = useRouter();
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

  // 画面にフォーカスが当たった時にフォームをリセット
  useFocusEffect(
    React.useCallback(() => {
      resetForm();
    }, [])
  );
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    motivation: '',
    difficulty: 3,
    targetEndDate: null as Date | null,
    reminderTime: '09:00', // デフォルト時間
    reminderEnabled: true, // リマインダーの有効/無効
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

  // リマインド時間のオプション
  const reminderTimeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', 
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30'
  ];

  const handleNext = async () => {
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
    
    // Step 2 validation (リマインド設定) & Goal Creation
    if (currentStep === 2) {
      if (formData.reminderEnabled && !formData.reminderTime) {
        Validation.showValidationErrors(['リマインド時間を設定してください']);
        return;
      }
      
      // ステップ2で目標作成を実行
      await handleCreateGoal();
      return;
    }
    
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      title: '',
      category: '',
      description: '',
      motivation: '',
      difficulty: 3,
      targetEndDate: null,
      reminderTime: '09:00',
      reminderEnabled: true,
    });
  };

  const handleCreateGoal = async () => {
    // Basic validation for Step 2 completion
    const titleResult = Validation.validateField(formData.title, Validation.rules.goalTitle, 'タイトル');
    const categoryResult = Validation.validateField(formData.category, Validation.rules.category, 'カテゴリ');
    
    const errors = [...titleResult.errors, ...categoryResult.errors];
    if (errors.length > 0) {
      Validation.showValidationErrors(errors);
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
            goal.targetDescription = ''; // Step 2で完了するため詳細は空
            goal.motivation = ''; // Step 2で完了するためモチベーションは空
            goal.difficulty = formData.difficulty;
            goal.reminderTime = formData.reminderTime;
            goal.reminderEnabled = formData.reminderEnabled;
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
      // 成功時はフォームをリセットしてダッシュボードに遷移
      resetForm();
      router.replace('/(tabs)');
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

      <Text style={styles.stepInfo}>
        ステップ {currentStep} / 2: 基本情報を入力してください
      </Text>

      {/* ステップ1専用の次へボタン */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity
          style={[
            styles.stepButton,
            (!formData.title || !formData.category) && styles.stepButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!formData.title || !formData.category}
        >
          <Text style={[
            styles.stepButtonText,
            (!formData.title || !formData.category) && styles.stepButtonTextDisabled
          ]}>
            次のステップへ →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>リマインド設定</Text>
      
      {/* リマインダー有効/無効 */}
      <View style={styles.switchContainer}>
        <Text style={styles.label}>リマインダーを使用する</Text>
        <TouchableOpacity
          style={[
            styles.switch,
            formData.reminderEnabled && styles.switchEnabled
          ]}
          onPress={() => setFormData({ 
            ...formData, 
            reminderEnabled: !formData.reminderEnabled 
          })}
        >
          <View style={[
            styles.switchThumb,
            formData.reminderEnabled && styles.switchThumbEnabled
          ]} />
        </TouchableOpacity>
      </View>

      {formData.reminderEnabled && (
        <>
          <Text style={styles.label}>リマインド時間 *</Text>
          <Text style={styles.helpText}>
            毎日この時間にリマインダー通知が届きます
          </Text>
          
          <ScrollView 
            style={styles.timePickerContainer}
            showsVerticalScrollIndicator={false}
          >
            {reminderTimeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  formData.reminderTime === time && styles.timeOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, reminderTime: time })}
              >
                <Text style={[
                  styles.timeOptionText,
                  formData.reminderTime === time && styles.timeOptionTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.stepInfo}>
        ステップ {currentStep} / 2: リマインダーの設定を行います
      </Text>

      {/* ステップ2専用のボタン */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity
          style={styles.stepSecondaryButton}
          onPress={handlePrevious}
        >
          <Text style={styles.stepSecondaryButtonText}>← 戻る</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.stepButton,
            (formData.reminderEnabled && !formData.reminderTime) && styles.stepButtonDisabled
          ]}
          onPress={handleNext}
          disabled={formData.reminderEnabled && !formData.reminderTime}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[
              styles.stepButtonText,
              (formData.reminderEnabled && !formData.reminderTime) && styles.stepButtonTextDisabled
            ]}>
              🎯 目標を作成
            </Text>
          )}
        </TouchableOpacity>
      </View>
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

      <Text style={styles.stepInfo}>
        ステップ {currentStep} / 2: 最終確認です。「目標を作成」で完了します
      </Text>

      {/* ステップ2専用のボタン */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity
          style={styles.stepSecondaryButton}
          onPress={handlePrevious}
        >
          <Text style={styles.stepSecondaryButtonText}>← 戻る</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.stepButton,
            !formData.motivation.trim() && styles.stepButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.motivation.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[
              styles.stepButtonText,
              !formData.motivation.trim() && styles.stepButtonTextDisabled
            ]}>
              🎯 目標を作成
            </Text>
          )}
        </TouchableOpacity>
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
          <Text style={styles.headerSubtitle}>ステップ {currentStep} / 2</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* プログレスバー */}
      <View style={styles.progressContainer}>
        {[1, 2].map((step) => (
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
      </ScrollView>

      {/* フッターボタン (ステップ2では非表示) */}
      {currentStep < 2 && (
        <View style={styles.footer}>
          {/* デバッグ情報 */}
          {__DEV__ && (
            <Text style={styles.debugText}>
              Debug: currentStep={currentStep}, isLoading={isLoading}
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>次へ</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ステップ2のみ：デバッグ情報用のフッター */}
      {currentStep === 3 && __DEV__ && (
        <View style={styles.debugFooter}>
          <Text style={styles.debugText}>
            Debug: currentStep={currentStep}, isLoading={isLoading}
          </Text>
        </View>
      )}
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
  stepInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  stepButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  stepButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  stepButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stepButtonTextDisabled: {
    color: '#666666',
  },
  stepSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stepSecondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  debugFooter: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  // リマインド設定用スタイル
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  switch: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  switchEnabled: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbEnabled: {
    transform: [{ translateX: 24 }],
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  timePickerContainer: {
    maxHeight: 200,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});