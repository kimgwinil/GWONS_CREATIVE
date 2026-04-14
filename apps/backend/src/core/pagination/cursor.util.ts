/**
 * GWONS_CREATIVE — Cursor Utility
 * 커서 토큰 인코딩 / 디코딩 유틸리티
 * Base64URL 인코딩으로 URL-safe 토큰 생성
 */

import { DecodedCursor } from './pagination.types';

export class CursorUtil {
  /**
   * 엔티티를 커서 토큰으로 인코딩
   * @param item - id, createdAt을 가진 엔티티
   * @param sortField - 정렬 기준 필드명
   */
  static encode(item: Record<string, any>, sortField = 'createdAt'): string {
    const payload: DecodedCursor = {
      id: item.id,
      createdAt: item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : String(item.createdAt),
      sortValue: sortField !== 'createdAt' ? item[sortField] : undefined,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * 커서 토큰을 디코딩
   * @param cursor - Base64URL 인코딩된 커서 문자열
   */
  static decode(cursor: string): DecodedCursor {
    try {
      const json = Buffer.from(cursor, 'base64url').toString('utf-8');
      return JSON.parse(json) as DecodedCursor;
    } catch {
      throw new Error(`유효하지 않은 커서 토큰입니다: ${cursor}`);
    }
  }

  /**
   * 커서 유효성 검증
   */
  static isValid(cursor: string): boolean {
    try {
      const decoded = CursorUtil.decode(cursor);
      return (
        typeof decoded.id === 'string' &&
        typeof decoded.createdAt === 'string' &&
        !isNaN(new Date(decoded.createdAt).getTime())
      );
    } catch {
      return false;
    }
  }
}
