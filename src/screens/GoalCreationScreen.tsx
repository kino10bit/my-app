import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  TextArea,
  Select,
  CheckIcon,
  FormControl,
  Radio,
  Slider,
  Switch,
  useColorModeValue,
  useToast,
  Divider,
  Card,
  Badge,
  IconButton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

import { useGoals } from '../hooks/useGoals';
import { useTrainer } from '../hooks/useTrainer';
import { GoalDifficulty } from '../types';

interface GoalFormData {
  title: string;
  category: string;
  targetDescription: string;
  motivation: string;
  difficulty: GoalDifficulty;
  hasEndDate: boolean;
  targetEndDate?: Date;
  dailyActionTitle: string;
  dailyActionDescription: string;
  estimatedMinutes: number;
  hasReminder: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export default function GoalCreationScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const toast = useToast();

  const { createGoal, isLoading } = useGoals();
  const { playMotivationVoice, getEncouragementMessage } = useTrainer();

  // フォームデータ
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    category: '',
    targetDescription: '',
    motivation: '',
    difficulty: GoalDifficulty.Normal,
    hasEndDate: false,
    targetEndDate: undefined,
    dailyActionTitle: '',
    dailyActionDescription: '',
    estimatedMinutes: 15,
    hasReminder: true,
    reminderHour: 9,
    reminderMinute: 0,
  });

  // カテゴリのプリセット
  const categoryPresets = [
    '健康・運動',
    '学習・スキルアップ',
    '仕事・キャリア',
    '趣味・娯楽',
    '人間関係',
    '家事・生活',
    'その他',
  ];

  // 色テーマ
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // フォームデータ更新
  const updateFormData = (field: keyof GoalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // バリデーション
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          toast.show({
            title: '目標タイトルを入力してください',
            status: 'warning',
          });
          return false;
        }
        if (!formData.category.trim()) {
          toast.show({
            title: 'カテゴリを選択してください',
            status: 'warning',
          });
          return false;
        }
        return true;

      case 2:
        if (!formData.targetDescription.trim()) {
          toast.show({
            title: '具体的な目標を入力してください',
            status: 'warning',
          });
          return false;
        }
        if (!formData.motivation.trim()) {
          toast.show({
            title: 'モチベーションを入力してください',
            status: 'warning',
          });
          return false;
        }
        return true;

      case 3:
        if (!formData.dailyActionTitle.trim()) {
          toast.show({
            title: '毎日の行動を入力してください',
            status: 'warning',
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // 次のステップへ
  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // 前のステップへ
  const handlePrevious = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // 目標作成
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await createGoal(
        formData.title,
        formData.category,
        formData.targetDescription,
        formData.motivation,
        formData.difficulty,
        formData.hasEndDate ? formData.targetEndDate : undefined
      );

      if (result.success) {
        // 祝福ボイス再生
        await playMotivationVoice();

        // 成功メッセージ
        Alert.alert(
          '🎉 目標を作成しました！',
          `「${formData.title}」\n${getEncouragementMessage()}\n\n今日から一緒にがんばりましょう！`,
          [
            {
              text: 'はじめる！',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        toast.show({
          title: '目標の作成に失敗しました',
          description: result.error.message,
          status: 'error',
        });
      }
    } catch (error) {
      toast.show({
        title: '予期しないエラーが発生しました',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日付選択
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData('targetEndDate', selectedDate);
    }
  };

  // 時刻選択
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      updateFormData('reminderHour', selectedTime.getHours());
      updateFormData('reminderMinute', selectedTime.getMinutes());
    }
  };

  // 難易度の表示名
  const getDifficultyLabel = (difficulty: GoalDifficulty): string => {
    switch (difficulty) {
      case GoalDifficulty.VeryEasy: return 'とても簡単';
      case GoalDifficulty.Easy: return '簡単';
      case GoalDifficulty.Normal: return '普通';
      case GoalDifficulty.Hard: return '難しい';
      case GoalDifficulty.VeryHard: return 'とても難しい';
      default: return '普通';
    }
  };

  // 難易度の色
  const getDifficultyColor = (difficulty: GoalDifficulty): string => {
    switch (difficulty) {
      case GoalDifficulty.VeryEasy: return 'green';
      case GoalDifficulty.Easy: return 'teal';
      case GoalDifficulty.Normal: return 'blue';
      case GoalDifficulty.Hard: return 'orange';
      case GoalDifficulty.VeryHard: return 'red';
      default: return 'blue';
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ヘッダー */}
      <Box safeAreaTop bg={cardBgColor}>
        <HStack
          alignItems="center"
          justifyContent="space-between"
          p={4}
          borderBottomWidth={1}
          borderBottomColor="gray.200"
        >
          <IconButton
            icon={<MaterialIcons name="arrow-back" size={24} color={textColor} />}
            onPress={() => currentStep > 1 ? handlePrevious() : navigation.goBack()}
          />
          
          <VStack alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              新しい目標
            </Text>
            <Text fontSize="xs" color={mutedTextColor}>
              ステップ {currentStep} / 4
            </Text>
          </VStack>

          <Box w="10" />
        </HStack>

        {/* プログレスバー */}
        <Box px={4} pb={2}>
          <HStack space={1}>
            {[1, 2, 3, 4].map((step) => (
              <Box
                key={step}
                flex={1}
                h="2"
                bg={step <= currentStep ? 'blue.500' : 'gray.200'}
                rounded="full"
              />
            ))}
          </HStack>
        </Box>
      </Box>

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={6} p={4}>
          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <Card bg={cardBgColor} p={4}>
              <VStack space={4}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  どんな目標ですか？
                </Text>

                <FormControl isRequired>
                  <FormControl.Label>目標タイトル</FormControl.Label>
                  <Input
                    placeholder="例: 毎日30分読書する"
                    value={formData.title}
                    onChangeText={(text) => updateFormData('title', text)}
                    fontSize="md"
                    bg="gray.50"
                  />
                  <FormControl.HelperText>
                    短くて覚えやすいタイトルにしましょう
                  </FormControl.HelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>カテゴリ</FormControl.Label>
                  <Select
                    selectedValue={formData.category}
                    placeholder="カテゴリを選択"
                    onValueChange={(value) => updateFormData('category', value)}
                    _selectedItem={{
                      bg: 'blue.500',
                      endIcon: <CheckIcon size="5" />,
                    }}
                  >
                    {categoryPresets.map((category) => (
                      <Select.Item
                        key={category}
                        label={category}
                        value={category}
                      />
                    ))}
                  </Select>
                </FormControl>

                {formData.category === 'その他' && (
                  <FormControl>
                    <FormControl.Label>カスタムカテゴリ</FormControl.Label>
                    <Input
                      placeholder="カテゴリ名を入力"
                      value={formData.category === 'その他' ? '' : formData.category}
                      onChangeText={(text) => updateFormData('category', text)}
                      bg="gray.50"
                    />
                  </FormControl>
                )}
              </VStack>
            </Card>
          )}

          {/* ステップ2: 詳細と動機 */}
          {currentStep === 2 && (
            <Card bg={cardBgColor} p={4}>
              <VStack space={4}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  目標の詳細を教えてください
                </Text>

                <FormControl isRequired>
                  <FormControl.Label>具体的な目標</FormControl.Label>
                  <TextArea
                    placeholder="何を、どのくらい、いつまでに達成したいですか？"
                    value={formData.targetDescription}
                    onChangeText={(text) => updateFormData('targetDescription', text)}
                    numberOfLines={4}
                    bg="gray.50"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>なぜこの目標を達成したいですか？</FormControl.Label>
                  <TextArea
                    placeholder="この目標を達成することで、どんな良いことがありますか？"
                    value={formData.motivation}
                    onChangeText={(text) => updateFormData('motivation', text)}
                    numberOfLines={3}
                    bg="gray.50"
                  />
                  <FormControl.HelperText>
                    モチベーションが下がった時に見返します
                  </FormControl.HelperText>
                </FormControl>

                <FormControl>
                  <FormControl.Label>難易度</FormControl.Label>
                  <Radio.Group
                    name="difficulty"
                    value={formData.difficulty.toString()}
                    onChange={(value) => updateFormData('difficulty', parseInt(value))}
                  >
                    <VStack space={2}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Radio key={level} value={level.toString()}>
                          <HStack alignItems="center" space={2}>
                            <Badge colorScheme={getDifficultyColor(level)} variant="subtle">
                              {getDifficultyLabel(level)}
                            </Badge>
                          </HStack>
                        </Radio>
                      ))}
                    </VStack>
                  </Radio.Group>
                </FormControl>

                <Divider />

                <VStack space={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="md" fontWeight="medium">
                      期限を設定しますか？
                    </Text>
                    <Switch
                      isChecked={formData.hasEndDate}
                      onToggle={(value) => updateFormData('hasEndDate', value)}
                    />
                  </HStack>

                  {formData.hasEndDate && (
                    <Button
                      variant="outline"
                      onPress={() => setShowDatePicker(true)}
                      leftIcon={<MaterialIcons name="calendar-today" size={16} />}
                    >
                      {formData.targetEndDate
                        ? formData.targetEndDate.toLocaleDateString('ja-JP')
                        : '日付を選択'}
                    </Button>
                  )}
                </VStack>
              </VStack>
            </Card>
          )}

          {/* ステップ3: 毎日の行動 */}
          {currentStep === 3 && (
            <Card bg={cardBgColor} p={4}>
              <VStack space={4}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  毎日何をしますか？
                </Text>
                
                <Text color={mutedTextColor}>
                  目標達成のために毎日行う具体的な行動を決めましょう
                </Text>

                <FormControl isRequired>
                  <FormControl.Label>毎日の行動</FormControl.Label>
                  <Input
                    placeholder="例: 本を30分読む"
                    value={formData.dailyActionTitle}
                    onChangeText={(text) => updateFormData('dailyActionTitle', text)}
                    bg="gray.50"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>詳細説明（任意）</FormControl.Label>
                  <TextArea
                    placeholder="どのような本を読むか、どこで読むかなど"
                    value={formData.dailyActionDescription}
                    onChangeText={(text) => updateFormData('dailyActionDescription', text)}
                    numberOfLines={2}
                    bg="gray.50"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>
                    予想時間: {formData.estimatedMinutes}分
                  </FormControl.Label>
                  <Slider
                    value={formData.estimatedMinutes}
                    minValue={5}
                    maxValue={120}
                    step={5}
                    onChange={(value) => updateFormData('estimatedMinutes', value)}
                    colorScheme="blue"
                  >
                    <Slider.Track>
                      <Slider.FilledTrack />
                    </Slider.Track>
                    <Slider.Thumb />
                  </Slider>
                  <HStack justifyContent="space-between" mt={1}>
                    <Text fontSize="xs" color={mutedTextColor}>5分</Text>
                    <Text fontSize="xs" color={mutedTextColor}>2時間</Text>
                  </HStack>
                </FormControl>
              </VStack>
            </Card>
          )}

          {/* ステップ4: リマインダー設定 */}
          {currentStep === 4 && (
            <Card bg={cardBgColor} p={4}>
              <VStack space={4}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  リマインダーを設定しましょう
                </Text>

                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" fontWeight="medium">
                    毎日リマインドする
                  </Text>
                  <Switch
                    isChecked={formData.hasReminder}
                    onToggle={(value) => updateFormData('hasReminder', value)}
                  />
                </HStack>

                {formData.hasReminder && (
                  <VStack space={3}>
                    <Button
                      variant="outline"
                      onPress={() => setShowTimePicker(true)}
                      leftIcon={<MaterialIcons name="access-time" size={16} />}
                    >
                      {String(formData.reminderHour).padStart(2, '0')}:
                      {String(formData.reminderMinute).padStart(2, '0')}
                    </Button>
                    
                    <Text fontSize="sm" color={mutedTextColor}>
                      設定した時間に通知でお知らせします
                    </Text>
                  </VStack>
                )}

                <Divider />

                {/* 設定確認 */}
                <VStack space={3}>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>
                    設定確認
                  </Text>
                  
                  <VStack space={2} bg="gray.50" p={3} rounded="md">
                    <HStack justifyContent="space-between">
                      <Text color={mutedTextColor}>目標:</Text>
                      <Text fontWeight="medium" flex={1} textAlign="right">
                        {formData.title}
                      </Text>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text color={mutedTextColor}>カテゴリ:</Text>
                      <Text fontWeight="medium">{formData.category}</Text>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text color={mutedTextColor}>毎日の行動:</Text>
                      <Text fontWeight="medium" flex={1} textAlign="right">
                        {formData.dailyActionTitle}
                      </Text>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text color={mutedTextColor}>予想時間:</Text>
                      <Text fontWeight="medium">{formData.estimatedMinutes}分</Text>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text color={mutedTextColor}>難易度:</Text>
                      <Badge colorScheme={getDifficultyColor(formData.difficulty)} variant="subtle">
                        {getDifficultyLabel(formData.difficulty)}
                      </Badge>
                    </HStack>
                  </VStack>
                </VStack>
              </VStack>
            </Card>
          )}
        </VStack>
      </ScrollView>

      {/* フッターボタン */}
      <Box bg={cardBgColor} p={4} safeAreaBottom>
        <HStack space={3}>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onPress={handlePrevious}
              flex={1}
              leftIcon={<MaterialIcons name="arrow-back" size={16} />}
            >
              戻る
            </Button>
          )}
          
          <Button
            onPress={currentStep === 4 ? handleSubmit : handleNext}
            flex={currentStep === 1 ? 1 : 2}
            isLoading={isSubmitting || isLoading}
            loadingText={currentStep === 4 ? "作成中..." : "処理中..."}
            rightIcon={
              currentStep === 4 ? 
                <MaterialIcons name="check" size={16} color="white" /> : 
                <MaterialIcons name="arrow-forward" size={16} color="white" />
            }
          >
            {currentStep === 4 ? '目標を作成' : '次へ'}
          </Button>
        </HStack>
      </Box>

      {/* 日付選択モーダル */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.targetEndDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* 時刻選択モーダル */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date(0, 0, 0, formData.reminderHour, formData.reminderMinute)}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});