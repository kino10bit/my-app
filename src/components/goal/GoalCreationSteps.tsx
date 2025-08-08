import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Card,
  Badge,
  useColorModeValue,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  const activeColor = useColorModeValue('blue.500', 'blue.400');
  const inactiveColor = useColorModeValue('gray.300', 'gray.600');
  const completedColor = useColorModeValue('green.500', 'green.400');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          // const isUpcoming = stepNumber > currentStep;

          return (
            <HStack key={stepNumber} alignItems="center" flex={1}>
              {/* ステップ番号/チェックマーク */}
              <Box
                w="8"
                h="8"
                rounded="full"
                bg={
                  isCompleted ? completedColor :
                  isActive ? activeColor :
                  inactiveColor
                }
                alignItems="center"
                justifyContent="center"
              >
                {isCompleted ? (
                  <MaterialIcons name="check" size={16} color="white" />
                ) : (
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={isActive || isCompleted ? 'white' : 'gray.500'}
                  >
                    {stepNumber}
                  </Text>
                )}
              </Box>

              {/* 接続線 */}
              {index < totalSteps - 1 && (
                <Box
                  flex={1}
                  h="1"
                  bg={stepNumber < currentStep ? completedColor : inactiveColor}
                  mx={2}
                />
              )}
            </HStack>
          );
        })}
      </HStack>

      {/* ステップタイトル */}
      <Text fontSize="lg" fontWeight="bold" color={textColor} textAlign="center">
        {stepTitles[currentStep - 1]}
      </Text>
      
      <Text fontSize="sm" color={mutedTextColor} textAlign="center">
        ステップ {currentStep} / {totalSteps}
      </Text>
    </VStack>
  );
}

interface GoalPreviewProps {
  title: string;
  category: string;
  dailyAction: string;
  difficulty: number;
  estimatedMinutes: number;
  hasEndDate: boolean;
  endDate?: Date;
}

export function GoalPreview({
  title,
  category,
  dailyAction,
  difficulty,
  estimatedMinutes,
  hasEndDate,
  endDate,
}: GoalPreviewProps) {
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  const getDifficultyLabel = (level: number): string => {
    switch (level) {
      case 1: return 'とても簡単';
      case 2: return '簡単';
      case 3: return '普通';
      case 4: return '難しい';
      case 5: return 'とても難しい';
      default: return '普通';
    }
  };

  const getDifficultyColor = (level: number): string => {
    switch (level) {
      case 1: return 'green';
      case 2: return 'teal';
      case 3: return 'blue';
      case 4: return 'orange';
      case 5: return 'red';
      default: return 'blue';
    }
  };

  return (
    <Card bg={cardBgColor} p={4}>
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <VStack flex={1} space={1}>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              {title || '目標タイトル'}
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              {category || 'カテゴリ'}
            </Text>
          </VStack>
          
          <Badge colorScheme={getDifficultyColor(difficulty)} variant="subtle">
            {getDifficultyLabel(difficulty)}
          </Badge>
        </HStack>

        {dailyAction && (
          <HStack alignItems="center" space={2}>
            <MaterialIcons name="today" size={16} color="gray" />
            <Text fontSize="sm" color={textColor} flex={1}>
              {dailyAction}
            </Text>
          </HStack>
        )}

        <HStack alignItems="center" space={4}>
          <HStack alignItems="center" space={1}>
            <MaterialIcons name="schedule" size={16} color="gray" />
            <Text fontSize="xs" color={mutedTextColor}>
              {estimatedMinutes}分
            </Text>
          </HStack>

          {hasEndDate && endDate && (
            <HStack alignItems="center" space={1}>
              <MaterialIcons name="event" size={16} color="gray" />
              <Text fontSize="xs" color={mutedTextColor}>
                {endDate.toLocaleDateString('ja-JP')}まで
              </Text>
            </HStack>
          )}
        </HStack>
      </VStack>
    </Card>
  );
}

interface MotivationCardProps {
  motivation: string;
  onEdit: () => void;
}

export function MotivationCard({ motivation, onEdit }: MotivationCardProps) {
  const cardBgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('blue.800', 'blue.100');
  const mutedTextColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Card bg={cardBgColor} p={4}>
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="bold" color={textColor}>
            💪 あなたのモチベーション
          </Text>
          <Box
            as={MaterialIcons}
            name="edit"
            size={16}
            color={mutedTextColor}
            onPress={onEdit}
          />
        </HStack>
        
        <Text fontSize="sm" color={textColor} lineHeight="sm">
          {motivation || 'モチベーションを入力してください'}
        </Text>
        
        <Text fontSize="xs" color={mutedTextColor} fontStyle="italic">
          ※ やる気が下がった時に見返して元気をもらいましょう
        </Text>
      </VStack>
    </Card>
  );
}

interface ValidationMessageProps {
  isVisible: boolean;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export function ValidationMessage({ isVisible, message, type }: ValidationMessageProps) {
  if (!isVisible) return null;

  const getIconName = () => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getColorScheme = () => {
    switch (type) {
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'blue';
    }
  };

  return (
    <HStack
      alignItems="center"
      space={2}
      bg={`${getColorScheme()}.50`}
      p={3}
      rounded="md"
      borderWidth={1}
      borderColor={`${getColorScheme()}.200`}
    >
      <MaterialIcons 
        name={getIconName()} 
        size={16} 
        color={getColorScheme()} 
      />
      <Text fontSize="sm" color={`${getColorScheme()}.700`} flex={1}>
        {message}
      </Text>
    </HStack>
  );
}