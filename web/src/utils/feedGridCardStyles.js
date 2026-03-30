/** 지금 여기는 더보기·지역 상세 2열 그리드 카드 공통 인라인 스타일 */

export const feedGridImageBox = {
  width: '100%',
  paddingBottom: '125%',
  height: 0,
  position: 'relative',
  background: '#e5e7eb',
  borderRadius: '14px',
  overflow: 'hidden',
  marginBottom: '4px',
};

export const feedGridInfoBox = {
  padding: '4px 14px 8px',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  overflow: 'hidden',
};

export const feedGridTitleStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export const feedGridDescStyle = {
  fontSize: '12px',
  color: '#475569',
  marginTop: 0,
  lineHeight: 1.35,
  maxHeight: '2.7em',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  background: 'rgba(15, 23, 42, 0.04)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  borderRadius: 10,
  padding: '6px 8px',
};

export const feedGridMetaRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1px',
  flexShrink: 0,
  fontSize: '11px',
  color: '#6b7280',
};
