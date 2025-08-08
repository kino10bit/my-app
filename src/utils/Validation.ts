import { ErrorHandler } from './ErrorHandler';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validation {
  static validateField(value: any, rules: ValidationRule, fieldName: string): ValidationResult {
    const errors: string[] = [];

    // Required check
    if (rules.required && this.isEmpty(value)) {
      errors.push(`${fieldName}は必須です`);
      return { isValid: false, errors };
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return { isValid: true, errors: [] };
    }

    const stringValue = String(value).trim();

    // Min length check
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`${fieldName}は${rules.minLength}文字以上で入力してください`);
    }

    // Max length check
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`${fieldName}は${rules.maxLength}文字以下で入力してください`);
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push(`${fieldName}の形式が正しくありません`);
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateGoal(goalData: {
    title: string;
    category: string;
    description: string;
    motivation: string;
  }): ValidationResult {
    const allErrors: string[] = [];

    // Title validation
    const titleResult = this.validateField(
      goalData.title,
      { required: true, minLength: 2, maxLength: 50 },
      'タイトル'
    );
    allErrors.push(...titleResult.errors);

    // Category validation
    const categoryResult = this.validateField(
      goalData.category,
      { required: true },
      'カテゴリ'
    );
    allErrors.push(...categoryResult.errors);

    // Description validation
    const descriptionResult = this.validateField(
      goalData.description,
      { required: true, minLength: 10, maxLength: 500 },
      '目標の詳細'
    );
    allErrors.push(...descriptionResult.errors);

    // Motivation validation
    const motivationResult = this.validateField(
      goalData.motivation,
      { required: true, minLength: 5, maxLength: 300 },
      'モチベーション'
    );
    allErrors.push(...motivationResult.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  static validateTrainerSelection(trainer: any): ValidationResult {
    const errors: string[] = [];

    if (!trainer) {
      errors.push('トレーナーを選択してください');
      return { isValid: false, errors };
    }

    if (!trainer.id) {
      errors.push('無効なトレーナーが選択されています');
    }

    if (!trainer.name) {
      errors.push('トレーナー名が設定されていません');
    }

    if (!trainer.type) {
      errors.push('トレーナータイプが設定されていません');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // Helper method to show validation errors
  static showValidationErrors(errors: string[]): void {
    if (errors.length === 0) return;

    const error = ErrorHandler.createValidationError(
      errors.length === 1 ? errors[0] : `以下の項目を確認してください：\n${errors.join('\n')}`
    );

    ErrorHandler.showUserError(error, '入力内容をご確認ください');
  }

  // Predefined validation rules
  static rules = {
    goalTitle: { required: true, minLength: 2, maxLength: 50 },
    goalDescription: { required: true, minLength: 10, maxLength: 500 },
    motivation: { required: true, minLength: 5, maxLength: 300 },
    category: { required: true }
  };
}