/**
 * GWONS_CREATIVE — CursorUtil Unit Tests
 * 인풋 기반 페이징 커서 유틸리티 테스트
 */
import { CursorUtil } from '../cursor.util';

describe('CursorUtil', () => {
  const mockItem = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    createdAt: new Date('2026-04-14T10:00:00.000Z'),
    title: '전시 A',
    score: 42,
  };

  describe('encode', () => {
    it('유효한 Base64URL 토큰을 생성해야 한다', () => {
      const token = CursorUtil.encode(mockItem);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // Base64URL은 +, / 대신 -, _ 사용 (URL 안전)
      expect(token).not.toMatch(/[+/=]/);
    });

    it('같은 입력은 항상 동일한 토큰을 생성해야 한다 (결정론적)', () => {
      const token1 = CursorUtil.encode(mockItem);
      const token2 = CursorUtil.encode(mockItem);
      expect(token1).toBe(token2);
    });

    it('sortField를 지정하면 sortValue가 포함되어야 한다', () => {
      const token = CursorUtil.encode(mockItem, 'score');
      const decoded = CursorUtil.decode(token);
      expect(decoded.sortValue).toBe(42);
    });

    it('sortField가 createdAt이면 sortValue가 없어야 한다', () => {
      const token = CursorUtil.encode(mockItem, 'createdAt');
      const decoded = CursorUtil.decode(token);
      expect(decoded.sortValue).toBeUndefined();
    });
  });

  describe('decode', () => {
    it('인코딩된 토큰을 정확히 디코딩해야 한다', () => {
      const token = CursorUtil.encode(mockItem);
      const decoded = CursorUtil.decode(token);

      expect(decoded.id).toBe(mockItem.id);
      expect(decoded.createdAt).toBe(mockItem.createdAt.toISOString());
    });

    it('잘못된 토큰에 대해 에러를 던져야 한다', () => {
      expect(() => CursorUtil.decode('invalid_cursor_!!!')).toThrow();
    });

    it('빈 문자열에 대해 에러를 던져야 한다', () => {
      expect(() => CursorUtil.decode('')).toThrow();
    });
  });

  describe('isValid', () => {
    it('유효한 커서는 true를 반환해야 한다', () => {
      const token = CursorUtil.encode(mockItem);
      expect(CursorUtil.isValid(token)).toBe(true);
    });

    it('잘못된 형식의 커서는 false를 반환해야 한다', () => {
      expect(CursorUtil.isValid('not-a-cursor')).toBe(false);
      expect(CursorUtil.isValid('')).toBe(false);
    });

    it('encode → isValid 는 항상 true여야 한다 (왕복 검증)', () => {
      const items = [
        { id: 'uuid-1', createdAt: new Date(), name: 'A' },
        { id: 'uuid-2', createdAt: new Date('2025-01-01'), name: 'B' },
      ];
      items.forEach((item) => {
        const token = CursorUtil.encode(item);
        expect(CursorUtil.isValid(token)).toBe(true);
      });
    });
  });

  describe('encode ↔ decode 왕복 테스트', () => {
    it('Date 객체와 문자열 모두 처리 가능해야 한다', () => {
      const itemWithDateStr = {
        id: 'uuid-3',
        createdAt: '2026-04-14T12:00:00.000Z' as any,
      };
      const token = CursorUtil.encode(itemWithDateStr);
      const decoded = CursorUtil.decode(token);
      expect(decoded.id).toBe('uuid-3');
    });
  });
});
