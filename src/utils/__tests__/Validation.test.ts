import { Validation, ValidationRule } from '../Validation';
import { ErrorHandler } from '../ErrorHandler';
import { Alert } from 'react-native';

jest.mock('../ErrorHandler');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateField', () => {
    it('should pass validation for valid input', () => {
      const rule: ValidationRule = { required: true, minLength: 3 };
      const result = Validation.validateField('test', rule, 'テストフィールド');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field when empty', () => {
      const rule: ValidationRule = { required: true };
      const result = Validation.validateField('', rule, 'テストフィールド');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('テストフィールドは必須です');
    });

    it('should fail validation for minimum length', () => {
      const rule: ValidationRule = { minLength: 5 };
      const result = Validation.validateField('abc', rule, 'テストフィールド');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('テストフィールドは5文字以上で入力してください');
    });

    it('should fail validation for maximum length', () => {
      const rule: ValidationRule = { maxLength: 3 };
      const result = Validation.validateField('abcdef', rule, 'テストフィールド');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('テストフィールドは3文字以下で入力してください');
    });

    it('should fail validation for pattern mismatch', () => {
      const rule: ValidationRule = { pattern: /^[a-z]+$/ };
      const result = Validation.validateField('ABC123', rule, 'テストフィールド');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('テストフィールドの形式が正しくありません');
    });

    it('should use custom validation function', () => {
      const rule: ValidationRule = {
        custom: (value) => value === 'forbidden' ? 'この値は使用できません' : null
      };
      const result = Validation.validateField('forbidden', rule, 'テストフィールド');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('この値は使用できません');
    });

    it('should skip validations for empty non-required field', () => {
      const rule: ValidationRule = { minLength: 5, maxLength: 10 };
      const result = Validation.validateField('', rule, 'テストフィールド');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateGoal', () => {
    const validGoal = {
      title: 'Test Goal',
      category: 'テスト',
      description: 'This is a test goal description',
      motivation: 'Test motivation'
    };

    it('should pass validation for valid goal data', () => {
      const result = Validation.validateGoal(validGoal);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing title', () => {
      const invalidGoal = { ...validGoal, title: '' };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('タイトル'))).toBe(true);
    });

    it('should fail validation for title too short', () => {
      const invalidGoal = { ...validGoal, title: 'a' };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('2文字以上'))).toBe(true);
    });

    it('should fail validation for title too long', () => {
      const invalidGoal = { ...validGoal, title: 'a'.repeat(51) };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('50文字以下'))).toBe(true);
    });

    it('should fail validation for missing category', () => {
      const invalidGoal = { ...validGoal, category: '' };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('カテゴリ'))).toBe(true);
    });

    it('should fail validation for description too short', () => {
      const invalidGoal = { ...validGoal, description: 'short' };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('10文字以上'))).toBe(true);
    });

    it('should fail validation for motivation too short', () => {
      const invalidGoal = { ...validGoal, motivation: 'abc' };
      const result = Validation.validateGoal(invalidGoal);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('5文字以上'))).toBe(true);
    });
  });

  describe('validateTrainerSelection', () => {
    const validTrainer = {
      id: '1',
      name: 'Test Trainer',
      type: 'energetic'
    };

    it('should pass validation for valid trainer', () => {
      const result = Validation.validateTrainerSelection(validTrainer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for null trainer', () => {
      const result = Validation.validateTrainerSelection(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('トレーナーを選択してください');
    });

    it('should fail validation for trainer without id', () => {
      const invalidTrainer = { ...validTrainer, id: '' };
      const result = Validation.validateTrainerSelection(invalidTrainer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('無効なトレーナーが選択されています');
    });

    it('should fail validation for trainer without name', () => {
      const invalidTrainer = { ...validTrainer, name: '' };
      const result = Validation.validateTrainerSelection(invalidTrainer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('トレーナー名が設定されていません');
    });

    it('should fail validation for trainer without type', () => {
      const invalidTrainer = { ...validTrainer, type: '' };
      const result = Validation.validateTrainerSelection(invalidTrainer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('トレーナータイプが設定されていません');
    });
  });

  describe('showValidationErrors', () => {
    it('should not show anything for empty errors', () => {
      const createValidationErrorSpy = jest.spyOn(ErrorHandler, 'createValidationError');
      const showUserErrorSpy = jest.spyOn(ErrorHandler, 'showUserError');

      Validation.showValidationErrors([]);

      expect(createValidationErrorSpy).not.toHaveBeenCalled();
      expect(showUserErrorSpy).not.toHaveBeenCalled();
    });

    it('should show single error message', () => {
      const createValidationErrorSpy = jest.spyOn(ErrorHandler, 'createValidationError');
      const showUserErrorSpy = jest.spyOn(ErrorHandler, 'showUserError');

      Validation.showValidationErrors(['Single error']);

      expect(createValidationErrorSpy).toHaveBeenCalledWith('Single error');
      expect(showUserErrorSpy).toHaveBeenCalled();
    });

    it('should show multiple errors as list', () => {
      const createValidationErrorSpy = jest.spyOn(ErrorHandler, 'createValidationError');
      const showUserErrorSpy = jest.spyOn(ErrorHandler, 'showUserError');

      Validation.showValidationErrors(['Error 1', 'Error 2']);

      expect(createValidationErrorSpy).toHaveBeenCalledWith(
        '以下の項目を確認してください：\nError 1\nError 2'
      );
      expect(showUserErrorSpy).toHaveBeenCalled();
    });
  });

  describe('predefined rules', () => {
    it('should have correct goal title rules', () => {
      const rule = Validation.rules.goalTitle;
      expect(rule.required).toBe(true);
      expect(rule.minLength).toBe(2);
      expect(rule.maxLength).toBe(50);
    });

    it('should have correct goal description rules', () => {
      const rule = Validation.rules.goalDescription;
      expect(rule.required).toBe(true);
      expect(rule.minLength).toBe(10);
      expect(rule.maxLength).toBe(500);
    });

    it('should have correct motivation rules', () => {
      const rule = Validation.rules.motivation;
      expect(rule.required).toBe(true);
      expect(rule.minLength).toBe(5);
      expect(rule.maxLength).toBe(300);
    });

    it('should have correct category rules', () => {
      const rule = Validation.rules.category;
      expect(rule.required).toBe(true);
    });
  });
});